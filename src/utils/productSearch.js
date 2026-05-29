/** Filtro de produtos por termo (nome, código, categoria, descrição). */

export function produtoMatchesTerm(produto, termo) {
  const t = String(termo || '').trim().toLowerCase()
  if (!t) return true
  return (
    produto.nome.toLowerCase().includes(t) ||
    produto.categoria.toLowerCase().includes(t) ||
    String(produto.codigo || '').toLowerCase().includes(t) ||
    String(produto.descricao || '').toLowerCase().includes(t)
  )
}

export function suggestProdutos(produtos, termo, limit = 8) {
  const list = Array.isArray(produtos) ? produtos : []
  const t = String(termo || '').trim()
  if (t.length < 1) {
    return list.filter((p) => p.estoque > 0).slice(0, limit)
  }
  return list.filter((p) => produtoMatchesTerm(p, t)).slice(0, limit)
}
