/**
 * Price intelligence — verifies deal savings are genuine vs. market prices.
 * Phase 1: stub returning no external data.
 * Phase 2: web scraping + LLM extraction (Amazon.in, Flipkart, brand sites).
 */

export interface PriceCheckInput {
  deal_id:             string;
  title:               string;
  brand:               string;
  category:            string;
  club_price:          number; // paise
  stated_retail_price: number; // paise
}

export interface PriceSource {
  source:     string;
  url:        string;
  price_paise: number;
  fetched_at: string;
  confidence: number;
}

export interface PriceIntelResult {
  deal_id:              string;
  sources:              PriceSource[];
  market_low_paise:     number;
  market_high_paise:    number;
  market_median_paise:  number;
  genuine_saving_pct:   number;
  is_suspicious:        boolean;
  flag_reason?:         string;
  checked_at:           string;
}

export async function checkDealPrice(input: PriceCheckInput): Promise<PriceIntelResult> {
  // Phase 1 stub — returns neutral result with no external data.
  // Phase 2: fetch from Amazon PA API, Flipkart API, brand websites.
  return {
    deal_id:             input.deal_id,
    sources:             [],
    market_low_paise:    input.stated_retail_price,
    market_high_paise:   input.stated_retail_price,
    market_median_paise: input.stated_retail_price,
    genuine_saving_pct:  input.stated_retail_price > 0
      ? ((input.stated_retail_price - input.club_price) / input.stated_retail_price) * 100
      : 0,
    is_suspicious: false,
    checked_at:    new Date().toISOString(),
  };
}
