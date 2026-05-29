import React, { useRef } from 'react'

/**
 * Envolve a grade/lista de produtos com animação lateral ao mudar de página.
 */
export default function ProductPageSlide({
  page,
  direction = 1,
  totalPages = 1,
  onPageChange,
  children,
  className = '',
}) {
  const touchRef = useRef({ x: 0, y: 0, t: 0 })

  const onTouchStart = (e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
  }

  const onTouchEnd = (e) => {
    if (totalPages <= 1 || typeof onPageChange !== 'function') return
    const start = touchRef.current
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Date.now() - start.t > 700) return
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (dx < 0 && page < totalPages) onPageChange(page + 1)
    else if (dx > 0 && page > 1) onPageChange(page - 1)
  }

  const dirClass = direction >= 0 ? 'forward' : 'back'

  return (
    <div
      key={page}
      className={`cf-product-page cf-product-page--${dirClass}${className ? ` ${className}` : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-live="polite"
      aria-label={`Página ${page} de ${totalPages}`}
    >
      {children}
    </div>
  )
}
