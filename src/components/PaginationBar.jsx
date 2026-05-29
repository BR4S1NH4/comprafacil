import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginationBar({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pages = []
  const add = (p) => pages.push(p)
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i)
  } else {
    add(1)
    if (page > 3) add('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
    if (page < totalPages - 2) add('…')
    add(totalPages)
  }

  return (
    <nav className="cf-pagination" aria-label="Paginação de produtos">
      <span className="cf-pagination-info text-sm text-muted">
        {start}–{end} de {totalItems} produtos
        {totalPages > 1 && (
          <span className="cf-pagination-swipe-hint"> · deslize para mudar de página</span>
        )}
      </span>
      <div className="cf-pagination-controls">
        <button
          type="button"
          className="btn btn-default btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14}/> Anterior
        </button>
        <div className="btn-group cf-pagination-pages">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="cf-pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-default'}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="btn btn-default btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          Próxima <ChevronRight size={14}/>
        </button>
      </div>
    </nav>
  )
}
