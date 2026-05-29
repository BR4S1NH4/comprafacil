/** Conteúdo e decoração da página «Sobre esta empresa». */

export const ABOUT_ICON_OPTIONS = [
  { id: 'home', label: 'Casa' },
  { id: 'leaf', label: 'Folha / ecologia' },
  { id: 'users', label: 'Pessoas' },
  { id: 'building', label: 'Empresa' },
  { id: 'hammer', label: 'Obra' },
  { id: 'heart', label: 'Coração' },
]

const DEFAULT_BLOCOS = () => [
  {
    id: 'b1',
    titulo: 'Casas mais sustentáveis e ecológicas',
    icone: 'home',
    texto:
      'O setor da construção civil concentra grande parte do consumo de recursos naturais e da geração de resíduos. Acreditamos que cada etapa — do projeto à escolha de insumos — pode reduzir impactos: eficiência energética, durabilidade, logística consciente e preferência por materiais com menor pegada ambiental quando isso faz sentido técnico e econômico para a sua obra.',
  },
  {
    id: 'b2',
    titulo: 'Ecologia no centro das decisões',
    icone: 'leaf',
    texto:
      'Não tratamos sustentabilidade como moda ou slogan: ela orienta curadoria, parcerias e a forma como organizamos o catálogo. Queremos que você encontre opções alinhadas a boas práticas, com informação clara para comparar e decidir com segurança no seu cronograma e orçamento.',
  },
  {
    id: 'b3',
    titulo: 'Por que o castor?',
    icone: 'users',
    texto:
      'Os castores são conhecidos por trabalhar em equipe, planejar e reutilizar materiais da natureza de forma inteligente, erguendo estruturas resilientes com o que o ambiente oferece. Essa metáfora inspira nossa motivação diária: colaboração, organização e materiais sustentáveis para apoiar quem constrói — de quem faz a primeira reforma a quem gerencia obra em escala.',
  },
]

export const DEFAULT_ABOUT_PAGE = {
  titulo: 'Sobre esta empresa',
  subtitulo: 'Missão, sustentabilidade e o que nos move',
  lead:
    'A {nomeLoja} nasceu de uma necessidade simples e urgente: tornar mais acessível construir e reformar com materiais de qualidade, reduzindo desperdício e priorizando soluções que respeitam o plano de fundo — o meio ambiente e quem nele vive.',
  blocos: DEFAULT_BLOCOS(),
  rodape: 'Obrigado por confiar na {nomeLoja} para materializar projetos com mais responsabilidade.',
  decoracao: {
    usarLogoEmpresa: true,
    logoDecorDataUrl: null,
    arteEsquerdaDataUrl: null,
    arteDireitaDataUrl: null,
    opacidadeArtes: 0.18,
  },
}

export function mergeAboutPage(raw) {
  const base = {
    titulo: DEFAULT_ABOUT_PAGE.titulo,
    subtitulo: DEFAULT_ABOUT_PAGE.subtitulo,
    lead: DEFAULT_ABOUT_PAGE.lead,
    blocos: DEFAULT_BLOCOS().map((b) => ({ ...b })),
    rodape: DEFAULT_ABOUT_PAGE.rodape,
    decoracao: { ...DEFAULT_ABOUT_PAGE.decoracao },
  }
  if (!raw || typeof raw !== 'object') return base

  if (raw.titulo) base.titulo = String(raw.titulo).trim()
  if (raw.subtitulo != null) base.subtitulo = String(raw.subtitulo).trim()
  if (raw.lead) base.lead = String(raw.lead).trim()
  if (raw.rodape) base.rodape = String(raw.rodape).trim()

  if (Array.isArray(raw.blocos) && raw.blocos.length) {
    base.blocos = raw.blocos
      .filter((b) => b && typeof b === 'object')
      .map((b, i) => ({
        id: String(b.id || `b${i}`),
        titulo: String(b.titulo || '').trim(),
        icone: ABOUT_ICON_OPTIONS.some((o) => o.id === b.icone) ? b.icone : 'building',
        texto: String(b.texto || '').trim(),
      }))
      .filter((b) => b.titulo || b.texto)
  }

  if (raw.decoracao && typeof raw.decoracao === 'object') {
    const d = raw.decoracao
    base.decoracao = {
      usarLogoEmpresa: d.usarLogoEmpresa !== false,
      logoDecorDataUrl: d.logoDecorDataUrl || null,
      arteEsquerdaDataUrl: d.arteEsquerdaDataUrl || null,
      arteDireitaDataUrl: d.arteDireitaDataUrl || null,
      opacidadeArtes: Math.min(1, Math.max(0.05, Number(d.opacidadeArtes) || 0.18)),
    }
  }

  return base
}

export function applyAboutPlaceholders(text, nomeLoja) {
  const nome = String(nomeLoja || 'Castor Construtor').trim()
  return String(text || '').replace(/\{nomeLoja\}/g, nome)
}
