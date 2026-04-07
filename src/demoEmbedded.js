/**
 * Demo embutido: 150 produtos + até 1500 vendas em períodos variados (mesma base do api/seed-demo).
 * Usado quando VITE_DEMO_DATA=true e para exportar INITIAL_* no data.js.
 */
import { RAW_PRODUTOS, CLIENTES } from '../api/rawProdutosDemo.js'

/** Igual api/calc.js / data.js — evita import do servidor no bundle Vite. */
function calcProduto(p) {
  const compra = +p.compra || 0
  const venda = +p.venda || 0
  const tributo = +p.tributo || 0
  const operacional = +p.operacional || 0
  const pixDesconto = +p.pixDesconto || 0
  const tribVal = venda * (tributo / 100)
  const operVal = venda * (operacional / 100)
  const custoTotal = compra + tribVal + operVal
  const margem = venda - custoTotal
  const margemPct = venda > 0 ? (margem / venda) * 100 : 0
  const pixDescontoVal = venda * (pixDesconto / 100)
  const precoPixFinal = venda - pixDescontoVal
  const pixValido = pixDescontoVal <= margem && margem > 0
  return { tribVal, operVal, custoTotal, margem, margemPct, pixDescontoVal, precoPixFinal, pixValido }
}

const NUM_VENDAS = 1500

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function demoProdutoUuid(i) {
  const hex = i.toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex.slice(0, 4)}-${hex.slice(4)}`
}

function demoPedidoUuid(n) {
  const x = (0x100000 + n).toString(16).padStart(12, '0')
  return `00000001-0000-4000-8000-${x.slice(0, 4)}-${x.slice(4)}`
}

/** Produto interno (pix_desconto) + referência mutável para simular vendas. */
function buildProdutosInternos(rng) {
  const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1))
  if (RAW_PRODUTOS.length !== 150) {
    throw new Error(`RAW_PRODUTOS deve ter 150 itens, tem ${RAW_PRODUTOS.length}`)
  }
  return RAW_PRODUTOS.map(([nome, descricao, categoria, unidade, emoji, compra], i) => {
    const mark = 1.2 + rng() * 0.28
    const venda = round2(compra * mark)
    const minimo = Math.max(5, Math.min(45, Math.floor(compra / 3)))
    const estoque = 4000 + Math.floor(rng() * 3500)
    return {
      id: demoProdutoUuid(i),
      codigo: `MAT-${String(i + 1).padStart(5, '0')}`,
      nome,
      descricao,
      categoria,
      unidade,
      emoji,
      compra: round2(compra),
      venda,
      tributo: 8,
      operacional: 7,
      pix_desconto: 10,
      minimo,
      estoque,
    }
  })
}

function toProdutoFront(p) {
  return {
    id: p.id,
    codigo: p.codigo,
    nome: p.nome,
    descricao: p.descricao,
    categoria: p.categoria,
    unidade: p.unidade,
    emoji: p.emoji,
    compra: p.compra,
    venda: p.venda,
    tributo: p.tributo,
    operacional: p.operacional,
    estoque: p.estoque,
    minimo: p.minimo,
    pixDesconto: p.pix_desconto,
  }
}

function margemLinha(p, qty) {
  const prod = {
    compra: p.compra,
    venda: p.venda,
    tributo: p.tributo,
    operacional: p.operacional,
    pixDesconto: p.pix_desconto,
  }
  const c = calcProduto(prod)
  return qty * c.margem
}

function descontoPixLinha(p, qty) {
  const prod = {
    compra: p.compra,
    venda: p.venda,
    tributo: p.tributo,
    operacional: p.operacional,
    pixDesconto: p.pix_desconto,
  }
  const c = calcProduto(prod)
  return qty * (p.venda - c.precoPixFinal)
}

function randomPedidoTimestampMs(now, rng) {
  const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1))
  const dayMs = 24 * 60 * 60 * 1000
  const u = rng()
  let daysAgo
  if (u < 0.1) daysAgo = randInt(0, 7)
  else if (u < 0.22) daysAgo = randInt(8, 29)
  else if (u < 0.4) daysAgo = randInt(30, 119)
  else if (u < 0.58) daysAgo = randInt(120, 364)
  else if (u < 0.75) daysAgo = randInt(365, 729)
  else daysAgo = randInt(730, 1095)
  return now - daysAgo * dayMs - randInt(0, dayMs - 1)
}

function buildPedidoLines(produtos, rng) {
  const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1))
  const nItens = randInt(1, 7)
  const lines = []
  const used = new Set()
  let tries = 0
  while (lines.length < nItens && tries < 100) {
    tries++
    const idx = randInt(0, produtos.length - 1)
    if (used.has(idx)) continue
    const prod = produtos[idx]
    if (prod.estoque <= 0) continue
    const qty = Math.min(randInt(1, 12), prod.estoque)
    if (qty < 1) continue
    used.add(idx)
    lines.push({ prod, qty })
  }
  return lines
}

function nomeClienteSeeded(i) {
  const base = CLIENTES[i % CLIENTES.length]
  const n = Math.floor(i / CLIENTES.length)
  return n === 0 ? base : `${base} (#${n + 1})`
}

function buildRankingFromLineItems(produtos, pedidos) {
  const byId = new Map(produtos.map((p) => [p.id, p]))
  const agg = new Map()
  for (const ped of pedidos) {
    const lines = ped.lineItems
    if (!lines) continue
    for (const li of lines) {
      const prev = agg.get(li.produtoId) || { qtd: 0, faturamento: 0 }
      prev.qtd += li.qty
      prev.faturamento += li.subtotal
      agg.set(li.produtoId, prev)
    }
  }
  const ranking = [...agg.entries()]
    .map(([id, v]) => {
      const p = byId.get(id)
      return {
        id,
        nome: p?.nome || '',
        emoji: p?.emoji || '📦',
        qtd: v.qtd,
        faturamento: round2(v.faturamento),
      }
    })
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 50)
  return ranking
}

function seedVendas(produtos, rng) {
  const now = Date.now()
  const pedidos = []
  let inseridos = 0
  let tentativas = 0
  const maxTentativas = NUM_VENDAS * 8

  while (inseridos < NUM_VENDAS && tentativas < maxTentativas) {
    tentativas++
    const lines = buildPedidoLines(produtos, rng)
    if (lines.length === 0) continue

    const payMode = rng() < 0.42 ? 'pix' : 'cartao'
    let subtotal = 0
    let lucro = 0
    let desconto = 0

    for (const { prod, qty } of lines) {
      subtotal += prod.venda * qty
      lucro += margemLinha(prod, qty)
      if (payMode === 'pix') {
        desconto += descontoPixLinha(prod, qty)
      }
    }

    const total = round2(subtotal - desconto)
    const itensQtd = lines.reduce((a, l) => a + l.qty, 0)
    const dataMs = randomPedidoTimestampMs(now, rng)

    const lineItems = lines.map(({ prod, qty }) => ({
      produtoId: prod.id,
      qty,
      subtotal: round2(prod.venda * qty),
    }))

    for (const { prod, qty } of lines) {
      prod.estoque -= qty
    }

    pedidos.push({
      id: demoPedidoUuid(inseridos),
      data: dataMs,
      cliente: nomeClienteSeeded(inseridos),
      pagamento: payMode,
      total,
      desconto: round2(desconto),
      lucroEstimado: round2(lucro),
      status: 'concluido',
      itens: itensQtd,
      lineItems,
    })
    inseridos++
  }

  return pedidos
}

function buildDemoDataset() {
  const rngP = mulberry32(0xc0ffee)
  const rngS = mulberry32(0xdeadbeef)
  const internos = buildProdutosInternos(rngP)
  const produtosMut = internos.map((p) => ({ ...p }))
  const pedidosComLinhas = seedVendas(produtosMut, rngS)
  const produtosFront = produtosMut.map(toProdutoFront)
  const pedidosUi = pedidosComLinhas
  const ranking = buildRankingFromLineItems(produtosFront, pedidosUi)
  return {
    INITIAL_PRODUCTS: produtosFront,
    INITIAL_PEDIDOS: pedidosUi,
    DEMO_RANKING: ranking,
  }
}

const built = buildDemoDataset()

export const INITIAL_PRODUCTS = built.INITIAL_PRODUCTS
export const INITIAL_PEDIDOS = built.INITIAL_PEDIDOS
export const DEMO_RANKING = built.DEMO_RANKING

/** Recalcula ranking (modo demo) após novo checkout. */
export function computeDemoRanking(produtos, pedidos) {
  return buildRankingFromLineItems(produtos, pedidos)
}
