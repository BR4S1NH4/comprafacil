/** Parse JSON API responses; throws Error with a clear message when !ok. */
export async function parseApiResponse(res) {
  const text = await res.text()
  let payload = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = {}
  }
  if (!res.ok) {
    if (payload.error) throw new Error(payload.error)
    if ([502, 503, 504].includes(res.status)) {
      throw new Error(
        'Servidor da API indisponivel. Inicie a API na porta 3001 (por exemplo: docker compose up postgres api e, em seguida, npm run dev).'
      )
    }
    if (res.status === 404) {
      throw new Error(
        'Rota da API nao encontrada (404). Se roda npm run dev na maquina (fora do Docker), apague ou ajuste VITE_API_PROXY_TARGET no .env (use http://127.0.0.1:3001; nao use http://api:3001). Confirme tambem a API na pasta api com npm start na porta 3001.'
      )
    }
    throw new Error(
      `Falha na requisicao (HTTP ${res.status}). Verifique se a API CompraFacil esta rodando na porta 3001.`
    )
  }
  return payload
}
