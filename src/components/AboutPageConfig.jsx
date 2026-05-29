import React, { useState } from 'react'
import { Box } from './Layout'
import { ImageIcon, Trash2, Pencil, Plus, Building2 } from 'lucide-react'
import LogoCropModal from './LogoCropModal'
import { ABOUT_ICON_OPTIONS, mergeAboutPage } from '../utils/aboutPageSettings'
import { readBannerFile } from '../utils/vitrineSettings'
import { MAX_LOGO_BYTES } from '../utils/companySettings'

const DECOR_FIELDS = [
  { key: 'logoDecorDataUrl', label: 'Logo decorativo (hero)', hint: 'Grande, no topo da página. Se vazio, usa o logo da empresa.' },
  { key: 'arteEsquerdaDataUrl', label: 'Arte corporativa — esquerda', hint: 'Imagem de fundo/decoração à esquerda do texto.' },
  { key: 'arteDireitaDataUrl', label: 'Arte corporativa — direita', hint: 'Imagem de fundo/decoração à direita do texto.' },
]

export default function AboutPageConfig({ paginaSobre, onChange, logoEmpresa }) {
  const page = mergeAboutPage(paginaSobre)
  const [crop, setCrop] = useState(null)

  const setPage = (patch) => onChange({ ...page, ...patch })
  const setDecor = (k, v) =>
    setPage({ decoracao: { ...page.decoracao, [k]: v } })

  const setBloco = (id, patch) => {
    setPage({
      blocos: page.blocos.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })
  }

  const addBloco = () => {
    setPage({
      blocos: [
        ...page.blocos,
        {
          id: `b${Date.now()}`,
          titulo: 'Novo bloco',
          icone: 'building',
          texto: '',
        },
      ],
    })
  }

  const removeBloco = (id) => {
    if (page.blocos.length <= 1) {
      window.alert('Mantenha ao menos um bloco de conteúdo.')
      return
    }
    setPage({ blocos: page.blocos.filter((b) => b.id !== id) })
  }

  const onImageFile = async (field, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await readBannerFile(file)
      setDecor(field, url)
    } catch (err) {
      window.alert(err.message || 'Falha ao carregar imagem.')
    }
  }

  const openCrop = (src, field) => setCrop({ src, field })
  const onCropApply = (dataUrl) => {
    if (crop?.field) setDecor(crop.field, dataUrl)
    setCrop(null)
  }

  return (
    <>
      <Box title={<><Building2 size={13}/> Textos da página</>} type="primary" style={{ marginBottom: 16 }}>
        <p className="text-xs text-muted mb-2">
          Use <code>{'{nomeLoja}'}</code> nos textos para inserir o nome fantasia automaticamente.
        </p>
        <div className="form-group">
          <label>Título da página</label>
          <input value={page.titulo} onChange={(e) => setPage({ titulo: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Subtítulo</label>
          <input value={page.subtitulo} onChange={(e) => setPage({ subtitulo: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Introdução (lead)</label>
          <textarea rows={4} value={page.lead} onChange={(e) => setPage({ lead: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Texto de encerramento</label>
          <textarea rows={2} value={page.rodape} onChange={(e) => setPage({ rodape: e.target.value })} />
        </div>
      </Box>

      <Box title="Blocos de conteúdo" style={{ marginBottom: 16 }}>
        {page.blocos.map((b) => (
          <div key={b.id} className="cf-about-config-block">
            <div className="d-flex gap-2 flex-wrap mb-2">
              <div className="form-group mb-0" style={{ flex: 1, minWidth: 180 }}>
                <label>Título do bloco</label>
                <input value={b.titulo} onChange={(e) => setBloco(b.id, { titulo: e.target.value })} />
              </div>
              <div className="form-group mb-0" style={{ width: 160 }}>
                <label>Ícone</label>
                <select value={b.icone} onChange={(e) => setBloco(b.id, { icone: e.target.value })}>
                  {ABOUT_ICON_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Texto</label>
              <textarea rows={4} value={b.texto} onChange={(e) => setBloco(b.id, { texto: e.target.value })} />
            </div>
            <button type="button" className="btn btn-danger btn-xs" onClick={() => removeBloco(b.id)}>
              <Trash2 size={11}/> Remover bloco
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-default btn-sm mt-2" onClick={addBloco}>
          <Plus size={12}/> Adicionar bloco
        </button>
      </Box>

      <Box title="Logo e artes corporativas" type="info" style={{ marginBottom: 16 }}>
        <label className="d-flex items-center gap-2 mb-3" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={page.decoracao.usarLogoEmpresa}
            onChange={(e) => setDecor('usarLogoEmpresa', e.target.checked)}
          />
          <span>Exibir logo da empresa no topo (Configuração geral)</span>
        </label>
        {logoEmpresa && page.decoracao.usarLogoEmpresa && (
          <div className="mb-3">
            <img src={logoEmpresa} alt="" style={{ maxHeight: 48, objectFit: 'contain' }} />
          </div>
        )}

        <div className="form-group">
          <label>Opacidade das artes laterais ({Math.round(page.decoracao.opacidadeArtes * 100)}%)</label>
          <input
            type="range"
            min="5"
            max="60"
            value={Math.round(page.decoracao.opacidadeArtes * 100)}
            onChange={(e) => setDecor('opacidadeArtes', Number(e.target.value) / 100)}
          />
        </div>

        {DECOR_FIELDS.map(({ key, label, hint }) => {
          const url = page.decoracao[key]
          return (
            <div key={key} className="cf-about-config-decor mb-3">
              <label className="d-block mb-1" style={{ fontWeight: 600 }}>{label}</label>
              <p className="text-xs text-muted mb-2">{hint}</p>
              <div className="d-flex flex-wrap gap-2 items-center mb-2">
                <label className="btn btn-default btn-sm mb-0" style={{ cursor: 'pointer' }}>
                  <ImageIcon size={12}/> Enviar
                  <input type="file" accept="image/*" className="d-none" onChange={(e) => onImageFile(key, e)} />
                </label>
                {url && (
                  <>
                    <button type="button" className="btn btn-info btn-sm" onClick={() => openCrop(url, key)}>
                      <Pencil size={12}/> Editar
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDecor(key, null)}>
                      <Trash2 size={12}/> Remover
                    </button>
                  </>
                )}
              </div>
              {url && (
                <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain', borderRadius: 8 }} />
              )}
            </div>
          )
        })}
      </Box>

      {crop && (
        <LogoCropModal
          key={crop.src.slice(0, 40)}
          imageSrc={crop.src}
          title="Recortar imagem"
          defaultAspectId="free"
          maxBytes={MAX_LOGO_BYTES}
          onClose={() => setCrop(null)}
          onApply={onCropApply}
        />
      )}
    </>
  )
}
