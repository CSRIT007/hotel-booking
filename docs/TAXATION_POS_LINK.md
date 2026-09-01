# Taxation ↔ POS Tax % Link

How **POS tax** (tax % on sales) relates to the **Taxation** sub-page and how the logic works.

---

## Relationship

| Where | What |
|-------|------|
| **POS (Point of Sale)** | On each sale you can set a **tax %** (e.g. 10%). The system calculates **tax amount** = subtotal × (tax% / 100) and stores it in `pos_transactions.tax`. |
| **Taxation page** | You record **tax obligations to pay to the government** (e.g. VAT, Sales Tax) with amount, due date, agency. When you pay, you mark the record as paid. |

**Link:** The tax **collected** at POS (from customers) is the same tax you **remit** to the government. So:

1. POS collects tax (stored in `pos_transactions.tax`).
2. Taxation page records the obligation (e.g. “VAT January 2026 – $X”) and then “Mark as paid” when you pay the agency.

---

## Logic

### POS side (`staff/pos-sales.php`)

- **Tax %** field (default 10%): applied to **subtotal**.
- **Tax amount** = `subtotal × (tax_percent / 100)`.
- Stored in **`pos_transactions`**: `subtotal`, `tax`, `discount`, `total_amount`.
- Only **paid** transactions (`payment_status = 'paid'`) are included in tax summaries.

### Taxation side (`staff/accounting-taxation.php`)

- **“POS tax collected”** section (only if table `pos_transactions` exists):
  - **This month:** `SUM(tax)` where `payment_status = 'paid'` and `transaction_date` in current month.
  - **Last month:** same for previous calendar month.
  - **This quarter:** current quarter (Q1–Q4).
  - **Last quarter:** previous quarter.
- **“Create VAT from [period]”** buttons:
  - Open the **Add Tax Record** modal.
  - Pre-fill: **Tax type** = VAT, **Tax period** = that period (e.g. “January 2026”, “Q1 2026”), **Amount** = POS tax collected for that period.
  - You still enter **Due date**, **Agency**, and optional reference/notes, then save. That creates the tax record you will later mark as paid when you pay the government.

So:

- **POS** = where tax is **collected** (per transaction, by tax %).
- **Taxation** = where you **record and track** what you must pay (and then mark paid). The “Create from POS” flow uses POS **collected** amounts to create those **obligation** records.

---

## Flow

1. **POS:** Sales with tax % → `pos_transactions.tax` (per transaction).
2. **Taxation:** Open page → see “POS tax collected” for This month, Last month, This quarter, Last quarter.
3. **Create obligation:** Click e.g. “Create VAT from this month” → modal opens with VAT, period, and amount filled → add Due date and Agency → Save.
4. **Pay government:** When you pay, open the record → “Mark Paid” → set paid date and amount.

---

## Other tax types

Taxation page is not limited to POS:

- **VAT / Sales Tax** from POS → use “Create VAT from …” or add manually with amount from POS.
- **Income Tax, Property Tax, Withholding, Payroll Tax, Other** → add and track on the same Taxation page; no automatic link to POS (manual entry only).

---

## Summary

- **Related:** Yes. POS tax % drives **collected** tax; Taxation page records **what you pay** to the government. POS tax collected is used to **pre-fill** VAT/Sales Tax records.
- **Logic:** POS stores `tax` per paid transaction; Taxation sums it by period and lets you create a tax record with that amount so you can track and mark it paid.
