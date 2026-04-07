import React, { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Package,
  ClipboardList, BarChart3, Settings, LogOut, KeyRound,
  Bell, Menu, ChevronRight, AlertTriangle, X
} from 'lucide-react'
import { BRAND_NAME, resolveLogoUrls } from '../branding'

const ADMIN_NAV = [
  { id:'dashboard', label:'Dashboard',     icon:LayoutDashboard },
  { id:'pedidos',   label:'Pedidos',       icon:ClipboardList },
  { id:'produtos',  label:'Produtos',      icon:Package },
  { id:'relatorios',label:'Relatórios',    icon:BarChart3 },
  { id:'credenciais',label:'Credenciais',  icon:KeyRound },
]

const SALES_NAV = [
  { id:'loja',      label:'Balcão de Vendas', icon:ShoppingBag },
  { id:'carrinho',  label:'Carrinho',         icon:ShoppingCart },
]

export default function Layout({
  active,
  area,
  onSwitchArea,
  onNav,
  onLogout,
  userName,
  canSwitchArea,
  cartCount,
  alertCount,
  empresa,
  children,
}) {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  const isAdmin = area === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : SALES_NAV
  const nomeLoja = empresa?.nomeLoja?.trim() || BRAND_NAME
  const { header: headerLogoUrl, avatar: avatarLogoUrl } = resolveLogoUrls(empresa)

  return (
    <div className="cf-wrap">
      {/* ── Header ─────────────────────────────── */}
      <header className="cf-header">
        <a className="cf-logo" title={nomeLoja}>
          <img
            className="cf-logo-img"
            src={headerLogoUrl}
            alt={nomeLoja}
            decoding="async"
            fetchPriority="high"
            width={200}
            height={44}
          />
        </a>
        <nav className="cf-header-nav">
          <button className="cf-hbtn" onClick={() => setCollapsed(c => !c)} title="Alternar menu">
            <Menu size={18}/>
          </button>
        </nav>
        <div className="cf-header-right">
          {isAdmin && alertCount > 0 && (
            <button className="cf-hbtn" onClick={() => onNav('dashboard')} title="Alertas de estoque">
              <AlertTriangle size={16}/>
              <span className="cf-hbtn-badge yellow">{alertCount}</span>
            </button>
          )}
          {!isAdmin && <button className="cf-hbtn" onClick={() => onNav('carrinho')} title="Carrinho">
            <ShoppingCart size={16}/>
            {cartCount > 0 && <span className="cf-hbtn-badge">{cartCount}</span>}
          </button>}
          {canSwitchArea && (
            <button
              className={`btn btn-sm ${isAdmin ? 'btn-warning' : 'btn-info'}`}
              onClick={onSwitchArea}
              title="Alternar área"
            >
              {isAdmin ? 'Ir para Vendas' : 'Ir para Admin'}
            </button>
          )}
          <button
            className="btn btn-sm btn-danger"
            onClick={onLogout}
            title="Deslogar usuário"
          >
            <LogOut size={13}/> Deslogar
          </button>
          <button className="cf-hbtn" title="Notificações">
            <Bell size={16}/>
          </button>
          <button className="cf-user-btn">
            <div className="cf-avatar">A</div>
            <span>{userName || (isAdmin ? 'Admin' : 'Vendedor')}</span>
          </button>
        </div>
      </header>

      <div className="cf-body">
        {/* ── Sidebar ──────────────────────────── */}
        <aside className={`cf-sidebar${collapsed ? ' collapsed' : ''}`}>
          {/* User panel */}
          <div className="cf-user-panel">
            <div className="cf-up-avatar">
              <img
                src={avatarLogoUrl}
                alt=""
                className="cf-up-avatar-img"
                decoding="async"
                loading="lazy"
                width={44}
                height={44}
              />
            </div>
            <div>
              <div className="cf-up-name">{isAdmin ? 'Administrador' : 'Operador de Vendas'}</div>
              <div className="cf-up-company" title={nomeLoja}>{nomeLoja}</div>
              <div className="cf-up-status">
                <span className="cf-online-dot"/>Online
              </div>
            </div>
          </div>

          <div className="cf-nav-head">{isAdmin ? 'Área Administrativa' : 'Área de Vendas'}</div>

          {navItems.map(item => {
            const Icon = item.icon
            const badge = item.id === 'carrinho' ? cartCount
              : item.id === 'dashboard' && alertCount > 0 ? alertCount
              : 0
            return (
              <button
                key={item.id}
                className={`cf-nav-item${active === item.id ? ' active' : ''}`}
                onClick={() => onNav(item.id)}
              >
                <Icon size={15}/>
                {item.label}
                {badge > 0 && (
                  <span className="cf-nav-badge" style={{
                    background: item.id === 'dashboard' ? 'var(--c-yellow)' : 'var(--c-red)',
                    color: item.id === 'dashboard' ? 'var(--brand-charcoal)' : '#fff'
                  }}>{badge}</span>
                )}
              </button>
            )
          })}

          <div className="cf-nav-divider"/>
          <div className="cf-nav-head">Sistema</div>

          {isAdmin && <button className="cf-nav-item" onClick={() => onNav('config')}>
            <Settings size={15}/>Configurações
          </button>}
          <button className="cf-nav-item" onClick={onLogout}>
            <LogOut size={15}/>Sair
          </button>
        </aside>

        {/* ── Content ──────────────────────────── */}
        <main className="cf-content">
          {children}
        </main>
      </div>
    </div>
  )
}

/* ── Page Header ────────────────────────────────────────────── */
export function PageHeader({ title, sub, breadcrumbs = [], actions }) {
  return (
    <div className="cf-page-header">
      <div>
        <h1 className="cf-page-title">
          {title}
          {sub && <small>{sub}</small>}
        </h1>
      </div>
      <div className="d-flex items-center gap-3">
        {actions}
        <nav className="cf-breadcrumb">
          <span>Home</span>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span className="cf-breadcrumb-sep"><ChevronRight size={11}/></span>
              <span>{b}</span>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  )
}

/* ── Box card ────────────────────────────────────────────────── */
export function Box({ title, type, tools, children, footer, style, className = '' }) {
  return (
    <div className={`box${type ? ` box-${type}` : ''} ${className}`} style={style}>
      {title !== undefined && (
        <div className="box-header">
          <span className="box-title">{title}</span>
          {tools && <div className="box-tools">{tools}</div>}
        </div>
      )}
      <div className="box-body">{children}</div>
      {footer && <div className="box-footer">{footer}</div>}
    </div>
  )
}

/* ── Small stat box ──────────────────────────────────────────── */
export function SmallBox({ value, label, icon, color, sub, onClick }) {
  return (
    <div className="small-box" style={{ background: color, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="small-box-val">{value}</div>
      <div className="small-box-lbl">{label}</div>
      <div className="small-box-icon">{icon}</div>
      {sub && (
        <div className="small-box-footer">
          <ChevronRight size={11}/>{sub}
        </div>
      )}
    </div>
  )
}

/* ── Info box ────────────────────────────────────────────────── */
export function InfoBox({ icon, color, text, number }) {
  return (
    <div className="info-box">
      <div className="info-box-icon" style={{ background: color }}>{icon}</div>
      <div className="info-box-content">
        <span className="info-box-text">{text}</span>
        <span className="info-box-number">{number}</span>
      </div>
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, footer, size }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{
          maxWidth: size === 'xl' ? 960 : size === 'lg' ? 720 : 520,
        }}
      >
        <div className="modal-header">
          <h4>{title}</h4>
          <button className="modal-close-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
