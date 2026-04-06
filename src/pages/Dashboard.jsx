import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { PageHeader, Box, SmallBox, InfoBox } from '../components/Layout'
import { calcProduto, stockStatus, fmt, computeSummaryFromPedidos, computeWeekSeriesFromPedidos, computeWeekBucketsFromPedidos, formatChartCurrencyAxis } from '../data'
import { TrendingUp, Package, AlertTriangle, DollarSign, RefreshCw, BarChart3 } from 'lucide-react'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #d2d6de', borderRadius:3, padding:'7px 12px', fontSize:12, boxShadow:'0 2px 6px rgba(0,0,0,.1)' }}>
      <div style={{ fontWeight:700, marginBottom:3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{fmt(p.value)}</div>
      ))}
    </div>
  )
}

export default function Dashboard({ produtos, pedidos = [], rankingProdutos = [], onNav }) {
  const weekSeries = computeWeekSeriesFromPedidos(pedidos)
  const weekBuckets = computeWeekBucketsFromPedidos(pedidos, 4)
  const s = computeSummaryFromPedidos(pedidos)
  const rankingTop = rankingProdutos.slice(0, 8)
  const maxQ = rankingTop[0]?.qtd || 1
  const hasSalesData = s.totalPedidos > 0 && s.totalFaturamento > 0
  const pixShareText = hasSalesData ? `${Math.round(s.pedidosPix / s.totalPedidos * 100)}%` : 'N/A'
  const alertas = produtos.filter(p => p.estoque <= p.minimo)
  const semEstoque = produtos.filter(p => p.estoque === 0).length
  const normal  = produtos.filter(p => p.estoque > p.minimo).length
  const atencao = alertas.filter(p => p.estoque === p.minimo).length
  const critico = alertas.filter(p => p.estoque < p.minimo && p.estoque > 0).length
  const margemProdMedia = produtos.reduce((a, p) => a + calcProduto(p).margemPct, 0) / (produtos.length || 1)
  const pieData = [
    { name:'Normal',     value: normal,   color:'#198754' },
    { name:'Atenção',    value: atencao,  color:'#E9A800', labelDark: true },
    { name:'Crítico',    value: critico,  color:'#c53030' },
    { name:'Sem estoque',value: semEstoque, color:'#aaa' },
  ].filter(d => d.value > 0)

  return (
    <>
      <PageHeader title="Dashboard" sub="Painel de controle" breadcrumbs={['Dashboard']}/>
      <div className="cf-page-body">

        {/* ── Row 1: Small boxes ─────────────────── */}
        <div className="row mb-3">
          <div className="col-3">
            <SmallBox
              value={hasSalesData ? `R$ ${(s.totalFaturamento/1000).toFixed(1)}k` : 'N/A'}
              label="Faturamento Total"
              icon="💰" color="var(--c-blue)"
              sub="Ver relatório completo"
              onClick={() => onNav('relatorios')}
            />
          </div>
          <div className="col-3">
            <SmallBox
              value={hasSalesData ? `R$ ${(s.lucroEstimado/1000).toFixed(1)}k` : 'N/A'}
              label="Lucro Estimado"
              icon="📈" color="var(--c-green)"
              sub={hasSalesData ? `Margem vendas ${s.margemMedia.toFixed(1)}%` : `Margem produtos ${margemProdMedia.toFixed(1)}%`}
            />
          </div>
          <div className="col-3">
            <SmallBox
              value={hasSalesData ? s.totalPedidos : 'N/A'}
              label="Total de Pedidos"
              icon="🛒" color="var(--c-yellow)"
              sub={hasSalesData ? `Ticket médio ${fmt(s.ticketMedio)}` : 'Ticket médio N/A'}
              onClick={() => onNav('pedidos')}
            />
          </div>
          <div className="col-3">
            <SmallBox
              value={hasSalesData ? `R$ ${(s.descontosPix/1000).toFixed(1)}k` : 'N/A'}
              label="Descontos via PIX"
              icon="⚡" color="var(--c-red)"
              sub={hasSalesData ? `${s.pedidosPix} de ${s.totalPedidos} pedidos` : 'N/A'}
            />
          </div>
        </div>

        {/* ── Row 2: Info boxes ──────────────────── */}
        <div className="row mb-2">
          <div className="col-3">
            <InfoBox icon="📦" color="var(--c-blue)"   text="Total produtos" number={produtos.length}/>
          </div>
          <div className="col-3">
            <InfoBox icon="⚠️" color="var(--c-yellow)" text="Alertas estoque"  number={alertas.length}/>
          </div>
          <div className="col-3">
            <InfoBox icon="✅" color="var(--c-green)"  text="PIX do total"    number={pixShareText}/>
          </div>
          <div className="col-3">
            <InfoBox icon="💳" color="var(--c-teal)"   text="Poupado no PIX"  number={hasSalesData ? fmt(s.descontosPix) : 'N/A'}/>
          </div>
        </div>

        {/* ── Row 3: Charts ──────────────────────── */}
        <div className="row">
          <div className="col-8">
            <Box
              title={<><TrendingUp size={13}/> Vendas — Últimos 7 dias</>}
              type="primary"
              tools={
                <div className="d-flex gap-2">
                  <button className="btn btn-default btn-xs"><RefreshCw size={10}/> Atualizar</button>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={weekSeries} margin={{ top:5, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" tick={{fontSize:11,fill:'#777'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#777'}} axisLine={false} tickLine={false} tickFormatter={formatChartCurrencyAxis}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="valor" name="Vendas" stroke="#7C3AED" strokeWidth={2.5}
                    fill="url(#gArea)" dot={{r:4,fill:'#6D28D9',strokeWidth:2,stroke:'#fff'}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </div>
          <div className="col-4">
            <Box title={<><Package size={13}/> Situação do Estoque</>} type="warning">
              <div className="d-flex items-center gap-2 justify-center">
                <ResponsiveContainer width={130} height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                      {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {pieData.map(item => (
                    <div key={item.name} className="d-flex items-center gap-3" style={{justifyContent:'space-between'}}>
                      <span className="text-sm text-muted">{item.name}</span>
                      <span className="label" style={{ background: item.color, color: item.labelDark ? '#231F20' : '#fff' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Box>

            <Box title="Vendas por semana" type="info">
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={weekBuckets} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="sem" tick={{fontSize:10,fill:'#777'}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="valor" name="Vendas" fill="var(--c-teal)" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </div>
        </div>

        {/* ── Row 4: Tables ─────────────────────── */}
        <div className="row">
          <div className="col-6">
            <Box
              title={<><BarChart3 size={13}/> Produtos Mais Vendidos</>}
              type="success"
              tools={<button className="btn btn-default btn-xs" onClick={() => onNav('relatorios')}>Ver tudo</button>}
            >
              <table className="table table-hover">
                <thead>
                  <tr><th>#</th><th>Produto</th><th>Vendas</th><th>Faturamento</th><th>Barra</th></tr>
                </thead>
                <tbody>
                  {rankingTop.length === 0 ? (
                    <tr><td colSpan={5} className="text-muted text-center">Sem vendas para ranking ainda.</td></tr>
                  ) : rankingTop.map((item, i) => (
                    <tr key={item.id}>
                      <td className="text-muted text-bold">{i+1}</td>
                      <td style={{fontWeight:600}}><span style={{marginRight:6}}>{item.emoji || '📦'}</span>{item.nome}</td>
                      <td>{item.qtd}</td>
                      <td className="text-success text-bold">{fmt(item.faturamento)}</td>
                      <td style={{width:100}}>
                        <div className="progress progress-sm">
                          <div className="progress-bar" style={{
                            width:`${(item.qtd/maxQ*100).toFixed(0)}%`,
                            background: i===0?'#198754':'#6D28D9'
                          }}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </div>

          <div className="col-6">
            <Box
              title={<><AlertTriangle size={13}/> Alertas de Estoque</>}
              type="danger"
              tools={<button className="btn btn-default btn-xs" onClick={() => onNav('produtos')}>Gerenciar</button>}
            >
              {alertas.length === 0 ? (
                <div className="empty-state" style={{padding:'24px 0'}}>
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">Nenhum alerta ativo</div>
                  <div className="empty-state-sub">Todos os produtos estão dentro do estoque mínimo</div>
                </div>
              ) : (
                <table className="table table-hover">
                  <thead>
                    <tr><th>Produto</th><th>Atual</th><th>Mínimo</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {alertas.map(p => {
                      const st = stockStatus(p)
                      return (
                        <tr key={p.id}>
                          <td>
                            <span style={{fontSize:16,marginRight:6}}>{p.emoji}</span>
                            <strong>{p.nome}</strong>
                          </td>
                          <td style={{fontWeight:700,color:p.estoque===0?'#c53030':'inherit'}}>{p.estoque}</td>
                          <td className="text-muted">{p.minimo}</td>
                          <td><span className={`label ${st.cls}`}>{st.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Box>
          </div>
        </div>

        {/* ── Row 5: Margin table ────────────────── */}
        <Box
          title={<><DollarSign size={13}/> Análise de Margem e PIX por Produto</>}
          tools={<button className="btn btn-default btn-xs" onClick={() => onNav('produtos')}>Editar produtos</button>}
        >
          <div style={{overflowX:'auto'}}>
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>Produto</th><th>Categoria</th>
                  <th>Preço venda</th><th>Custo total</th>
                  <th>Margem R$</th><th>Margem %</th>
                  <th>Preço PIX</th><th>Desc. PIX</th>
                  <th>Estoque</th><th>Validação</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => {
                  const c  = calcProduto(p)
                  const st = stockStatus(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{fontSize:16,marginRight:6}}>{p.emoji}</span>
                        <strong>{p.nome}</strong>
                        <div className="text-xs text-muted">{p.unidade}</div>
                      </td>
                      <td><span className="label label-default">{p.categoria}</span></td>
                      <td style={{fontWeight:600}}>{fmt(p.venda)}</td>
                      <td className="text-muted">{fmt(c.custoTotal)}</td>
                      <td className="text-success text-bold">{fmt(c.margem)}</td>
                      <td><span className="label label-success">{c.margemPct.toFixed(1)}%</span></td>
                      <td className="text-primary text-bold">{fmt(c.precoPixFinal)}</td>
                      <td>{p.pixDesconto}%</td>
                      <td><span className={`label ${st.cls}`}>{p.estoque} un</span></td>
                      <td>
                        <span className={`label ${c.pixValido?'label-success':'label-danger'}`}>
                          {c.pixValido ? '✓ Válido' : '✗ Inválido'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Box>

      </div>
    </>
  )
}
