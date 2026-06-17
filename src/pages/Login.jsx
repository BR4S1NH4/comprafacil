import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, User, LogIn, AlertTriangle, UserPlus, Eye, EyeOff } from 'lucide-react'
import { DEFAULT_COMPANY_SETTINGS } from '../utils/companySettings'
import { BRAND_NAME, resolveLogoUrls } from '../branding'

function PasswordInput({ testId, value, onChange, placeholder, autoFocus }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="input-group">
      <span className="input-addon input-addon-left"><Lock size={13} /></span>
      <input
        data-testid={testId}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required
      />
      <button
        type="button"
        className="input-addon input-addon-right"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Exibir senha'}
        title={visible ? 'Ocultar senha' : 'Exibir senha'}
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

function loginStatusLabel(phase) {
  if (phase === 'warmup' || phase === 'warmup-retry') return 'Acordando servidor…'
  if (phase === 'auth') return 'Entrando…'
  return 'Entrando…'
}

function AdminLoginModal({
  open,
  onClose,
  adminUsuario,
  setAdminUsuario,
  adminSenha,
  setAdminSenha,
  adminErro,
  setAdminErro,
  adminLoading,
  adminStatus,
  onSubmit,
}) {
  if (!open) return null

  const modal = (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1200 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h4>Acesso administrativo</h4>
          <button type="button" className="modal-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          {adminErro && (
            <div className="alert alert-danger">
              <AlertTriangle size={15} />
              <span>{adminErro}</span>
            </div>
          )}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Usuario administrativo</label>
              <div className="input-group">
                <span className="input-addon input-addon-left"><User size={13} /></span>
                <input
                  data-testid="admin-usuario"
                  value={adminUsuario}
                  onChange={e => {
                    setAdminUsuario(e.target.value)
                    setAdminErro('')
                  }}
                  placeholder="Digite o usuario admin"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Senha</label>
              <PasswordInput
                testId="admin-senha"
                value={adminSenha}
                onChange={e => {
                  setAdminSenha(e.target.value)
                  setAdminErro('')
                }}
                placeholder="Digite a senha do admin"
              />
            </div>
            <button data-testid="admin-submit" type="submit" className="btn btn-warning btn-block" disabled={adminLoading}>
              <LogIn size={14} /> {adminLoading ? (adminStatus || 'Entrando...') : 'Entrar como administrador'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default function Login({ onLogin, onRegister, empresa, embedded, onAdminModalOpen }) {
  const e = empresa || DEFAULT_COMPANY_SETTINGS
  const nomeMarca = (e.nomeLoja || BRAND_NAME).trim()
  const { header: loginLogoUrl } = resolveLogoUrls(e)
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
  const [adminStatus, setAdminStatus] = useState('')
  const [loginStatus, setLoginStatus] = useState('')

  const handleLogin = async e => {
    e.preventDefault()
    try {
      setLoading(true)
      setLoginStatus('')
      setErro('')
      setOkMsg('')
      await onLogin(usuario, senha, {
        onStatus: (phase) => setLoginStatus(loginStatusLabel(phase)),
      })
    } catch (error) {
      setErro(error.message || 'Usuario ou senha invalidos.')
    } finally {
      setLoading(false)
      setLoginStatus('')
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
      setAdminStatus('')
      setAdminErro('')
      await onLogin(adminUsuario, adminSenha, {
        onStatus: (phase) => setAdminStatus(loginStatusLabel(phase)),
      })
      setAdminOpen(false)
    } catch (error) {
      setAdminErro(error.message || 'Falha no login administrativo.')
    } finally {
      setAdminLoading(false)
      setAdminStatus('')
    }
  }

  const openAdminModal = () => {
    onAdminModalOpen?.()
    setAdminUsuario('TIAGO GABRIEL')
    setAdminSenha('')
    setAdminErro('')
    setAdminOpen(true)
  }

  const inner = (
    <div className="box" style={{ width: '100%', maxWidth: 420, marginBottom: 0 }}>
        <div className="box-header" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff' }}>
          <span className="box-title">Acesso ao sistema</span>
        </div>
        <div className="box-body">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <img
                src={loginLogoUrl}
                alt={nomeMarca}
                decoding="async"
                fetchPriority="high"
                width={320}
                height={72}
                style={{ maxHeight: 72, maxWidth: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
            </div>
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
            data-testid="admin-login-open"
            className="btn btn-warning btn-block mb-2"
            onClick={openAdminModal}
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
                  data-testid="login-usuario"
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
              <PasswordInput
                testId="login-senha"
                value={senha}
                onChange={e => {
                  setSenha(e.target.value)
                  setErro('')
                }}
                placeholder="Digite a senha"
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Confirmar senha</label>
                <PasswordInput
                  value={confirmarSenha}
                  onChange={e => {
                    setConfirmarSenha(e.target.value)
                    setErro('')
                  }}
                  placeholder="Repita a senha"
                />
              </div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              className={`btn btn-block ${mode === 'login' ? 'btn-primary' : 'btn-success'}`}
              disabled={loading}
            >
              {mode === 'login'
                ? <><LogIn size={14} /> {loading ? (loginStatus || 'Entrando...') : 'Entrar no sistema'}</>
                : <><UserPlus size={14} /> {loading ? 'Criando conta...' : 'Criar conta'}</>}
            </button>
          </form>
        </div>
      </div>
  )

  const adminModal = (
    <AdminLoginModal
      open={adminOpen}
      onClose={() => setAdminOpen(false)}
      adminUsuario={adminUsuario}
      setAdminUsuario={setAdminUsuario}
      adminSenha={adminSenha}
      setAdminSenha={setAdminSenha}
      adminErro={adminErro}
      setAdminErro={setAdminErro}
      adminLoading={adminLoading}
      adminStatus={adminStatus}
      onSubmit={handleAdminLogin}
    />
  )

  if (embedded) {
    return (
      <>
        {inner}
        {adminModal}
      </>
    )
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
      {inner}
      {adminModal}
    </div>
  )
}
