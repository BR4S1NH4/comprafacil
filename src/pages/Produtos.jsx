import React, { useState } from 'react'
import { calcProduto, stockStatus, fmt, CATEGORIAS, UNIDADES, EMOJIS } from '../data'
import { PageHeader, Box, Modal } from '../components/Layout'
import { Plus, Edit2, Trash2, Save, CheckCircle, AlertTriangle, Package, Search } from 'lucide-react'

const EMPTY = {
  codigo: '',
  nome: '',
  descricao: '',
  categoria: 'Estrutura',
  unidade: 'unidade',
  emoji: '📦',
  compra: '',
  venda: '',
  tributo: 8,
  operacional: 7,
  estoque: '',
  minimo: '',
  pixDesconto: 10,
}

function normalizeCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24)
}

function FormField({ label, hint, error, children }) {
  return (
    <div className={`form-group${error?' has-error':''}`}>
      <label>{label}</label>
      {children}
      {hint  && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

function ProdutoModal({ produto, produtos, onSave, onClose }) {
  const [form, setForm]   = useState(() => {
    if (!produto) return EMPTY
    return {
      ...produto,
      codigo: produto.codigo || `MAT-${String(produto.id).padStart(4, '0')}`,
      descricao: produto.descricao || '',
    }
  })
  const [errors, setErrs] = useState({})
  const set = (k,v) => {
    const nextValue = k === 'codigo' ? normalizeCode(v) : v
    setForm(f=>({...f,[k]:nextValue}))
    setErrs(e=>({...e,[k]:''}))
  }
  const isEdit = !!produto

  const mock = { compra:+form.compra||0, venda:+form.venda||0, tributo:+form.tributo||0, operacional:+form.operacional||0, pixDesconto:+form.pixDesconto||0 }
  const calc = calcProduto(mock)

  const validate = () => {
    const e = {}
    if (!form.codigo.trim())      e.codigo = 'Código/SKU obrigatório'
    if (!form.nome.trim())        e.nome    = 'Nome obrigatório'
    if (!+form.compra || +form.compra <= 0) e.compra  = 'Informe o custo de compra'
    if (!+form.venda  || +form.venda  <= 0) e.venda   = 'Informe o preço de venda'
    if (+form.venda <= +form.compra)         e.venda   = 'Preço de venda deve ser maior que o custo'
    if (+form.estoque < 0)                   e.estoque = 'Estoque não pode ser negativo'
    if (+form.minimo  < 0)                   e.minimo  = 'Mínimo não pode ser negativo'
    if (!calc.pixValido && +form.pixDesconto > 0) e.pixDesconto = `Desconto máximo: ${calc.margemPct.toFixed(2)}%`

    const codigoNormalizado = form.codigo.trim().toUpperCase()
    const nomeNormalizado = form.nome.trim().toLowerCase()
    const duplicatedCode = produtos.some(p => p.id !== form.id && (p.codigo || '').trim().toUpperCase() === codigoNormalizado)
    const duplicatedName = produtos.some(p => p.id !== form.id && p.nome.trim().toLowerCase() === nomeNormalizado)
    if (duplicatedCode) e.codigo = 'Já existe material com esse código'
    if (duplicatedName) e.nome = 'Já existe material com esse nome'

    setErrs(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      ...form, id: form.id || crypto.randomUUID(),
      codigo: form.codigo.trim().toUpperCase(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      compra:+form.compra, venda:+form.venda,
      tributo:+form.tributo, operacional:+form.operacional,
      estoque:+form.estoque, minimo:+form.minimo,
      pixDesconto:+form.pixDesconto,
    })
    onClose()
  }

  return (
    <Modal
      title={<><Package size={15}/> {isEdit ? 'Editar Material' : 'Novo Material'}</>}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-default" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={13}/> {isEdit ? 'Salvar alterações' : 'Cadastrar material'}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="col-8">
          {/* Emoji */}
          <FormField label="Ícone do produto">
            <div className="d-flex flex-wrap gap-1">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => set('emoji',e)} style={{
                  fontSize:18, width:34, height:34, borderRadius:3, cursor:'pointer',
                  border: form.emoji===e?'2px solid var(--brand-purple)':'1px solid var(--border)',
                  background: form.emoji===e?'#fff4e6':'#fff',
                }}>{e}</button>
              ))}
            </div>
          </FormField>

          {/* Codigo */}
          <FormField label="Código/SKU" hint="Use letras, números e hífen" error={errors.codigo}>
            <input
              value={form.codigo}
              onChange={e=>set('codigo',e.target.value)}
              placeholder="Ex: MAT-0001"
            />
          </FormField>

          {/* Nome */}
          <FormField label="Nome do material" error={errors.nome}>
            <input value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Ex: Cimento CP-II 50kg"/>
          </FormField>

          <FormField label="Descrição (opcional)">
            <textarea
              value={form.descricao}
              onChange={e=>set('descricao',e.target.value)}
              rows={3}
              placeholder="Informações para venda: marca, dimensão, acabamento etc."
            />
          </FormField>

          {/* Categoria + Unidade */}
          <div className="row">
            <div className="col-6">
              <FormField label="Categoria">
                <select value={form.categoria} onChange={e=>set('categoria',e.target.value)}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Unidade de medida">
                <select value={form.unidade} onChange={e=>set('unidade',e.target.value)}>
                  {UNIDADES.map(u=><option key={u}>{u}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* Preços */}
          <div className="row">
            <div className="col-6">
              <FormField label="Preço de compra (R$)" error={errors.compra}>
                <div className="input-group">
                  <span className="input-addon input-addon-left">R$</span>
                  <input type="number" min="0" step="0.01" value={form.compra} onChange={e=>set('compra',e.target.value)} placeholder="0,00"/>
                </div>
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Preço de venda (R$)" error={errors.venda}>
                <div className="input-group">
                  <span className="input-addon input-addon-left">R$</span>
                  <input type="number" min="0" step="0.01" value={form.venda} onChange={e=>set('venda',e.target.value)} placeholder="0,00"/>
                </div>
              </FormField>
            </div>
          </div>

          {/* Custos */}
          <div className="row">
            <div className="col-6">
              <FormField label="Tributos (%)" hint="Impostos sobre venda">
                <div className="input-group">
                  <input type="number" min="0" max="100" step="0.1" value={form.tributo} onChange={e=>set('tributo',e.target.value)}/>
                  <span className="input-addon input-addon-right">%</span>
                </div>
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Custo operacional (%)" hint="Pessoal, logística, etc.">
                <div className="input-group">
                  <input type="number" min="0" max="100" step="0.1" value={form.operacional} onChange={e=>set('operacional',e.target.value)}/>
                  <span className="input-addon input-addon-right">%</span>
                </div>
              </FormField>
            </div>
          </div>

          {/* Estoque */}
          <div className="row">
            <div className="col-6">
              <FormField label="Estoque atual (unidades)" error={errors.estoque}>
                <input type="number" min="0" step="1" value={form.estoque} onChange={e=>set('estoque',e.target.value)}/>
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Estoque mínimo (alerta)" error={errors.minimo}>
                <input type="number" min="0" step="1" value={form.minimo} onChange={e=>set('minimo',e.target.value)}/>
              </FormField>
            </div>
          </div>

          {/* Desconto PIX */}
          <FormField label="Desconto PIX (%)" error={errors.pixDesconto}>
            <div className="input-group" style={{maxWidth:160}}>
              <input type="number" min="0" max="100" step="0.5" value={form.pixDesconto} onChange={e=>set('pixDesconto',e.target.value)}/>
              <span className="input-addon input-addon-right">%</span>
            </div>
          </FormField>
        </div>

        {/* Calculadora ao vivo */}
        <div className="col-4">
          <div style={{position:'sticky',top:0}}>
            <Box title="Calculadora" type="info" style={{marginBottom:12}}>
              <div className="stat-row"><span className="text-muted">Preço compra</span><span>{fmt(mock.compra)}</span></div>
              <div className="stat-row"><span className="text-muted">Tributos ({mock.tributo}%)</span><span className="text-danger">+{fmt(calc.tribVal)}</span></div>
              <div className="stat-row"><span className="text-muted">Operacional ({mock.operacional}%)</span><span className="text-danger">+{fmt(calc.operVal)}</span></div>
              <div className="stat-row stat-row-bold"><span>Custo total</span><span>{fmt(calc.custoTotal)}</span></div>
              <div className="stat-row"><span className="text-muted">Margem bruta</span><span className="text-success text-bold">{fmt(calc.margem)}</span></div>
              <div className="stat-row"><span className="text-muted">Margem %</span><span><span className="label label-success">{calc.margemPct.toFixed(2)}%</span></span></div>
              <div className="stat-row"><span className="text-muted">Desc. máx. PIX</span><span><span className="label label-warning">{calc.margemPct.toFixed(2)}%</span></span></div>
            </Box>

            <div className={`alert ${calc.pixValido?'alert-success':'alert-danger'}`} style={{fontSize:12}}>
              {calc.pixValido ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
              <span>
                {calc.pixValido
                  ? `✓ PIX válido — preço final ${fmt(calc.precoPixFinal)}`
                  : `✗ PIX inválido — gera prejuízo! Máx: ${calc.margemPct.toFixed(1)}%`}
              </span>
            </div>

            <Box title="Preço ao cliente" type="success" style={{marginTop:8}}>
              <div className="d-flex justify-between items-center mb-2 pb-2" style={{borderBottom:'1px solid #f0f0f0'}}>
                <div>
                  <div className="text-xs text-muted mb-1">💳 Cartão</div>
                  <div style={{fontSize:17,fontWeight:700}}>{fmt(mock.venda)}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="text-xs text-muted mb-1">⚡ PIX <span className="label label-success text-xs">{mock.pixDesconto}% OFF</span></div>
                  <div style={{fontSize:17,fontWeight:700,color:'#198754'}}>{fmt(calc.precoPixFinal)}</div>
                </div>
              </div>
              <div className="text-xs text-muted">Economia de <strong>{fmt(calc.pixDescontoVal)}</strong>/un no PIX</div>
            </Box>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Produtos({ produtos, onSave, onDelete }) {
  const [modal, setModal]   = useState(null)   // null | 'novo' | {produto}
  const [busca, setBusca]   = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [delConf, setDelConf] = useState(null)

  const filtrados = produtos.filter(p => {
    const termo = busca.toLowerCase()
    const m = (
      p.nome.toLowerCase().includes(termo) ||
      (p.codigo || '').toLowerCase().includes(termo) ||
      p.categoria.toLowerCase().includes(termo) ||
      (p.descricao || '').toLowerCase().includes(termo)
    )
    if (filtro==='alerta')    return m && p.estoque <= p.minimo
    if (filtro==='pix-ok')    return m && calcProduto(p).pixValido
    if (filtro==='pix-inv')   return m && !calcProduto(p).pixValido
    return m
  })

  const handleDelete = (id) => {
    onDelete(id)
    setDelConf(null)
  }

  return (
    <>
      <PageHeader
        title="Gestão de Produtos"
        sub="Cadastro de materiais para venda"
        breadcrumbs={['Produtos']}
        actions={
          <button className="btn btn-success btn-sm" onClick={() => setModal('novo')}>
            <Plus size={13}/> Novo material
          </button>
        }
      />
      <div className="cf-page-body">

        {/* Filtros */}
        <Box title={<><Search size={13}/> Filtros</>}>
          <div className="d-flex gap-3 flex-wrap items-center">
            <div className="input-group" style={{maxWidth:300,flex:1}}>
              <span className="input-addon input-addon-left"><Search size={13}/></span>
              <input type="text" placeholder="Buscar por nome, código, categoria..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="btn-group">
              {[{id:'todos',label:'Todos'},{id:'alerta',label:'⚠ Alerta'},{id:'pix-ok',label:'✓ PIX válido'},{id:'pix-inv',label:'✗ PIX inválido'}].map(f=>(
                <button key={f.id} className={`btn btn-sm ${filtro===f.id?'btn-primary':'btn-default'}`} onClick={()=>setFiltro(f.id)}>{f.label}</button>
              ))}
            </div>
            <span className="text-sm text-muted ml-auto">{filtrados.length} material(is)</span>
          </div>
        </Box>

        {/* Tabela */}
        <Box title={<><Package size={13}/> Materiais cadastrados ({filtrados.length})</>}>
          {filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">Nenhum material encontrado</div>
              <div className="empty-state-sub mb-3">Ajuste os filtros ou cadastre um novo material</div>
              <button className="btn btn-success" onClick={()=>setModal('novo')}><Plus size={13}/> Novo material</button>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Custo</th>
                    <th>Venda</th>
                    <th>Margem</th>
                    <th>PIX</th>
                    <th>Desc.</th>
                    <th>Validação</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th style={{width:100}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const c  = calcProduto(p)
                    const st = stockStatus(p)
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="d-flex items-center gap-2">
                            <span style={{fontSize:20}}>{p.emoji}</span>
                            <div>
                              <div style={{fontWeight:600}}>{p.nome}</div>
                              <div className="text-xs text-muted">{p.unidade}</div>
                              {p.descricao && <div className="text-xs text-muted">{p.descricao}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="label label-info">{p.codigo || 'SEM-COD'}</span></td>
                        <td><span className="label label-default">{p.categoria}</span></td>
                        <td className="text-muted">{fmt(p.compra)}</td>
                        <td style={{fontWeight:600}}>{fmt(p.venda)}</td>
                        <td>
                          <span className="text-success text-bold">{fmt(c.margem)}</span>
                          <div className="text-xs text-muted">{c.margemPct.toFixed(1)}%</div>
                        </td>
                        <td className="text-primary text-bold">{fmt(c.precoPixFinal)}</td>
                        <td>{p.pixDesconto}%</td>
                        <td>
                          <span className={`label ${c.pixValido?'label-success':'label-danger'}`}>
                            {c.pixValido ? '✓ Válido' : '✗ Inválido'}
                          </span>
                        </td>
                        <td>
                          <div style={{fontWeight:700,color:p.estoque===0?'#c53030':'inherit'}}>{p.estoque}</div>
                          <div className="text-xs text-muted">mín: {p.minimo}</div>
                        </td>
                        <td><span className={`label ${st.cls}`}>{st.label}</span></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-info btn-xs" onClick={() => setModal(p)} title="Editar">
                              <Edit2 size={11}/>
                            </button>
                            <button className="btn btn-danger btn-xs" onClick={() => setDelConf(p)} title="Excluir">
                              <Trash2 size={11}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Box>
      </div>

      {/* Modal novo/editar */}
      {modal !== null && (
        <ProdutoModal
          produto={modal === 'novo' ? null : modal}
          produtos={produtos}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal confirmação exclusão */}
      {delConf && (
        <Modal
          title={<><AlertTriangle size={15}/> Confirmar exclusão</>}
          onClose={() => setDelConf(null)}
          footer={
            <>
              <button className="btn btn-default" onClick={() => setDelConf(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(delConf.id)}>
                <Trash2 size={13}/> Excluir permanentemente
              </button>
            </>
          }
        >
          <div className="alert alert-danger">
            <AlertTriangle size={16}/>
            <span>Você está prestes a excluir <strong>{delConf.nome}</strong>. Esta ação não pode ser desfeita.</span>
          </div>
        </Modal>
      )}
    </>
  )
}
