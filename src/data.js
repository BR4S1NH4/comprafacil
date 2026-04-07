/* ═══════════════════════════════════════════════════════════
   Castor Construtor — Data & Business Logic
   ═══════════════════════════════════════════════════════════ */

export const CATEGORIAS = ['Estrutura','Acabamento','Cobertura','Insumos','Hidráulica','Elétrica','Ferragens']
export const UNIDADES   = ['unidade','saco','lata','m²','m³','rolo','cento','milheiro','barra','par','caixa','kg','litro']
export const EMOJIS     = ['📦','🏗️','🎨','🧱','⛏️','🔩','🏠','🪣','⬜','🪟','🚪','🔌','💧','🪜','⚙️','🔧','🔑','🪤','🧰','🛢️']

/* ── Business logic ─────────────────────────────────────── */
export function calcProduto(p) {
  const compra       = +p.compra || 0
  const venda        = +p.venda  || 0
  const tributo      = +p.tributo || 0
  const operacional  = +p.operacional || 0
  const pixDesconto  = +p.pixDesconto || 0

  const tribVal      = venda * (tributo / 100)
  const operVal      = venda * (operacional / 100)
  const custoTotal   = compra + tribVal + operVal
  const margem       = venda - custoTotal
  const margemPct    = venda > 0 ? (margem / venda) * 100 : 0
  const pixDescontoVal  = venda * (pixDesconto / 100)
  const precoPixFinal   = venda - pixDescontoVal
  const pixValido    = pixDescontoVal <= margem && margem > 0

  return { tribVal, operVal, custoTotal, margem, margemPct, pixDescontoVal, precoPixFinal, pixValido }
}

export function stockStatus(p) {
  if (p.estoque === 0)           return { label:'Sem estoque', cls:'label-default', color:'#aaa', textColor:'#fff' }
  if (p.estoque <  p.minimo)     return { label:'Crítico',     cls:'label-danger',  color:'#c53030', textColor:'#fff' }
  if (p.estoque === p.minimo)    return { label:'Atenção',     cls:'label-warning', color:'#E9A800', textColor:'#231F20' }
  return                                { label:'Normal',      cls:'label-success', color:'#198754', textColor:'#fff' }
}

/* ── Formatting ─────────────────────────────────────────── */
export function fmt(v) {
  return Number(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })
}
export function fmtN(v, dec=0) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
export function fmtPct(v) {
  return Number(v).toFixed(2) + '%'
}
export function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const DAY_MS = 86400000

/** Eixo Y em gráficos de valor (evita “0k” quando faturamento é baixo). */
export function formatChartCurrencyAxis(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(Math.round(n))
}

/** Início do dia local (meia-noite). */
function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Últimos 7 dias corridos (hoje inclusive), somando faturamento e lucro por dia.
 * Usa `pedidos[].data` (ms) como no retorno da API.
 */
export function computeWeekSeriesFromPedidos(pedidos) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const series = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = todayStart - i * DAY_MS
    const dayEnd = dayStart + DAY_MS
    let valor = 0
    let lucro = 0
    for (const p of list) {
      const ts = Number(p.data)
      if (!Number.isFinite(ts) || ts < dayStart || ts >= dayEnd) continue
      valor += +p.total || 0
      lucro += +p.lucroEstimado || 0
    }
    const dayDate = new Date(dayStart)
    series.push({
      dia: WEEKDAY_SHORT[dayDate.getDay()],
      valor,
      lucro,
      label: dayDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    })
  }
  return series
}

/** Últimas `numWeeks` semanas (7 dias cada), faturamento + lucro; mais antiga primeiro. */
export function computeWeekBucketsFromPedidos(pedidos, numWeeks = 4) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const out = []
  for (let w = numWeeks - 1; w >= 0; w--) {
    const weekEnd = todayStart - w * 7 * DAY_MS + DAY_MS
    const weekStart = weekEnd - 7 * DAY_MS
    let valor = 0
    let lucro = 0
    for (const p of list) {
      const ts = Number(p.data)
      if (!Number.isFinite(ts) || ts < weekStart || ts >= weekEnd) continue
      valor += +p.total || 0
      lucro += +p.lucroEstimado || 0
    }
    out.push({ sem: `Sem ${numWeeks - w}`, valor, lucro })
  }
  return out
}

/** Últimos 90 dias em 3 faixas de ~30 dias (mais antiga primeiro). */
export function computeTrimestreBucketsFromPedidos(pedidos) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const out = []
  for (let m = 2; m >= 0; m--) {
    const startMs = todayStart - (m + 1) * 30 * DAY_MS
    const endMs = m === 0 ? todayStart + DAY_MS : todayStart - m * 30 * DAY_MS
    let valor = 0
    let lucro = 0
    for (const p of list) {
      const ts = Number(p.data)
      if (!Number.isFinite(ts) || ts < startMs || ts >= endMs) continue
      valor += +p.total || 0
      lucro += +p.lucroEstimado || 0
    }
    const label = m === 0 ? '0–30 d' : m === 1 ? '31–60 d' : '61–90 d'
    out.push({ sem: label, valor, lucro })
  }
  return out
}

/** Filtra pedidos pelo período selecionado nos relatórios (referência: hoje). */
export function filterPedidosByPeriod(pedidos, periodo) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const end = todayStart + DAY_MS
  let start
  if (periodo === 'semana') start = todayStart - 6 * DAY_MS
  else if (periodo === 'mes') start = todayStart - 29 * DAY_MS
  else if (periodo === 'trimestre') start = todayStart - 89 * DAY_MS
  else if (periodo === 'ano') start = todayStart - 364 * DAY_MS
  else if (periodo === 'anos') start = todayStart - Math.floor(365 * 3) * DAY_MS
  else start = todayStart - 89 * DAY_MS
  return list.filter((p) => {
    const ts = Number(p.data)
    return Number.isFinite(ts) && ts >= start && ts < end
  })
}

/** Últimos `numMonths` meses calendário (do dia 1 ao fim do mês; mês atual até hoje). */
export function computeMonthlyBucketsFromPedidos(pedidos, numMonths = 12) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const out = []
  for (let i = numMonths - 1; i >= 0; i--) {
    const ref = new Date(todayStart)
    ref.setDate(1)
    ref.setMonth(ref.getMonth() - i)
    const y = ref.getFullYear()
    const mo = ref.getMonth()
    const startMs = new Date(y, mo, 1).getTime()
    let endMs = new Date(y, mo + 1, 1).getTime()
    if (endMs > todayStart + DAY_MS) endMs = todayStart + DAY_MS
    let valor = 0
    let lucro = 0
    for (const p of list) {
      const ts = Number(p.data)
      if (!Number.isFinite(ts) || ts < startMs || ts >= endMs) continue
      valor += +p.total || 0
      lucro += +p.lucroEstimado || 0
    }
    const label = ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(/\./g, '')
    out.push({ sem: label, valor, lucro })
  }
  return out
}

/** Anos calendário (últimos `numYears` anos; ano corrente até hoje). */
export function computeYearlyBucketsFromPedidos(pedidos, numYears = 3) {
  const list = Array.isArray(pedidos) ? pedidos : []
  const todayStart = startOfLocalDay(new Date())
  const currentYear = new Date(todayStart).getFullYear()
  const out = []
  for (let i = numYears - 1; i >= 0; i--) {
    const year = currentYear - i
    const startMs = new Date(year, 0, 1).getTime()
    let endMs = new Date(year + 1, 0, 1).getTime()
    if (i === 0) endMs = Math.min(endMs, todayStart + DAY_MS)
    let valor = 0
    let lucro = 0
    for (const p of list) {
      const ts = Number(p.data)
      if (!Number.isFinite(ts) || ts < startMs || ts >= endMs) continue
      valor += +p.total || 0
      lucro += +p.lucroEstimado || 0
    }
    out.push({ sem: String(year), valor, lucro })
  }
  return out
}

/**
 * Série principal do relatório (barras faturamento × lucro) conforme período.
 */
export function computeRelatorioSeries(pedidos, periodo) {
  const filtered = filterPedidosByPeriod(pedidos, periodo)
  if (periodo === 'semana') {
    return {
      xKey: 'dia',
      data: computeWeekSeriesFromPedidos(filtered),
      title: 'Faturamento × Lucro — últimos 7 dias',
    }
  }
  if (periodo === 'mes') {
    return {
      xKey: 'sem',
      data: computeWeekBucketsFromPedidos(filtered, 5),
      title: 'Faturamento × Lucro — semanas (até 30 dias)',
    }
  }
  if (periodo === 'trimestre') {
    return {
      xKey: 'sem',
      data: computeTrimestreBucketsFromPedidos(filtered),
      title: 'Faturamento × Lucro — últimos 90 dias (faixas de 30 dias)',
    }
  }
  if (periodo === 'ano') {
    return {
      xKey: 'sem',
      data: computeMonthlyBucketsFromPedidos(filtered, 12),
      title: 'Faturamento × Lucro — últimos 12 meses',
    }
  }
  if (periodo === 'anos') {
    return {
      xKey: 'sem',
      data: computeYearlyBucketsFromPedidos(filtered, 3),
      title: 'Faturamento × Lucro — por ano (últimos 3 anos)',
    }
  }
  return {
    xKey: 'sem',
    data: computeTrimestreBucketsFromPedidos(filtered),
    title: 'Faturamento × Lucro — últimos 90 dias',
  }
}
export const MOCK_SUMMARY = {
  totalFaturamento: 0,
  lucroEstimado:    0,
  totalPedidos:     0,
  pedidosPix:       0,
  descontosPix:     0,
  margemMedia:      0,
  ticketMedio:      0,
}

/** Agrega pedidos persistidos (PostgreSQL) para dashboard / relatórios. */
export function computeSummaryFromPedidos(pedidos) {
  if (!pedidos?.length) {
    return { ...MOCK_SUMMARY }
  }
  const totalFaturamento = pedidos.reduce((s, p) => s + (+p.total || 0), 0)
  const totalPedidos = pedidos.length
  const pedidosPix = pedidos.filter((p) => p.pagamento === 'pix').length
  const descontosPix = pedidos
    .filter((p) => p.pagamento === 'pix')
    .reduce((s, p) => s + (+p.desconto || 0), 0)
  const lucroEstimado = pedidos.reduce((s, p) => s + (+p.lucroEstimado || 0), 0)
  const ticketMedio = totalPedidos ? totalFaturamento / totalPedidos : 0
  const margemMedia = totalFaturamento > 0 ? (lucroEstimado / totalFaturamento) * 100 : 0
  return {
    totalFaturamento,
    lucroEstimado,
    totalPedidos,
    pedidosPix,
    descontosPix,
    margemMedia,
    ticketMedio,
  }
}
