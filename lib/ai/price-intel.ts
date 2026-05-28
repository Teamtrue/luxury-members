/**
 * lib/ai/price-intel.ts
 *
 * Price intelligence: verifies PlutusClub deal prices against market rates.
 * Phase 1: returns a stub result indicating no external data is available.
 * Phase 2 (future): web scraping + LLM extraction via Amazon/Flipkart APIs.
 *
 * The route that calls this handles the stub gracefully — deals are not
 * blocked from creation when price intel is unavailable.
 */

export interface PriceCheckInput {
  deal_id: string;
  title: string;
  brand: string;
  category: string;
  club_price: number;      // paise
  stated_retail_price: number;
}

export interface PriceSource {
  source: string;
  url: string;
  price_paise: number;
  fetched_at: string;
  confidence: number;
}

export interface PriceIntelResult {
  deal_id: string;
  sources: PriceSource[];
  market_low_paise: number;
  market_high_paise: number;
  market_median_paise: number;
  genuine_saving_pct: number;
  is_suspicious: boolean;
  flag_reason?: string;
  checked_at: string;
  available: boolean;  // false = no external data fetched (stub mode)
}

/**
 * Check deal price against external market data.
 *
 * Currently returns a stub result (available: false) because Phase 2
 * web scraping/LLM extraction is not yet implemented.
 * Callers should check `result.available` before acting on the data.
 */
export async function checkDealPrice(input: PriceCheckInput): Promise<PriceIntelResult> {
  // Phase 2: fetch Amazon/Flipkart/brand-site prices via scraping + LLM extraction.
  // For now, return a stub with available=false so callers can proceed without data.
  return {
    deal_id: input.deal_id,
    sources: [],
    market_low_paise: 0,
    market_high_paise: 0,
    market_median_paise: 0,
    genuine_saving_pct: 0,
    is_suspicious: false,
    checked_at: new Date().toISOString(),
    available: false,
  };
}

/**
 * Basic sanity check using only the stated retail price.
 * Flags obvious inflation without any external data.
 */
export function quickSanityCheck(input: PriceCheckInput): {
  is_suspicious: boolean;
  flag_reason?: string;
} {
  // Club price should never exceed stated retail price.
  if (input.club_price >= input.stated_retail_price) {
    return {
      is_suspicious: true,
      flag_reason: 'club_price_exceeds_or_equals_stated_retail',
    };
  }

  // Saving > 90% is almost certainly inflated retail price.
  const savingPct = (input.stated_retail_price - input.club_price) / input.stated_retail_price;
  if (savingPct > 0.9) {
    return {
      is_suspicious: true,
      flag_reason: `stated_saving_${Math.round(savingPct * 100)}pct_implausibly_high`,
    };
  }

  return { is_suspicious: false };
}
