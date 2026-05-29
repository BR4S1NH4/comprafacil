import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Package,
  ClipboardList, BarChart3, Settings, LogOut, KeyRound,
  Bell, Menu, ChevronRight, AlertTriangle, X, Building2, LogIn,
} from 'lucide-react'
import { BRAND_NAME, resolveLogoUrls } from '../branding'
import StoreHeaderSearch from './StoreHeaderSearch'

const ADMIN_NAV = [
  { id:'dashboard', label:'Dashboard',     icon:LayoutDashboard },
  { id:'pedidos',   label:'Pedidos',       icon:ClipboardList },
  { id:'produtos',  label:'Produtos',      icon:Package },
  { id:'relatorios',label:'Relatórios',    icon:BarChart3 },
  { id:'credenciais',label:'Credenciais',  icon:KeyRound },
]

const SALES_NAV = [
  { id:'loja',      label:'Loja',            icon:ShoppingBag },
  { id:'carrinho',  label:'Carrinho',        icon:ShoppingCart },
  { id:'sobre', label:'Sobre esta empresa', icon:Building2 },
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
  storefrontMode = false,
  guestMode = false,
  onOpenLogin,
  storeSearch = null,
}) {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return Boolean(storefrontMode)
    if (storefrontMode) return true
    return window.matchMedia('(max-width: 768px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const fn = () => setIsNarrow(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    if (storefrontMode) setCollapsed(true)
  }, [storefrontMode])

  const isAdmin = area === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : SALES_NAV
  const nomeLoja = empresa?.nomeLoja?.trim() || BRAND_NAME
  const { header: headerLogoUrl, avatar: avatarLogoUrl } = resolveLogoUrls(empresa)

  const overlayDrawer = storefrontMode || isNarrow
  const showScrim = overlayDrawer && !collapsed

  const handleNavItem = (item) => {
    onNav(item.id)
    if (overlayDrawer) setCollapsed(true)
  }

  const toggleMenu = () => setCollapsed((c) => !c)

  const headerClass = `cf-header${storefrontMode ? ' cf-header--store' : ''}`

  return (
    <div className={`cf-wrap${storefrontMode ? ' cf-storefront' : ''}`}>
      <header className={headerClass}>
        <button type="button" className="cf-hbtn" onClick={toggleMenu} title="Menu">
          <Menu size={18}/>
        </button>
        <a
          className="cf-logo"
          title={nomeLoja}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (isAdmin) onNav('dashboard')
            else onNav('loja')
          }}
        >
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
        {!storefrontMode && (
          <nav className="cf-header-nav" aria-hidden />
        )}
        {storefrontMode && storeSearch && (
          <StoreHeaderSearch
            value={storeSearch.value}
            onChange={storeSearch.onChange}
            produtos={storeSearch.produtos}
            onNavigateLoja={storeSearch.onNavigateLoja}
          />
        )}
        {storefrontMode && !storeSearch && (
          <div className="cf-header-tagline text-muted text-sm">
            Materiais para obra · PIX com desconto
          </div>
        )}
        <div className="cf-header-right">
          {isAdmin && alertCount > 0 && (
            <button className="cf-hbtn" onClick={() => onNav('dashboard')} title="Alertas de estoque">
              <AlertTriangle size={16}/>
              <span className="cf-hbtn-badge yellow">{alertCount}</span>
            </button>
          )}
          {!isAdmin && (
            <button className="cf-hbtn" onClick={() => onNav('carrinho')} title="Carrinho">
              <ShoppingCart size={16}/>
              {cartCount > 0 && <span className="cf-hbtn-badge">{cartCount}</span>}
            </button>
          )}
          {guestMode && typeof onOpenLogin === 'function' && (
            <button
              type="button"
              data-testid="guest-open-login"
              className="btn btn-sm btn-default cf-header-login-btn"
              onClick={() => onOpenLogin()}
            >
              <LogIn size={14}/> Entrar
            </button>
          )}
          {canSwitchArea && (
            <button
              className={`btn btn-sm ${isAdmin ? 'btn-warning' : 'btn-info'}`}
              onClick={onSwitchArea}
              title="Alternar área"
            >
              {isAdmin ? 'Ir para Vendas' : 'Ir para Admin'}
            </button>
          )}
          {!guestMode && (
            <button
              className="btn btn-sm btn-danger"
              onClick={onLogout}
              title="Deslogar usuário"
            >
              <LogOut size={13}/> Deslogar
            </button>
          )}
          {!guestMode && (
            <button className="cf-hbtn" title="Notificações">
              <Bell size={16}/>
            </button>
          )}
          {!guestMode && (
            <button type="button" className="cf-user-btn">
              <div className="cf-avatar">{(userName || 'U').slice(0, 1).toUpperCase()}</div>
              <span className="cf-user-btn-label">{userName || (isAdmin ? 'Admin' : 'Vendedor')}</span>
            </button>
          )}
        </div>
      </header>

      <div className={`cf-body${overlayDrawer ? ' cf-body--drawer' : ''}`}>
        {showScrim && (
          <button
            type="button"
            className="cf-sidebar-scrim"
            aria-label="Fechar menu"
            onClick={() => setCollapsed(true)}
          />
        )}
        <aside className={`cf-sidebar${collapsed ? ' collapsed' : ''}${overlayDrawer ? ' cf-sidebar--overlay' : ''}`}>
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
                style={
                  empresa?.logoDataUrl?.trim().startsWith('data:image/png')
                    ? { borderRadius: '50%', objectFit: 'cover' }
                    : undefined
                }
              />
            </div>
            <div>
              <div className="cf-up-name">{guestMode ? 'Visitante' : isAdmin ? 'Administrador' : 'Operador de Vendas'}</div>
              <div className="cf-up-company" title={nomeLoja}>{nomeLoja}</div>
              <div className="cf-up-status">
                <span className="cf-online-dot"/>Online
              </div>
            </div>
          </div>

          <div className="cf-nav-head">{isAdmin ? 'Área Administrativa' : 'Menu'}</div>

          {navItems.map((item) => {
            const Icon = item.icon
            const badge = item.id === 'carrinho' ? cartCount
              : item.id === 'dashboard' && alertCount > 0 ? alertCount
              : 0
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`cf-nav-item${isActive ? ' active' : ''}`}
                onClick={() => handleNavItem(item)}
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

          {isAdmin && (
            <button type="button" className="cf-nav-item" onClick={() => { onNav('config'); if (overlayDrawer) setCollapsed(true) }}>
              <Settings size={15}/>Configurações
            </button>
          )}
          {!guestMode && (
            <button type="button" className="cf-nav-item" onClick={onLogout}>
              <LogOut size={15}/>Sair
            </button>
          )}
          {guestMode && typeof onOpenLogin === 'function' && (
            <button type="button" className="cf-nav-item" onClick={() => { onOpenLogin(); setCollapsed(true) }}>
              <LogIn size={15}/>Entrar na conta
            </button>
          )}
        </aside>

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
          <button type="button" className="modal-close-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
