import { apiUrl } from '../config/apiBase.js'
import { parseApiResponse } from './parseApiResponse.js'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchBranding() {
  const res = await fetch(apiUrl('/api/branding'))
  return parseApiResponse(res)
}

export async function fetchProdutos(token) {
  const res = await fetch(apiUrl('/api/produtos'), { headers: authHeaders(token) })
  const data = await parseApiResponse(res)
  return data.produtos || []
}

export async function fetchPedidos(token) {
  const res = await fetch(apiUrl('/api/pedidos'), { headers: authHeaders(token) })
  const data = await parseApiResponse(res)
  return data.pedidos || []
}

export async function fetchRankingProdutos(token) {
  const res = await fetch(apiUrl('/api/relatorios/ranking-produtos'), { headers: authHeaders(token) })
  const data = await parseApiResponse(res)
  return data.ranking || []
}

export async function fetchEmpresa(token) {
  const res = await fetch(apiUrl('/api/empresa'), { headers: authHeaders(token) })
  return parseApiResponse(res)
}

export async function saveEmpresaRequest(token, empresa) {
  const res = await fetch(apiUrl('/api/empresa'), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(empresa),
  })
  return parseApiResponse(res)
}

export async function saveProdutoRequest(token, produto, isEdit) {
  if (isEdit) {
    const res = await fetch(apiUrl(`/api/produtos/${encodeURIComponent(produto.id)}`), {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(produto),
    })
    return parseApiResponse(res)
  }
  const res = await fetch(apiUrl('/api/produtos'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(produto),
  })
  return parseApiResponse(res)
}

export async function deleteProdutoRequest(token, id) {
  const res = await fetch(apiUrl(`/api/produtos/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return parseApiResponse(res)
}

export async function checkoutPedidoRequest(token, { payMode, items }) {
  const res = await fetch(apiUrl('/api/pedidos/checkout'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ payMode, items }),
  })
  return parseApiResponse(res)
}
