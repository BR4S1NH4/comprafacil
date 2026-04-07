import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { pool, migrate } from './db.js'
import { calcProduto } from './calc.js'

const app = express()
const PORT = process.env.PORT || 3001

const RESERVED_ADMIN_USERS = new Set(['TIAGO GABRIEL', 'ISRAEL'])

const DEFAULT_EMPRESA = {
  nomeLoja: 'Castor Construtor',
  razaoSocial: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: 'AM',
  logoDataUrl: null,
  pixPadrao: 10,
  tributosPadrao: 8,
  operacionalPadrao: 7,
  estoqueMinPadrao: 10,
  alertaEstoque: true,
  confirmarExclusao: true,
}

function normalizeUser(value) {
  return String(value || '').trim().toUpperCase()
}

function rowToProduto(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    descricao: row.descricao || '',
    categoria: row.categoria,
    unidade: row.unidade,
    emoji: row.emoji,
    compra: Number(row.compra),
    venda: Number(row.venda),
    tributo: Number(row.tributo),
    operacional: Number(row.operacional),
    estoque: row.estoque,
    minimo: row.minimo,
    pixDesconto: Number(row.pix_desconto),
  }
}

function rowToPedido(row) {
  return {
    id: row.id,
    data: Number(row.data_ms),
    cliente: row.cliente,
    pagamento: row.pagamento,
    total: Number(row.total),
    desconto: Number(row.desconto),
    lucroEstimado: Number(row.lucro_estimado),
    status: row.status,
    itens: row.itens_qtd,
  }
}

function mergeEmpresa(payload) {
  return { ...DEFAULT_EMPRESA, ...(payload && typeof payload === 'object' ? payload : {}) }
}

const sessions = new Map()

app.use(cors())
app.use(express.json({ limit: '4mb' }))

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Nao autenticado.' })
  }
  req.user = sessions.get(token)
  next()
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso permitido apenas para admin.' })
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'postgresql' })
})

app.get('/api/branding', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT payload FROM empresa_config WHERE id = 1')
    const merged = mergeEmpresa(rows[0]?.payload)
    res.json({
      nomeLoja: merged.nomeLoja,
      logoDataUrl: merged.logoDataUrl,
    })
  } catch (e) {
    console.error(e)
    res.json({
      nomeLoja: DEFAULT_EMPRESA.nomeLoja,
      logoDataUrl: null,
    })
  }
})

app.get('/api/empresa', authenticate, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT payload FROM empresa_config WHERE id = 1')
    res.json(mergeEmpresa(rows[0]?.payload))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao carregar empresa.' })
  }
})

app.put('/api/empresa', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const merged = mergeEmpresa(body)
    await pool.query(
      `INSERT INTO empresa_config (id, payload) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
      [JSON.stringify(merged)]
    )
    res.json(merged)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao salvar empresa.' })
  }
})

app.get('/api/produtos', authenticate, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY nome')
    res.json({ produtos: rows.map(rowToProduto) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao listar produtos.' })
  }
})

app.post('/api/produtos', authenticate, requireAdmin, async (req, res) => {
  const p = req.body
  if (!p?.codigo || !p?.nome) return res.status(400).json({ error: 'Codigo e nome obrigatorios.' })
  const id = p.id && String(p.id).length > 10 ? p.id : crypto.randomUUID()
  try {
    await pool.query(
      `INSERT INTO produtos (
        id, codigo, nome, descricao, categoria, unidade, emoji,
        compra, venda, tributo, operacional, estoque, minimo, pix_desconto
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        String(p.codigo).trim().toUpperCase(),
        String(p.nome).trim(),
        String(p.descricao || '').trim(),
        String(p.categoria || 'Estrutura'),
        String(p.unidade || 'unidade'),
        String(p.emoji || '📦'),
        Number(p.compra),
        Number(p.venda),
        Number(p.tributo) || 0,
        Number(p.operacional) || 0,
        Math.max(0, Math.floor(Number(p.estoque) || 0)),
        Math.max(0, Math.floor(Number(p.minimo) || 0)),
        Number(p.pixDesconto) || 0,
      ]
    )
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [id])
    res.status(201).json(rowToProduto(rows[0]))
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Codigo ja cadastrado.' })
    console.error(e)
    res.status(500).json({ error: 'Falha ao criar produto.' })
  }
})

app.put('/api/produtos/:id', authenticate, requireAdmin, async (req, res) => {
  const id = req.params.id
  const p = req.body
  try {
    const { rowCount } = await pool.query(
      `UPDATE produtos SET
        codigo = $2, nome = $3, descricao = $4, categoria = $5, unidade = $6, emoji = $7,
        compra = $8, venda = $9, tributo = $10, operacional = $11, estoque = $12, minimo = $13, pix_desconto = $14,
        updated_at = NOW()
      WHERE id = $1::uuid`,
      [
        id,
        String(p.codigo).trim().toUpperCase(),
        String(p.nome).trim(),
        String(p.descricao || '').trim(),
        String(p.categoria || 'Estrutura'),
        String(p.unidade || 'unidade'),
        String(p.emoji || '📦'),
        Number(p.compra),
        Number(p.venda),
        Number(p.tributo) || 0,
        Number(p.operacional) || 0,
        Math.max(0, Math.floor(Number(p.estoque) || 0)),
        Math.max(0, Math.floor(Number(p.minimo) || 0)),
        Number(p.pixDesconto) || 0,
      ]
    )
    if (!rowCount) return res.status(404).json({ error: 'Produto nao encontrado.' })
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1::uuid', [id])
    res.json(rowToProduto(rows[0]))
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Codigo ja cadastrado.' })
    console.error(e)
    res.status(500).json({ error: 'Falha ao atualizar produto.' })
  }
})

app.delete('/api/produtos/:id', authenticate, requireAdmin, async (req, res) => {
  const id = req.params.id
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM pedido_itens WHERE produto_id = $1::uuid LIMIT 1`,
      [id]
    )
    if (rows.length) {
      return res.status(409).json({ error: 'Nao e possivel excluir: existem pedidos com este produto.' })
    }
    const { rowCount } = await pool.query('DELETE FROM produtos WHERE id = $1::uuid', [id])
    if (!rowCount) return res.status(404).json({ error: 'Produto nao encontrado.' })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao excluir produto.' })
  }
})

app.get('/api/pedidos', authenticate, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pedidos ORDER BY id DESC LIMIT 5000'
    )
    res.json({ pedidos: rows.map(rowToPedido) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao listar pedidos.' })
  }
})

app.get('/api/relatorios/ranking-produtos', authenticate, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pi.produto_id::text AS id,
             p.nome,
             COALESCE(NULLIF(TRIM(p.emoji), ''), '📦') AS emoji,
             COALESCE(SUM(pi.qty), 0)::int AS qtd,
             COALESCE(SUM(pi.subtotal), 0)::numeric AS faturamento
      FROM pedido_itens pi
      INNER JOIN produtos p ON p.id = pi.produto_id
      GROUP BY pi.produto_id, p.nome, p.emoji
      ORDER BY SUM(pi.subtotal) DESC NULLS LAST
      LIMIT 50
    `)
    res.json({
      ranking: rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        emoji: r.emoji,
        qtd: r.qtd,
        faturamento: Number(r.faturamento),
      })),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Falha ao carregar ranking de produtos.' })
  }
})

app.post('/api/pedidos/checkout', authenticate, async (req, res) => {
  const payMode = req.body?.payMode === 'pix' ? 'pix' : 'cartao'
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : []
  const qtyById = new Map()
  for (const it of rawItems) {
    const pid = it?.produtoId
    const add = Math.max(0, Math.floor(Number(it?.qty) || 0))
    if (!pid || add <= 0) continue
    qtyById.set(String(pid), (qtyById.get(String(pid)) || 0) + add)
  }
  if (qtyById.size === 0) {
    return res.status(400).json({ error: 'Carrinho vazio.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ids = [...qtyById.keys()]
    const { rows: locked } = await client.query(
      `SELECT * FROM produtos WHERE id = ANY($1::uuid[]) FOR UPDATE`,
      [ids]
    )
    if (locked.length !== ids.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Produto nao encontrado.' })
    }
    const pMap = new Map(locked.map((r) => [r.id, r]))

    for (const [id, q] of qtyById) {
      const row = pMap.get(id)
      if (row.estoque < q) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Estoque insuficiente para "${row.nome}".` })
      }
    }

    let subtotal = 0
    let lucroLinhas = 0
    for (const [id, q] of qtyById) {
      const row = pMap.get(id)
      const prod = rowToProduto(row)
      subtotal += prod.venda * q
      const c = calcProduto(prod)
      lucroLinhas += q * c.margem
    }

    let desconto = 0
    if (payMode === 'pix') {
      for (const [id, q] of qtyById) {
        const prod = rowToProduto(pMap.get(id))
        const c = calcProduto(prod)
        desconto += (prod.venda - c.precoPixFinal) * q
      }
    }
    const total = subtotal - desconto
    const itensQtd = [...qtyById.values()].reduce((a, b) => a + b, 0)
    const dataMs = Date.now()

    const ins = await client.query(
      `INSERT INTO pedidos (data_ms, cliente, pagamento, total, desconto, lucro_estimado, status, itens_qtd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [dataMs, 'Cliente Web', payMode, total, desconto, lucroLinhas, 'concluido', itensQtd]
    )
    const pedidoId = ins.rows[0].id

    for (const [id, q] of qtyById) {
      const row = pMap.get(id)
      const unit = Number(row.venda)
      const sub = unit * q
      await client.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, qty, preco_unit, subtotal)
         VALUES ($1, $2::uuid, $3, $4, $5)`,
        [pedidoId, id, q, unit, sub]
      )
      await client.query(`UPDATE produtos SET estoque = estoque - $1, updated_at = NOW() WHERE id = $2::uuid`, [
        q,
        id,
      ])
    }

    await client.query('COMMIT')

    const { rows: pedRows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId])
    const { rows: prodRows } = await pool.query('SELECT * FROM produtos ORDER BY nome')

    res.json({
      pedido: rowToPedido(pedRows[0]),
      produtos: prodRows.map(rowToProduto),
    })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(e)
    res.status(500).json({ error: e.message || 'Falha ao finalizar pedido.' })
  } finally {
    client.release()
  }
})

app.post('/api/auth/register', async (req, res) => {
  const nome = String(req.body?.nome || '').trim()
  const usuario = normalizeUser(req.body?.usuario)
  const senha = String(req.body?.senha || '')

  if (nome.length < 3) return res.status(400).json({ error: 'Nome invalido.' })
  if (usuario.length < 3) return res.status(400).json({ error: 'Usuario invalido.' })
  if (senha.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' })
  if (RESERVED_ADMIN_USERS.has(usuario)) {
    return res.status(403).json({ error: 'Usuario reservado para administracao.' })
  }

  const hash = bcrypt.hashSync(senha, 10)
  try {
    await pool.query(
      `INSERT INTO users (nome, usuario, senha_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW())`,
      [nome, usuario, hash, 'vendas']
    )
    res.status(201).json({ ok: true, message: 'Conta criada com sucesso.' })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Usuario ja existe.' })
    console.error(e)
    res.status(500).json({ error: 'Falha ao registrar.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const usuario = normalizeUser(req.body?.usuario)
  const senha = String(req.body?.senha || '')

  if (!usuario || !senha) return res.status(400).json({ error: 'Informe usuario e senha.' })

  const { rows } = await pool.query(
    'SELECT id, nome, usuario, senha_hash, role FROM users WHERE usuario = $1',
    [usuario]
  )
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Usuario ou senha invalidos.' })

  const ok = bcrypt.compareSync(senha, user.senha_hash)
  if (!ok) return res.status(401).json({ error: 'Usuario ou senha invalidos.' })

  const token = crypto.randomUUID()
  sessions.set(token, { id: user.id, nome: user.nome, usuario: user.usuario, role: user.role })

  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      role: user.role,
    },
  })
})

app.post('/api/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) sessions.delete(token)
  res.json({ ok: true })
})

app.get('/api/users', authenticate, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, usuario, role, created_at AS "createdAt" FROM users ORDER BY id DESC'
  )
  res.json({ users: rows })
})

app.patch('/api/users/:id/password', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  const novaSenha = String(req.body?.novaSenha || '')
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Usuario invalido.' })
  if (novaSenha.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' })

  const { rowCount } = await pool.query('UPDATE users SET senha_hash = $1 WHERE id = $2', [
    bcrypt.hashSync(novaSenha, 10),
    id,
  ])
  if (!rowCount) return res.status(404).json({ error: 'Usuario nao encontrado.' })
  res.json({ ok: true, message: 'Senha redefinida com sucesso.' })
})

function upsertAdminUser({ nome, usuario, senha }) {
  const adminUser = normalizeUser(usuario)
  const adminName = String(nome || '').trim() || adminUser
  const adminPwd = String(senha || '')
  const hash = bcrypt.hashSync(adminPwd, 10)
  // Nao atualizar senha_hash em conflito: senhas alteradas pelo admin em Configuracoes
  // devem persistir apos reinicio da API (antes, o seed sobrescrevia a cada boot).
  return pool.query(
    `INSERT INTO users (nome, usuario, senha_hash, role, created_at)
     VALUES ($1, $2, $3, 'admin', NOW())
     ON CONFLICT (usuario) DO UPDATE SET nome = EXCLUDED.nome, role = 'admin'`,
    [adminName, adminUser, hash]
  )
}

async function seedAdmins() {
  await upsertAdminUser({ nome: 'TIAGO GABRIEL', usuario: 'TIAGO GABRIEL', senha: '123456789' })
  await upsertAdminUser({ nome: 'ISRAEL', usuario: 'ISRAEL', senha: 'ISRAEL PAIA' })
}

async function seedEmpresaIfEmpty() {
  await pool.query(
    `INSERT INTO empresa_config (id, payload) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(DEFAULT_EMPRESA)]
  )
}

app.use((req, res) => {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.path}` })
})

async function main() {
  await migrate()
  await seedAdmins()
  await seedEmpresaIfEmpty()
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT} (PostgreSQL)`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
