const usdAccounting = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencySign: 'accounting',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(n) {
  const amount = Number(n)
  const value = Number.isFinite(amount) ? amount : 0
  try {
    return usdAccounting.format(value)
  } catch {
    const abs = Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return value < 0 ? `($${abs})` : `$${abs}`
  }
}
