/**
 * Em produção (ex.: static site no Render), o front e a API costumam estar em hosts
 * diferentes. Defina VITE_API_BASE_URL com a URL pública do Web Service da API
 * (sem barra no final), ex.: https://comprafacil-api1.onrender.com
 * Em dev, deixe vazio: o Vite encaminha /api para o proxy local.
 */
const raw = (import.meta.env.VITE_API_BASE_URL || '').trim()
export const API_BASE = raw.replace(/\/$/, '')

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE) return p
  return `${API_BASE}${p}`
}
