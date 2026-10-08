const HOTEL_NAME = 'Smile Hotel MS'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function csvEscape(value) {
  if (value == null) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function cellText(row, column) {
  if (typeof column.value === 'function') return column.value(row)
  if (column.key) return row?.[column.key]
  return ''
}

function formatDay(value) {
  if (!value) return ''
  const text = String(value)
  const key = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
  const d = new Date(`${key}T00:00:00`)
  if (Number.isNaN(d.getTime())) return text
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatReportRange(from, to) {
  const start = formatDay(from)
  const end = formatDay(to)
  if (!start && !end) return 'All dates'
  if (start && end && start === end) return start
  if (start && end) return `${start} – ${end}`
  if (start) return `From ${start}`
  return `Until ${end}`
}

export function formatExportWhen(date = new Date()) {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileBase(title) {
  return String(title || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'report'
}

function reportMeta({ title, from, to, exportedBy, exportedAt }) {
  return {
    hotel: HOTEL_NAME,
    title: title || 'Report',
    range: formatReportRange(from, to),
    exportedBy: exportedBy || 'Staff',
    exportedAt: exportedAt || formatExportWhen(),
  }
}

export function buildReportCsv({ title, from, to, exportedBy, rows, columns } = {}) {
  const meta = reportMeta({ title, from, to, exportedBy })
  const list = Array.isArray(rows) ? rows : []
  const cols = Array.isArray(columns) ? columns : []
  const lines = [
    csvEscape(meta.hotel),
    csvEscape(meta.title),
    csvEscape(meta.range),
    `${csvEscape('Exported by')},${csvEscape(meta.exportedBy)}`,
    `${csvEscape('Exported at')},${csvEscape(meta.exportedAt)}`,
    '',
    cols.map((col) => csvEscape(col.label)).join(','),
    ...list.map((row) => cols.map((col) => csvEscape(cellText(row, col))).join(',')),
  ]
  return `\uFEFF${lines.join('\n')}`
}

export function downloadReportCsv(options = {}) {
  const csv = buildReportCsv(options)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileBase(options.title)}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function buildReportHtml(options = {}, { preview } = {}) {
  const meta = reportMeta(options)
  const list = Array.isArray(options.rows) ? options.rows : []
  const cols = Array.isArray(options.columns) ? options.columns : []
  const head = cols.map((col) => `<th>${escapeHtml(col.label)}</th>`).join('')
  const body = list.length
    ? list
        .map((row) => `<tr>${cols.map((col) => `<td>${escapeHtml(cellText(row, col))}</td>`).join('')}</tr>`)
        .join('')
    : `<tr><td colspan="${Math.max(cols.length, 1)}">No rows in this period.</td></tr>`
  const toolbar = preview
    ? `<div class="toolbar">
        <p>Preview — close this window when you are done, or save as PDF.</p>
        <div>
          <button type="button" onclick="window.print()">PDF / Print</button>
        </div>
      </div>`
    : ''
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(meta.hotel)} — ${escapeHtml(meta.title)}</title>
  <style>
    body { font-family: Georgia, serif; color: #1c1917; padding: 32px 36px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: -8px 0 20px; padding: 10px 12px; border: 1px solid #e7e5e4; border-radius: 10px; background: #fafaf9; font-family: system-ui, sans-serif; font-size: 13px; }
    .toolbar p { margin: 0; color: #57534e; }
    .toolbar button { border: 1px solid #d6d3d1; background: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
    .head { text-align: center; margin-bottom: 20px; }
    .hotel { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.02em; }
    .title { margin: 8px 0 0; font-size: 18px; font-weight: 600; }
    .range { margin: 6px 0 0; font-size: 13px; color: #57534e; }
    .byline { text-align: right; margin: 0 0 10px; font-size: 12px; color: #44403c; line-height: 1.45; }
    .byline p { margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 7px 6px; border-bottom: 1px solid #e7e5e4; text-align: left; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; color: #57534e; border-bottom: 1px solid #a8a29e; }
    @media print { body { padding: 12px; } .toolbar { display: none !important; } }
  </style>
</head>
<body>
  ${toolbar}
  <header class="head">
    <p class="hotel">${escapeHtml(meta.hotel)}</p>
    <h1 class="title">${escapeHtml(meta.title)}</h1>
    <p class="range">${escapeHtml(meta.range)}</p>
  </header>
  <div class="byline">
    <p>${escapeHtml(meta.exportedBy)}</p>
    <p>${escapeHtml(meta.exportedAt)}</p>
  </div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`
}

export function openStaffReport(options = {}, { autoPrint = false } = {}) {
  const w = window.open('', autoPrint ? 'staff-report-pdf' : 'staff-report-view', 'width=960,height=900')
  if (!w) return
  w.document.write(buildReportHtml(options, { preview: !autoPrint }))
  w.document.close()
  w.focus()
  if (autoPrint) w.print()
}
