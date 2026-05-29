/**
 * GET /api/bookings/[id]/invoice — GST tax invoice (HTML, browser print-to-PDF)
 *
 * Generates a print-friendly HTML invoice for a confirmed or delivered booking.
 * Includes CGST + SGST breakdown at 18% (GST-inclusive), PC Token discount
 * line item if tokens were redeemed, and full company / GSTIN details.
 *
 * Flow:
 *   1. requireAuth
 *   2. Load booking + deal join — 404 / 403 guards
 *   3. Confirm booking.status IN ('confirmed', 'delivered')
 *   4. Load payment record (optional)
 *   5. Load member profile for Bill To section
 *   6. Derive invoice number from booking_ref
 *   7. Calculate GST components (18% inclusive)
 *   8. Render and return HTML response
 */

import { requireAuth, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { brand } from '@/lib/brand';

// ---------------------------------------------------------------------------
// GET /api/bookings/[id]/invoice
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const db = createServiceRoleClient();

  // Load booking with deal join.
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select(
      `
        id,
        user_id,
        booking_ref,
        status,
        total_paise,
        tokens_used,
        payment_method,
        created_at,
        deals ( title, category )
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (bookingError) {
    console.error('[GET /api/bookings/[id]/invoice] booking query error:', bookingError.message);
    return apiError('Failed to load booking.', 500);
  }
  if (!booking) {
    return apiError('Booking not found.', 404);
  }

  const bookingRow = booking as Record<string, unknown>;

  if (bookingRow.user_id !== user.id) {
    return apiError('You do not have access to this booking.', 403);
  }

  if (!['confirmed', 'delivered'].includes(bookingRow.status as string)) {
    return apiError('Invoice is only available for confirmed bookings.', 400);
  }

  // Resolve joined deal (may be array or object from Supabase).
  const deal = resolveJoin(bookingRow.deals) as Record<string, unknown> | null;

  // Load most recent payment record.
  const { data: payment } = await db
    .from('payments')
    .select('id, amount_paise, provider_payment_id')
    .eq('booking_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentRow = payment as Record<string, unknown> | null;

  // Load member profile for Bill To section.
  const { data: profile } = await db
    .from('user_profiles')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .maybeSingle();

  const profileRow = (profile ?? {}) as Record<string, unknown>;

  // -------------------------------------------------------------------------
  // Invoice calculations
  // -------------------------------------------------------------------------

  const totalPaise: number =
    (paymentRow?.amount_paise as number) ?? (bookingRow.total_paise as number) ?? 0;

  // GST 18% inclusive split: CGST 9% + SGST 9%.
  const basePaise  = Math.round(totalPaise / 1.18);
  const cgstPaise  = Math.round(basePaise * 0.09);
  const sgstPaise  = Math.round(basePaise * 0.09);

  // Token discount (stored as token units; we display separately).
  const tokensUsed = (bookingRow.tokens_used as number) ?? 0;

  // Invoice number.
  const bookingRef   = (bookingRow.booking_ref as string) ?? '';
  const invoiceYear  = new Date().getFullYear();
  const invoiceNum   = `PC-INV-${invoiceYear}-${bookingRef.slice(-6)}`;

  // Format booking date as DD/MM/YYYY.
  const bookingDate = formatDDMMYYYY(bookingRow.created_at as string);

  // Human-readable INR amounts.
  const fmt = (paise: number) =>
    '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const html = buildInvoiceHTML({
    invoiceNum,
    bookingDate,
    bookingRef,
    dealTitle:         (deal?.title    as string) ?? 'Booking',
    dealCategory:      (deal?.category as string) ?? '',
    memberName:        (profileRow.full_name as string) ?? 'Member',
    memberPhone:       (profileRow.phone     as string) ?? '',
    totalPaise,
    basePaise,
    cgstPaise,
    sgstPaise,
    tokensUsed,
    paymentMethod:     (bookingRow.payment_method     as string) ?? 'N/A',
    providerPaymentId: (paymentRow?.provider_payment_id as string) ?? 'N/A',
    fmt,
  });

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ---------------------------------------------------------------------------
// HTML generator
// ---------------------------------------------------------------------------

interface InvoiceParams {
  invoiceNum:        string;
  bookingDate:       string;
  bookingRef:        string;
  dealTitle:         string;
  dealCategory:      string;
  memberName:        string;
  memberPhone:       string;
  totalPaise:        number;
  basePaise:         number;
  cgstPaise:         number;
  sgstPaise:         number;
  tokensUsed:        number;
  paymentMethod:     string;
  providerPaymentId: string;
  fmt:               (paise: number) => string;
}

function buildInvoiceHTML(p: InvoiceParams): string {
  const tokenDiscountRow =
    p.tokensUsed > 0
      ? `<tr>
           <td>${escHtml(brand.tokenName)} Discount</td>
           <td>—</td>
           <td style="text-align:center">1</td>
           <td style="text-align:right;color:#e53e3e">- ${p.tokensUsed} tokens</td>
         </tr>`
      : '';

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tax Invoice ${p.invoiceNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #f7f7f7; padding: 24px; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #ddd; border-radius: 8px; }

    /* Letterhead */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
    .company-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: #1a1a2e; }
    .company-meta { font-size: 11px; color: #555; margin-top: 4px; line-height: 1.6; }
    .invoice-badge { text-align: right; }
    .invoice-badge h2 { font-size: 18px; font-weight: 700; color: #b8860b; letter-spacing: 2px; }
    .invoice-badge p { font-size: 11px; color: #555; margin-top: 4px; }

    /* Metadata grid */
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box h4 { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888; margin-bottom: 6px; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; color: #1a1a2e; line-height: 1.7; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1a1a2e; color: #fff; padding: 9px 10px; font-size: 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #fafafa; }

    /* Totals */
    .totals { width: 320px; margin-left: auto; margin-bottom: 28px; }
    .totals table { margin-bottom: 0; }
    .totals td:last-child { text-align: right; font-weight: 600; }
    .grand-total td { background: #1a1a2e; color: #fff; font-size: 15px; font-weight: 700; padding: 10px; }

    /* Payment details */
    .payment-section { background: #f7f7f7; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; }
    .payment-section h4 { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .payment-section dl { display: grid; grid-template-columns: 160px 1fr; row-gap: 6px; }
    .payment-section dt { font-size: 12px; color: #555; font-weight: 600; }
    .payment-section dd { font-size: 12px; color: #1a1a2e; }

    /* Footer */
    .footer { border-top: 1px solid #eee; padding-top: 14px; font-size: 11px; color: #888; text-align: center; line-height: 1.6; }

    /* Print button */
    .print-btn { display: block; margin: 24px auto 0; padding: 10px 28px; background: #1a1a2e; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { border: none; border-radius: 0; padding: 20px; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Letterhead -->
    <div class="header">
      <div>
        <div class="company-name">${escHtml(brand.legalName.toUpperCase())}</div>
        <div class="company-meta">
          ${escHtml(brand.registeredAddress)}<br />
          GSTIN: ${escHtml(brand.gstin)} &nbsp;|&nbsp; CIN: ${escHtml(brand.cin)}
        </div>
      </div>
      <div class="invoice-badge">
        <h2>TAX INVOICE</h2>
        <p>Invoice No: <strong>${escHtml(p.invoiceNum)}</strong></p>
        <p>Date: <strong>${escHtml(p.bookingDate)}</strong></p>
      </div>
    </div>

    <!-- Bill To / Invoice Details -->
    <div class="meta-grid">
      <div class="meta-box">
        <h4>Bill To</h4>
        <p>
          <strong>${escHtml(p.memberName)}</strong><br />
          ${escHtml(p.memberPhone)}
        </p>
      </div>
      <div class="meta-box" style="text-align:right">
        <h4>Booking Reference</h4>
        <p><strong>${escHtml(p.bookingRef)}</strong></p>
      </div>
    </div>

    <!-- Items -->
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>HSN / SAC</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escHtml(p.dealTitle)}<br /><span style="font-size:11px;color:#888">${escHtml(p.dealCategory)}</span></td>
          <td>9983</td>
          <td style="text-align:center">1</td>
          <td style="text-align:right">${p.fmt(p.basePaise)}</td>
        </tr>
        ${tokenDiscountRow}
      </tbody>
    </table>

    <!-- Tax breakdown + Grand Total -->
    <div class="totals">
      <table>
        <tbody>
          <tr>
            <td>Taxable Amount</td>
            <td>${p.fmt(p.basePaise)}</td>
          </tr>
          <tr>
            <td>CGST @ 9%</td>
            <td>${p.fmt(p.cgstPaise)}</td>
          </tr>
          <tr>
            <td>SGST @ 9%</td>
            <td>${p.fmt(p.sgstPaise)}</td>
          </tr>
          <tr class="grand-total">
            <td>Grand Total</td>
            <td>${p.fmt(p.totalPaise)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment Details -->
    <div class="payment-section">
      <h4>Payment Details</h4>
      <dl>
        <dt>Method</dt>
        <dd>${escHtml(p.paymentMethod)}</dd>
        <dt>Payment ID</dt>
        <dd>${escHtml(p.providerPaymentId)}</dd>
        <dt>Booking Reference</dt>
        <dd>${escHtml(p.bookingRef)}</dd>
      </dl>
    </div>

    <!-- Footer -->
    <div class="footer">
      This is a computer-generated invoice and does not require a physical signature.<br />
      For queries, write to ${escHtml(brand.supportEmail)}
    </div>

    <!-- Print button (hidden on print) -->
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a Supabase joined relation that may be an array or a single object. */
function resolveJoin(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  return (arr[0] as Record<string, unknown>) ?? null;
}

/** Format an ISO date string as DD/MM/YYYY. */
function formatDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Escape HTML special characters to prevent XSS in generated invoice. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
