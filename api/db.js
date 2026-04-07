import pg from 'pg'

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://comprafacil:comprafacil_secret@localhost:5432/comprafacil'

/**
 * Render, RDS, etc.: Postgres gerenciado costuma exigir TLS.
 * Localhost / container `postgres` na rede Docker: sem SSL.
 * DATABASE_SSL=true|false força o comportamento (útil em casos especiais).
 */
function buildPoolConfig() {
  const config = {
    connectionString,
    max: 15,
    idleTimeoutMillis: 30_000,
  }

  if (process.env.DATABASE_SSL === 'false') {
    return config
  }
  if (process.env.DATABASE_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false }
    return config
  }

  if (!process.env.DATABASE_URL) {
    return config
  }

  try {
    const u = new URL(connectionString)
    const host = u.hostname
    const local = host === 'localhost' || host === '127.0.0.1' || host === 'postgres'
    if (!local) {
      config.ssl = { rejectUnauthorized: false }
    }
  } catch {
    // connectionString inválida: deixa o Pool falhar depois com mensagem clara
  }

  return config
}

export const pool = new Pool(buildPoolConfig())

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'vendas',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    categoria TEXT NOT NULL,
    unidade TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '📦',
    compra NUMERIC(14,4) NOT NULL,
    venda NUMERIC(14,4) NOT NULL,
    tributo NUMERIC(12,4) NOT NULL,
    operacional NUMERIC(12,4) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    minimo INTEGER NOT NULL DEFAULT 0,
    pix_desconto NUMERIC(12,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    data_ms BIGINT NOT NULL,
    cliente TEXT NOT NULL,
    pagamento TEXT NOT NULL,
    total NUMERIC(14,4) NOT NULL,
    desconto NUMERIC(14,4) NOT NULL DEFAULT 0,
    lucro_estimado NUMERIC(14,4) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'concluido',
    itens_qtd INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL,
    preco_unit NUMERIC(14,4) NOT NULL,
    subtotal NUMERIC(14,4) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS empresa_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
  )`,
]

export async function migrate() {
  for (const sql of MIGRATIONS) {
    await pool.query(sql)
  }
}
