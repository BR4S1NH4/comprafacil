import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Clock, Search, X } from 'lucide-react'
import { getSearchTerms, pushSearchTerm } from '../utils/searchHistory'
import { suggestProdutos } from '../utils/productSearch'

function fmt(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function StoreHeaderSearch({
  value,
  onChange,
  produtos = [],
  onNavigateLoja,
  placeholder = 'Buscar materiais, código, categoria…',
}) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState([])
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  const refreshRecent = () => setRecent(getSearchTerms())

  useEffect(() => {
    if (!open) return
    refreshRecent()
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const sugestoes = useMemo(
    () => suggestProdutos(produtos, value, 8),
    [produtos, value]
  )

  const aplicarTermo = (termo) => {
    const t = String(termo || '').trim()
    onChange(t)
    if (t.length >= 2) pushSearchTerm(t)
    setOpen(false)
    if (typeof onNavigateLoja === 'function') onNavigateLoja()
  }

  const abrir = () => {
    refreshRecent()
    setOpen(true)
    if (typeof onNavigateLoja === 'function') onNavigateLoja()
  }

  const limpar = () => {
    onChange('')
    inputRef.current?.focus()
    refreshRecent()
  }

  return (
    <div className="cf-header-search" ref={wrapRef}>
      <div className={`cf-header-search-bar${open ? ' is-open' : ''}`}>
        <Search size={18} className="cf-header-search-icon" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          className="cf-header-search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={abrir}
          onClick={abrir}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            className="cf-header-search-clear"
            onClick={limpar}
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="cf-header-search-panel" id={listId} role="listbox">
          {recent.length > 0 && (
            <section className="cf-header-search-section">
              <h3>
                <Clock size={14} /> Buscas recentes
              </h3>
              <ul className="cf-header-search-chips">
                {recent.map((t) => (
                  <li key={t}>
                    <button type="button" onClick={() => aplicarTermo(t)}>
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="cf-header-search-section">
            <h3>
              <Search size={14} />
              {value.trim() ? 'Sugestões de produtos' : 'Produtos em destaque'}
            </h3>
            {sugestoes.length === 0 ? (
              <p className="cf-header-search-empty">Nenhum produto encontrado para esta busca.</p>
            ) : (
              <ul className="cf-header-search-products">
                {sugestoes.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="cf-header-search-product"
                      onClick={() => aplicarTermo(p.nome)}
                    >
                      {p.imagemDataUrl ? (
                        <img src={p.imagemDataUrl} alt="" className="cf-header-search-product-img" />
                      ) : (
                        <span className="cf-header-search-product-emoji">{p.emoji || '📦'}</span>
                      )}
                      <span className="cf-header-search-product-text">
                        <span className="cf-header-search-product-name">{p.nome}</span>
                        <span className="cf-header-search-product-meta">
                          {p.categoria}
                          {p.codigo ? ` · ${p.codigo}` : ''}
                        </span>
                      </span>
                      <span className="cf-header-search-product-price">{fmt(p.venda)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {value.trim().length >= 2 && (
            <button
              type="button"
              className="cf-header-search-submit"
              onClick={() => aplicarTermo(value)}
            >
              Ver todos os resultados para «{value.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  )
}
