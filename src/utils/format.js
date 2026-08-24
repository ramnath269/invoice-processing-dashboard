export function money(n) {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}
