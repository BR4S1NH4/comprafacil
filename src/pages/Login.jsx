import React, { useState } from 'react'
import { Lock, User, LogIn, AlertTriangle, UserPlus } from 'lucide-react'
import { DEFAULT_COMPANY_SETTINGS } from '../utils/companySettings'

export default function Login({ onLogin, onRegister, empresa }) {
  const e = empresa || DEFAULT_COMPANY_SETTINGS
  const nomeMarca = (e.nomeLoja || 'CompraFacil').trim()
  const logoUrl = e.logoDataUrl
  const [mode, setMode] = useState('login')
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminUsuario, setAdminUsuario] = useState('TIAGO GABRIEL')
  const [adminSenha, setAdminSenha] = useState('')
  const [adminErro, setAdminErro] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const handleLogin = async e => {
    e.preventDefault()
    try {
      setLoading(true)
      setErro('')
      setOkMsg('')
      await onLogin(usuario, senha)
    } catch (error) {
      setErro(error.message || 'Usuario ou senha invalidos.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async e => {
    e.preventDefault()
    if (senha !== confirmarSenha) {
      setErro('As senhas nao conferem.')
      return
    }
    try {
      setLoading(true)
      setErro('')
      setOkMsg('')
      await onRegister(nome, usuario, senha)
      setOkMsg('Conta criada com sucesso. Agora faca login.')
      setMode('login')
      setNome('')
      setUsuario('')
      setSenha('')
      setConfirmarSenha('')
    } catch (error) {
      setErro(error.message || 'Nao foi possivel criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async e => {
    e.preventDefault()
    try {
      setAdminLoading(true)
      setAdminErro('')
      await onLogin(adminUsuario, adminSenha)
    } catch (error) {
      setAdminErro(error.message || 'Falha no login administrativo.')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7C3AED 0%, #1a0f2e 55%, #0f081c 100%)',
        padding: 16,
      }}
    >
      <div className="box" style={{ width: '100%', maxWidth: 420, marginBottom: 0 }}>
        <div className="box-header" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff' }}>
          <span className="box-title">Acesso ao sistema</span>
        </div>
        <div className="box-body">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {logoUrl ? (
              <div style={{ marginBottom: 12 }}>
                <img src={logoUrl} alt="" style={{ maxHeight: 72, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ fontSize: 30, fontWeight: 700, color: '#6D28D9' }}>{nomeMarca}</div>
            )}
            <div className="text-muted">
              {mode === 'login' ? 'Entre com sua conta' : 'Crie sua conta para usar a area de vendas'}
            </div>
          </div>

          <div className="btn-group mb-2" style={{ width: '100%' }}>
            <button
              className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-default'}`}
              style={{ width: '50%', justifyContent: 'center' }}
              onClick={() => {
                setMode('login')
                setErro('')
                setOkMsg('')
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`btn btn-sm ${mode === 'register' ? 'btn-success' : 'btn-default'}`}
              style={{ width: '50%', justifyContent: 'center' }}
              onClick={() => {
                setMode('register')
                setErro('')
                setOkMsg('')
              }}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <button
            type="button"
            className="btn btn-warning btn-block mb-2"
            onClick={() => {
              setAdminOpen(true)
              setAdminUsuario('TIAGO GABRIEL')
              setAdminSenha('')
              setAdminErro('')
            }}
          >
            Acessar login administrativo
          </button>

          {okMsg && (
            <div className="alert alert-success">
              <span>{okMsg}</span>
            </div>
          )}

          {erro && (
            <div className="alert alert-danger">
              <AlertTriangle size={15} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Nome completo</label>
                <input
                  value={nome}
                  onChange={e => {
                    setNome(e.target.value)
                    setErro('')
                  }}
                  placeholder="Digite seu nome"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Usuario</label>
              <div className="input-group">
                <span className="input-addon input-addon-left"><User size={13} /></span>
                <input
                  value={usuario}
                  onChange={e => {
                    setUsuario(e.target.value)
                    setErro('')
                  }}
                  placeholder="Digite o usuario"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Senha</label>
              <div className="input-group">
                <span className="input-addon input-addon-left"><Lock size={13} /></span>
                <input
                  type="password"
                  value={senha}
                  onChange={e => {
                    setSenha(e.target.value)
                    setErro('')
                  }}
                  placeholder="Digite a senha"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Confirmar senha</label>
                <div className="input-group">
                  <span className="input-addon input-addon-left"><Lock size={13} /></span>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={e => {
                      setConfirmarSenha(e.target.value)
                      setErro('')
                    }}
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-block ${mode === 'login' ? 'btn-primary' : 'btn-success'}`}
              disabled={loading}
            >
              {mode === 'login'
                ? <><LogIn size={14} /> {loading ? 'Entrando...' : 'Entrar no sistema'}</>
                : <><UserPlus size={14} /> {loading ? 'Criando conta...' : 'Criar conta'}</>}
            </button>
          </form>
        </div>
      </div>

      {adminOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setAdminOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4>Acesso administrativo</h4>
              <button className="modal-close-btn" onClick={() => setAdminOpen(false)}>x</button>
            </div>
            <div className="modal-body">
              {adminErro && (
                <div className="alert alert-danger">
                  <AlertTriangle size={15} />
                  <span>{adminErro}</span>
                </div>
              )}
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label>Usuario administrativo</label>
                  <div className="input-group">
                    <span className="input-addon input-addon-left"><User size={13} /></span>
                    <input
                      value={adminUsuario}
                      onChange={e => {
                        setAdminUsuario(e.target.value)
                        setAdminErro('')
                      }}
                      placeholder="Digite o usuario admin"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <div className="input-group">
                    <span className="input-addon input-addon-left"><Lock size={13} /></span>
                    <input
                      type="password"
                      value={adminSenha}
                      onChange={e => {
                        setAdminSenha(e.target.value)
                        setAdminErro('')
                      }}
                      placeholder="Digite a senha do admin"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-warning btn-block" disabled={adminLoading}>
                  <LogIn size={14} /> {adminLoading ? 'Entrando...' : 'Entrar como administrador'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
