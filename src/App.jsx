import React, { useEffect, useState } from 'react'
import Layout           from './components/Layout'
import Dashboard        from './pages/Dashboard'
import Loja             from './pages/Loja'
import Carrinho         from './pages/Carrinho'
import Pedidos          from './pages/Pedidos'
import Produtos         from './pages/Produtos'
import Relatorios       from './pages/Relatorios'
import Config           from './pages/Config'
import Login            from './pages/Login'
import { loadCompanySettings } from './utils/companySettings'
import {
  listUsersRequest,
  loginRequest,
  logoutRequest,
  resetUserPasswordRequest,
  registerRequest,
} from './services/authApi'
import {
  fetchBranding,
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

const DEMO_MODE =
  import.meta.env.VITE_DEMO_DATA === 'true' || import.meta.env.VITE_DEMO_DATA === '1'

const AREA_DEFAULT_SCREEN = {
  admin: 'dashboard',
  vendas: 'loja',
}

const ADMIN_SCREENS = new Set(['dashboard', 'pedidos', 'produtos', 'relatorios', 'config', 'credenciais'])
const SALES_SCREENS = new Set(['loja', 'carrinho'])

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

  useEffect(() => {
    fetchBranding()
      .then((b) => {
        setEmpresa((prev) => ({
          ...prev,
          nomeLoja: b.nomeLoja || prev.nomeLoja,
          logoDataUrl: b.logoDataUrl ?? prev.logoDataUrl,
        }))
      })
      .catch(() => {})
  }, [])

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
      import('./demoEmbedded.js')
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
        const [prods, peds, rank, emp] = await Promise.all([
          fetchProdutos(auth.token),
          fetchPedidos(auth.token),
          fetchRankingProdutos(auth.token),
          fetchEmpresa(auth.token),
        ])
        if (!cancelled) {
          setProdutos(prods)
          setPedidos(peds)
          setRankingProdutos(rank)
          setEmpresa(emp)
          setDataReady(true)
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
    if (DEMO_MODE) {
      setEmpresa((prev) => ({ ...prev, ...dados }))
      return
    }
    try {
      const merged = await saveEmpresaRequest(auth.token, dados)
      setEmpresa(merged)
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

  const handleLogin = async (usuario, senha) => {
    const data = await loginRequest(usuario, senha)
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
    setAuth(nextAuth)
    const nextArea = u.role === 'admin' ? 'admin' : 'vendas'
    setArea(nextArea)
    setScreen(AREA_DEFAULT_SCREEN[nextArea])
    if (u.role === 'admin') await carregarUsuarios(data.token)
  }

  const handleRegister = async (nome, usuario, senha) => {
    await registerRequest(nome, usuario, senha)
  }

  const handleResetUserPassword = async (userId, novaSenha) => {
    if (!auth?.token) throw new Error('Sessao invalida.')
    await resetUserPasswordRequest(auth.token, userId, novaSenha)
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
    if (area === 'admin') {
      switch (screen) {
        case 'dashboard':
          return <Dashboard produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos} onNav={setScreen}/>
        case 'pedidos':
          return <Pedidos pedidos={pedidos}/>
        case 'produtos':
          return <Produtos produtos={produtos} onSave={salvarProduto} onDelete={excluirProduto}/>
        case 'relatorios':
          return <Relatorios produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos}/>
        case 'config':
          return (
            <Config
              initialTab="geral"
              empresa={empresa}
              onSaveEmpresa={salvarEmpresa}
              usuarios={usuarios}
              usersLoading={usersLoading}
              usersError={usersError}
              onRefreshUsers={() => carregarUsuarios(auth.token)}
              onResetUserPassword={handleResetUserPassword}
            />
          )
        case 'credenciais':
          return (
            <Config
              initialTab="credenciais"
              empresa={empresa}
              onSaveEmpresa={salvarEmpresa}
              usuarios={usuarios}
              usersLoading={usersLoading}
              usersError={usersError}
              onRefreshUsers={() => carregarUsuarios(auth.token)}
              onResetUserPassword={handleResetUserPassword}
            />
          )
        default:
          return <Dashboard produtos={produtos} pedidos={pedidos} rankingProdutos={rankingProdutos} onNav={setScreen}/>
      }
    }

    switch (screen) {
      case 'loja':
        return <Loja produtos={produtos} onAddCart={adicionarAoCarrinho}/>
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
          />
        )
      default:
        return <Loja produtos={produtos} onAddCart={adicionarAoCarrinho}/>
    }
  }

  const activeIsValid = area === 'admin'
    ? ADMIN_SCREENS.has(screen)
    : SALES_SCREENS.has(screen)
  const activeScreen = activeIsValid ? screen : AREA_DEFAULT_SCREEN[area]

  useEffect(() => {
    if (!auth || auth.role !== 'admin') return
    if (screen !== 'config') return
    carregarUsuarios(auth.token)
  }, [auth, screen])

  if (!auth) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
        empresa={empresa}
      />
    )
  }

  if (!dataReady) {
    const shellStyle = {
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
    if (dataLoadError) {
      return (
        <div style={shellStyle}>
          <div
            className="alert alert-danger"
            style={{ maxWidth: 520, width: '100%' }}
            role="alert"
          >
            {dataLoadError}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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
      )
    }
    return (
      <div style={shellStyle}>
        Carregando dados do servidor…
      </div>
    )
  }

  return (
    <Layout
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
    >
      {renderScreen()}
    </Layout>
  )
}
