# Payment Before Confirmation – Setup

## Logic

**Pay before hotel confirms** is a common and logical flow:

1. Guest submits a booking (status: **pending**).
2. Guest sees **payment information** (amount + how to pay).
3. Guest pays (e.g. bank transfer).
4. Hotel receives payment and **confirms** the booking (status: **confirmed**).

This reduces no-shows and secures the reservation.

## What’s Implemented

- After a guest clicks **“Book and Pay Now”**, the booking is saved as **pending**.
- A **payment info box** is shown with:
  - Amount to pay (total for the stay)
  - Payment deadline text
  - Bank / payment method details (editable in config)

## Where to Edit Payment Details

Edit **`config/config.php`** and change these constants to your real details:

| Constant | Purpose |
|----------|--------|
| `PAYMENT_METHOD` | e.g. "Bank Transfer", "Pay at Hotel" |
| `PAYMENT_DEADLINE` | e.g. "Please complete payment within 24 hours to confirm your booking." |
| `PAYMENT_BANK_NAME` | Your bank name |
| `PAYMENT_ACCOUNT_NAME` | Account holder name (e.g. hotel name) |
| `PAYMENT_ACCOUNT_NUMBER` | Bank account number |
| `PAYMENT_SWIFT_OR_ROUTING` | SWIFT / routing code (optional) |
| `PAYMENT_EXTRA_INSTRUCTIONS` | e.g. "Include your booking reference in the transfer note." |

After editing, guests will see your real payment instructions when they complete a booking.

## Optional Next Steps

- Add a **payment_status** column to `bookings` (e.g. unpaid / paid) and an admin page to mark bookings as paid, then auto-confirm when paid.
- Add a **“My Bookings”** page so guests can see their pending bookings and payment info again.
