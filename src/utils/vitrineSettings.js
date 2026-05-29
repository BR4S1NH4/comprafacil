/** Configuração pública da vitrine (anúncios + paginação). */

export const MAX_BANNER_INPUT_BYTES = 2 * 1024 * 1024
export const MAX_BANNER_DATA_URL_LEN = 900_000

export const AD_SLOT_META = [
  {
    key: 'hero',
    label: 'Banner principal',
    hint: 'Topo da loja, acima da busca — estilo capa (Amazon).',
    variant: 'hero',
  },
  {
    key: 'posBusca',
    label: 'Faixa após a busca',
    hint: 'Logo abaixo da barra de pesquisa.',
    variant: 'strip',
  },
  {
    key: 'posFiltros',
    label: 'Entre filtros e produtos',
    hint: 'Antes da contagem de resultados.',
    variant: 'strip',
  },
  {
    key: 'posGrade',
    label: 'Acima da grade',
    hint: 'Imediatamente antes dos cards de produto.',
    variant: 'card',
  },
  {
    key: 'rodape',
    label: 'Rodapé da loja',
    hint: 'Barra rotativa no fim da vitrine (alterna com promoções PIX dos produtos).',
    variant: 'strip',
  },
]

const EMPTY_AD = () => ({
  ativo: false,
  titulo: '',
  subtitulo: '',
  linkUrl: '',
  imagemDataUrl: null,
})

export const VITRINE_PAGE_SIZES = [6, 8, 12, 16]

const LEGACY_PAGE_SIZE = { 12: 12, 24: 12, 36: 16, 48: 16 }

export const DEFAULT_VITRINE = {
  produtosPorPagina: 12,
  anuncios: Object.fromEntries(AD_SLOT_META.map((s) => [s.key, EMPTY_AD()])),
}

export function mergeVitrine(raw) {
  const base = {
    produtosPorPagina: DEFAULT_VITRINE.produtosPorPagina,
    anuncios: { ...DEFAULT_VITRINE.anuncios },
  }
  if (!raw || typeof raw !== 'object') return base

  const n = Number(raw.produtosPorPagina)
  if (VITRINE_PAGE_SIZES.includes(n)) base.produtosPorPagina = n
  else if (LEGACY_PAGE_SIZE[n]) base.produtosPorPagina = LEGACY_PAGE_SIZE[n]

  if (raw.anuncios && typeof raw.anuncios === 'object') {
    for (const { key } of AD_SLOT_META) {
      const a = raw.anuncios[key]
      if (!a || typeof a !== 'object') continue
      base.anuncios[key] = {
        ativo: Boolean(a.ativo),
        titulo: String(a.titulo || '').trim(),
        subtitulo: String(a.subtitulo || '').trim(),
        linkUrl: String(a.linkUrl || '').trim(),
        imagemDataUrl: a.imagemDataUrl || null,
      }
    }
  }
  return base
}

export function readBannerFile(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem.'))
      return
    }
    if (file.size > MAX_BANNER_INPUT_BYTES) {
      reject(new Error('Imagem muito grande. Use até ~2 MB.'))
      return
    }
    const r = new FileReader()
    r.onload = () => {
      const url = String(r.result || '')
      if (url.length > MAX_BANNER_DATA_URL_LEN) {
        reject(new Error('Imagem resultante muito grande. Reduza o tamanho ou use JPG.'))
        return
      }
      resolve(url)
    }
    r.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    r.readAsDataURL(file)
  })
}
