/** Mesma lógica de `src/data.js` — usada no checkout no servidor. */
export function calcProduto(p) {
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

  return {
    tribVal,
    operVal,
    custoTotal,
    margem,
    margemPct,
    pixDescontoVal,
    precoPixFinal,
    pixValido,
  }
}
