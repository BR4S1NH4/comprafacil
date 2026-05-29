import React, { useState } from 'react'
import { Box } from './Layout'
import { ImageIcon, Trash2, Megaphone, Pencil } from 'lucide-react'
import LogoCropModal from './LogoCropModal'
import {
  AD_SLOT_META,
  DEFAULT_VITRINE,
  MAX_BANNER_DATA_URL_LEN,
  readBannerFile,
  VITRINE_PAGE_SIZES,
} from '../utils/vitrineSettings'

const BANNER_CROP_MAX_BYTES = 680_000

function defaultAspectForVariant(variant) {
  if (variant === 'hero') return '16/9'
  if (variant === 'strip') return '3/1'
  return '16/9'
}

function AdSlotEditor({ slotKey, meta, anuncio, onChange, onEditImage }) {
  const a = anuncio || {}
  const set = (k, v) => onChange(slotKey, { ...a, [k]: v })

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await readBannerFile(file)
      set('imagemDataUrl', url)
      set('ativo', true)
    } catch (err) {
      window.alert(err.message || 'Falha ao carregar imagem.')
    }
  }

  return (
    <Box
      title={<><Megaphone size={13}/> {meta.label}</>}
      type={a.ativo ? 'info' : undefined}
      style={{ marginBottom: 16 }}
    >
      <p className="text-xs text-muted mb-2">{meta.hint}</p>
      <label className="d-flex items-center gap-2 mb-2" style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={Boolean(a.ativo)}
          onChange={(e) => set('ativo', e.target.checked)}
        />
        <span>Exibir este anúncio na loja</span>
      </label>
      <div className="form-group">
        <label>Título</label>
        <input
          value={a.titulo || ''}
          onChange={(e) => set('titulo', e.target.value)}
          placeholder="Ex: Frete grátis em materiais selecionados"
        />
      </div>
      <div className="form-group">
        <label>Subtítulo (opcional)</label>
        <input
          value={a.subtitulo || ''}
          onChange={(e) => set('subtitulo', e.target.value)}
          placeholder="Texto complementar"
        />
      </div>
      <div className="form-group">
        <label>Link ao clicar (opcional)</label>
        <input
          value={a.linkUrl || ''}
          onChange={(e) => set('linkUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="d-flex flex-wrap gap-2 items-center mb-2">
        <label className="btn btn-default btn-sm mb-0" style={{ cursor: 'pointer' }}>
          <ImageIcon size={14}/> Enviar imagem
          <input type="file" accept="image/*" className="d-none" onChange={onFile} />
        </label>
        {a.imagemDataUrl && (
          <>
            <button
              type="button"
              className="btn btn-info btn-sm"
              onClick={() => onEditImage(slotKey, a.imagemDataUrl, meta)}
            >
              <Pencil size={12}/> Editar imagem
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => set('imagemDataUrl', null)}>
              <Trash2 size={12}/> Remover imagem
            </button>
          </>
        )}
      </div>
      {a.imagemDataUrl && (
        <img
          src={a.imagemDataUrl}
          alt=""
          style={{
            maxWidth: '100%',
            maxHeight: meta.variant === 'hero' ? 140 : 80,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        />
      )}
    </Box>
  )
}

export default function VitrineAdsConfig({ vitrine, onChange }) {
  const v = vitrine || DEFAULT_VITRINE
  const [bannerCrop, setBannerCrop] = useState(null)

  const setPagina = (n) => onChange({ ...v, produtosPorPagina: n })

  const setAnuncio = (key, next) => {
    onChange({
      ...v,
      anuncios: { ...v.anuncios, [key]: next },
    })
  }

  const openBannerCrop = (slotKey, src, meta) => {
    setBannerCrop({ slotKey, src, meta })
  }

  const closeBannerCrop = () => setBannerCrop(null)

  const onBannerCropApply = (dataUrl) => {
    if (!bannerCrop) return
    if (dataUrl.length > MAX_BANNER_DATA_URL_LEN) {
      window.alert('Imagem muito grande após o recorte. Tente um enquadramento menor.')
      return
    }
    const prev = v.anuncios?.[bannerCrop.slotKey] || {}
    setAnuncio(bannerCrop.slotKey, { ...prev, imagemDataUrl: dataUrl, ativo: true })
    closeBannerCrop()
  }

  return (
    <>
      <Box title="Paginação da loja" type="primary" style={{ marginBottom: 20 }}>
        <p className="text-sm text-muted mb-2">
          Quantos produtos aparecem por página na vitrine (evita rolagem infinita).
        </p>
        <div className="btn-group flex-wrap">
          {VITRINE_PAGE_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              className={`btn btn-sm ${v.produtosPorPagina === n ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setPagina(n)}
            >
              {n} por página
            </button>
          ))}
        </div>
      </Box>

      <div className="alert alert-info mb-3" style={{ fontSize: 12 }}>
        Configure até {AD_SLOT_META.length} áreas de anúncio visíveis na loja (visitantes e vendedores).
        Ative cada slot, envie imagem e textos; salve em «Salvar configurações».
      </div>

      {AD_SLOT_META.map((meta) => (
        <AdSlotEditor
          key={meta.key}
          slotKey={meta.key}
          meta={meta}
          anuncio={v.anuncios?.[meta.key]}
          onChange={setAnuncio}
          onEditImage={openBannerCrop}
        />
      ))}

      {bannerCrop && (
        <LogoCropModal
          key={`${bannerCrop.slotKey}-${bannerCrop.src.slice(0, 40)}`}
          imageSrc={bannerCrop.src}
          title={`Recortar — ${bannerCrop.meta.label}`}
          defaultAspectId={defaultAspectForVariant(bannerCrop.meta.variant)}
          maxBytes={BANNER_CROP_MAX_BYTES}
          onClose={closeBannerCrop}
          onApply={onBannerCropApply}
        />
      )}
    </>
  )
}
