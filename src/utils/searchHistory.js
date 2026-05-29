const KEY = 'castor_search_history'
const MAX = 12

export function pushSearchTerm(term) {
  const t = String(term || '').trim().toLowerCase()
  if (t.length < 2) return
  try {
    const raw = sessionStorage.getItem(KEY)
    const prev = raw ? JSON.parse(raw) : []
    const next = [t, ...prev.filter((x) => x !== t)].slice(0, MAX)
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function getSearchTerms() {
  try {
    const raw = sessionStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x.length >= 2) : []
  } catch {
    return []
  }
}
