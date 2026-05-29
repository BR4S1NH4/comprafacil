import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Crop, ZoomIn, X, Circle } from 'lucide-react'
import { Modal } from './Layout'
import { finalizeLogoDataUrl } from '../utils/cropImage'
import { MAX_LOGO_BYTES } from '../utils/companySettings'

const ASPECT_OPTIONS = [
  { id: 'circle', label: 'Circular', value: 1, round: true },
  { id: 'free', label: 'Livre', value: undefined, round: false },
  { id: '1', label: '1:1', value: 1, round: false },
  { id: '16/9', label: '16:9', value: 16 / 9, round: false },
  { id: '3/1', label: '3:1', value: 3, round: false },
]

export default function LogoCropModal({
  imageSrc,
  onClose,
  onApply,
  title = 'Recortar imagem',
  maxBytes = MAX_LOGO_BYTES,
  defaultAspectId = 'circle',
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspectId, setAspectId] = useState(defaultAspectId)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const aspectOpt = ASPECT_OPTIONS.find((o) => o.id === aspectId) || ASPECT_OPTIONS[0]
  const aspect = aspectOpt.value
  const cropShape = aspectOpt.round ? 'round' : 'rect'

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      setErr('Ajuste o recorte na imagem.')
      return
    }
    setErr('')
    setBusy(true)
    try {
      const dataUrl = await finalizeLogoDataUrl(imageSrc, croppedAreaPixels, maxBytes, {
        circular: aspectOpt.round,
      })
      onApply(dataUrl)
    } catch (e) {
      setErr(e.message || 'Falha ao gerar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  if (!imageSrc) return null

  return (
    <Modal
      title={
        <span className="d-flex items-center gap-2">
          <Crop size={18} />
          {title}
        </span>
      }
      onClose={onClose}
      size="xl"
      footer={
        <div className="d-flex items-center justify-between flex-wrap gap-2" style={{ width: '100%' }}>
          <span className="text-xs text-muted">
            {aspectOpt.round
              ? 'Formato circular — ideal para avatar e ícone. Fundo transparente fora do círculo.'
              : 'Arraste para posicionar. Use o zoom para enquadrar.'}
          </span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-default" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply} disabled={busy}>
              {busy ? 'Gerando…' : 'Aplicar recorte'}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-3">
        <div className="text-xs text-muted mb-2" style={{ fontWeight: 600 }}>
          Formato do recorte
        </div>
        <div className="btn-group flex-wrap">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`btn btn-sm ${aspectId === opt.id ? 'btn-primary' : 'btn-default'}`}
              onClick={() => {
                setAspectId(opt.id)
                setCrop({ x: 0, y: 0 })
                setZoom(1)
              }}
            >
              {opt.round ? <Circle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : null}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded"
        style={{
          position: 'relative',
          width: '100%',
          height: 360,
          background: aspectOpt.round
            ? 'repeating-conic-gradient(#3a3a3a 0% 25%, #2a2627 0% 50%) 50% / 16px 16px'
            : '#2a2627',
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={!aspectOpt.round}
        />
      </div>

      <div className="form-group mt-3 mb-0">
        <label className="d-flex items-center gap-2">
          <ZoomIn size={14} />
          Zoom
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
          style={{ width: '100%' }}
        />
      </div>

      {err && (
        <div className="alert alert-danger mt-3 mb-0 d-flex items-start gap-2">
          <X size={16} style={{ flexShrink: 0 }} />
          <span>{err}</span>
        </div>
      )}
    </Modal>
  )
}
