import { apiUrl } from '../config/apiBase.js'

const WARM_CACHE_MS = 4 * 60 * 1000
const PING_MS = 12_000

let lastWarmOk = 0
let warmInFlight = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pingHealth(timeoutMs = PING_MS) {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(apiUrl('/api/health'), {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (res.ok) lastWarmOk = Date.now()
    return res.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

/** Dispara warm-up sem bloquear; ignora se a API respondeu recentemente. */
export function warmApi() {
  if (Date.now() - lastWarmOk < WARM_CACHE_MS) return
  if (warmInFlight) return
  warmInFlight = pingHealth(PING_MS).finally(() => {
    warmInFlight = null
  })
}

/**
 * Aguarda a API responder (cold start no Render). onStatus: 'warmup' | 'warmup-retry' | 'ready'
 */
export async function ensureApiReady({ timeoutMs = 90_000, onStatus } = {}) {
  if (Date.now() - lastWarmOk < WARM_CACHE_MS) {
    onStatus?.('ready')
    return true
  }

  onStatus?.('warmup')
  const deadline = Date.now() + timeoutMs
  let attempt = 0

  while (Date.now() < deadline) {
    attempt += 1
    if (attempt > 1) onStatus?.('warmup-retry')
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    const ok = await pingHealth(Math.min(PING_MS, remaining))
    if (ok) {
      onStatus?.('ready')
      return true
    }
    const wait = Math.min(attempt <= 2 ? 800 : 1800, deadline - Date.now())
    if (wait > 0) await sleep(wait)
  }

  throw new Error(
    'Servidor demorou para responder. Aguarde alguns segundos e tente novamente.'
  )
}
