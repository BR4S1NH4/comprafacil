import React, { useState, useEffect } from 'react'
import { calcProduto, fmt } from '../data'
import { PageHeader, Box } from '../components/Layout'
import { Trash2, CreditCard, Zap, CheckCircle, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react'

export default function Carrinho({ cart, onQty, onRemove, onClear, onCheckout, onViewOrders, onNav }) {
  const [payMode, setPayMode]     = useState('pix')
  const [finalizado, setFinalizado] = useState(false)
  const [pedidoId, setPedidoId]    = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [confirmacao, setConfirmacao] = useState(null)

  const subtotal = cart.reduce((s,i) => s + i.produto.venda * i.qty, 0)
  const desconto = cart.reduce((s,i) => {
    const c = calcProduto(i.produto)
    return s + (i.produto.venda - c.precoPixFinal) * i.qty
  }, 0)
  const total = payMode === 'pix' ? subtotal - desconto : subtotal

  useEffect(() => {
    if (cart.length > 0) {
      setFinalizado(false)
      setConfirmacao(null)
      setPedidoId(null)
    }
  }, [cart.length])

  if (finalizado && confirmacao) return (
    <>
      <PageHeader title="Pedido Confirmado" breadcrumbs={['Carrinho','Confirmação']}/>
      <div className="cf-page-body">
        <div style={{maxWidth:520,margin:'0 auto'}}>
          <Box>
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div style={{fontSize:60,marginBottom:16}}>✅</div>
              <h2 style={{fontSize:24,fontWeight:700,marginBottom:8}}>Pedido #{pedidoId || '---'} realizado!</h2>
              <div className="text-muted mb-2">Pagamento via {confirmacao.payMode==='pix'?'PIX ⚡':'Cartão 💳'}</div>
              <div style={{fontSize:28,fontWeight:700,color:'#198754',marginBottom:6}}>{fmt(confirmacao.total)}</div>
              {confirmacao.payMode==='pix' && confirmacao.desconto > 0 && (
                <div className="text-sm text-muted mb-3">Você economizou {fmt(confirmacao.desconto)} com o PIX</div>
              )}
              <div className="alert alert-success" style={{textAlign:'left',marginBottom:20}}>
                <CheckCircle size={16}/>
                <span>Pedido registrado com sucesso. O estoque foi atualizado automaticamente.</span>
              </div>
              <div className="d-flex gap-3 justify-center">
                <button className="btn btn-primary btn-lg" onClick={()=>{setFinalizado(false);onClear();onNav('loja')}}>
                  <ShoppingCart size={16}/> Continuar comprando
                </button>
                <button className="btn btn-default btn-lg" onClick={onViewOrders}>
                  Ver meus pedidos
                </button>
              </div>
            </div>
          </Box>
        </div>
      </div>
    </>
  )

  if (cart.length === 0) return (
    <>
      <PageHeader title="Carrinho" breadcrumbs={['Carrinho']}/>
      <div className="cf-page-body">
        <Box>
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-title">Carrinho vazio</div>
            <div className="empty-state-sub mb-3">Adicione produtos da loja para começar</div>
            <button className="btn btn-primary" onClick={()=>onNav('loja')}>
              <ArrowLeft size={14}/> Ir para a loja
            </button>
          </div>
        </Box>
      </div>
    </>
  )

  return (
    <>
      <PageHeader
        title="Carrinho"
        sub={`${cart.reduce((s,i)=>s+i.qty,0)} item(ns)`}
        breadcrumbs={['Carrinho']}
        actions={
          <button className="btn btn-default btn-sm" onClick={()=>onNav('loja')}>
            <ArrowLeft size={13}/> Continuar comprando
          </button>
        }
      />
      <div className="cf-page-body">
        <div className="row">
          {/* Itens */}
          <div className="col-8">
            <Box title={<><ShoppingCart size={13}/> Itens do pedido</>} type="primary">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="text-center" style={{width:120}}>Qtd</th>
                    <th>Preço cartão</th>
                    <th>Preço PIX</th>
                    <th>Subtotal</th>
                    <th style={{width:50}}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(({produto, qty}) => {
                    const c = calcProduto(produto)
                    const lineTotal = payMode==='pix' ? c.precoPixFinal * qty : produto.venda * qty
                    return (
                      <tr key={produto.id}>
                        <td>
                          <div className="d-flex items-center gap-2">
                            <span style={{fontSize:24}}>{produto.emoji}</span>
                            <div>
                              <div style={{fontWeight:600}}>{produto.nome}</div>
                              <div className="text-xs text-muted">{produto.unidade}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex items-center gap-1 justify-center">
                            <button
                              className="btn btn-default btn-xs"
                              style={{padding:'2px 7px'}}
                              onClick={() => onQty(produto.id, qty - 1)}
                            ><Minus size={10}/></button>
                            <span style={{fontWeight:700, minWidth:24, textAlign:'center', fontSize:14}}>{qty}</span>
                            <button
                              className="btn btn-default btn-xs"
                              style={{padding:'2px 7px'}}
                              disabled={qty >= produto.estoque}
                              onClick={() => onQty(produto.id, qty + 1)}
                            ><Plus size={10}/></button>
                          </div>
                          <div className="text-xs text-muted mt-1">máx. {produto.estoque}</div>
                        </td>
                        <td className="text-muted" style={{textDecoration:'line-through',fontSize:12}}>{fmt(produto.venda)}</td>
                        <td className="text-success text-bold">{fmt(c.precoPixFinal)}</td>
                        <td style={{fontWeight:700,fontSize:14}}>{fmt(lineTotal)}</td>
                        <td>
                          <button className="btn btn-danger btn-xs" onClick={() => onRemove(produto.id)}>
                            <Trash2 size={11}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="d-flex justify-between mt-2">
                <button className="btn btn-default btn-sm" onClick={() => onClear()}>
                  <Trash2 size={12}/> Limpar carrinho
                </button>
                <div className="text-sm text-muted">
                  {cart.length} produto{cart.length!==1?'s':''} · {cart.reduce((s,i)=>s+i.qty,0)} unidade{cart.reduce((s,i)=>s+i.qty,0)!==1?'s':''}
                </div>
              </div>
            </Box>
          </div>

          {/* Sidebar */}
          <div className="col-4">
            {/* Pagamento */}
            <Box title={<><CreditCard size={13}/> Forma de pagamento</>} type="warning">
              {[
                { id:'pix',  label:'PIX ⚡',           sub:'Desconto automático aplicado', badge:'10% OFF' },
                { id:'card', label:'Cartão de crédito', sub:'Sem desconto sobre o valor',   badge:null },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setPayMode(opt.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                    padding:'12px 14px', marginBottom:8,
                    border: `2px solid ${payMode===opt.id?'var(--brand-purple)':'var(--border)'}`,
                    borderRadius:3,
                    background: payMode===opt.id?'#fff4e6':'#fff',
                    transition:'all .15s',
                  }}
                >
                  <div style={{
                    width:18, height:18, borderRadius:'50%', flexShrink:0,
                    border: `5px solid ${payMode===opt.id?'var(--brand-purple)':'#ccc'}`,
                    transition:'border-color .15s',
                  }}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{opt.label}</div>
                    <div className="text-xs text-muted">{opt.sub}</div>
                  </div>
                  {opt.badge && <span className="label label-success">{opt.badge}</span>}
                </div>
              ))}
            </Box>

            {/* Resumo */}
            <Box title="Resumo do pedido" type="success">
              <div className="stat-row">
                <span className="text-muted">Subtotal ({cart.reduce((s,i)=>s+i.qty,0)} items)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {payMode === 'pix' && (
                <div className="stat-row" style={{color:'#198754',fontWeight:600}}>
                  <span>Desconto PIX</span>
                  <span>− {fmt(desconto)}</span>
                </div>
              )}
              <div className="stat-row stat-row-bold">
                <span style={{fontSize:16}}>Total</span>
                <span style={{fontSize:18,color:'var(--brand-purple)'}}>{fmt(total)}</span>
              </div>

              {payMode==='pix' && desconto > 0 && (
                <div className="alert alert-success mt-2 mb-0" style={{fontSize:12}}>
                  <Zap size={14}/>
                  <span>Você economiza <strong>{fmt(desconto)}</strong> pagando com PIX!</span>
                </div>
              )}

              <button
                className="btn btn-success btn-lg btn-block mt-3"
                disabled={checkoutLoading || cart.length === 0}
                onClick={async () => {
                  try {
                    setCheckoutLoading(true)
                    const novo = await onCheckout(payMode)
                    setConfirmacao({
                      total: novo.total,
                      desconto: novo.desconto,
                      payMode,
                    })
                    setPedidoId(novo?.id || null)
                    setFinalizado(true)
                  } catch {
                    // Erro já exibido em App.jsx
                  } finally {
                    setCheckoutLoading(false)
                  }
                }}
              >
                <CheckCircle size={15}/> {checkoutLoading ? 'Processando…' : 'Finalizar pedido'}
              </button>
            </Box>

            {/* Resumo por produto */}
            <Box title="Breakdown PIX" type="info">
              <table style={{width:'100%',fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 0',color:'#777',fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Produto</th>
                    <th style={{textAlign:'right',padding:'4px 0',color:'#777',fontWeight:600,fontSize:10,textTransform:'uppercase'}}>Economia</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(({produto,qty}) => {
                    const c = calcProduto(produto)
                    const eco = (produto.venda - c.precoPixFinal) * qty
                    return (
                      <tr key={produto.id}>
                        <td style={{padding:'4px 0',borderBottom:'1px solid #f4f4f4'}}>
                          {produto.emoji} {produto.nome}
                        </td>
                        <td style={{textAlign:'right',padding:'4px 0',borderBottom:'1px solid #f4f4f4',color:'#198754',fontWeight:600}}>
                          {fmt(eco)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td style={{padding:'6px 0',fontWeight:700}}>Total economia</td>
                    <td style={{textAlign:'right',padding:'6px 0',color:'#198754',fontWeight:700}}>{fmt(desconto)}</td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </div>
        </div>
      </div>
    </>
  )
}
