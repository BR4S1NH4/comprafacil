import React from 'react'

/**
 * Exibe um slot de anúncio configurado no admin.
 */
export default function StoreAdSlot({ anuncio, variant = 'strip', animDelay = 0 }) {
  if (!anuncio?.ativo) return null
  const hasImg = Boolean(anuncio.imagemDataUrl)
  const hasText = Boolean(anuncio.titulo?.trim() || anuncio.subtitulo?.trim())
  if (!hasImg && !hasText) return null

  const className = `cf-store-ad cf-store-ad--${variant} cf-ad-animate-in`

  const content = (
    <div className={className}>
      {hasImg && (
        <img
          className="cf-store-ad-img"
          src={anuncio.imagemDataUrl}
          alt={anuncio.titulo || 'Anúncio'}
          loading="lazy"
          decoding="async"
        />
      )}
      {(anuncio.titulo || anuncio.subtitulo) && (
        <div className="cf-store-ad-text">
          {anuncio.titulo && (
            <div className="cf-store-ad-title cf-ad-animate-text">{anuncio.titulo}</div>
          )}
          {anuncio.subtitulo && (
            <div className="cf-store-ad-sub cf-ad-animate-text cf-ad-animate-text--2">{anuncio.subtitulo}</div>
          )}
        </div>
      )}
      {variant === 'hero' && <span className="cf-store-ad-shimmer" aria-hidden />}
    </div>
  )

  const wrapStyle = { '--cf-ad-delay': `${animDelay}ms` }
  const url = anuncio.linkUrl?.trim()

  if (url) {
    return (
      <a
        className="cf-store-ad-link cf-store-ad-wrap"
        style={wrapStyle}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={anuncio.titulo || 'Anúncio'}
      >
        {content}
      </a>
    )
  }

  return (
    <div className="cf-store-ad-wrap" style={wrapStyle}>
      {content}
    </div>
  )
}
