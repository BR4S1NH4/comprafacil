/**
 * Popula o banco com 150 produtos e muitas vendas de demonstração
 * (material de construção), distribuídas em semanas, meses e anos.
 *
 * Uso: node seed-demo.js
 * Requer DATABASE_URL ou padrão em db.js (PostgreSQL).
 */
const NUM_VENDAS = 1500
import { pool, migrate } from './db.js'
import { calcProduto } from './calc.js'
import crypto from 'node:crypto'
import { RAW_PRODUTOS, CLIENTES } from './rawProdutosDemo.js'

/** Escala sobre o preço de compra RAW + margem típica de loja (evita valores exorbitantes). */
const PRECO_COMPRA_ESCALA = 0.73
const MARGEM_MIN = 1.09
const MARGEM_RNG = 0.14

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1))
}

function buildProdutos() {
  if (RAW_PRODUTOS.length !== 150) {
    throw new Error(`Lista de produtos deve ter 150 itens, tem ${RAW_PRODUTOS.length}`)
  }
  return RAW_PRODUTOS.map(([nome, descricao, categoria, unidade, emoji, compra], i) => {
    const compraBase = round2(compra * PRECO_COMPRA_ESCALA)
    const mark = MARGEM_MIN + Math.random() * MARGEM_RNG
    const venda = round2(compraBase * mark)
    const minimo = Math.max(5, Math.min(45, Math.floor(compraBase / 3)))
    const estoque = 4000 + Math.floor(Math.random() * 3500)
    return {
      id: crypto.randomUUID(),
      codigo: `MAT-${String(i + 1).padStart(5, '0')}`,
      nome,
      descricao,
      categoria,
      unidade,
      emoji,
      compra: compraBase,
      venda,
      tributo: 8,
      operacional: 7,
      pix_desconto: 10,
      minimo,
      estoque,
    }
  })
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

/** Distribui datas ao longo de ~3 anos (mais peso nos meses recentes). */
function randomPedidoTimestampMs(now) {
  const dayMs = 24 * 60 * 60 * 1000
  const u = Math.random()
  let daysAgo
  if (u < 0.1) daysAgo = randInt(0, 7)
  else if (u < 0.22) daysAgo = randInt(8, 29)
  else if (u < 0.4) daysAgo = randInt(30, 119)
  else if (u < 0.58) daysAgo = randInt(120, 364)
  else if (u < 0.75) daysAgo = randInt(365, 729)
  else daysAgo = randInt(730, 1095)
  return now - daysAgo * dayMs - randInt(0, dayMs - 1)
}

function buildPedidoLines(produtos) {
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

async function clearDemoData(client) {
  await client.query('DELETE FROM pedido_itens')
  await client.query('DELETE FROM pedidos')
  await client.query('DELETE FROM produtos')
}

async function insertProdutos(client, produtos) {
  for (const p of produtos) {
    await client.query(
      `INSERT INTO produtos (
        id, codigo, nome, descricao, categoria, unidade, emoji,
        compra, venda, tributo, operacional, estoque, minimo, pix_desconto
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        p.id,
        p.codigo,
        p.nome,
        p.descricao,
        p.categoria,
        p.unidade,
        p.emoji,
        p.compra,
        p.venda,
        p.tributo,
        p.operacional,
        p.estoque,
        p.minimo,
        p.pix_desconto,
      ]
    )
  }
}

async function seedVendas(client, produtos) {
  const now = Date.now()
  let inseridos = 0
  let tentativas = 0
  const maxTentativas = NUM_VENDAS * 8

  while (inseridos < NUM_VENDAS && tentativas < maxTentativas) {
    tentativas++
    const lines = buildPedidoLines(produtos)
    if (lines.length === 0) continue

    const payMode = Math.random() < 0.42 ? 'pix' : 'cartao'
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
    const dataMs = randomPedidoTimestampMs(now)

    const ins = await client.query(
      `INSERT INTO pedidos (data_ms, cliente, pagamento, total, desconto, lucro_estimado, status, itens_qtd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        dataMs,
        nomeClienteSeeded(inseridos),
        payMode,
        total,
        round2(desconto),
        round2(lucro),
        'concluido',
        itensQtd,
      ]
    )
    const pedidoId = ins.rows[0].id

    for (const { prod, qty } of lines) {
      const unit = Number(prod.venda)
      const sub = round2(unit * qty)
      await client.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, qty, preco_unit, subtotal)
         VALUES ($1, $2::uuid, $3, $4, $5)`,
        [pedidoId, prod.id, qty, unit, sub]
      )
      await client.query(
        `UPDATE produtos SET estoque = estoque - $1, updated_at = NOW() WHERE id = $2::uuid`,
        [qty, prod.id]
      )
      prod.estoque -= qty
    }
    inseridos++
  }

  if (inseridos < NUM_VENDAS) {
    console.warn(`Aviso: apenas ${inseridos} vendas inseridas (estoque insuficiente para mais).`)
  }
}

async function main() {
  await migrate()
  const produtos = buildProdutos()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await clearDemoData(client)
    await insertProdutos(client, produtos)
    await seedVendas(client, produtos)
    await client.query('COMMIT')
    console.log(`Seed concluído: 150 produtos e até ${NUM_VENDAS} vendas (períodos variados em anos).`)
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
