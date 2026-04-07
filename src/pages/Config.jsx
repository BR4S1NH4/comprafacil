import React, { useEffect, useRef, useState } from 'react'
import { PageHeader, Box } from '../components/Layout'
import { Save, AlertTriangle, CheckCircle, Store, Tag, Shield, Users, RefreshCw, KeyRound, ImageIcon, Trash2 } from 'lucide-react'
import LogoCropModal from '../components/LogoCropModal'
import { DEFAULT_COMPANY_SETTINGS, MAX_LOGO_BYTES, MAX_LOGO_INPUT_BYTES } from '../utils/companySettings'
import { BRAND_NAME, DEFAULT_LOGO_URL } from '../branding'

export default function Config({
  initialTab = 'geral',
  empresa,
  onSaveEmpresa,
  usuarios = [],
  usersLoading,
  usersError,
  onRefreshUsers,
  onResetUserPassword,
}) {
  const [saved, setSaved] = useState(false)
  const [aba, setAba] = useState(initialTab)
  const [senhaMap, setSenhaMap] = useState({})
  const [credMsg, setCredMsg] = useState('')
  const [credErr, setCredErr] = useState('')
  const [credLoadingId, setCredLoadingId] = useState(null)
  const [form, setForm] = useState(() => ({ ...(empresa || DEFAULT_COMPANY_SETTINGS) }))
  const [logoCropSrc, setLogoCropSrc] = useState(null)
  const logoCropSrcRef = useRef(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    logoCropSrcRef.current = logoCropSrc
  }, [logoCropSrc])

  useEffect(() => () => {
    const u = logoCropSrcRef.current
    if (u) URL.revokeObjectURL(u)
  }, [])

  useEffect(() => {
    setForm({ ...(empresa || DEFAULT_COMPANY_SETTINGS) })
  }, [empresa])

  const save = () => {
    onSaveEmpresa({ ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const cancelar = () => {
    closeLogoCrop()
    setForm({ ...(empresa || DEFAULT_COMPANY_SETTINGS) })
  }

  const closeLogoCrop = () => {
    if (logoCropSrc) {
      URL.revokeObjectURL(logoCropSrc)
      setLogoCropSrc(null)
    }
  }

  const onLogoFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Selecione um arquivo de imagem (PNG, JPG, WebP, etc.).')
      return
    }
    if (file.size > MAX_LOGO_INPUT_BYTES) {
      window.alert(
        `Arquivo muito grande para enviar. Use até ${Math.round(MAX_LOGO_INPUT_BYTES / (1024 * 1024))} MB (antes do recorte).`
      )
      return
    }
    setLogoCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const onLogoCropApply = (dataUrl) => {
    set('logoDataUrl', dataUrl)
    closeLogoCrop()
  }

  const removerLogo = () => set('logoDataUrl', null)

  useEffect(() => {
    setAba(initialTab)
  }, [initialTab])

  const redefinirSenha = async (userId) => {
    const novaSenha = String(senhaMap[userId] || '')
    if (novaSenha.length < 6) {
      setCredErr('A nova senha precisa ter ao menos 6 caracteres.')
      setCredMsg('')
      return
    }
    try {
      setCredLoadingId(userId)
      setCredErr('')
      setCredMsg('')
      await onResetUserPassword(userId, novaSenha)
      setCredMsg(`Senha redefinida para o usuario #${userId}.`)
      setSenhaMap(prev => ({ ...prev, [userId]: '' }))
      onRefreshUsers()
    } catch (error) {
      setCredErr(error.message || 'Falha ao redefinir senha.')
      setCredMsg('')
    } finally {
      setCredLoadingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Configurações" sub="Parâmetros do sistema" breadcrumbs={['Configurações']}/>
      <div className="cf-page-body">
        <div className="btn-group mb-3">
          <button className={`btn btn-sm ${aba==='geral'?'btn-primary':'btn-default'}`} onClick={()=>setAba('geral')}>
            Configuração geral
          </button>
          <button className={`btn btn-sm ${aba==='credenciais'?'btn-warning':'btn-default'}`} onClick={()=>setAba('credenciais')}>
            Credenciais de usuários
          </button>
        </div>

        {aba === 'credenciais' && (
          <Box
            title={<><KeyRound size={13}/> Login e senha dos usuários</>}
            type="warning"
            tools={
              <button className="btn btn-default btn-xs" onClick={onRefreshUsers} disabled={usersLoading}>
                <RefreshCw size={11}/> Atualizar
              </button>
            }
          >
            <div className="alert alert-info" style={{fontSize:12}}>
              <AlertTriangle size={13}/>
              <span>Por segurança, senhas atuais nao sao exibidas. Use a coluna «Nova senha» para redefinir.</span>
            </div>
            {credErr && <div className="alert alert-danger"><span>{credErr}</span></div>}
            {credMsg && <div className="alert alert-success"><span>{credMsg}</span></div>}
            {usersLoading ? (
              <div className="text-muted text-sm">Carregando usuarios...</div>
            ) : (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Login</th>
                    <th>Perfil</th>
                    <th>Senha atual</th>
                    <th>Nova senha</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{fontWeight:700}}>{u.usuario}</div>
                        <div className="text-xs text-muted">{u.nome}</div>
                      </td>
                      <td>
                        <span className={`label ${u.role === 'admin' ? 'label-danger' : 'label-info'}`}>{u.role}</span>
                      </td>
                      <td className="text-muted">Nao exibivel</td>
                      <td style={{minWidth:220}}>
                        <input
                          type="text"
                          value={senhaMap[u.id] || ''}
                          onChange={e => setSenhaMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="Digite a nova senha"
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => redefinirSenha(u.id)}
                          disabled={credLoadingId === u.id}
                        >
                          {credLoadingId === u.id ? 'Salvando...' : 'Redefinir senha'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        )}

        {aba === 'geral' && (
        <div className="row">
          <div className="col-6">

            {/* Dados da empresa */}
            <Box title={<><Store size={13}/> Dados da empresa</>} type="primary">
              <div className="cf-logo-upload mb-3">
                <label className="d-block mb-2" style={{ fontWeight: 600 }}>Logotipo</label>
                <div className="d-flex gap-3 flex-wrap items-center">
                  <div
                    className="cf-logo-preview box mb-0"
                    style={{
                      width: 160,
                      minHeight: 72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f9f9f9',
                      border: '1px dashed #ccc',
                    }}
                  >
                    {form.logoDataUrl ? (
                      <img src={form.logoDataUrl} alt="Logotipo" decoding="async" loading="lazy" style={{ maxWidth: '100%', maxHeight: 64, objectFit: 'contain' }} />
                    ) : (
                      <div className="d-flex flex-col items-center gap-1" style={{ padding: 8 }}>
                        <img src={DEFAULT_LOGO_URL} alt="" decoding="async" loading="lazy" style={{ maxWidth: '100%', maxHeight: 56, objectFit: 'contain' }} />
                        <span className="text-muted text-xs">Padrão {BRAND_NAME}</span>
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-col gap-2">
                    <label className="btn btn-default btn-sm mb-0" style={{ cursor: 'pointer' }}>
                      <ImageIcon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Enviar imagem
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoFile} aria-label="Selecionar logotipo" />
                    </label>
                    {form.logoDataUrl && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={removerLogo}>
                        <Trash2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Remover logo
                      </button>
                    )}
                    <span className="text-xs text-muted">
                      Envie a imagem e use o recorte para ajustar. Arquivo até {Math.round(MAX_LOGO_INPUT_BYTES / (1024 * 1024))} MB;
                      após cortar, o logo fica limitado a ~{Math.round(MAX_LOGO_BYTES / 1024)} KB.
                    </span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Nome fantasia / marca</label>
                <input value={form.nomeLoja} onChange={e=>set('nomeLoja',e.target.value)} placeholder="Nome exibido no sistema"/>
              </div>
              <div className="form-group">
                <label>Razão social</label>
                <input value={form.razaoSocial || ''} onChange={e=>set('razaoSocial',e.target.value)} placeholder="Opcional"/>
              </div>
              <div className="form-group">
                <label>CNPJ</label>
                <input value={form.cnpj} onChange={e=>set('cnpj',e.target.value)} placeholder="00.000.000/0001-00"/>
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input value={form.endereco || ''} onChange={e=>set('endereco',e.target.value)} placeholder="Rua, número, bairro"/>
              </div>
              <div className="form-group">
                <label>E-mail administrativo</label>
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input value={form.telefone} onChange={e=>set('telefone',e.target.value)}/>
              </div>
              <div className="row">
                <div className="col-8">
                  <div className="form-group">
                    <label>Cidade</label>
                    <input value={form.cidade} onChange={e=>set('cidade',e.target.value)}/>
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-group">
                    <label>UF</label>
                    <select value={form.estado} onChange={e=>set('estado',e.target.value)}>
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </Box>

            {/* Padrões financeiros */}
            <Box title={<><Tag size={13}/> Padrões financeiros</>} type="warning">
              <div className="alert alert-info mb-3" style={{fontSize:12}}>
                <AlertTriangle size={14}/>
                <span>Estes valores são aplicados como padrão em novos produtos. Cada produto pode ter seus próprios valores.</span>
              </div>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label>Desconto PIX padrão (%)</label>
                    <div className="input-group">
                      <input type="number" min="0" max="100" step="0.5" value={form.pixPadrao} onChange={e=>set('pixPadrao',+e.target.value)}/>
                      <span className="input-addon input-addon-right">%</span>
                    </div>
                    <div className="form-hint">Desconto aplicado automaticamente no PIX</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label>Estoque mínimo padrão</label>
                    <input type="number" min="0" value={form.estoqueMinPadrao} onChange={e=>set('estoqueMinPadrao',+e.target.value)}/>
                    <div className="form-hint">Gatilho de alerta de reposição</div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label>Tributos padrão (%)</label>
                    <div className="input-group">
                      <input type="number" min="0" max="100" step="0.1" value={form.tributosPadrao} onChange={e=>set('tributosPadrao',+e.target.value)}/>
                      <span className="input-addon input-addon-right">%</span>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label>Operacional padrão (%)</label>
                    <div className="input-group">
                      <input type="number" min="0" max="100" step="0.1" value={form.operacionalPadrao} onChange={e=>set('operacionalPadrao',+e.target.value)}/>
                      <span className="input-addon input-addon-right">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          </div>

          <div className="col-6">
            {/* Regras do sistema */}
            <Box title={<><Shield size={13}/> Regras e segurança</>} type="danger">
              <div className="alert alert-warning mb-3" style={{fontSize:12}}>
                <AlertTriangle size={14}/>
                <span><strong>Regras de negócio imutáveis:</strong> O sistema sempre valida que o desconto PIX não ultrapasse a margem e que o preço de venda seja maior que o custo total. Estas regras protegem a empresa.</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f4f4f4'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Alerta de estoque mínimo</div>
                  <div className="text-xs text-muted">Exibir notificação quando estoque atingir o mínimo</div>
                </div>
                <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={form.alertaEstoque} onChange={e=>set('alertaEstoque',e.target.checked)} style={{ width: 'auto' }}/>
                  <span className={`label ${form.alertaEstoque?'label-success':'label-default'}`}>{form.alertaEstoque?'Ativo':'Inativo'}</span>
                </label>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Confirmar exclusão de produtos</div>
                  <div className="text-xs text-muted">Exibir modal de confirmação antes de excluir</div>
                </div>
                <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={form.confirmarExclusao} onChange={e=>set('confirmarExclusao',e.target.checked)}/>
                  <span className={`label ${form.confirmarExclusao?'label-success':'label-default'}`}>{form.confirmarExclusao?'Ativo':'Inativo'}</span>
                </label>
              </div>
            </Box>

            {/* Regras de negócio */}
            <Box title="📏 Regras de negócio do sistema" type="info">
              {[
                { num:'RN1', text:'Vendas exclusivamente online — sem atendimento presencial', ok:true },
                { num:'RN2', text:'Desconto automático apenas para pagamento via PIX', ok:true },
                { num:'RN3', text:'Desconto PIX não pode ultrapassar a margem bruta do produto', ok:true },
                { num:'RN4', text:'Preço mínimo = custo de compra + tributos + operacional', ok:true },
                { num:'RN5', text:'Estoque é decrementado automaticamente ao finalizar pedido', ok:true },
                { num:'RN6', text:'Alerta automático quando estoque ≤ estoque mínimo', ok:true },
              ].map(r => (
                <div key={r.num} className="d-flex items-center gap-3" style={{padding:'7px 0',borderBottom:'1px solid #f4f4f4'}}>
                  <span className="label label-primary">{r.num}</span>
                  <span style={{flex:1,fontSize:12,color:'var(--text)'}}>{r.text}</span>
                  <CheckCircle size={14} style={{color:'#198754',flexShrink:0}}/>
                </div>
              ))}
            </Box>

            {/* Informações do projeto */}
            <Box title="ℹ️ Sobre o projeto">
              <table style={{width:'100%',fontSize:13}}>
                <tbody>
                  {[
                    ['Sistema',   `${form.nomeLoja || BRAND_NAME} — v1.0`],
                    ['Framework', 'React 18 + Vite'],
                    ['Gráficos',  'Recharts'],
                    ['Ícones',    'Lucide React'],
                    ['Layout',    'AdminLTE (CSS customizado)'],
                    ['Projeto',   'Trabalho escolar — Disciplina de TI'],
                  ].map(([k,v]) => (
                    <tr key={k}>
                      <td style={{padding:'5px 0',color:'var(--text-muted)',fontWeight:600,width:100,borderBottom:'1px solid #f4f4f4'}}>{k}</td>
                      <td style={{padding:'5px 0',borderBottom:'1px solid #f4f4f4'}}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Box
              title={<><Users size={13}/> Banco de usuarios</>}
              type="primary"
              tools={
                <button className="btn btn-default btn-xs" onClick={onRefreshUsers} disabled={usersLoading}>
                  <RefreshCw size={11}/> Atualizar
                </button>
              }
            >
              {usersError && (
                <div className="alert alert-danger" style={{fontSize:12}}>
                  <AlertTriangle size={13}/>
                  <span>{usersError}</span>
                </div>
              )}
              {usersLoading ? (
                <div className="text-muted text-sm">Carregando usuarios...</div>
              ) : (
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Usuario</th>
                      <th>Perfil</th>
                      <th>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted text-center">Nenhum usuario cadastrado.</td>
                      </tr>
                    ) : usuarios.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td style={{fontWeight:600}}>{u.nome}</td>
                        <td>{u.usuario}</td>
                        <td>
                          <span className={`label ${u.role === 'admin' ? 'label-danger' : 'label-info'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="text-xs text-muted mt-2">
                Esta listagem vem diretamente do banco SQLite da API.
              </div>
            </Box>
          </div>
        </div>
        )}

        {logoCropSrc && (
          <LogoCropModal
            key={logoCropSrc}
            imageSrc={logoCropSrc}
            onClose={closeLogoCrop}
            onApply={onLogoCropApply}
          />
        )}

        {saved && (
          <div className="alert alert-success d-flex items-center gap-2" style={{position:'fixed',bottom:20,right:20,zIndex:999,width:'auto',padding:'12px 20px',boxShadow:'0 4px 12px rgba(0,0,0,.2)'}}>
            <CheckCircle size={16}/> Configurações salvas com sucesso!
          </div>
        )}

        {aba === 'geral' && (
          <div className="d-flex gap-3">
            <button className="btn btn-primary btn-lg" onClick={save}><Save size={14}/> Salvar configurações</button>
            <button type="button" className="btn btn-default btn-lg" onClick={cancelar}>Cancelar</button>
          </div>
        )}
      </div>
    </>
  )
}
