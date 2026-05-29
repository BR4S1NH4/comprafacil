import { calcProduto } from '../data'
import { getSearchTerms } from './searchHistory'

function scoreProdutoBusca(p, termos) {
  if (!termos.length) return 0
  const nome = (p.nome || '').toLowerCase()
  const cat = (p.categoria || '').toLowerCase()
  const desc = (p.descricao || '').toLowerCase()
  let s = 0
  for (const t of termos) {
    if (!t) continue
    if (nome.includes(t)) s += 3
    if (cat.includes(t)) s += 2
    if (desc.includes(t)) s += 1
  }
  return s
}

/** Produtos em promoção (buscas recentes + maior desconto PIX). */
export function pickOfertasDoDia(produtos, buscaAtual, max = 12) {
  const history = getSearchTerms()
  const termos = [...history]
  const b = String(buscaAtual || '').trim().toLowerCase()
  if (b.length >= 2) termos.unshift(b)
  const uniq = [...new Set(termos)].slice(0, 8)

  const disponiveis = (Array.isArray(produtos) ? produtos : []).filter((p) => p.estoque > 0)
  if (!disponiveis.length) return []

  const scored = disponiveis.map((p) => {
    const c = calcProduto(p)
    const match = scoreProdutoBusca(p, uniq)
    const pixBoost = Number(p.pixDesconto) || 0
    return {
      p,
      c,
      score: match * 10 + pixBoost + (p.estoque > p.minimo ? 1 : 0),
    }
  })

  scored.sort((a, b) => b.score - a.score)
  const out = []
  const seen = new Set()
  for (const row of scored) {
    if (out.length >= max) break
    if (seen.has(row.p.id)) continue
    seen.add(row.p.id)
    out.push(row)
  }
  if (out.length < max) {
    for (const p of disponiveis) {
      if (out.length >= max) break
      if (seen.has(p.id)) continue
      seen.add(p.id)
      out.push({ p, c: calcProduto(p), score: 0 })
    }
  }
  return out
}
