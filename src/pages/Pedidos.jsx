import React, { useState } from 'react'
import { fmt, fmtDate } from '../data'
import { PageHeader, Box } from '../components/Layout'
import { ClipboardList, Zap, CreditCard, CheckCircle } from 'lucide-react'

export default function Pedidos({ pedidos = [] }) {
  const [filtro, setFiltro] = useState('todos')
  const [busca,  setBusca]  = useState('')

  const todos = pedidos

  const filtrados = todos.filter(p => {
    const m = p.cliente.toLowerCase().includes(busca.toLowerCase()) || String(p.id).includes(busca)
    if (filtro==='pix')    return m && p.pagamento==='pix'
    if (filtro==='cartao') return m && p.pagamento==='cartao'
    return m
  })

  const totalPixPedidos = todos.filter(p => p.pagamento === 'pix').length
  const totalCartaoPedidos = todos.filter(p => p.pagamento === 'cartao').length
  const totalDesc = todos.filter(p => p.pagamento === 'pix').reduce((s, p) => s + (+p.desconto || 0), 0)
  const fatTotal = todos.reduce((s, p) => s + (+p.total || 0), 0)
  return (
    <>
      <PageHeader title="Pedidos" sub="Histórico de vendas" breadcrumbs={['Pedidos']}/>
      <div className="cf-page-body">

        {/* Info boxes */}
        <div className="row mb-3">
          <div className="col-3">
            <div className="info-box mb-0">
              <div className="info-box-icon" style={{background:'var(--brand-purple)',fontSize:28}}>📋</div>
              <div className="info-box-content">
                <span className="info-box-text">Total pedidos</span>
                <span className="info-box-number">{todos.length}</span>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="info-box mb-0">
              <div className="info-box-icon" style={{background:'#198754',fontSize:24}}>⚡</div>
              <div className="info-box-content">
                <span className="info-box-text">Via PIX</span>
                <span className="info-box-number">{totalPixPedidos}</span>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="info-box mb-0">
              <div className="info-box-icon" style={{background:'#E9A800',fontSize:24}}>💳</div>
              <div className="info-box-content">
                <span className="info-box-text">Via cartão</span>
                <span className="info-box-number">{totalCartaoPedidos}</span>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="info-box mb-0">
              <div className="info-box-icon" style={{background:'#c53030',fontSize:24}}>💰</div>
              <div className="info-box-content">
                <span className="info-box-text">Total descontos PIX</span>
                <span className="info-box-number" style={{fontSize:16}}>{fmt(totalDesc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Box>
          <div className="d-flex gap-3 items-center flex-wrap">
            <input type="text" placeholder="Buscar por cliente ou nº pedido..." value={busca} onChange={e=>setBusca(e.target.value)} style={{maxWidth:280,flex:1}}/>
            <div className="btn-group">
              {[{id:'todos',label:'Todos'},{id:'pix',label:'⚡ PIX'},{id:'cartao',label:'💳 Cartão'}].map(f=>(
                <button key={f.id} className={`btn btn-sm ${filtro===f.id?'btn-primary':'btn-default'}`} onClick={()=>setFiltro(f.id)}>{f.label}</button>
              ))}
            </div>
            <span className="text-sm text-muted ml-auto">
              Faturamento: <strong className="text-success">{fmt(fatTotal)}</strong>
            </span>
          </div>
        </Box>

        {/* Tabela */}
        <Box title={<><ClipboardList size={13}/> Lista de pedidos</>} type="primary">
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Nenhum pedido registrado</div>
              <div className="empty-state-sub">Os pedidos finalizados no balcão aparecem aqui (PostgreSQL).</div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Nenhum pedido corresponde ao filtro</div>
              <div className="empty-state-sub">Ajuste a busca ou o tipo de pagamento.</div>
            </div>
          ) : (
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Data/hora</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Pagamento</th>
                  <th>Desconto</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:700,color:'var(--brand-purple)'}}>#{p.id}</td>
                    <td className="text-sm">{fmtDate(p.data)}</td>
                    <td style={{fontWeight:600}}>{p.cliente}</td>
                    <td className="text-center">
                      <span className="label label-default">{p.itens} ite{p.itens!==1?'ns':'m'}</span>
                    </td>
                    <td>
                      {p.pagamento === 'pix' ? (
                        <span className="d-flex items-center gap-1" style={{color:'#198754',fontWeight:600,fontSize:13}}>
                          <Zap size={13}/> PIX
                        </span>
                      ) : (
                        <span className="d-flex items-center gap-1 text-muted" style={{fontSize:13}}>
                          <CreditCard size={13}/> Cartão
                        </span>
                      )}
                    </td>
                    <td>
                      {p.desconto > 0
                        ? <span className="text-success text-bold">− {fmt(p.desconto)}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td style={{fontWeight:700,fontSize:14}}>{fmt(p.total)}</td>
                    <td>
                      <span className="label label-success">
                        <CheckCircle size={10} style={{marginRight:3}}/> Concluído
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="box-footer d-flex justify-between">
            <span>Exibindo: <strong>{filtrados.length}</strong> de <strong>{todos.length}</strong></span>
            <span>Faturamento (filtrado): <strong className="text-success">{fmt(filtrados.reduce((s,p)=>s+(+p.total||0),0))}</strong></span>
            <span>Descontos PIX (total): <strong className="text-danger">{fmt(totalDesc)}</strong></span>
          </div>
        </Box>

        {/* Timeline últimas atividades */}
        <div className="row">
          <div className="col-6">
            <Box title="Últimas transações">
              <div className="text-muted">N/A</div>
            </Box>
          </div>
          <div className="col-6">
            <Box title="Resumo por forma de pagamento" type="info">
              <div className="text-muted">N/A</div>
            </Box>
          </div>
        </div>

      </div>
    </>
  )
}
