/** Nome e logos padrão (arquivos em /public). */
export const BRAND_NAME = 'Castor Construtor'

export const DEFAULT_LOGO_URL = '/castor-construtor-logo.svg'
export const DEFAULT_ICON_URL = '/castor-icon.svg'

/** Aceita data URL, caminho absoluto ou URL http(s). */
export function isUsableImageSrc(src) {
  const s = String(src ?? '').trim()
  if (!s) return false
  if (s.startsWith('data:image/')) {
    return s.includes('base64,') && s.length > 80
  }
  return s.startsWith('/') || /^https?:\/\//i.test(s)
}

/** Header/login: logo largo; sidebar: ícone quando não há upload custom. */
export function resolveLogoUrls(empresa) {
  const custom = empresa?.logoDataUrl?.trim()
  if (custom && isUsableImageSrc(custom)) {
    return { header: custom, avatar: custom }
  }
  return { header: DEFAULT_LOGO_URL, avatar: DEFAULT_ICON_URL }
}
