import { formatMoney } from './money'

export function payMethodLabel(method) {
  if (method === 'bank') return 'Bank'
  if (method === 'card') return 'Card'
  if (method === 'cash') return 'Cash'
  return method || ''
}

export function folioCategoryLabel(category) {
  if (category === 'fnb') return 'F&B'
  if (category === 'minibar') return 'Mini-bar'
  if (category === 'room') return 'Room'
  if (category === 'deposit') return 'Deposit'
  if (category === 'payment') return 'Payment'
  if (category === 'laundry') return 'Laundry'
  return category || 'Other'
}

export function printStayInvoice(inv) {
  const w = window.open('', 'stay-invoice', 'width=800,height=900')
  if (!w) return
  const lines = (inv.lines || [])
    .map((item) => {
      const amt = item.kind === 'payment' ? `−${formatMoney(item.amount)}` : formatMoney(item.amount)
      const method = item.method ? ` · ${payMethodLabel(item.method)}` : ''
      return `<tr>
        <td>${item.created_at || ''}</td>
        <td>${item.description || ''}${method}</td>
        <td>${folioCategoryLabel(item.category)}</td>
        <td class="right">${amt}</td>
      </tr>`
    })
    .join('')
  const methods = inv.payments_by_method || {}
  const methodBits = ['cash', 'bank', 'card']
    .filter((k) => Number(methods[k]) > 0)
    .map((k) => `${payMethodLabel(k)} ${formatMoney(methods[k])}`)
    .join(' · ')
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${inv.invoice_no || 'Invoice'}</title>
  <style>
    body { font-family: Georgia, serif; color: #1c1917; padding: 32px; }
    h1 { font-size: 22px; margin: 0; }
    .muted { color: #78716c; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #57534e; }
    .right { text-align: right; }
    .totals { margin-top: 16px; font-size: 14px; }
    .hotel { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${inv.hotel_name || 'Hotel'}</h1>
  <p class="muted">${inv.hotel_location || ''}</p>
  <p><strong>${inv.invoice_no || ''}</strong>${inv.invoiced_at ? ` · ${inv.invoiced_at}` : ''}</p>
  <p>
    ${inv.guest_name || ''}<br />
    ${inv.guest_email || ''}
    ${inv.guest_id_number ? `<br />ID: ${inv.guest_id_number}` : ''}
  </p>
  <p class="muted">${inv.room_name} · ${inv.check_in} → ${inv.check_out} · ${inv.guests} guest(s)</p>
  <table>
    <thead>
      <tr><th>When</th><th>Line</th><th>Type</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>${lines || '<tr><td colspan="4">No folio lines yet.</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <p>Charges ${formatMoney(inv.folio_charges)} · Payments ${formatMoney(inv.folio_payments)}</p>
    <p><strong>Balance ${formatMoney(inv.folio_balance)}</strong></p>
    ${methodBits ? `<p class="muted">${methodBits}</p>` : ''}
  </div>
  <div class="hotel">
    <p><strong>${inv.hotel_name || 'Hotel'}</strong></p>
    ${inv.hotel_location ? `<p>${inv.hotel_location}</p>` : ''}
    <p>${inv.hotel_phone || '+855 98 944 686'}</p>
    <p>${inv.hotel_email || 'noreply@smilerental.com'}</p>
  </div>
</body>
</html>`)
  w.document.close()
  w.focus()
  w.print()
}
