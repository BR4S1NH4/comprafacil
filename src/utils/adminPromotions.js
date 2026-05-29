import { calcProduto } from '../data'

/** Campanhas fictícias para a gestão de produtos (admin). */
export const ADMIN_CAMPAIGNS = [
  {
    id: 'semana-cimento',
    titulo: 'Semana do Cimento & Cal',
    subtitulo: 'Revise margens PIX dos sacos 50kg — destaque sugerido na vitrine',
    emoji: '🏗️',
    tone: 'amber',
    apply: { busca: 'cimento', filtro: 'todos', highlightLabel: 'Cimento e cal' },
  },
  {
    id: 'combo-agregados',
    titulo: 'Combo Agregados para Obra',
    subtitulo: 'Areia, brita e pedrisco com alto giro — campanha «Obra Completa»',
    emoji: '🏖️',
    tone: 'teal',
    apply: { busca: 'agregados', filtro: 'todos', highlightLabel: 'Agregados' },
  },
  {
    id: 'ferro-aco',
    titulo: 'Ferro & Aço em Promo',
    subtitulo: 'Vergalhões e telas — ajuste estoque mínimo antes do pico de vendas',
    emoji: '🔩',
    tone: 'violet',
    apply: { busca: 'ferro', filtro: 'todos', highlightLabel: 'Ferro e aço' },
  },
  {
    id: 'pintura-verao',
    titulo: 'Pintura Verão Castor',
    subtitulo: 'Tintas e massas corrida — PIX reforçado na loja esta semana',
    emoji: '🎨',
    tone: 'rose',
    apply: { busca: 'tinta', filtro: 'todos', highlightLabel: 'Pintura' },
  },
  {
    id: 'reposicao-critica',
    titulo: 'Reposição Crítica',
    subtitulo: 'Itens abaixo do mínimo — priorize compra e reabastecimento',
    emoji: '⚠️',
    tone: 'sky',
    apply: { busca: '', filtro: 'alerta', highlightLabel: 'Alerta de estoque' },
  },
  {
    id: 'pix-campeoes',
    titulo: 'Campeões de Desconto PIX',
    subtitulo: 'Materiais com maior % PIX válido — use nos anúncios da vitrine',
    emoji: '⚡',
    tone: 'emerald',
    apply: { busca: '', filtro: 'pix-ok', highlightLabel: 'PIX válido' },
  },
  {
    id: 'ferramentas-pro',
    titulo: 'Ferramentas Pro Obra',
    subtitulo: 'Martelos, discos e EPI — kit «Profissional Castor»',
    emoji: '🛠️',
    tone: 'purple',
    apply: { busca: 'ferrament', filtro: 'todos', highlightLabel: 'Ferramentas' },
  },
]

/** Produtos sugeridos para o carrossel admin (PIX + giro + alerta). */
export function pickAdminPromoProducts(produtos, max = 12) {
  const list = Array.isArray(produtos) ? produtos : []
  if (!list.length) return []

  const scored = list.map((p) => {
    const c = calcProduto(p)
    const pix = Number(p.pixDesconto) || 0
    const alerta = p.estoque <= p.minimo ? 1 : 0
    const estoqueOk = p.estoque > 0 ? 1 : 0
    return {
      p,
      c,
      score: pix * 3 + alerta * 8 + estoqueOk * 2 + (c.margemPct > 15 ? 2 : 0),
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max)
}

export function findCampaign(id) {
  return ADMIN_CAMPAIGNS.find((c) => c.id === id) || null
}
