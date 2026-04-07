/** Nome e logos padrão (arquivos em /public). */
export const BRAND_NAME = 'Castor Construtor'

export const DEFAULT_LOGO_URL = '/castor-construtor-logo.svg'
export const DEFAULT_ICON_URL = '/castor-icon.svg'

/** Header/login: logo largo; sidebar: ícone quando não há upload custom. */
export function resolveLogoUrls(empresa) {
  const custom = empresa?.logoDataUrl?.trim()
  if (custom) {
    return { header: custom, avatar: custom }
  }
  return { header: DEFAULT_LOGO_URL, avatar: DEFAULT_ICON_URL }
}
