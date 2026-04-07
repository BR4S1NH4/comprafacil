import React, { useState } from 'react'
import { calcProduto, stockStatus, fmt } from '../data'
import { PageHeader, Box } from '../components/Layout'
import { Search, ShoppingCart, Filter, Grid, List, Tag } from 'lucide-react'

function ProductCard({ produto, onAddCart }) {
  const calc = calcProduto(produto)
  const st   = stockStatus(produto)
  const bgMap = { 'label-success':'#198754', 'label-warning':'#E9A800', 'label-danger':'#c53030', 'label-default':'#aaa' }

  return (
    <div className="box mb-0" style={{transition:'box-shadow .2s, transform .2s'}}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}
    >
      {/* header colorido */}
      <div style={{
        background: bgMap[st.cls],
        padding:'18px 0 14px', textAlign:'center', fontSize:44,
        borderRadius:'3px 3px 0 0', position:'relative',
      }}>
        {produto.emoji}
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

        {/* Preços */}
        <div style={{marginBottom:10}}>
          <div className="text-xs text-muted" style={{textDecoration:'line-through'}}>{fmt(produto.venda)} no cartão</div>
          <div className="d-flex items-center gap-2 mt-1">
            <span style={{fontSize:18, fontWeight:700, color:'#198754'}}>{fmt(calc.precoPixFinal)}</span>
            <span className="label label-success badge-pill">PIX {produto.pixDesconto}%</span>
          </div>
        </div>

        {/* Estoque / margem */}
        <div className="d-flex items-center" style={{justifyContent:'space-between', marginBottom:12}}>
          <span className="text-xs text-muted">
            Estoque: <strong style={{color:'var(--text)'}}>{produto.estoque}</strong> un
          </span>
          <span className={`label ${st.cls}`}>{st.label}</span>
        </div>

        {/* Progresso estoque */}
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

function ProductRow({ produto, onAddCart }) {
  const calc = calcProduto(produto)
  const st   = stockStatus(produto)
  return (
    <tr>
      <td><span style={{fontSize:20,marginRight:8}}>{produto.emoji}</span><strong>{produto.nome}</strong><div className="text-xs text-muted">{produto.unidade}</div></td>
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

export default function Loja({ produtos, onAddCart }) {
  const [busca, setBusca]     = useState('')
  const [filtro, setFiltro]   = useState('todos')
  const [categoria, setCat]   = useState('todas')
  const [modo, setModo]       = useState('grid')

  const filtrados = produtos.filter(p => {
    const termo = busca.toLowerCase()
    const mBusca = (
      p.nome.toLowerCase().includes(termo) ||
      p.categoria.toLowerCase().includes(termo) ||
      (p.codigo || '').toLowerCase().includes(termo) ||
      (p.descricao || '').toLowerCase().includes(termo)
    )
    const mFiltro = filtro === 'todos' ? true : filtro === 'disponivel' ? p.estoque > 0 : p.estoque <= p.minimo
    const mCat   = categoria === 'todas' ? true : p.categoria === categoria
    return mBusca && mFiltro && mCat
  })

  const cats = ['todas', ...new Set(produtos.map(p => p.categoria))]

  return (
    <>
      <PageHeader
        title="Loja Online"
        sub="Catálogo de produtos"
        breadcrumbs={['Loja']}
        actions={
          <span className="label label-success badge-pill" style={{padding:'5px 12px',fontSize:12}}>
            ⚡ PIX com desconto automático
          </span>
        }
      />
      <div className="cf-page-body">
        {/* Filtros */}
        <Box title={<><Filter size={13}/> Filtros</>}>
          <div className="d-flex gap-3 flex-wrap items-center">
            <div className="input-group" style={{maxWidth:280,flex:1}}>
              <span className="input-addon input-addon-left"><Search size={13}/></span>
              <input type="text" placeholder="Buscar material, codigo ou categoria..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="btn-group">
              {[{id:'todos',label:'Todos'},{id:'disponivel',label:'Disponíveis'},{id:'alerta',label:'⚠ Alerta'}].map(f => (
                <button key={f.id} className={`btn btn-sm ${filtro===f.id?'btn-primary':'btn-default'}`} onClick={()=>setFiltro(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <select style={{maxWidth:160}} value={categoria} onChange={e=>setCat(e.target.value)}>
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

        <div className="d-flex items-center mb-2">
          <span className="text-muted text-sm">
            {filtrados.length} produto{filtrados.length!==1?'s':''} encontrado{filtrados.length!==1?'s':''}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <Box>
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Nenhum produto encontrado</div>
              <div className="empty-state-sub">Tente outros filtros ou limpe a busca</div>
            </div>
          </Box>
        ) : modo === 'grid' ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,160px),1fr))', gap:16}}>
            {filtrados.map(p => <ProductCard key={p.id} produto={p} onAddCart={onAddCart}/>)}
          </div>
        ) : (
          <Box>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr><th>Produto</th><th>Categoria</th><th>Preço cartão</th><th>Preço PIX</th><th>Estoque</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {filtrados.map(p => <ProductRow key={p.id} produto={p} onAddCart={onAddCart}/>)}
                </tbody>
              </table>
            </div>
          </Box>
        )}
      </div>
    </>
  )
}
