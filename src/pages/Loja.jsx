import React, { useState, useMemo, useEffect, useRef } from 'react'
import { calcProduto, stockStatus, fmt } from '../data'
import { PageHeader, Box } from '../components/Layout'
import { Search, ShoppingCart, Filter, Grid, List, Tag } from 'lucide-react'
import { pushSearchTerm, getSearchTerms } from '../utils/searchHistory'
import { produtoMatchesTerm } from '../utils/productSearch'
import { pickOfertasDoDia } from '../utils/promoProducts'
import StoreAdSlot from '../components/StoreAdSlot'
import StorePromoCarousel from '../components/StorePromoCarousel'
import StoreFooterPromoBar from '../components/StoreFooterPromoBar'
import ProductPageSlide from '../components/ProductPageSlide'
import PaginationBar from '../components/PaginationBar'
import { mergeVitrine, AD_SLOT_META } from '../utils/vitrineSettings'

function adVariant(key) {
  return AD_SLOT_META.find((s) => s.key === key)?.variant || 'strip'
}

function ProductMedia({ produto, height = 120 }) {
  if (produto.imagemDataUrl) {
    return (
      <img
        className="cf-product-card-img"
        src={produto.imagemDataUrl}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height, objectFit: 'cover', borderRadius: '6px 6px 0 0', display: 'block' }}
      />
    )
  }
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: 44,
        padding: '14px 0 10px',
        lineHeight: 1,
      }}
    >
      {produto.emoji}
    </div>
  )
}

function ProductCard({ produto, onAddCart }) {
  const calc = calcProduto(produto)
  const st = stockStatus(produto)
  const bgMap = { 'label-success':'#198754', 'label-warning':'#E9A800', 'label-danger':'#c53030', 'label-default':'#aaa' }
  const hasImg = Boolean(produto.imagemDataUrl)

  return (
    <div className="box mb-0" style={{transition:'box-shadow .2s, transform .2s'}}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}
    >
      <div style={{
        background: hasImg ? '#f4f4f5' : bgMap[st.cls],
        padding: hasImg ? 8 : '18px 0 14px',
        textAlign: 'center',
        borderRadius:'3px 3px 0 0', position:'relative',
      }}>
        <ProductMedia produto={produto} height={hasImg ? 140 : undefined} />
        <span style={{
          position:'absolute', top:8, right:8,
          background:'rgba(0,0,0,.2)', color:'#fff', fontSize:9, fontWeight:700,
          padding:'2px 6px', borderRadius:2,
        }}>
          {produto.categoria}
        </span>
      </div>
      <div className="box-body" style={{padding:'12px 14px'}}>
        <div style={{fontWeight:700, fontSize:14, marginBottom:2}}>{produto.nome}</div>
        <div className="text-muted text-sm mb-2">por {produto.unidade}</div>

        <div style={{marginBottom:10}}>
          <div className="text-xs text-muted" style={{textDecoration:'line-through'}}>{fmt(produto.venda)} no cartão</div>
          <div className="d-flex items-center gap-2 mt-1">
            <span style={{fontSize:18, fontWeight:700, color:'#198754'}}>{fmt(calc.precoPixFinal)}</span>
            <span className="label label-success badge-pill">PIX {produto.pixDesconto}%</span>
          </div>
        </div>

        <div className="d-flex items-center" style={{justifyContent:'space-between', marginBottom:12}}>
          <span className="text-xs text-muted">
            Estoque: <strong style={{color:'var(--text)'}}>{produto.estoque}</strong> un
          </span>
          <span className={`label ${st.cls}`}>{st.label}</span>
        </div>

        <div className="mb-2">
          <div className="progress progress-xs">
            <div className="progress-bar" style={{
              width: `${Math.min((produto.estoque / (produto.minimo * 3)) * 100, 100)}%`,
              background: bgMap[st.cls],
            }}/>
          </div>
        </div>

        <button
          className={`btn ${produto.estoque === 0 ? 'btn-default' : 'btn-primary'} btn-sm btn-block`}
          disabled={produto.estoque === 0}
          onClick={() => onAddCart(produto)}
        >
          <ShoppingCart size={12}/>
          {produto.estoque === 0 ? 'Sem estoque' : 'Adicionar ao carrinho'}
        </button>
      </div>
      <div className="box-footer text-xs" style={{padding:'5px 14px'}}>
        Margem: <strong className="text-success">{calcProduto(produto).margemPct.toFixed(1)}%</strong>
        <span className="ml-auto text-muted" style={{float:'right'}}>
          {fmt(produto.compra)} custo
        </span>
      </div>
    </div>
  )
}

function ProductRow({ produto, onAddCart, animIndex = 0 }) {
  const calc = calcProduto(produto)
  const st = stockStatus(produto)
  return (
    <tr
      className="cf-product-page-item"
      style={{ '--cf-page-i': animIndex }}
    >
      <td>
        <div className="d-flex items-center gap-2">
          {produto.imagemDataUrl ? (
            <img src={produto.imagemDataUrl} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            <span style={{fontSize:20,marginRight:8}}>{produto.emoji}</span>
          )}
          <div>
            <strong>{produto.nome}</strong>
            <div className="text-xs text-muted">{produto.unidade}</div>
          </div>
        </div>
      </td>
      <td><span className="label label-default">{produto.categoria}</span></td>
      <td className="text-muted">{fmt(produto.venda)}</td>
      <td className="text-success text-bold">{fmt(calc.precoPixFinal)} <span className="label label-success text-xs">PIX</span></td>
      <td><span className={`label ${st.cls}`}>{produto.estoque} un</span></td>
      <td>
        <button
          className={`btn btn-sm ${produto.estoque===0?'btn-default':'btn-primary'}`}
          disabled={produto.estoque===0}
          onClick={() => onAddCart(produto)}
        >
          <ShoppingCart size={11}/> Comprar
        </button>
      </td>
    </tr>
  )
}

export default function Loja({ produtos, onAddCart, vitrineAmazon, empresa, busca: buscaProp, onBuscaChange }) {
  const [buscaLocal, setBuscaLocal] = useState('')
  const busca = buscaProp !== undefined ? buscaProp : buscaLocal
  const setBusca = onBuscaChange || setBuscaLocal
  const [filtro, setFiltro]   = useState('todos')
  const [categoria, setCat]   = useState('todas')
  const [modo, setModo]       = useState('grid')
  const [pagina, setPagina]   = useState(1)
  const [pageDir, setPageDir] = useState(1)
  const gridTopRef = useRef(null)
  const searchDebounceRef = useRef(null)

  const vitrine = useMemo(() => mergeVitrine(empresa?.vitrine), [empresa?.vitrine])
  const pageSize = vitrine.produtosPorPagina
  const ads = vitrine.anuncios

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      const t = busca.trim()
      if (t.length >= 2) pushSearchTerm(t)
    }, 500)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [busca])

  useEffect(() => {
    setPagina(1)
    setPageDir(1)
  }, [busca, filtro, categoria])

  const goToPage = (p) => {
    setPageDir(p > pagina ? 1 : p < pagina ? -1 : pageDir)
    setPagina(p)
    requestAnimationFrame(() => {
      gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const ofertas = useMemo(() => pickOfertasDoDia(produtos, busca, 12), [produtos, busca])

  const filtrados = produtos.filter((p) => {
    const mBusca = produtoMatchesTerm(p, busca)
    const mFiltro = filtro === 'todos' ? true : filtro === 'disponivel' ? p.estoque > 0 : p.estoque <= p.minimo
    const mCat = categoria === 'todas' ? true : p.categoria === categoria
    return mBusca && mFiltro && mCat
  })

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize))
  const paginaSafe = Math.min(pagina, totalPages)
  const inicio = (paginaSafe - 1) * pageSize
  const paginaItens = filtrados.slice(inicio, inicio + pageSize)

  const cats = ['todas', ...new Set(produtos.map(p => p.categoria))]

  const aplicarBuscaOferta = (termo) => {
    setBusca(termo)
    if (termo.trim().length >= 2) pushSearchTerm(termo)
  }

  return (
    <>
      {!vitrineAmazon && (
        <PageHeader
          title="Loja Online"
          sub="Catálogo de produtos"
          breadcrumbs={['Loja']}
          actions={
            <span className="label label-success badge-pill" style={{padding:'5px 12px',fontSize:12}}>
              PIX com desconto automático
            </span>
          }
        />
      )}
      {vitrineAmazon && (
        <div className="cf-page-header" style={{ paddingBottom: 12 }}>
          <div>
            <h1 className="cf-page-title" style={{ fontSize: 20 }}>
              Loja
              <small style={{ display: 'block', marginTop: 4 }}>Ofertas e materiais para sua obra</small>
            </h1>
          </div>
          <span className="label label-success badge-pill" style={{ padding: '5px 12px', fontSize: 12 }}>
            PIX com desconto
          </span>
        </div>
      )}
      <div className="cf-page-body">
        <StoreAdSlot anuncio={ads.hero} variant={adVariant('hero')} animDelay={0} />

        <StorePromoCarousel ofertas={ofertas} onAddCart={onAddCart} />

        {!vitrineAmazon && (
          <div className="cf-store-hero-search">
            <div className="input-group w-full">
              <span className="input-addon input-addon-left"><Search size={16}/></span>
              <input
                type="search"
                placeholder="Buscar materiais, código, categoria…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        <StoreAdSlot anuncio={ads.posBusca} variant={adVariant('posBusca')} animDelay={80} />

        <Box title={<><Filter size={13}/> Filtros</>}>
          <div className="d-flex gap-3 flex-wrap items-center">
            <div className="btn-group">
              {[{id:'todos',label:'Todos'},{id:'disponivel',label:'Disponíveis'},{id:'alerta',label:'Alerta'}].map(f => (
                <button key={f.id} className={`btn btn-sm ${filtro===f.id?'btn-primary':'btn-default'}`} onClick={()=>setFiltro(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <select style={{maxWidth:200}} value={categoria} onChange={e=>setCat(e.target.value)}>
              <option value="todas">Todas categorias</option>
              {cats.filter(c=>c!=='todas').map(c=><option key={c}>{c}</option>)}
            </select>
            <div className="btn-group ml-auto">
              <button className={`btn btn-sm ${modo==='grid'?'btn-primary':'btn-default'}`} onClick={()=>setModo('grid')} title="Grade"><Grid size={13}/></button>
              <button className={`btn btn-sm ${modo==='list'?'btn-primary':'btn-default'}`} onClick={()=>setModo('list')} title="Lista"><List size={13}/></button>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap mt-2">
            {cats.filter(c=>c!=='todas').map(c => (
              <button key={c} className={`btn btn-xs ${categoria===c?'btn-info':'btn-default'}`} onClick={()=>setCat(categoria===c?'todas':c)}>
                <Tag size={10}/> {c}
              </button>
            ))}
          </div>
        </Box>

        <StoreAdSlot anuncio={ads.posFiltros} variant={adVariant('posFiltros')} animDelay={160} />

        <div className="d-flex items-center mb-2 flex-wrap gap-2" ref={gridTopRef}>
          <span className="text-muted text-sm">
            {filtrados.length} produto{filtrados.length!==1?'s':''} encontrado{filtrados.length!==1?'s':''}
            {totalPages > 1 && (
              <> · página {paginaSafe} de {totalPages}</>
            )}
          </span>
          {getSearchTerms().slice(0, 5).map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              onClick={() => aplicarBuscaOferta(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <StoreAdSlot anuncio={ads.posGrade} variant={adVariant('posGrade')} animDelay={240} />

        {filtrados.length === 0 ? (
          <Box>
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Nenhum produto encontrado</div>
              <div className="empty-state-sub">Tente outros filtros ou limpe a busca</div>
            </div>
          </Box>
        ) : modo === 'grid' ? (
          <>
            <ProductPageSlide
              page={paginaSafe}
              direction={pageDir}
              totalPages={totalPages}
              onPageChange={goToPage}
            >
              <div
                className="cf-product-page-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,160px),1fr))',
                  gap: 16,
                }}
              >
                {paginaItens.map((p, i) => (
                  <div
                    key={p.id}
                    className="cf-product-page-item"
                    style={{ '--cf-page-i': i }}
                  >
                    <ProductCard produto={p} onAddCart={onAddCart} />
                  </div>
                ))}
              </div>
            </ProductPageSlide>
            <PaginationBar
              page={paginaSafe}
              totalPages={totalPages}
              totalItems={filtrados.length}
              pageSize={pageSize}
              onPageChange={goToPage}
            />
          </>
        ) : (
          <>
            <ProductPageSlide
              page={paginaSafe}
              direction={pageDir}
              totalPages={totalPages}
              onPageChange={goToPage}
            >
              <Box>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr><th>Produto</th><th>Categoria</th><th>Preço cartão</th><th>Preço PIX</th><th>Estoque</th><th>Ação</th></tr>
                    </thead>
                    <tbody>
                      {paginaItens.map((p, i) => (
                        <ProductRow
                          key={p.id}
                          produto={p}
                          onAddCart={onAddCart}
                          animIndex={i}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Box>
            </ProductPageSlide>
            <PaginationBar
              page={paginaSafe}
              totalPages={totalPages}
              totalItems={filtrados.length}
              pageSize={pageSize}
              onPageChange={goToPage}
            />
          </>
        )}

        <StoreFooterPromoBar anuncioRodape={ads.rodape} ofertas={ofertas} onAddCart={onAddCart} />
      </div>
    </>
  )
}
