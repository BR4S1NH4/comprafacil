import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { fmt } from '../data'

const AUTO_MS = 4500
const GAP = 12

export default function StorePromoCarousel({
  ofertas = [],
  onAddCart,
  onCardClick,
  title = 'Ofertas para você hoje',
  cardHint,
}) {
  const handleCard = (payload) => {
    if (onCardClick) onCardClick(payload)
    else if (onAddCart) onAddCart(payload?.p ?? payload)
  }
  const viewportRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const pauseTimerRef = useRef(null)

  const pauseBriefly = useCallback(() => {
    setPaused(true)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setPaused(false), 3500)
  }, [])

  useEffect(
    () => () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    },
    []
  )

  const getStep = useCallback(() => {
    const el = viewportRef.current
    const card = el?.querySelector('.cf-promo-card')
    return (card?.offsetWidth || 148) + GAP
  }, [])

  const syncScrollState = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const step = getStep()
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    const idx = step > 0 ? Math.round(el.scrollLeft / step) : 0
    setActiveIndex(Math.min(idx, Math.max(0, ofertas.length - 1)))
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < max - 4)
  }, [getStep, ofertas.length])

  const scrollByCard = useCallback(
    (dir) => {
      const el = viewportRef.current
      if (!el) return
      const step = getStep()
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      let next = el.scrollLeft + dir * step
      if (next > max + 2) next = 0
      if (next < -2) next = max
      el.scrollTo({ left: next, behavior: 'smooth' })
    },
    [getStep]
  )

  const goToIndex = (index) => {
    const el = viewportRef.current
    if (!el) return
    el.scrollTo({ left: index * getStep(), behavior: 'smooth' })
  }

  useEffect(() => {
    syncScrollState()
    const el = viewportRef.current
    if (!el) return
    el.addEventListener('scroll', syncScrollState, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollState) : null
    ro?.observe(el)
    window.addEventListener('resize', syncScrollState)
    return () => {
      el.removeEventListener('scroll', syncScrollState)
      ro?.disconnect()
      window.removeEventListener('resize', syncScrollState)
    }
  }, [syncScrollState, ofertas.length])

  useEffect(() => {
    if (ofertas.length <= 1 || paused) return
    const id = setInterval(() => scrollByCard(1), AUTO_MS)
    return () => clearInterval(id)
  }, [ofertas.length, paused, scrollByCard])

  if (!ofertas.length) return null

  const showArrows = ofertas.length > 1

  return (
    <section
      className="cf-promo-carousel cf-ad-animate-in"
      style={{ '--cf-ad-delay': '40ms' }}
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pauseBriefly}
    >
      <div className="cf-promo-carousel-head">
        <h2>
          <Sparkles size={18} aria-hidden /> {title}
        </h2>
          <p className="cf-promo-carousel-sub">
            {cardHint || 'Deslize ou toque nas setas · rolagem automática'}
          </p>
      </div>

      <div className="cf-promo-carousel-stage">
        {showArrows && (
          <>
            <div
              className={`cf-promo-carousel-fade cf-promo-carousel-fade--left${canPrev ? '' : ' is-hidden'}`}
              aria-hidden
            />
            <div
              className={`cf-promo-carousel-fade cf-promo-carousel-fade--right${canNext ? '' : ' is-hidden'}`}
              aria-hidden
            />
            <button
              type="button"
              className={`cf-promo-carousel-arrow cf-promo-carousel-arrow--prev${canPrev ? '' : ' is-hidden'}`}
              onClick={() => scrollByCard(-1)}
              aria-label="Ofertas anteriores"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={`cf-promo-carousel-arrow cf-promo-carousel-arrow--next${canNext ? '' : ' is-hidden'}`}
              onClick={() => scrollByCard(1)}
              aria-label="Próximas ofertas"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}

        <div
          className="cf-promo-carousel-viewport"
          ref={viewportRef}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Lista de ofertas"
        >
          <div className="cf-promo-carousel-track">
            {ofertas.map(({ p, c }, i) => (
              <button
                key={p.id}
                type="button"
                className="cf-promo-card"
              onClick={() => handleCard({ p, c })}
              disabled={(!onCardClick && !onAddCart) || p.estoque === 0}
                aria-label={`${p.nome}, ${fmt(c.precoPixFinal)} no PIX`}
                data-active={i === activeIndex ? 'true' : undefined}
              >
                <div className="cf-promo-card-media">
                  {p.imagemDataUrl ? (
                    <img src={p.imagemDataUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="cf-promo-card-emoji">{p.emoji || '📦'}</span>
                  )}
                  {Number(p.pixDesconto) > 0 && (
                    <span className="cf-promo-card-badge">-{p.pixDesconto}% PIX</span>
                  )}
                </div>
                <div className="cf-promo-card-body">
                  <span className="cf-promo-card-cat">{p.categoria}</span>
                  <span className="cf-promo-card-name">{p.nome}</span>
                  <span className="cf-promo-card-price">{fmt(c.precoPixFinal)}</span>
                  <span className="cf-promo-card-pix">no PIX</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showArrows && (
        <div className="cf-promo-carousel-dots" role="tablist" aria-label="Ir para oferta">
          {ofertas.map(({ p }, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              className={`cf-promo-carousel-dot${i === activeIndex ? ' is-active' : ''}`}
              aria-selected={i === activeIndex}
              aria-label={`Oferta ${i + 1} de ${ofertas.length}`}
              onClick={() => goToIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
