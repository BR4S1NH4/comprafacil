import React, { lazy, Suspense, useEffect, useState } from 'react'
import Layout, { Modal } from './components/Layout'
import Loja             from './pages/Loja'
import SobreEmpresa     from './pages/SobreEmpresa'
import Carrinho         from './pages/Carrinho'
import Login            from './pages/Login'
import { loadCompanySettings } from './utils/companySettings'
import { mergeVitrine } from './utils/vitrineSettings'
import { mergeAboutPage } from './utils/aboutPageSettings'
import {
  listUsersRequest,
  loginRequest,
  logoutRequest,
  resetUserPasswordRequest,
  registerRequest,
  deleteUserRequest,
} from './services/authApi'
import {
  warmApi,
  ensureApiReady,
  fetchBranding,
  fetchCatalogProdutos,
  fetchProdutos,
  fetchPedidos,
  fetchRankingProdutos,
  fetchEmpresa,
  saveEmpresaRequest,
  saveProdutoRequest,
  deleteProdutoRequest,
  checkoutPedidoRequest,
} from './services/dataApi'
import { calcProduto } from './data'

const Dashboard  = lazy(() => import('./pages/Dashboard'))
const Pedidos    = lazy(() => import('./pages/Pedidos'))
const Produtos   = lazy(() => import('./pages/Produtos'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Config     = lazy(() => import('./pages/Config'))

const demoModulePromise = import('./demoEmbedded.js')

const DEMO_MODE =
  import.meta.env.VITE_DEMO_DATA === 'true' || import.meta.env.VITE_DEMO_DATA === '1'

const AREA_DEFAULT_SCREEN = {
  admin: 'dashboard',
  vendas: 'loja',
}

const ADMIN_SCREENS = new Set(['dashboard', 'pedidos', 'produtos', 'relatorios', 'config', 'credenciais'])
const SALES_SCREENS = new Set(['loja', 'carrinho', 'sobre'])

const GUEST_CART_KEY = 'cf_guest_cart_v1'

function readGuestCartLines() {
  try {
    const s = sessionStorage.getItem(GUEST_CART_KEY)
    const j = s ? JSON.parse(s) : []
    return Array.isArray(j) ? j.filter((x) => x && x.id) : []
  } catch {
    return []
  }
}

function writeGuestCartLines(lines) {
  try {
    sessionStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify(lines.map(({ produto, qty }) => ({ id: produto.id, qty })))
    )
  } catch {
    /* ignore */
  }
}

function hydrateGuestCart(catalog, raw) {
  const pmap = new Map(catalog.map((p) => [p.id, p]))
  const out = []
  for (const row of raw) {
    const p = pmap.get(row.id)
    if (!p || p.estoque <= 0) continue
    out.push({
      produto: p,
      qty: Math.min(Math.max(1, Math.floor(Number(row.qty) || 1)), p.estoque),
    })
  }
  return out
}

export default function App() {
  const [auth,     setAuth]     = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [usersError, setUsersError] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [area,     setArea]     = useState('vendas')
  const [screen,   setScreen]   = useState(AREA_DEFAULT_SCREEN.vendas)
  const [produtos, setProdutos] = useState([])
  const [cart,     setCart]     = useState([])
  const [pedidos,  setPedidos]  = useState([])
  const [rankingProdutos, setRankingProdutos] = useState([])
  const [empresa, setEmpresa] = useState(() => loadCompanySettings())
  const [dataReady, setDataReady] = useState(false)
  const [dataLoadError, setDataLoadError] = useState('')
  const [dataRetryKey, setDataRetryKey] = useState(0)
  const [guestScreen, setGuestScreen] = useState('loja')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [guestCatalog, setGuestCatalog] = useState([])
  const [guestCatalogLoading, setGuestCatalogLoading] = useState(true)
  const [guestCatalogError, setGuestCatalogError] = useState('')
  const [guestRetryKey, setGuestRetryKey] = useState(0)
  const [guestCart, setGuestCart] = useState([])
  const [lojaBusca, setLojaBusca] = useState('')

  useEffect(() => {
    warmApi()
    fetchBranding()
      .then((b) => {
        setEmpresa((prev) => ({
          ...prev,
          nomeLoja: b.nomeLoja || prev.nomeLoja,
          logoDataUrl: b.logoDataUrl ?? prev.logoDataUrl,
          vitrine: b.vitrine != null ? mergeVitrine(b.vitrine) : prev.vitrine,
          paginaSobre: b.paginaSobre != null ? mergeAboutPage(b.paginaSobre) : prev.paginaSobre,
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (loginModalOpen) warmApi()
  }, [loginModalOpen])

  useEffect(() => {
    if (auth) return
    let cancelled = false
    setGuestCatalogError('')

    demoModulePromise
      .then((m) => {
        if (!cancelled) {
          setGuestCatalog(m.INITIAL_PRODUCTS)
          setGuestCatalogLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error(e)
          setGuestCatalogError(e.message || 'Falha ao carregar vitrine.')
          setGuestCatalogLoading(false)
        }
      })

    if (!DEMO_MODE) {
      warmApi()
      fetchCatalogProdutos()
        .then((prods) => {
          if (!cancelled && prods?.length) setGuestCatalog(prods)
        })
        .catch((e) => {
          if (!cancelled) console.error(e)
        })
    }

    return () => {
      cancelled = true
    }
  }, [auth, guestRetryKey])

  useEffect(() => {
    if (auth) return
    if (!guestCatalog.length) return
    const raw = readGuestCartLines()
    setGuestCart(hydrateGuestCart(guestCatalog, raw))
  }, [auth, guestCatalog])

  useEffect(() => {
    if (auth) return
    if (!guestCart.length) {
      try {
        sessionStorage.removeItem(GUEST_CART_KEY)
      } catch {
        /* ignore */
      }
      return
    }
    writeGuestCartLines(guestCart)
  }, [auth, guestCart])

  useEffect(() => {
    if (!auth) {
      setDataReady(false)
      setDataLoadError('')
      setDataRetryKey(0)
      return
    }
    let cancelled = false
    setDataReady(false)
    setDataLoadError('')
    if (DEMO_MODE) {
      demoModulePromise
        .then((m) => {
          if (cancelled) return
          setProdutos(m.INITIAL_PRODUCTS)
          setPedidos(m.INITIAL_PEDIDOS)
          setRankingProdutos(m.DEMO_RANKING)
          setDataReady(true)
        })
        .catch((e) => {
          if (!cancelled) {
            console.error(e)
            setDataLoadError(e.message || 'Falha ao carregar dados de demonstracao.')
          }
        })
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const token = auth.token
        const isAdmin = auth.role === 'admin'

        const [prods, emp] = await Promise.all([
          fetchProdutos(token),
          fetchEmpresa(token),
        ])
        if (cancelled) return
        setProdutos(prods)
        setEmpresa({
          ...emp,
          vitrine: mergeVitrine(emp.vitrine),
          paginaSobre: mergeAboutPage(emp.paginaSobre),
        })
        setDataReady(true)

        void fetchPedidos(token)
          .then((peds) => {
            if (!cancelled) setPedidos(peds)
          })
          .catch(() => {})

        void fetchRankingProdutos(token)
          .then((rank) => {
            if (!cancelled) setRankingProdutos(rank)
          })
          .catch(() => {})

        if (isAdmin) {
          void (async () => {
            try {
              setUsersLoading(true)
              setUsersError('')
              const data = await listUsersRequest(token)
              if (!cancelled) setUsuarios(data.users || [])
            } catch (error) {
              if (!cancelled) setUsersError(error.message || 'Falha ao carregar usuarios.')
            } finally {
              if (!cancelled) setUsersLoading(false)
            }
          })()
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          setDataLoadError(e.message || 'Falha ao carregar dados do servidor.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [auth, dataRetryKey])

  const salvarEmpresa = async (dados) => {
    if (!auth?.token) return
    const payload = {
      ...dados,
      vitrine: mergeVitrine(dados?.vitrine),
      paginaSobre: mergeAboutPage(dados?.paginaSobre),
    }
    if (DEMO_MODE) {
      setEmpresa((prev) => ({ ...prev, ...payload }))
      return
    }
    try {
      const merged = await saveEmpresaRequest(auth.token, payload)
      setEmpresa({
        ...merged,
        vitrine: mergeVitrine(merged.vitrine),
        paginaSobre: mergeAboutPage(merged.paginaSobre),
      })
    } catch (e) {
      window.alert(e.message || 'Falha ao salvar configuracoes.')
    }
  }

  const salvarProduto = async (produto) => {
    const isEdit = produtos.some((p) => p.id === produto.id)
    if (DEMO_MODE) {
      const saved = isEdit
        ? { ...produto }
        : { ...produto, id: crypto.randomUUID() }
      setProdutos((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx >= 0) {
          const u = [...prev]
          u[idx] = saved
          return u
        }
        return [...prev, saved]
      })
      return
    }
    try {
      const saved = await saveProdutoRequest(auth.token, produto, isEdit)
      setProdutos((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx >= 0) {
          const u = [...prev]
          u[idx] = saved
          return u
        }
        return [...prev, saved]
      })
    } catch (e) {
      window.alert(e.message || 'Falha ao salvar produto.')
    }
  }

  const excluirProduto = async (id) => {
    if (DEMO_MODE) {
      const used = pedidos.some((p) => p.lineItems?.some((l) => l.produtoId === id))
      if (used) {
        window.alert('Nao e possivel excluir: existem pedidos com este produto.')
        return
      }
      setProdutos((prev) => prev.filter((p) => p.id !== id))
      setCart((prev) => prev.filter((i) => i.produto.id !== id))
      return
    }
    try {
      await deleteProdutoRequest(auth.token, id)
      setProdutos((prev) => prev.filter((p) => p.id !== id))
      setCart((prev) => prev.filter((i) => i.produto.id !== id))
    } catch (e) {
      window.alert(e.message || 'Falha ao excluir produto.')
    }
  }

  const guestAdicionarAoCarrinho = (produto) => {
    setGuestCart((prev) => {
      const ex = prev.find((i) => i.produto.id === produto.id)
      if (ex) {
        return prev.map((i) =>
          i.produto.id === produto.id
            ? { ...i, qty: Math.min(i.qty + 1, produto.estoque) }
            : i
        )
      }
      return [...prev, { produto, qty: 1 }]
    })
    setGuestScreen('carrinho')
  }

  const guestAtualizarQtd = (id, qty) => {
    if (qty <= 0) setGuestCart((prev) => prev.filter((i) => i.produto.id !== id))
    else setGuestCart((prev) => prev.map((i) => (i.produto.id === id ? { ...i, qty } : i)))
  }

  const guestRemoverDoCarrinho = (id) => setGuestCart((prev) => prev.filter((i) => i.produto.id !== id))

  const guestLimparCarrinho = () => setGuestCart([])

  const adicionarAoCarrinho = (produto) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.produto.id === produto.id)
      if (ex) {
        return prev.map((i) =>
          i.produto.id === produto.id
            ? { ...i, qty: Math.min(i.qty + 1, produto.estoque) }
            : i
        )
      }
      return [...prev, { produto, qty: 1 }]
    })
    setScreen('carrinho')
  }

  const atualizarQtd = (id, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.produto.id !== id))
    else setCart((prev) => prev.map((i) => (i.produto.id === id ? { ...i, qty } : i)))
  }

  const removerDoCarrinho = (id) => setCart((prev) => prev.filter((i) => i.produto.id !== id))

  const limparCarrinho = () => setCart([])

  const finalizarPedido = async (payMode) => {
    const items = cart.map((i) => ({ produtoId: i.produto.id, qty: i.qty }))
    if (DEMO_MODE) {
      const { computeDemoRanking } = await import('./demoEmbedded.js')
      const qtyById = new Map()
      for (const it of items) {
        const add = Math.max(0, Math.floor(Number(it.qty) || 0))
        if (!it.produtoId || add <= 0) continue
        qtyById.set(String(it.produtoId), (qtyById.get(String(it.produtoId)) || 0) + add)
      }
      if (qtyById.size === 0) {
        window.alert('Carrinho vazio.')
        throw new Error('Carrinho vazio.')
      }
      const ids = [...qtyById.keys()]
      const pMap = new Map(produtos.map((p) => [p.id, p]))
      for (const id of ids) {
        if (!pMap.has(id)) {
          window.alert('Produto nao encontrado.')
          throw new Error('Produto nao encontrado.')
        }
      }
      for (const [id, q] of qtyById) {
        const row = pMap.get(id)
        if (row.estoque < q) {
          window.alert(`Estoque insuficiente para "${row.nome}".`)
          throw new Error('Estoque insuficiente.')
        }
      }
      let subtotal = 0
      let lucroLinhas = 0
      for (const [id, q] of qtyById) {
        const prod = pMap.get(id)
        subtotal += prod.venda * q
        const c = calcProduto(prod)
        lucroLinhas += q * c.margem
      }
      let desconto = 0
      if (payMode === 'pix') {
        for (const [id, q] of qtyById) {
          const prod = pMap.get(id)
          const c = calcProduto(prod)
          desconto += (prod.venda - c.precoPixFinal) * q
        }
      }
      const round2 = (n) => Math.round(Number(n) * 100) / 100
      const total = round2(subtotal - desconto)
      const itensQtd = [...qtyById.values()].reduce((a, b) => a + b, 0)
      const dataMs = Date.now()
      const lineItems = []
      for (const [id, q] of qtyById) {
        const prod = pMap.get(id)
        lineItems.push({
          produtoId: id,
          qty: q,
          subtotal: round2(prod.venda * q),
        })
      }
      const pedido = {
        id: crypto.randomUUID(),
        data: dataMs,
        cliente: 'Cliente Web',
        pagamento: payMode,
        total,
        desconto: round2(desconto),
        lucroEstimado: round2(lucroLinhas),
        status: 'concluido',
        itens: itensQtd,
        lineItems,
      }
      const nextProdutos = produtos.map((p) => {
        const q = qtyById.get(String(p.id))
        if (!q) return p
        return { ...p, estoque: p.estoque - q }
      })
      setPedidos((prev) => [pedido, ...prev])
      setProdutos(nextProdutos)
      setRankingProdutos(computeDemoRanking(nextProdutos, [pedido, ...pedidos]))
      limparCarrinho()
      return pedido
    }
    try {
      const data = await checkoutPedidoRequest(auth.token, { payMode, items })
      setPedidos((prev) => [data.pedido, ...prev])
      setProdutos(data.produtos)
      try {
        setRankingProdutos(await fetchRankingProdutos(auth.token))
      } catch {
        /* ranking é opcional */
      }
      limparCarrinho()
      return data.pedido
    } catch (e) {
      window.alert(e.message || 'Falha ao finalizar pedido.')
      throw e
    }
  }

  const alternarArea = () => {
    if (auth?.role !== 'admin') return
    setArea((prev) => {
      const nextArea = prev === 'admin' ? 'vendas' : 'admin'
      setScreen(AREA_DEFAULT_SCREEN[nextArea])
      return nextArea
    })
  }

  const irParaPedidosAdmin = () => {
    if (auth?.role !== 'admin') return
    setArea('admin')
    setScreen('pedidos')
  }

  const cartCount  = cart.reduce((s, i) => s + i.qty, 0)
  const alertCount = produtos.filter((p) => p.estoque <= p.minimo).length

  const carregarUsuarios = async (token) => {
    try {
      setUsersLoading(true)
      setUsersError('')
      const data = await listUsersRequest(token)
      setUsuarios(data.users || [])
    } catch (error) {
      setUsersError(error.message || 'Falha ao carregar usuarios.')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleLogin = async (usuario, senha, { onStatus } = {}) => {
    await ensureApiReady({ onStatus })
    onStatus?.('auth')

    const ctrl = new AbortController()
    const loginTimer = window.setTimeout(() => ctrl.abort(), 60_000)
    let data
    try {
      data = await loginRequest(usuario, senha, { signal: ctrl.signal })
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Login demorou demais. Tente novamente.')
      }
      throw e
    } finally {
      window.clearTimeout(loginTimer)
    }

    if (!data?.token || !data?.user) {
      throw new Error(
        'Resposta invalida do servidor. No Render (Static Site): (1) Environment -> VITE_API_BASE_URL = URL publica da API, sem barra no final, e redeploy; OU (2) Redirects/Rewrites -> Rewrite: Source /api/* -> Destination https://SUA-API.onrender.com/api/*'
      )
    }
    const u = data.user
    const nextAuth = {
      token: data.token,
      userName: u.nome || u.usuario,
      role: u.role,
    }
    try {
      sessionStorage.removeItem(GUEST_CART_KEY)
    } catch {
      /* ignore */
    }
    setGuestCart([])
    setLoginModalOpen(false)
    setGuestScreen('loja')
    if (guestCatalog.length) setProdutos(guestCatalog)
    setAuth(nextAuth)
    const nextArea = u.role === 'admin' ? 'admin' : 'vendas'
    setArea(nextArea)
    setScreen(AREA_DEFAULT_SCREEN[nextArea])
  }

  const handleRegister = async (nome, usuario, senha) => {
    await registerRequest(nome, usuario, senha)
  }

  const handleResetUserPassword = async (userId, novaSenha) => {
    if (!auth?.token) throw new Error('Sessao invalida.')
    await resetUserPasswordRequest(auth.token, userId, novaSenha)
  }

  const handleDeleteUser = async (userId) => {
    if (!auth?.token) return
    await deleteUserRequest(auth.token, userId)
    await carregarUsuarios(auth.token)
  }

  const handleLogout = async () => {
    if (auth?.token) {
      try {
        await logoutRequest(auth.token)
      } catch {
        // Logout local segue mesmo com falha remota.
      }
    }
    setAuth(null)
    setUsuarios([])
    setUsersError('')
    setProdutos([])
    setPedidos([])
    setRankingProdutos([])
    setDataLoadError('')
    setDataRetryKey(0)
    setArea('vendas')
    setScreen(AREA_DEFAULT_SCREEN.vendas)
    setCart([])
  }

  const renderScreen = () => {
    const fallback = (
      <div className="alert alert-info" role="status" style={{ margin: '0 0 16px' }}>
        Carregando módulo…
      </div>
    )

    if (area === 'admin') {
      switch (screen) {
        case 'dashboard':
          return (
            <Suspense fallback={fallback}>
              <Dashboard produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos} onNav={setScreen}/>
            </Suspense>
          )
        case 'pedidos':
          return (
            <Suspense fallback={fallback}>
              <Pedidos pedidos={pedidos}/>
            </Suspense>
          )
        case 'produtos':
          return (
            <Suspense fallback={fallback}>
              <Produtos produtos={produtos} onSave={salvarProduto} onDelete={excluirProduto}/>
            </Suspense>
          )
        case 'relatorios':
          return (
            <Suspense fallback={fallback}>
              <Relatorios produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos}/>
            </Suspense>
          )
        case 'config':
          return (
            <Suspense fallback={fallback}>
              <Config
                initialTab="geral"
                empresa={empresa}
                onSaveEmpresa={salvarEmpresa}
                usuarios={usuarios}
                usersLoading={usersLoading}
                usersError={usersError}
                onRefreshUsers={() => carregarUsuarios(auth.token)}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
              />
            </Suspense>
          )
        case 'credenciais':
          return (
            <Suspense fallback={fallback}>
              <Config
                initialTab="credenciais"
                empresa={empresa}
                onSaveEmpresa={salvarEmpresa}
                usuarios={usuarios}
                usersLoading={usersLoading}
                usersError={usersError}
                onRefreshUsers={() => carregarUsuarios(auth.token)}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
              />
            </Suspense>
          )
        default:
          return (
            <Suspense fallback={fallback}>
              <Dashboard produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos} onNav={setScreen}/>
            </Suspense>
          )
      }
    }

    switch (screen) {
      case 'loja':
        return (
          <Loja
            vitrineAmazon
            produtos={produtos}
            empresa={empresa}
            busca={lojaBusca}
            onBuscaChange={setLojaBusca}
            onAddCart={adicionarAoCarrinho}
          />
        )
      case 'carrinho':
        return (
          <Carrinho
            cart={cart}
            onQty={atualizarQtd}
            onRemove={removerDoCarrinho}
            onClear={limparCarrinho}
            onCheckout={finalizarPedido}
            onViewOrders={irParaPedidosAdmin}
            onNav={setScreen}
            guestMode={false}
          />
        )
      case 'sobre':
        return <SobreEmpresa vitrineAmazon empresa={empresa} />
      default:
        return (
          <Loja
            vitrineAmazon
            produtos={produtos}
            empresa={empresa}
            busca={lojaBusca}
            onBuscaChange={setLojaBusca}
            onAddCart={adicionarAoCarrinho}
          />
        )
    }
  }

  const activeIsValid = area === 'admin'
    ? ADMIN_SCREENS.has(screen)
    : SALES_SCREENS.has(screen)
  const activeScreen = activeIsValid ? screen : AREA_DEFAULT_SCREEN[area]

  useEffect(() => {
    if (!auth || auth.role !== 'admin') return
    if (screen !== 'config' && screen !== 'credenciais') return
    if (usersLoading || usuarios.length) return
    carregarUsuarios(auth.token)
  }, [auth, screen, usersLoading, usuarios.length])

  if (!auth) {
    const guestShell = {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      boxSizing: 'border-box',
      background: 'var(--body-bg, #F5F0EA)',
      fontSize: 16,
      color: 'var(--text, #231F20)',
    }
    if (guestCatalogError && !guestCatalog.length) {
      return (
        <div style={guestShell}>
          <div className="alert alert-danger" style={{ maxWidth: 520, width: '100%' }} role="alert">
            {guestCatalogError}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setGuestRetryKey((k) => k + 1)}>
            Tentar novamente
          </button>
        </div>
      )
    }
    const guestCartCount = guestCart.reduce((s, i) => s + i.qty, 0)
    return (
      <>
        <Layout
          storefrontMode
          guestMode
          onOpenLogin={() => setLoginModalOpen(true)}
          active={guestScreen}
          area="vendas"
          onNav={setGuestScreen}
          onLogout={() => {}}
          userName=""
          canSwitchArea={false}
          cartCount={guestCartCount}
          alertCount={0}
          empresa={empresa}
          storeSearch={
            guestScreen === 'loja'
              ? {
                  value: lojaBusca,
                  onChange: setLojaBusca,
                  produtos: guestCatalog,
                  onNavigateLoja: () => setGuestScreen('loja'),
                }
              : null
          }
        >
          {guestScreen === 'loja' ? (
            <>
              {guestCatalogLoading && guestCatalog.length === 0 && (
                <div className="alert alert-info" role="status" style={{ margin: '0 0 12px' }}>
                  Carregando vitrine…
                </div>
              )}
              <Loja
                vitrineAmazon
                produtos={guestCatalog}
                empresa={empresa}
                busca={lojaBusca}
                onBuscaChange={setLojaBusca}
                onAddCart={guestAdicionarAoCarrinho}
              />
            </>
          ) : guestScreen === 'sobre' ? (
            <SobreEmpresa vitrineAmazon empresa={empresa} />
          ) : (
            <Carrinho
              guestMode
              onRequestLogin={() => setLoginModalOpen(true)}
              cart={guestCart}
              onQty={guestAtualizarQtd}
              onRemove={guestRemoverDoCarrinho}
              onClear={guestLimparCarrinho}
              onCheckout={async () => {}}
              onViewOrders={() => {}}
              onNav={setGuestScreen}
            />
          )}
        </Layout>
        {loginModalOpen && (
          <Modal title="Acesso à conta" onClose={() => setLoginModalOpen(false)} size="lg">
            <Login
              embedded
              onLogin={handleLogin}
              onRegister={handleRegister}
              onAdminModalOpen={warmApi}
              empresa={empresa}
            />
          </Modal>
        )}
      </>
    )
  }

  const authenticatedContent = dataLoadError ? (
    <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <div className="alert alert-danger" role="alert">
        {dataLoadError}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDataRetryKey((k) => k + 1)}
        >
          Tentar novamente
        </button>
        <button type="button" className="btn btn-default" onClick={() => void handleLogout()}>
          Sair
        </button>
      </div>
    </div>
  ) : (
    <>
      {!dataReady && (
        <div className="alert alert-info" role="status" style={{ margin: '0 0 16px' }}>
          Carregando dados do servidor…
        </div>
      )}
      {renderScreen()}
    </>
  )

  return (
    <Layout
      storefrontMode={area === 'vendas'}
      active={activeScreen}
      area={area}
      onSwitchArea={alternarArea}
      onNav={setScreen}
      onLogout={handleLogout}
      userName={auth.userName}
      canSwitchArea={auth.role === 'admin'}
      cartCount={cartCount}
      alertCount={alertCount}
      empresa={empresa}
      storeSearch={
        area === 'vendas' && activeScreen === 'loja'
          ? {
              value: lojaBusca,
              onChange: setLojaBusca,
              produtos,
              onNavigateLoja: () => setScreen('loja'),
            }
          : null
      }
    >
      {authenticatedContent}
    </Layout>
  )
}
