import { apiUrl } from '../config/apiBase.js'
import { parseApiResponse } from './parseApiResponse.js'

export async function loginRequest(usuario, senha) {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  })
  return parseApiResponse(res)
}

export async function registerRequest(nome, usuario, senha) {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, usuario, senha }),
  })
  return parseApiResponse(res)
}

export async function logoutRequest(token) {
  const res = await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseApiResponse(res)
}

export async function listUsersRequest(token) {
  const res = await fetch(apiUrl('/api/users'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseApiResponse(res)
}

export async function resetUserPasswordRequest(token, userId, novaSenha) {
  const res = await fetch(apiUrl(`/api/users/${userId}/password`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ novaSenha }),
  })
  return parseApiResponse(res)
}
