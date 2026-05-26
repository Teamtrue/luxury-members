# API Reference — PlutusClub

All API routes are under `/app/api/`. Base URL: `https://plutusclub.in`

**Authentication:** Member routes use Supabase session cookies. Pass cookies with all requests (handled automatically by browsers). For programmatic access, the `Authorization: Bearer <jwt>` header is also accepted by Supabase.

**Error format:**
```json
{ "error": "Human-readable message", "details": [...] }
```

`details` is included on validation errors (Zod issues array). Omitted for auth/server errors.

**Rate limits** are documented per endpoint. Limits shown are per-IP / per-user. Exceeding a limit returns `429 Too Many Requests` with `Retry-After` header (seconds).

---

## Health

### `GET /api/health`

Check system connectivity. Used by uptime monitors and deployment validation.

**Auth required:** No  
**Rate limit:** 60/min per IP  

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-26T10:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "app": "ok",
    "supabase": "ok | error | not_configured",
    "razorpay": "ok | not_configured"
  }
}
```

**Response 503** when `app` check fails.

---

## Authentication

### `POST /api/auth/send-otp`

Send a 6-digit OTP to the specified phone number. In production, Supabase delivers the OTP via SMS.

**Auth required:** No  
**Rate limit:** 5 OTP sends per phone per 10 minutes; 20 per IP per 10 minutes  

**Request body:**
```json
{ "phone": "9876543210" }
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `phone` | string | Yes | Exactly 10 digits, Indian mobile |

**Response 200:**
```json
{ "success": true, "message": "OTP sent to your mobile number" }
```

**Response 400** — validation error:
```json
{ "error": "Must be a 10-digit mobile number", "details": [...] }
```

**Response 429** — rate limited:
```json
{ "error": "Too many OTP requests. Please wait 10 minutes before trying again." }
```
Headers: `Retry-After: 600`

---

### `POST /api/auth/verify-otp`

Verify the OTP. On success, Supabase sets session cookies in the response.

**Auth required:** No  
**Rate limit:** 10 attempts per phone per 10 minutes  

**Request body:**
```json
{ "phone": "9876543210", "otp": "123456" }
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `phone` | string | Yes | 10 digits |
| `otp` | string | Yes | Exactly 6 digits |

**Response 200:**
```json
{
  "success": true,
  "member": { "id": "uuid", "name": "Aarav Mehta", "tier": "platinum", "role": "member" }
}
```

**Response 401:**
```json
{ "error": "Invalid or expired OTP" }
```

**Response 503** (production with Supabase not configured):
```json
{ "error": "Auth service not configured. Contact support." }
```

---

## Members

### `GET /api/members`

List all members. Admin only.

**Auth required:** Admin role  
**Rate limit:** 30/min  

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tier` | string | Filter by tier: `silver`, `gold`, `platinum`, `obsidian`, or `all` |
| `status` | string | Filter by status: `active`, `expired`, `suspended`, `pending`, or `all` |
| `q` | string | Search by name or member ID (case-insensitive) |

**Response 200:**
```json
[
  {
    "id": "PC-001247",
    "name": "Aarav Mehta",
    "email": "aarav.mehta@gmail.com",
    "phone": "+91 98765 43210",
    "tier": "platinum",
    "status": "active",
    "tokens": 4820,
    "joined": "2023-03-15T00:00:00.000Z",
    "membership_expires": "2026-03-14T23:59:59.000Z",
    "referral_code": "AARAV2024"
  }
]
```

**Note:** Currently returns `MOCK_MEMBERS` from `lib/mock-data.ts`. Admin auth check is TODO.

---

### `POST /api/members`

Create a new member. Used by signup flow.

**Auth required:** No (signup is public)  
**Rate limit:** 10/min per IP  

**Request body:**
```json
{
  "name": "Aarav Mehta",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "tier": "silver",
  "referred_by": "PRIYA2024"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | 2-100 chars |
| `email` | string | Yes | Valid email format |
| `phone` | string | Yes | 10 digits |
| `tier` | string | No | `silver` \| `gold` \| `platinum` \| `obsidian`; default `silver` |
| `referred_by` | string | No | Referral code of the referring member |

**Response 201:**
```json
{
  "id": "PC-234567",
  "name": "Aarav Mehta",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "tier": "silver",
  "status": "pending",
  "tokens": 200,
  "referral_code": "AARAV1234"
}
```

**Response 400** — validation error.

---

### `GET /api/members/[id]`

Get a single member by ID.

**Auth required:** Admin role, or member themselves  
**Rate limit:** 60/min  

**Response 200:**
```json
{
  "id": "PC-001247",
  "name": "Aarav Mehta",
  "tier": "platinum",
  "status": "active",
  "tokens": 4820,
  ...
}
```

**Response 404:**
```json
{ "error": "Member not found" }
```

---

### `PATCH /api/members/[id]`

Update a member's profile. Admin use only for tier/status changes; members can update their own name/email.

**Auth required:** Admin role for `tier`/`status` changes; member session for name/email  
**Rate limit:** 30/min  

**Request body (partial update — only include fields to change):**
```json
{
  "tier": "gold",
  "status": "active",
  "name": "Aarav K. Mehta",
  "email": "new-email@example.com"
}
```

| Field | Type | Who can set |
|-------|------|------------|
| `tier` | `silver` \| `gold` \| `platinum` \| `obsidian` | Admin only |
| `status` | `active` \| `expired` \| `suspended` \| `pending` | Admin only |
| `name` | string (2-100 chars) | Admin or self |
| `email` | valid email | Admin or self |

**Response 200:**
```json
{ "id": "PC-001247", "tier": "gold", "updated": true }
```

---

## Deals

### `GET /api/deals`

List deals with filtering and pagination.

**Auth required:** No (public); tier-gated access enforced by `min_tier` filter  
**Rate limit:** 200/min per IP  

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | — | Filter by category name (case-insensitive) |
| `minSavings` | number | — | Minimum savings percentage (e.g., `20` for 20%+) |
| `tier` | string | — | Member's tier — filters out deals requiring higher tier |
| `status` | string | `active` | `active`, `expiring_soon`, `pending`, or `all` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |

**Response 200:**
```json
{
  "deals": [
    {
      "id": "DL-001",
      "title": "Maldives Overwater Villa — 5N/6D",
      "category": "Travel",
      "brand": "Anantara Resorts",
      "club_price": 240000,
      "retail_price": 380000,
      "savings_pct": 37,
      "min_tier": "platinum",
      "status": "active",
      "expires_at": "2026-06-30",
      "max_bookings": 50,
      "current_bookings": 18,
      "description": "...",
      "images": [],
      "created_at": "2026-04-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

---

### `POST /api/deals`

Create a new deal. Admin only.

**Auth required:** Admin role (TODO — not yet enforced)  
**Rate limit:** 30/min  

**Request body:**
```json
{
  "title": "BMW 3 Series Test Drive",
  "category": "Automobiles",
  "brand": "BMW India",
  "description": "48-hour test drive experience",
  "club_price": 0,
  "retail_price": 0,
  "min_tier": "gold",
  "expires_at": "2026-12-31T23:59:59Z",
  "max_bookings": 30
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `title` | string | Yes | 3-200 chars |
| `category` | string | Yes | Non-empty |
| `brand` | string | No | — |
| `description` | string | No | Max 2000 chars |
| `club_price` | integer | Yes | Positive (paise) |
| `retail_price` | integer | Yes | Positive (paise) |
| `min_tier` | string | Yes | `silver` \| `gold` \| `platinum` \| `obsidian` |
| `expires_at` | string | Yes | ISO 8601 datetime |
| `max_bookings` | integer | No | Positive integer |

**Response 201:**
```json
{
  "deal": { "id": "DL-006", "title": "BMW 3 Series Test Drive", "status": "pending", ... }
}
```

---

### `GET /api/deals/[id]`

Get full details for a single deal.

**Auth required:** No  
**Rate limit:** 200/min per IP  

**Response 200:**
```json
{
  "deal": {
    "id": "DL-001",
    "title": "...",
    "terms": "Valid for Platinum and above. Non-refundable.",
    "updated_at": "2026-04-01T00:00:00Z",
    ...
  }
}
```

**Response 404:**
```json
{ "error": "Deal not found" }
```

---

### `PATCH /api/deals/[id]`

Update a deal. Admin only.

**Auth required:** Admin role (TODO — not yet enforced)  
**Rate limit:** 30/min  

**Request body (partial):**
```json
{
  "status": "active",
  "club_price": 235000,
  "expires_at": "2026-07-31T23:59:59Z"
}
```

Allowed fields: `title`, `category`, `brand`, `club_price`, `retail_price`, `min_tier`, `status`, `expires_at`, `max_bookings`, `description`, `terms`

`savings_pct` is recalculated automatically if `club_price` or `retail_price` changes.

Valid status values: `active`, `pending`, `archived`, `expiring`

**Response 200:**
```json
{ "deal": { "id": "DL-001", "status": "active", "savings_pct": 38, ... } }
```

**Response 400** — invalid status:
```json
{ "error": "Invalid status. Must be one of: active, pending, archived, expiring" }
```

---

## Bookings

### `GET /api/bookings`

List bookings for the authenticated member.

**Auth required:** Member session (TODO — currently returns mock data for any caller)  
**Rate limit:** 60/min  

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `pending_payment`, `confirmed`, `processing`, `delivered`, `cancelled` |

**Response 200:**
```json
[
  {
    "id": "bkg-001",
    "member_id": "PC-001247",
    "deal_id": "deal-002",
    "deal_title": "Sony Bravia XR 77\" OLED TV",
    "deal_category": "Electronics",
    "amount_paid": 285000,
    "tokens_used": 500,
    "tokens_earned": 356,
    "payment_method": "card",
    "status": "processing",
    "delivery_address": "12B, Prestige Towers...",
    "razorpay_order_id": "order_NxQ8...",
    "razorpay_payment_id": "pay_NxR9...",
    "created_at": "2026-05-10T14:32:00.000Z",
    "updated_at": "2026-05-10T14:45:00.000Z"
  }
]
```

---

### `POST /api/bookings`

Create a new booking for a deal.

**Auth required:** Member session (TODO — currently uses mock member)  
**Rate limit:** 5/min per user  

**Request body:**
```json
{
  "deal_id": "deal-002",
  "tokens_used": 500,
  "payment_method": "card",
  "delivery_address": "12B, Prestige Towers, MG Road, Bengaluru – 560001",
  "notes": "Please call before delivery"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `deal_id` | string | Yes | Non-empty |
| `tokens_used` | integer | No | 0-50000; must not exceed member's balance |
| `payment_method` | string | No | `upi` \| `netbanking` \| `card` \| `emi` |
| `delivery_address` | string | Yes | 10-500 chars |
| `notes` | string | No | Max 500 chars |

**Business rules:**
- `tokens_used` cannot exceed `member.token_balance`
- `tokens_used` cannot exceed `maxTokenRedemption(deal.club_price, member.tier)` (20-50% cap by tier)
- `amount_paid = deal.club_price * 1.18 - (tokens_used * 0.5)` (club price + 18% GST, minus token discount)
- `tokens_earned = floor(amount_paid * earn_rate_for_tier)`

**Response 201:**
```json
{
  "id": "BK-542310",
  "member_id": "PC-001247",
  "deal_id": "deal-002",
  "deal_title": "Sony Bravia XR 77\" OLED TV",
  "amount_paid": 285250,
  "tokens_used": 500,
  "tokens_earned": 356,
  "status": "pending_payment",
  "delivery_address": "...",
  "created_at": "2026-05-26T10:00:00.000Z",
  "updated_at": "2026-05-26T10:00:00.000Z"
}
```

**Response 400** — token balance exceeded:
```json
{ "error": "tokens_used (600) exceeds your balance (500)" }
```

---

## Payments

### `POST /api/payments/create-order`

Create a Razorpay order for a deal booking payment.

**Auth required:** Member session  
**Rate limit:** 10/min per user  

**Request body:**
```json
{
  "amount": 2852.50,
  "booking_ref": "BK-542310",
  "member_id": "PC-001247"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount in rupees (not paise). Must be > 0 |
| `booking_ref` | string | No | Internal booking reference for receipt |
| `member_id` | string | No | Member ID for receipt generation |

**Response 200:**
```json
{
  "id": "order_NxQ8Kz2pLm3Ty1",
  "amount": 285250,
  "currency": "INR",
  "receipt": "BK-542310",
  "status": "created"
}
```

Pass `id` to the Razorpay checkout SDK as `order_id`.

**Dev mode:** Returns `order_mock_<timestamp>` without calling Razorpay when `RAZORPAY_KEY_ID` is not set.

---

### `POST /api/payments/verify`

Verify the Razorpay payment signature after checkout completion.

**Auth required:** Member session  
**Rate limit:** 20/min per user  

**Request body:**
```json
{
  "razorpay_order_id": "order_NxQ8Kz2pLm3Ty1",
  "razorpay_payment_id": "pay_NxR9Mz3qMn4Uz2",
  "razorpay_signature": "abc123...",
  "booking_id": "BK-542310"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `razorpay_order_id` | string | Yes | Order ID from `create-order` |
| `razorpay_payment_id` | string | Yes | Payment ID from Razorpay callback |
| `razorpay_signature` | string | Yes | HMAC-SHA256 signature from Razorpay |
| `booking_id` | string | No | Internal booking ID to update |

**Verification:** `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` must match `razorpay_signature`.

**Response 200:**
```json
{ "success": true, "booking_id": "BK-542310", "status": "confirmed" }
```

**Response 400** — invalid signature:
```json
{ "error": "Invalid payment signature" }
```

---

### `POST /api/membership/create-order`

Create a Razorpay order for purchasing or renewing a membership plan.

**Auth required:** Any (used during signup before session exists)  
**Rate limit:** 10/min per IP  

**Request body:**
```json
{
  "tier": "gold",
  "member_id": "PC-001247"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tier` | string | Yes | `silver` \| `gold` \| `platinum` \| `obsidian` |
| `member_id` | string | No | For existing members renewing |

**Tier prices (INR, inclusive of 18% GST):**

| Tier | Base price | Total with GST |
|------|-----------|----------------|
| Silver | ₹999 | ₹1,179 |
| Gold | ₹3,999 | ₹4,719 |
| Platinum | ₹9,999 | ₹11,799 |
| Obsidian | ₹24,999 | ₹29,499 |

**Response 200:**
```json
{
  "id": "order_MwP7...",
  "amount": 471900,
  "currency": "INR",
  "receipt": "MEMB-PC-001247-1716710400000",
  "tier": "gold",
  "razorpay_key": "rzp_live_..."
}
```

Note: `razorpay_key` (the publishable key) is included in the response for convenience when initializing the Razorpay checkout SDK.

---

## PC Tokens

### `GET /api/tokens`

List PC Token transactions for the authenticated member.

**Auth required:** Member session (TODO — currently returns mock data)  
**Rate limit:** 60/min  

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter: `earned` \| `redeemed` \| `bonus` \| `expired` |
| `limit` | number | Max results; default 50 |

**Response 200:**
```json
[
  {
    "id": "txn-001",
    "member_id": "PC-001247",
    "type": "earned",
    "amount": 356,
    "description": "Tokens earned on Sony Bravia XR 77\" OLED TV purchase",
    "reference": "bkg-001",
    "created_at": "2026-05-10T14:45:00.000Z"
  }
]
```

Note: `amount` is always positive. Redemptions and expirations are stored as negative amounts (`type: 'redeemed'` with `amount: -500`).

---

### `POST /api/tokens`

Credit or debit tokens for a member. Admin/internal use only.

**Auth required:** Admin session or internal job token  
**Rate limit:** 30/min  

**Request body:**
```json
{
  "type": "bonus",
  "amount": 500,
  "description": "Welcome bonus for new Platinum member",
  "reference": "signup-PC-001247"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `type` | string | Yes | `earned` \| `redeemed` \| `bonus` \| `expired` |
| `amount` | integer | Yes | Positive; sign is inferred from type |
| `description` | string | Yes | Non-empty |
| `reference` | string | No | Booking ID, referral ID, or other context |

For `type: 'redeemed'` or `type: 'expired'`, the amount is stored as negative automatically.

**Response 201:**
```json
{
  "id": "t1716710400000",
  "member_id": "PC-001247",
  "type": "bonus",
  "amount": 500,
  "description": "Welcome bonus...",
  "created_at": "2026-05-26T10:00:00.000Z"
}
```

---

## Referrals

### `GET /api/referrals`

Get referral stats and referee list for the authenticated member.

**Auth required:** Member session (TODO — currently returns mock data)  
**Rate limit:** 60/min  

**Response 200:**
```json
{
  "stats": {
    "total": 5,
    "active": 4,
    "trail_commission_earned": 14050,
    "token_bonuses": 2500,
    "referral_code": "AARAV2024"
  },
  "referrals": [
    {
      "id": "ref-001",
      "referrer_id": "PC-001247",
      "referee_id": "PC-001389",
      "referee_name": "Rohan Gupta",
      "referee_tier": "platinum",
      "status": "active",
      "joined_at": "2023-06-10T00:00:00.000Z",
      "total_purchases": 425000,
      "trail_commission_earned": 8500,
      "token_bonus": 500
    }
  ]
}
```

Note: `trail_commission_earned` is in rupees (not paise) in the mock data but will be paise in the real DB.

---

## Webhooks

### `POST /api/webhooks/razorpay`

Razorpay sends payment events to this endpoint. Register in Razorpay Dashboard → Settings → Webhooks.

**Auth required:** Webhook signature verification (not session-based)  
**Rate limit:** Not rate-limited (Razorpay controls call frequency)  

**Headers required:**
```
x-razorpay-signature: <HMAC-SHA256 of raw body with RAZORPAY_WEBHOOK_SECRET>
```

**Verification:** `HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` must match the `x-razorpay-signature` header. Returns 400 if mismatch.

**Handled events:**

| Event | Action |
|-------|--------|
| `payment.captured` | TODO: Update booking status → `confirmed`; credit PC Tokens; send confirmation SMS/email |
| `payment.failed` | TODO: Update booking status → `payment_failed`; notify member |
| `refund.created` | TODO: Update booking; reverse PC Tokens |
| `subscription.charged` | TODO: Renew membership; update `membership_expires_at` |

**Response 200:**
```json
{ "received": true }
```

Razorpay requires a 200 response within 5 seconds. All heavy processing must be async (write to queue, return immediately).

---

## Admin

### `POST /api/admin/login`

Admin authentication with email and password.

**Auth required:** No  
**Rate limit:** 10/min per IP  

**Request body:**
```json
{ "email": "admin@plutusclub.in", "password": "securepassword" }
```

**Response 200:**
```json
{ "success": true, "role": "super_admin" }
```

Session cookie is set by Supabase Auth in the response.

**Response 401:**
```json
{ "error": "Invalid credentials" }
```

**Response 403:**
```json
{ "error": "Access denied. Admin privileges required." }
```

**Dev shortcut:** `admin@plutusclub.in` / `admin123` is accepted in `NODE_ENV !== 'production'`.

---

## Internal (Cron Jobs)

All `/api/internal/*` routes require:
```
Authorization: Bearer <INTERNAL_JOB_TOKEN>
```

Returns 401 if token is missing or incorrect.

### `POST /api/internal/cron/membership-expiry`

Check for memberships expiring in the next 30 days. Send renewal reminders. Mark expired memberships.

**Response 200:**
```json
{
  "processed": 47,
  "reminded": 12,
  "expired": 3,
  "duration_ms": 1240
}
```

---

### `POST /api/internal/cron/token-expiry`

Expire tokens older than `token_expiry_months` (config setting, default 12 months).

**Response 200:**
```json
{ "members_affected": 8, "tokens_expired": 3400, "duration_ms": 890 }
```

---

### `POST /api/internal/cron/deal-status`

Archive deals whose `expires_at` is in the past. Mark deals expiring in 7 days as `expiring_soon`.

**Response 200:**
```json
{ "archived": 2, "marked_expiring_soon": 5, "duration_ms": 340 }
```

---

### `POST /api/internal/cron/referral-commission`

Calculate and record trail commissions earned since last run.

**Response 200:**
```json
{ "referrals_processed": 156, "commission_credited_paise": 48500, "duration_ms": 2100 }
```

---

## Error Codes

| HTTP Status | When used |
|------------|-----------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error, malformed request, business rule violation |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized (wrong role) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error (check Vercel logs) |
| 503 | External service unavailable (Supabase down, payment gateway error) |

All error responses have the shape:
```json
{ "error": "Human-readable message" }
```

Validation errors additionally include:
```json
{
  "error": "Must be a 10-digit mobile number",
  "details": [
    { "code": "custom", "message": "Must be a 10-digit mobile number", "path": ["phone"] }
  ]
}
```
