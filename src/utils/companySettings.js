import { BRAND_NAME } from '../branding'

const STORAGE_KEY = 'cf_company_settings_v1'

export const DEFAULT_COMPANY_SETTINGS = {
  nomeLoja: BRAND_NAME,
  razaoSocial: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: 'AM',
  logoDataUrl: null,
  pixPadrao: 10,
  tributosPadrao: 8,
  operacionalPadrao: 7,
  estoqueMinPadrao: 10,
  alertaEstoque: true,
  confirmarExclusao: true,
}

export function loadCompanySettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COMPANY_SETTINGS }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_COMPANY_SETTINGS }
    return { ...DEFAULT_COMPANY_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_COMPANY_SETTINGS }
  }
}

export function saveCompanySettings(data) {
  const merged = { ...DEFAULT_COMPANY_SETTINGS, ...data }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return merged
}

/** Limite para evitar estourar quota do localStorage (~5MB total). */
export const MAX_LOGO_BYTES = 1_500_000

/** Arquivo bruto antes do recorte (MB) — depois o corte comprime para MAX_LOGO_BYTES. */
export const MAX_LOGO_INPUT_BYTES = 12 * 1024 * 1024
