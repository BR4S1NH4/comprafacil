import React, { useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import {
  fmt,
  calcProduto,
  computeSummaryFromPedidos,
  filterPedidosByPeriod,
  computeRelatorioSeries,
  computeWeekBucketsFromPedidos,
  formatChartCurrencyAxis,
} from '../data'
import { PageHeader, Box, SmallBox } from '../components/Layout'
import { BarChart3, TrendingUp, DollarSign, Zap, Download, RefreshCw } from 'lucide-react'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'#fff',border:'1px solid #d2d6de',borderRadius:3,padding:'7px 12px',fontSize:12,boxShadow:'0 2px 6px rgba(0,0,0,.1)'}}>
      <div style={{fontWeight:700,marginBottom:3}}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{color:p.color||p.stroke}}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  )
}

const PERIODOS = [
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
  { id: 'anos', label: '3 anos' },
]

export default function Relatorios({ produtos, pedidos = [], rankingProdutos = [] }) {
  const [periodo, setPeriodo] = useState('semana')
  const pedidosFiltrados = filterPedidosByPeriod(pedidos, periodo)
  const s = computeSummaryFromPedidos(pedidosFiltrados)
  const relatorioSeries = computeRelatorioSeries(pedidos, periodo)
  const monthWeekData = computeWeekBucketsFromPedidos(pedidosFiltrados, 4)

  const hasSalesData = s.totalPedidos > 0 && s.totalFaturamento > 0
  const lucroMargemText = hasSalesData ? `${(s.lucroEstimado/s.totalFaturamento*100).toFixed(1)}%` : 'N/A'
  const pixShareValue = hasSalesData ? `${(s.pedidosPix/s.totalPedidos*100).toFixed(0)}%` : 'N/A'
  const pixShareSub = hasSalesData ? `${s.pedidosPix} de ${s.totalPedidos} pedidos` : 'N/A'
  const pixSplitPix = hasSalesData ? `${Math.round(s.pedidosPix/s.totalPedidos*100)}%` : 'N/A'
  const pixSplitCard = hasSalesData ? `${Math.round((1-s.pedidosPix/s.totalPedidos)*100)}%` : 'N/A'

  const margemPorCategoria = Object.entries(
    produtos.reduce((acc, p) => {
      const c = calcProduto(p)
      if (!acc[p.categoria]) acc[p.categoria] = { total:0, count:0 }
      acc[p.categoria].total += c.margemPct
      acc[p.categoria].count++
      return acc
    }, {})
  ).map(([cat, {total,count}]) => ({ categoria:cat, margemMedia: +(total/count).toFixed(1) }))

  const pixTotal = s.pedidosPix + (s.totalPedidos - s.pedidosPix)
  const pixData =
    pixTotal > 0
      ? [
          { name:'Via PIX',    value: s.pedidosPix,                color:'#198754' },
          { name:'Via Cartão', value: s.totalPedidos-s.pedidosPix, color:'#7C3AED' },
        ]
      : [{ name: 'Sem pedidos no período', value: 1, color: '#d2d6de' }]

  const ranking = rankingProdutos.slice(0, 12)
  const totalFatRanking = ranking.reduce((sum, x) => sum + (+x.faturamento || 0), 0)

  const chartAngled = periodo === 'ano'

  return (
    <>
      <PageHeader
        title="Relatórios"
        sub="Análise financeira"
        breadcrumbs={['Relatórios']}
        actions={
          <div className="d-flex gap-2">
            <div className="btn-group">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-sm ${periodo === p.id ? 'btn-primary' : 'btn-default'}`}
                  onClick={() => setPeriodo(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-default btn-sm"><Download size={12}/> Exportar</button>
          </div>
        }
      />
      <div className="cf-page-body">

        {/* KPIs */}
        <div className="row mb-3">
          <div className="col-3">
            <SmallBox value={hasSalesData ? `R$ ${(s.totalFaturamento/1000).toFixed(1)}k` : 'N/A'} label="Faturamento (período)" icon="💰" color="var(--c-blue)"/>
          </div>
          <div className="col-3">
            <SmallBox value={hasSalesData ? `R$ ${(s.lucroEstimado/1000).toFixed(1)}k` : 'N/A'} label="Lucro líquido" icon="📈" color="var(--c-green)"
              sub={`Margem ${lucroMargemText}`}/>
          </div>
          <div className="col-3">
            <SmallBox value={pixShareValue} label="Pedidos via PIX" icon="⚡" color="var(--c-teal)"
              sub={pixShareSub}/>
          </div>
          <div className="col-3">
            <SmallBox value={hasSalesData ? fmt(s.descontosPix) : 'N/A'} label="Concedido em PIX" icon="🏷️" color="var(--c-purple)"
              sub="Total de descontos"/>
          </div>
        </div>

        {/* Gráficos principais */}
        <div className="row">
          <div className="col-8">
            <Box
              title={<><TrendingUp size={13}/> {relatorioSeries.title}</>}
              type="primary"
              tools={<button type="button" className="btn btn-default btn-xs"><RefreshCw size={10}/></button>}
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={relatorioSeries.data} margin={{top:5,right:5,left:0,bottom: chartAngled ? 24 : 0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis
                    dataKey={relatorioSeries.xKey}
                    tick={{fontSize: chartAngled ? 9 : 11, fill:'#777'}}
                    axisLine={false}
                    tickLine={false}
                    angle={chartAngled ? -35 : 0}
                    textAnchor={chartAngled ? 'end' : 'middle'}
                    height={chartAngled ? 50 : 30}
                  />
                  <YAxis tick={{fontSize:11,fill:'#777'}} axisLine={false} tickLine={false} tickFormatter={formatChartCurrencyAxis}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:12}}/>
                  <Bar dataKey="valor" name="Faturamento" fill="#7C3AED" radius={[3,3,0,0]}/>
                  <Bar dataKey="lucro" name="Lucro"        fill="#198754" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </div>
          <div className="col-4">
            <Box title={<><Zap size={13}/> PIX vs Cartão (período)</>} type="success">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pixData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {pixData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Legend wrapperStyle={{fontSize:12}}/>
                  <Tooltip formatter={(v,n) => (pixTotal > 0 ? [`${v} pedidos`, n] : ['—', n])}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex justify-between mt-2 text-sm">
                <span className="text-success text-bold">PIX: {pixSplitPix}</span>
                <span className="text-primary text-bold">Cartão: {pixSplitCard}</span>
              </div>
            </Box>

            <Box title="Vendas por semana (período)" type="info" style={{marginTop:0}}>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={monthWeekData} margin={{top:5,right:5,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="gMes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E9A800" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#E9A800" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="sem" tick={{fontSize:10,fill:'#777'}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="valor" name="Vendas" stroke="#E9A800" strokeWidth={2} fill="url(#gMes)"/>
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </div>
        </div>

        {/* Análise de produtos */}
        <div className="row">
          <div className="col-6">
            <Box title={<><BarChart3 size={13}/> Margem por categoria</>} type="warning">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={margemPorCategoria} layout="vertical" margin={{top:0,right:30,left:60,bottom:0}}>
                  <XAxis type="number" tick={{fontSize:10,fill:'#777'}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                  <YAxis type="category" dataKey="categoria" tick={{fontSize:11,fill:'#555'}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v) => [`${v}%`,'Margem média']}/>
                  <Bar dataKey="margemMedia" name="Margem média" fill="#E9A800" radius={[0,3,3,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </div>

          <div className="col-6">
            <Box title={<><DollarSign size={13}/> Ranking de faturamento (geral)</>} type="danger">
              <table className="table table-hover">
                <thead>
                  <tr><th>#</th><th>Produto</th><th>Vendas</th><th>Faturamento</th><th>Share</th></tr>
                </thead>
                <tbody>
                  {ranking.length === 0 ? (
                    <tr><td colSpan={5} className="text-muted text-center">Sem vendas registradas.</td></tr>
                  ) : (
                    ranking.map((r, i) => {
                      const share = totalFatRanking > 0 ? ((r.faturamento / totalFatRanking) * 100).toFixed(0) : '0'
                      return (
                        <tr key={r.id}>
                          <td className="text-muted text-bold">{i+1}</td>
                          <td style={{fontWeight:600}}><span style={{marginRight:6}}>{r.emoji || '📦'}</span>{r.nome}</td>
                          <td>{r.qtd} un</td>
                          <td className="text-success text-bold">{fmt(r.faturamento)}</td>
                          <td style={{width:80}}>
                            <div className="d-flex items-center gap-1">
                              <div className="progress flex-1 progress-xs">
                                <div className="progress-bar" style={{width:`${share}%`,background:i===0?'#198754':'#6D28D9'}}/>
                              </div>
                              <span className="text-xs">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </Box>
          </div>
        </div>

        {/* Tabela margem completa */}
        <Box title={<><DollarSign size={13}/> Análise financeira completa por produto</>}>
          <div style={{overflowX:'auto'}}>
            <table className="table table-hover table-striped table-bordered">
              <thead>
                <tr>
                  <th>Produto</th><th>Categoria</th>
                  <th>Custo</th><th>Venda</th>
                  <th>Tributos</th><th>Operacional</th>
                  <th>Custo total</th><th>Margem R$</th><th>Margem %</th>
                  <th>Preço PIX</th><th>Desc. PIX</th><th>Eco./un</th>
                  <th>Validade PIX</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => {
                  const c = calcProduto(p)
                  return (
                    <tr key={p.id}>
                      <td><span style={{fontSize:16,marginRight:6}}>{p.emoji}</span><strong>{p.nome}</strong></td>
                      <td><span className="label label-default">{p.categoria}</span></td>
                      <td>{fmt(p.compra)}</td>
                      <td style={{fontWeight:600}}>{fmt(p.venda)}</td>
                      <td className="text-danger">{fmt(c.tribVal)} <span className="text-xs">({p.tributo}%)</span></td>
                      <td className="text-danger">{fmt(c.operVal)} <span className="text-xs">({p.operacional}%)</span></td>
                      <td style={{fontWeight:600}}>{fmt(c.custoTotal)}</td>
                      <td className="text-success text-bold">{fmt(c.margem)}</td>
                      <td><span className="label label-success">{c.margemPct.toFixed(1)}%</span></td>
                      <td className="text-primary text-bold">{fmt(c.precoPixFinal)}</td>
                      <td>{p.pixDesconto}%</td>
                      <td className="text-success">{fmt(c.pixDescontoVal)}</td>
                      <td><span className={`label ${c.pixValido?'label-success':'label-danger'}`}>{c.pixValido?'✓ Válido':'✗ Inválido'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{background:'#f9f9f9',fontWeight:700}}>
                  <td colSpan={7} className="text-right text-muted text-sm">Médias:</td>
                  <td className="text-success">{produtos.length ? fmt(produtos.reduce((s,p)=>s+calcProduto(p).margem,0)/produtos.length) : 'N/A'}</td>
                  <td><span className="label label-info">{produtos.length ? `${(produtos.reduce((s,p)=>s+calcProduto(p).margemPct,0)/produtos.length).toFixed(1)}%` : 'N/A'}</span></td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Box>

      </div>
    </>
  )
}
