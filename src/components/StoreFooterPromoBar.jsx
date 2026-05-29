import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Megaphone, Tag } from 'lucide-react'
import { fmt } from '../data'

const AUTO_MS = 5000

function buildSlides(anuncioRodape, ofertas) {
  const slides = []

  if (anuncioRodape?.ativo) {
    const hasImg = Boolean(anuncioRodape.imagemDataUrl)
    const hasText = Boolean(anuncioRodape.titulo?.trim() || anuncioRodape.subtitulo?.trim())
    if (hasImg || hasText) {
      slides.push({
        id: 'ad-rodape',
        kind: 'ad',
        titulo: anuncioRodape.titulo || 'Promoção especial',
        subtitulo: anuncioRodape.subtitulo || '',
        imagemDataUrl: anuncioRodape.imagemDataUrl,
        linkUrl: anuncioRodape.linkUrl?.trim() || '',
        tone: 'purple',
      })
    }
  }

  const tones = ['teal', 'amber', 'violet', 'rose', 'sky', 'emerald']
  ofertas.slice(0, 8).forEach(({ p, c }, i) => {
    slides.push({
      id: `promo-${p.id}`,
      kind: 'promo',
      produto: p,
      titulo: p.nome,
      subtitulo: `${fmt(c.precoPixFinal)} no PIX · ${p.pixDesconto}% de desconto`,
      imagemDataUrl: p.imagemDataUrl,
      emoji: p.emoji,
      tone: tones[i % tones.length],
    })
  })

  return slides
}

function SlideContent({ slide, onAddCart }) {
  const inner = (
    <>
      {slide.imagemDataUrl ? (
        <img className="cf-footer-bar-img cf-ad-pop" src={slide.imagemDataUrl} alt="" loading="lazy" decoding="async" />
      ) : slide.emoji ? (
        <span className="cf-footer-bar-emoji cf-ad-pop">{slide.emoji}</span>
      ) : (
        <Megaphone size={22} className="cf-footer-bar-icon cf-ad-pop" aria-hidden />
      )}
      <div className="cf-footer-bar-text">
        <strong className="cf-ad-slide-text">{slide.titulo}</strong>
        {slide.subtitulo && <span className="cf-ad-slide-text cf-ad-slide-text--sub">{slide.subtitulo}</span>}
      </div>
      {slide.kind === 'promo' && (
        <span className="cf-footer-bar-cta cf-ad-slide-text cf-ad-slide-text--cta">
          <Tag size={12} /> Comprar
        </span>
      )}
    </>
  )

  const innerClass = 'cf-footer-bar-slide-inner'

  if (slide.kind === 'ad' && slide.linkUrl) {
    return (
      <a className={innerClass} href={slide.linkUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }

  if (slide.kind === 'promo') {
    return (
      <button
        type="button"
        className={innerClass}
        onClick={() => onAddCart(slide.produto)}
        disabled={slide.produto.estoque === 0}
      >
        {inner}
      </button>
    )
  }

  return <div className={innerClass}>{inner}</div>
}

export default function StoreFooterPromoBar({ anuncioRodape, ofertas = [], onAddCart }) {
  const slides = useMemo(() => buildSlides(anuncioRodape, ofertas), [anuncioRodape, ofertas])
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const pauseTimerRef = useRef(null)

  useEffect(() => {
    setIndex(0)
    setDirection(1)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const id = setInterval(() => {
      setDirection(1)
      setIndex((i) => {
        const next = (i + 1) % slides.length
        // #region agent log
        if (i >= 7 || next === 0) {
          fetch('http://127.0.0.1:7368/ingest/3bc56ea2-66ca-41fe-920a-82b7ea995613',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdf62d'},body:JSON.stringify({sessionId:'cdf62d',location:'StoreFooterPromoBar.jsx:autoAdvance',message:'footer auto slide',data:{from:i,to:next,slidesLen:slides.length,wraps:i===slides.length-1&&next===0},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        }
        // #endregion
        return next
      })
    }, AUTO_MS)
    return () => clearInterval(id)
  }, [slides.length, paused])

  useEffect(
    () => () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    },
    []
  )

  const pauseBriefly = () => {
    setPaused(true)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setPaused(false), 3500)
  }

  if (!slides.length) return null

  const go = (dir) => {
    setDirection(dir)
    setIndex((i) => {
      const next = (i + dir + slides.length) % slides.length
      // #region agent log
      fetch('http://127.0.0.1:7368/ingest/3bc56ea2-66ca-41fe-920a-82b7ea995613',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdf62d'},body:JSON.stringify({sessionId:'cdf62d',location:'StoreFooterPromoBar.jsx:go',message:'footer manual nav',data:{dir,from:i,to:next,slidesLen:slides.length},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return next
    })
    pauseBriefly()
  }

  return (
    <section
      className="cf-footer-bar cf-ad-animate-in"
      style={{ '--cf-ad-delay': '120ms' }}
      aria-label="Promoções no rodapé"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pauseBriefly}
    >
      <div className="cf-footer-bar-head">
        <span className="cf-footer-bar-label">
          <Megaphone size={14} /> Promoções
        </span>
        {slides.length > 1 && (
          <div className="cf-footer-bar-controls">
            <button type="button" className="cf-footer-bar-btn" onClick={() => go(-1)} aria-label="Anúncio anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="cf-footer-bar-counter">
              {index + 1}/{slides.length}
            </span>
            <button type="button" className="cf-footer-bar-btn" onClick={() => go(1)} aria-label="Próximo anúncio">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        className={`cf-footer-bar-viewport${direction < 0 ? ' is-back' : ' is-forward'}`}
        data-direction={direction < 0 ? 'back' : 'forward'}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`cf-footer-bar-slide cf-footer-bar-slide--${slide.tone}${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <SlideContent slide={slide} onAddCart={onAddCart} />
          </div>
        ))}
        {slides.length > 1 && !paused && (
          <div className="cf-footer-bar-progress" key={`prog-${index}`} aria-hidden>
            <span className="cf-footer-bar-progress-fill" style={{ animationDuration: `${AUTO_MS}ms` }} />
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div className="cf-footer-bar-dots" role="tablist" aria-label="Selecionar promoção">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`cf-footer-bar-dot${i === index ? ' is-active' : ''}`}
              onClick={() => {
                setDirection(i > index ? 1 : -1)
                // #region agent log
                fetch('http://127.0.0.1:7368/ingest/3bc56ea2-66ca-41fe-920a-82b7ea995613',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdf62d'},body:JSON.stringify({sessionId:'cdf62d',location:'StoreFooterPromoBar.jsx:dotClick',message:'footer dot click',data:{from:index,to:i,slidesLen:slides.length,slideId:slide.id},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                setIndex(i)
                pauseBriefly()
              }}
              title={slide.titulo}
            />
          ))}
        </div>
      )}
    </section>
  )
}
