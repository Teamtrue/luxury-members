# AI Roadmap — PlutusClub

Future AI features for PlutusClub. Each section documents: what the feature does, where in the codebase it will live, when it is triggered, and the exact interface shape so future developers know exactly what to build.

None of these features exist yet. This is a specification document.

---

## 1. Deal Recommendation Engine

**What it does:** Personalizes the deal listing for each member based on their purchase history, browsing behavior, tier, and behavior of similar members. Members see relevant deals first instead of chronological order.

**Where:** `lib/ai/recommendations.ts`

**Triggered from:** `GET /api/member/feed` (new endpoint) and optionally as an optional sort mode in `GET /api/deals`

**Model approach:** Hybrid — Collaborative Filtering (members with similar purchase patterns) + Content-Based Filtering (deals similar to previously bookmarked/booked deals). Start with a simple item-item collaborative filter; upgrade to a neural embedding model at 50K+ members.

**Interface:**

```typescript
// lib/ai/recommendations.ts

export interface RecommendationInput {
  member_id: string;
  tier: 'silver' | 'gold' | 'platinum' | 'obsidian';
  booking_history: {
    deal_id: string;
    category: string;
    amount_paid: number;
    created_at: string;
  }[];
  category_preferences: string[];   // from member_categories table
  limit: number;                     // how many deals to return
}

export interface RecommendedDeal {
  deal_id: string;
  score: number;       // 0-1 relevance score
  reason: string;      // human-readable: "Based on your travel purchases"
  model_version: string;
}

export interface RecommendationResult {
  recommendations: RecommendedDeal[];
  fallback: boolean;   // true if model failed and we returned popular deals
  model: 'collaborative' | 'content_based' | 'hybrid' | 'popular';
  generated_at: string;
}

export async function getRecommendedDeals(
  input: RecommendationInput
): Promise<RecommendationResult> {
  // TODO: implement
  // Phase 1: query top deals by booking count filtered by tier (pure popularity)
  // Phase 2: item-item collaborative filtering using booking_history co-occurrence matrix
  // Phase 3: neural embeddings via OpenAI Embeddings API or a fine-tuned model
  throw new Error('Not implemented');
}
```

**Data needed:** `bookings` table with deal category signals. No new tables required for Phase 1-2. Phase 3 needs a `member_embeddings` table for caching vector representations.

---

## 2. Churn Prediction

**What it does:** Scores each member's probability of not renewing their membership. High-churn-risk members get proactive outreach, win-back offers, or tier upgrade prompts.

**Where:** `lib/ai/churn.ts`

**Triggered from:** Membership lifecycle cron job (`POST /api/internal/cron/membership-expiry`) — runs daily at 2 AM IST. Also callable on-demand from admin panel.

**Model approach:** Logistic regression on behavioral signals — days since last booking, total bookings, tier, referral activity, token activity. Train offline, deploy as a scoring function with hardcoded coefficients (update every quarter).

**Interface:**

```typescript
// lib/ai/churn.ts

export interface ChurnSignals {
  member_id: string;
  tier: string;
  membership_expires_at: string;
  days_since_last_booking: number;
  total_bookings_lifetime: number;
  total_bookings_last_90_days: number;
  token_balance: number;
  tokens_earned_last_90_days: number;
  referrals_active: number;
  days_until_expiry: number;
  has_concierge_request: boolean;
}

export interface ChurnScore {
  member_id: string;
  churn_probability: number;     // 0.0 - 1.0
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  // low: <0.3  medium: 0.3-0.5  high: 0.5-0.75  critical: >0.75
  top_signals: string[];         // ['no_booking_60d', 'token_not_used', 'referral_churned']
  recommended_action: 'none' | 'email_nudge' | 'win_back_offer' | 'personal_outreach';
  scored_at: string;
}

export function scoreChurnRisk(signals: ChurnSignals): ChurnScore {
  // TODO: implement logistic regression
  // Coefficients derived from cohort analysis of past churned members
  // Feature weights (example — update quarterly based on actuals):
  // days_since_last_booking: +0.03 per day (up to cap of 90 days)
  // total_bookings_last_90_days=0: +0.4
  // days_until_expiry<30: +0.2
  // token_balance>0: -0.1
  // referrals_active>0: -0.15
  throw new Error('Not implemented');
}

export async function scoreAllAtRiskMembers(): Promise<ChurnScore[]> {
  // TODO: batch query members with membership_expires_at in next 60 days
  // Run scoreChurnRisk on each
  // Persist scores to members.churn_score column (add column in migration)
  // Trigger notifications for critical-risk members
  throw new Error('Not implemented');
}
```

**New DB column needed:** `ALTER TABLE members ADD COLUMN churn_score DECIMAL(4,3);`

---

## 3. AI Concierge — First Response

**What it does:** When a Platinum+ member submits a concierge request, an AI (GPT-4) generates an immediate personalized acknowledgement and preliminary recommendations within seconds. The human concierge team reviews and refines before sending the final response.

**Where:** `app/api/concierge/ai-assist/route.ts` (new API route)

**Triggered from:** `POST /api/concierge` — after saving the request to DB, call AI assist asynchronously and store the draft response

**Model:** OpenAI GPT-4o. System prompt includes member tier, previous bookings, and the request details. Response is stored as a draft for human review — never sent directly to members.

**Interface:**

```typescript
// app/api/concierge/ai-assist/route.ts

export interface AiConciergeInput {
  request_id: string;
  member: {
    name: string;
    tier: 'platinum' | 'obsidian';
    booking_history_summary: string;   // e.g. "3 travel bookings, 2 electronics"
  };
  request: {
    category: string;
    brand?: string;
    budget_min?: number;      // rupees
    budget_max?: number;      // rupees
    timeline?: string;
    notes: string;
  };
}

export interface AiConciergeResponse {
  request_id: string;
  draft_response: string;       // AI-generated draft for human review
  suggested_deals: string[];    // deal IDs that might match
  estimated_budget_range: {
    min: number;
    max: number;
    currency: 'INR';
  } | null;
  confidence: number;           // 0-1; below 0.6, flag for immediate human review
  model: string;                // 'gpt-4o-2024-08-06'
  generated_at: string;
  tokens_used: number;          // OpenAI token count for cost tracking
}

// POST /api/concierge/ai-assist
// Body: AiConciergeInput
// Response: AiConciergeResponse
// Auth: internal service call only (INTERNAL_JOB_TOKEN)
```

**Cost control:** Cap at 1000 tokens per response. Log `tokens_used` to a `ai_usage_log` table for monthly cost tracking. Disable if monthly AI spend exceeds `AI_MONTHLY_BUDGET_USD` env var.

---

## 4. Price Intelligence

**What it does:** For each deal, automatically fetches the current retail price from public sources and verifies that PlutusClub's club price genuinely represents a saving. Flags deals where the "retail price" appears inflated (dark pattern prevention).

**Where:** `lib/ai/price-intel.ts`

**Triggered from:**
- Deal creation (`POST /api/deals`) — async background job
- Scheduled refresh: `POST /api/internal/cron/price-check` — weekly

**Model approach:** Web scraping + LLM extraction. Fetch product pages from Amazon.in, Flipkart, brand websites. Use GPT-4o with vision or structured extraction to parse current prices. Store results for comparison.

**Interface:**

```typescript
// lib/ai/price-intel.ts

export interface PriceCheckInput {
  deal_id: string;
  title: string;
  brand: string;
  category: string;
  club_price: number;      // paise
  stated_retail_price: number;  // paise; what admin entered
}

export interface PriceSource {
  source: string;          // 'amazon.in', 'flipkart', 'brand_website'
  url: string;
  price_paise: number;
  fetched_at: string;
  confidence: number;      // 0-1; how confident the extraction is
}

export interface PriceIntelResult {
  deal_id: string;
  sources: PriceSource[];
  market_low_paise: number;    // lowest price found
  market_high_paise: number;   // highest price found
  market_median_paise: number;
  genuine_saving_pct: number;  // (market_median - club_price) / market_median
  is_suspicious: boolean;      // true if stated retail > market_high by >20%
  flag_reason?: string;        // 'stated_retail_inflated_by_35_percent'
  checked_at: string;
}

export async function checkDealPrice(input: PriceCheckInput): Promise<PriceIntelResult> {
  // TODO: implement
  // 1. Search Amazon Product Advertising API (or scrape cautiously)
  // 2. Search Flipkart API
  // 3. Try brand website via structured extraction
  // 4. Aggregate results
  // 5. Return comparison
  throw new Error('Not implemented');
}
```

**New DB column needed:** `ALTER TABLE deals ADD COLUMN price_intel JSONB;` — stores the `PriceIntelResult`

---

## 5. Personalised Feed

**What it does:** The member's deal listing is re-ranked using ML signals to put the most relevant deals at the top. Different from recommendations — this re-ranks all visible deals rather than fetching a curated subset.

**Where:** `app/api/member/feed/route.ts` (new endpoint, replaces plain `GET /api/deals` for authenticated members)

**Triggered from:** Member loading their deals page

**Model approach:** Linear ranking model. Features: category affinity score, tier match bonus, days until expiry urgency boost, savings percentage, booking velocity. No neural network needed — linear model is explainable and fast.

**Interface:**

```typescript
// app/api/member/feed/route.ts

// GET /api/member/feed?page=1&limit=20
// Auth: member session required

export interface FeedRankingInput {
  member_id: string;
  tier: string;
  category_affinity: Record<string, number>;  // { 'Electronics': 0.8, 'Travel': 0.6 }
  deals: Array<{
    id: string;
    category: string;
    savings_pct: number;
    days_until_expiry: number;
    bookings_velocity: number;  // bookings in last 7 days
    min_tier: string;
  }>;
}

export interface RankedDeal {
  deal_id: string;
  rank_score: number;
  rank_signals: {
    category_affinity: number;
    tier_bonus: number;
    urgency_boost: number;
    savings_boost: number;
    velocity_boost: number;
  };
}

export function rankDeals(input: FeedRankingInput): RankedDeal[] {
  // TODO: implement linear ranking
  // score = (category_affinity * 0.4)
  //       + (savings_pct/100 * 0.25)
  //       + (urgency_boost * 0.2)   // boost deals expiring in <7 days
  //       + (velocity_boost * 0.15) // boost popular deals
  throw new Error('Not implemented');
}
```

---

## 6. Fraud Scoring

**What it does:** Scores each payment attempt for fraud risk before creating a Razorpay order. High-risk transactions are flagged for manual review or blocked entirely.

**Where:** `lib/ai/fraud.ts`

**Triggered from:** `POST /api/payments/create-order` — synchronously, before calling Razorpay. Must be fast (<50ms).

**Model approach:** Rule-based scoring (immediate) + async ML enrichment. Rules run in <5ms. ML model runs async and updates the fraud score in DB for review.

**Interface:**

```typescript
// lib/ai/fraud.ts

export interface FraudSignals {
  member_id: string;
  ip_address: string;
  user_agent: string;
  amount_paise: number;
  deal_id: string;
  payment_method: string;
  member_age_days: number;         // days since account created
  lifetime_bookings: number;
  bookings_last_24h: number;
  tokens_used_pct: number;         // what % of order is being paid in tokens
  is_new_delivery_address: boolean;
  same_ip_different_members: number;  // how many other members used this IP today
}

export interface FraudScore {
  risk_score: number;              // 0-100; >70 = high risk
  risk_level: 'low' | 'medium' | 'high' | 'block';
  triggered_rules: string[];       // ['new_account_high_value', 'ip_shared_5_accounts']
  action: 'allow' | 'flag' | 'block';
  // allow: proceed normally
  // flag: proceed but add to manual review queue
  // block: reject the order
  reason?: string;                 // shown to member if blocked: "Contact support"
}

export function scoreFraudRisk(signals: FraudSignals): FraudScore {
  // TODO: implement rule-based scoring
  // Block rules (score = 100):
  //   - same_ip_different_members > 5
  //   - member_age_days < 1 AND amount > 100000 paise (₹1000)
  //   - bookings_last_24h > 10
  // High risk rules (+20-30 each):
  //   - tokens_used_pct > 0.8 (trying to use all tokens on high-value order)
  //   - member_age_days < 7 AND amount > 500000 paise
  //   - is_new_delivery_address AND amount > 200000 paise
  throw new Error('Not implemented');
}
```

**New DB table needed:**
```sql
CREATE TABLE fraud_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  member_id UUID REFERENCES members(id),
  fraud_score INTEGER,
  risk_level TEXT,
  triggered_rules TEXT[],
  reviewed_by UUID,      -- admin who cleared it
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. Smart Notification Timing

**What it does:** Instead of sending all deal notifications at a fixed time (e.g., 10 AM), learns each member's optimal engagement window and sends notifications when that specific member is most likely to open and act.

**Where:** `lib/ai/notification-timing.ts`

**Triggered from:** Notification dispatch queue worker — before sending any notification, call `getOptimalSendTime()`. If the optimal time is in the future, schedule instead of sending immediately.

**Model approach:** Per-member historical analysis. Track notification opens (by time of day), app session times, booking times. Build a simple histogram of engagement probability per hour. No complex ML needed.

**Interface:**

```typescript
// lib/ai/notification-timing.ts

export interface MemberEngagementHistory {
  member_id: string;
  notification_opens: Array<{
    sent_at: string;
    opened_at: string | null;
  }>;
  session_times: Array<{
    started_at: string;
    duration_seconds: number;
  }>;
  booking_times: Array<{
    created_at: string;
  }>;
}

export interface OptimalSendTime {
  member_id: string;
  recommended_hour_ist: number;   // 0-23 in IST timezone
  confidence: number;              // 0-1; below 0.3 = not enough data, use default
  default_used: boolean;           // true if not enough history (use 10 AM IST)
  engagement_probability: number;  // predicted open probability at recommended_hour
}

export function getOptimalSendTime(history: MemberEngagementHistory): OptimalSendTime {
  // TODO: implement
  // If fewer than 5 notification opens: return default 10 AM IST, confidence=0
  // Otherwise: find the 3-hour window with highest open rate
  // Return midpoint of that window
  throw new Error('Not implemented');
}

export interface ScheduledNotification {
  notification_id: string;
  member_id: string;
  send_at: string;     // ISO datetime
  type: string;
  payload: Record<string, unknown>;
}

export async function scheduleNotification(
  notification: Omit<ScheduledNotification, 'send_at'>,
  history: MemberEngagementHistory
): Promise<ScheduledNotification> {
  // TODO: implement
  // 1. Get optimal send time
  // 2. If optimal time is within next 2 hours, send now
  // 3. Otherwise, insert into notification_queue with scheduled send_at
  throw new Error('Not implemented');
}
```

---

## 8. Upgrade Propensity Scoring

**What it does:** Predicts which Silver/Gold members are most likely to upgrade to a higher tier if offered a promotion. Enables targeted upgrade campaigns with personalized incentives.

**Where:** `lib/ai/upgrade.ts`

**Triggered from:** Membership lifecycle cron (`POST /api/internal/cron/membership-expiry`) — runs alongside churn prediction. Also triggered when a member approaches their deal access limit (trying to book a deal above their tier).

**Model approach:** Logistic regression similar to churn, but for upgrade prediction. Key signals: deal denials (tried to book a Platinum deal while Gold), category spend rate, referral activity, token earn rate.

**Interface:**

```typescript
// lib/ai/upgrade.ts

export interface UpgradeSignals {
  member_id: string;
  current_tier: 'silver' | 'gold' | 'platinum';
  target_tier: 'gold' | 'platinum' | 'obsidian';
  days_since_join: number;
  total_spend_paise: number;
  spend_last_90_days_paise: number;
  deal_denials_last_30_days: number;  // times tried to book above-tier deal
  categories_accessed: string[];
  referrals_sent: number;
  token_earn_rate_90d: number;        // tokens/day in last 90 days
  membership_expires_in_days: number;
}

export interface UpgradeScore {
  member_id: string;
  current_tier: string;
  target_tier: string;
  upgrade_probability: number;    // 0-1
  propensity_level: 'low' | 'medium' | 'high';
  top_signals: string[];          // ['deal_denials_3', 'high_spend_rate', 'active_referrer']
  recommended_offer: {
    type: 'discount_first_month' | 'bonus_tokens' | 'extended_trial' | 'none';
    value: number;    // rupees off or bonus tokens
    valid_days: number;
  };
  scored_at: string;
}

export function scoreUpgradePropensity(signals: UpgradeSignals): UpgradeScore {
  // TODO: implement logistic regression
  // Strong positive signals:
  //   deal_denials_last_30_days > 0: +0.3 per denial (cap at 3)
  //   spend_last_90_days > tier_median_spend: +0.25
  //   membership_expires_in_days < 30: +0.15 (renewal window = upgrade opportunity)
  //   referrals_sent > 2: +0.1 (engaged member)
  // Negative signals:
  //   total_spend_paise < min_threshold: -0.2 (not getting value, won't pay more)
  //   days_since_join < 30: -0.1 (too new to know value)
  throw new Error('Not implemented');
}

export async function identifyUpgradeCandidates(
  tier: 'silver' | 'gold' | 'platinum'
): Promise<UpgradeScore[]> {
  // TODO: batch score all members of given tier
  // Return members with upgrade_probability > 0.4, sorted by probability desc
  throw new Error('Not implemented');
}
```

**New DB column needed:** `ALTER TABLE members ADD COLUMN upgrade_score JSONB;`

---

## Implementation Priority

| Feature | Value | Complexity | Priority |
|---------|-------|-----------|---------|
| Fraud scoring | High (prevent losses) | Medium | 1 |
| Deal recommendations | High (conversion lift) | Medium | 2 |
| Churn prediction | High (retention) | Low | 3 |
| Upgrade propensity | Medium (revenue) | Low | 4 |
| Personalised feed | Medium (engagement) | Medium | 5 |
| AI Concierge | Medium (NPS) | High | 6 |
| Smart notifications | Low (open rates) | Medium | 7 |
| Price intelligence | Low (trust) | High | 8 |

---

## AI Infrastructure Requirements

| Requirement | Provider | When needed |
|------------|---------|------------|
| LLM API | OpenAI (GPT-4o) | AI Concierge, Price Intel |
| Vector DB | pgvector extension on Supabase | Deal recommendations Phase 3 |
| ML model serving | Vercel Edge Functions (ONNX runtime) | Fraud scoring, churn, upgrade |
| Usage tracking | `ai_usage_log` table | All LLM features |
| Cost cap | `AI_MONTHLY_BUDGET_USD` env var | All LLM features |

**New env vars needed:**
```
OPENAI_API_KEY=sk-...
AI_MONTHLY_BUDGET_USD=500
AI_FEATURES_ENABLED=recommendations,fraud,churn
# comma-separated list to enable/disable features without deploy
```
