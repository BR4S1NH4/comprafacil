import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { fmt } from '../data'

const AUTO_MS = 4500
const GAP = 12

function getCards(el) {
  return [...el.querySelectorAll('.cf-promo-card')]
}

function findCenteredCardIndex(el) {
  const cards = getCards(el)
  if (!cards.length) return 0
  const vp = el.getBoundingClientRect()
  const vpCenter = vp.left + vp.width / 2
  let bestIdx = 0
  let bestDist = Infinity
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect()
    const dist = Math.abs(rect.left + rect.width / 2 - vpCenter)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  })
  return bestIdx
}

function scrollToCardIndex(el, index, behavior = 'smooth') {
  const card = getCards(el)[index]
  if (!card) return
  const cardRect = card.getBoundingClientRect()
  const vpRect = el.getBoundingClientRect()
  const cardCenter = cardRect.left + cardRect.width / 2
  const vpCenter = vpRect.left + vpRect.width / 2
  const delta = cardCenter - vpCenter
  const maxScroll = el.scrollWidth - el.clientWidth
  const target = Math.max(0, Math.min(el.scrollLeft + delta, maxScroll))
  el.scrollTo({ left: target, behavior })
}

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
  const sectionRef = useRef(null)
  const programmaticScrollRef = useRef(false)
  const activeIndexRef = useRef(0)
  const [paused, setPaused] = useState(false)
  const [offscreen, setOffscreen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const pauseTimerRef = useRef(null)
  const carouselPaused = paused || offscreen

  const setActive = useCallback((idx) => {
    activeIndexRef.current = idx
    setActiveIndex(idx)
  }, [])

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

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { root: null, threshold: 0.08, rootMargin: '40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const markProgrammaticScroll = useCallback(() => {
    programmaticScrollRef.current = true
    window.setTimeout(() => {
      programmaticScrollRef.current = false
    }, 500)
  }, [])

  const pulseSlide = useCallback((dir) => {
    const el = viewportRef.current
    if (!el) return
    el.classList.remove('is-slide-forward', 'is-slide-back')
    el.classList.add(dir > 0 ? 'is-slide-forward' : 'is-slide-back')
    window.setTimeout(() => {
      el.classList.remove('is-slide-forward', 'is-slide-back')
    }, 480)
  }, [])

  const syncScrollState = useCallback(() => {
    const el = viewportRef.current
    if (!el || programmaticScrollRef.current) return
    const centered = findCenteredCardIndex(el)
    setActive(centered)
  }, [setActive])

  const scrollByCard = useCallback(
    (dir) => {
      const el = viewportRef.current
      if (!el) return
      const cards = getCards(el)
      if (cards.length <= 1) return

      const cur = activeIndexRef.current
      const nextIdx = (cur + dir + cards.length) % cards.length
      const wrapping =
        (dir > 0 && cur === cards.length - 1 && nextIdx === 0) ||
        (dir < 0 && cur === 0 && nextIdx === cards.length - 1)
      const behavior = wrapping ? 'auto' : 'smooth'

      pulseSlide(dir)
      markProgrammaticScroll()
      setActive(nextIdx)
      scrollToCardIndex(el, nextIdx, behavior)
      if (wrapping) {
        requestAnimationFrame(() => scrollToCardIndex(el, nextIdx, 'smooth'))
      }
    },
    [markProgrammaticScroll, pulseSlide, setActive]
  )

  const goToIndex = (index) => {
    const el = viewportRef.current
    if (!el) return
    const cards = getCards(el)
    const safe = Math.max(0, Math.min(cards.length - 1, index))
    pulseSlide(safe > activeIndexRef.current ? 1 : -1)
    markProgrammaticScroll()
    setActive(safe)
    scrollToCardIndex(el, safe)
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
    setActive(0)
    const el = viewportRef.current
    if (el) el.scrollLeft = 0
  }, [ofertas.length, setActive])

  useEffect(() => {
    if (ofertas.length <= 1 || carouselPaused) return
    const id = setInterval(() => scrollByCard(1), AUTO_MS)
    return () => clearInterval(id)
  }, [ofertas.length, carouselPaused, scrollByCard])

  if (!ofertas.length) return null

  const showArrows = ofertas.length > 1

  return (
    <section
      ref={sectionRef}
      className="cf-promo-carousel cf-ad-animate-in cf-promo-carousel--loop"
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
          {cardHint || 'Deslize ou toque nas setas · rolagem em loop'}
        </p>
      </div>

      <div className="cf-promo-carousel-stage">
        {showArrows && (
          <>
            <div className="cf-promo-carousel-fade cf-promo-carousel-fade--left" aria-hidden />
            <div className="cf-promo-carousel-fade cf-promo-carousel-fade--right" aria-hidden />
            <button
              type="button"
              className="cf-promo-carousel-arrow cf-promo-carousel-arrow--prev"
              onClick={() => scrollByCard(-1)}
              aria-label="Ofertas anteriores"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="cf-promo-carousel-arrow cf-promo-carousel-arrow--next"
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
