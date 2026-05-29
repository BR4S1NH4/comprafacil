import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Megaphone, Tag, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { fmt } from '../data'
import { ADMIN_CAMPAIGNS, pickAdminPromoProducts } from '../utils/adminPromotions'
import StorePromoCarousel from './StorePromoCarousel'

const AUTO_MS = 5500

function CampaignRotator({ onSelect }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const pauseRef = useRef(null)

  useEffect(() => {
    if (ADMIN_CAMPAIGNS.length <= 1 || paused) return
    const id = setInterval(() => {
      setDirection(1)
      setIndex((i) => (i + 1) % ADMIN_CAMPAIGNS.length)
    }, AUTO_MS)
    return () => clearInterval(id)
  }, [paused])

  useEffect(
    () => () => {
      if (pauseRef.current) clearTimeout(pauseRef.current)
    },
    []
  )

  const pauseBriefly = () => {
    setPaused(true)
    if (pauseRef.current) clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(() => setPaused(false), 4000)
  }

  const go = (dir) => {
    setDirection(dir)
    setIndex((i) => (i + dir + ADMIN_CAMPAIGNS.length) % ADMIN_CAMPAIGNS.length)
    pauseBriefly()
  }

  const select = (campaign) => {
    onSelect(campaign.apply, campaign)
    pauseBriefly()
  }

  return (
    <section
      className="cf-admin-campaign-bar cf-ad-animate-in"
      style={{ '--cf-ad-delay': '0ms' }}
      aria-label="Campanhas sugeridas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pauseBriefly}
    >
      <div className="cf-admin-campaign-head">
        <span className="cf-admin-campaign-label">
          <Megaphone size={14} /> Campanhas sugeridas
        </span>
        <div className="cf-admin-campaign-controls">
          <button type="button" className="cf-footer-bar-btn" onClick={() => go(-1)} aria-label="Campanha anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="cf-footer-bar-counter">
            {index + 1}/{ADMIN_CAMPAIGNS.length}
          </span>
          <button type="button" className="cf-footer-bar-btn" onClick={() => go(1)} aria-label="Próxima campanha">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={`cf-footer-bar-viewport${direction < 0 ? ' is-back' : ' is-forward'}`}>
        {ADMIN_CAMPAIGNS.map((c, i) => (
          <div
            key={c.id}
            className={`cf-footer-bar-slide cf-footer-bar-slide--${c.tone}${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <button type="button" className="cf-footer-bar-slide-inner" onClick={() => select(c)}>
              <span className="cf-footer-bar-emoji cf-ad-pop">{c.emoji}</span>
              <div className="cf-footer-bar-text">
                <strong className="cf-ad-slide-text">{c.titulo}</strong>
                <span className="cf-ad-slide-text cf-ad-slide-text--sub">{c.subtitulo}</span>
              </div>
              <span className="cf-footer-bar-cta cf-ad-slide-text cf-ad-slide-text--cta">
                <Tag size={12} /> Filtrar lista
              </span>
            </button>
          </div>
        ))}
        {!paused && (
          <div className="cf-footer-bar-progress" key={`adm-${index}`} aria-hidden>
            <span className="cf-footer-bar-progress-fill" style={{ animationDuration: `${AUTO_MS}ms` }} />
          </div>
        )}
      </div>

      <div className="cf-admin-campaign-chips">
        {ADMIN_CAMPAIGNS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`cf-admin-campaign-chip${i === index ? ' is-active' : ''}`}
            onClick={() => {
              setDirection(i > index ? 1 : -1)
              setIndex(i)
              select(c)
            }}
          >
            {c.emoji} {c.titulo.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>
    </section>
  )
}

function AdminPromoCarousel({ produtos, onSelectProduct }) {
  const ofertas = useMemo(() => pickAdminPromoProducts(produtos), [produtos])

  if (!ofertas.length) return null

  return (
    <div className="cf-admin-promo-carousel-wrap">
      <StorePromoCarousel
        ofertas={ofertas}
        title="Materiais em destaque na campanha"
        onCardClick={onSelectProduct}
        cardHint="Toque para localizar na lista"
      />
    </div>
  )
}

export default function AdminProductsPromos({ produtos, onApplyFilter }) {
  const handleCampaign = (apply) => {
    onApplyFilter({
      busca: apply.busca ?? '',
      filtro: apply.filtro ?? 'todos',
      highlightLabel: apply.highlightLabel || '',
    })
  }

  const handleProduct = ({ p }) => {
    onApplyFilter({
      busca: p.nome,
      filtro: 'todos',
      highlightId: p.id,
      highlightLabel: p.nome,
    })
  }

  return (
    <div className="cf-admin-promos">
      <CampaignRotator onSelect={handleCampaign} />
      <AdminPromoCarousel produtos={produtos} onSelectProduct={handleProduct} />
      <p className="cf-admin-promos-foot text-xs text-muted">
        <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Promoções ilustrativas para apoiar gestão — clique para filtrar a tabela abaixo.
      </p>
    </div>
  )
}
