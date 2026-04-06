/**
 * Popula o banco com 150 produtos e muitas vendas de demonstração
 * (material de construção), distribuídas em semanas, meses e anos.
 *
 * Uso: node seed-demo.js
 * Requer DATABASE_URL ou padrão em db.js (PostgreSQL).
 */
const NUM_VENDAS = 1500
import { pool, migrate } from './db.js'
import { calcProduto } from './calc.js'
import crypto from 'node:crypto'

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1))
}

/** Lista base: [nome, descricao, categoria, unidade, emoji, precoCompra] */
const RAW_PRODUTOS = [
  // Cimento, cal e argamassa
  ['Cimento CP-II-E-32 50kg', 'Saco para concreto e estruturas', 'Cimento e cal', 'saco', '🏗️', 38.9],
  ['Cimento CP-IV-32 50kg', 'Alta resistência inicial', 'Cimento e cal', 'saco', '🏗️', 42.5],
  ['Cal hidratado CH-III 20kg', 'Para reboco e assentamento', 'Cimento e cal', 'saco', '🧱', 18.5],
  ['Argamassa AC-III 20kg', 'Assentamento cerâmica', 'Argamassa', 'saco', '🧱', 24.9],
  ['Argamassa AC-II 20kg', 'Uso geral interno', 'Argamassa', 'saco', '🧱', 21.5],
  ['Argamassa colante flexível 20kg', 'Porcelanato e grandes formatos', 'Argamassa', 'saco', '🧱', 48.9],
  ['Rejunte flexível 1kg cinza', 'Antimofo', 'Argamassa', 'un', '🧱', 8.9],
  ['Argamassa para drywall 25kg', 'Colagem de placas', 'Argamassa', 'saco', '🧱', 36.5],
  ['Gesso em pó 40kg', 'Moldagem e correção', 'Cimento e cal', 'saco', '🏗️', 52.0],
  // Agregados
  ['Areia média m³', 'Britagem lavada', 'Agregados', 'm³', '🏖️', 95.0],
  ['Areia fina m³', 'Reboco e contrapiso', 'Agregados', 'm³', '🏖️', 88.0],
  ['Brita 1 m³', 'Concreto e base', 'Agregados', 'm³', '⛰️', 120.0],
  ['Brita 2 m³', 'Drenagem', 'Agregados', 'm³', '⛰️', 115.0],
  ['Pedrisco m³', 'Contrapiso', 'Agregados', 'm³', '⛰️', 98.0],
  ['Areia ensacada 20kg', 'Pequenas obras', 'Agregados', 'saco', '🏖️', 12.5],
  ['Saibro m³', 'Regularização', 'Agregados', 'm³', '🏖️', 72.0],
  // Ferro e estrutura
  ['Vergalhão CA-50 10mm (barra 12m)', 'Ferro para laje', 'Ferro e aço', 'barra', '🔩', 58.0],
  ['Vergalhão CA-50 12,5mm (barra 12m)', 'Pilares', 'Ferro e aço', 'barra', '🔩', 89.0],
  ['Vergalhão CA-50 16mm (barra 12m)', 'Estrutura principal', 'Ferro e aço', 'barra', '🔩', 142.0],
  ['Arame recozido 18 BWG rolo', 'Amarração', 'Ferro e aço', 'rolo', '🔩', 42.0],
  ['Tela soldada Q-188 2,5x6m', 'Laje e piso', 'Ferro e aço', 'un', '🔩', 118.0],
  ['Tela soldada Q-251 2,5x6m', 'Reforço pesado', 'Ferro e aço', 'un', '🔩', 156.0],
  ['Cantoneira 2x1/8 6m', 'Reforço metálico', 'Ferro e aço', 'barra', '🔩', 95.0],
  ['Chapa galvanizada 2x1,20m 24', 'Cobertura leve', 'Ferro e aço', 'chapa', '🔩', 185.0],
  ['Perfil U enrijecido 100mm 6m', 'Estrutura metálica', 'Ferro e aço', 'barra', '🔩', 210.0],
  ['Perfil W 150 6m', 'Sarrafos metálicos', 'Ferro e aço', 'barra', '🔩', 380.0],
  ['Prego 18x27 kg', 'Carpintaria', 'Ferro e aço', 'kg', '🔩', 8.9],
  ['Parafuso sextavado 5/16x2 (100un)', 'Fixação', 'Ferro e aço', 'caixa', '🔩', 28.0],
  // Madeira
  ['Caibro 6x12 6m', 'Estrutura telhado', 'Madeira', 'un', '🪵', 42.0],
  ['Caibro 5x10 6m', 'Divisórias', 'Madeira', 'un', '🪵', 32.0],
  ['Ripa 1x5 3m', 'Telhado', 'Madeira', 'un', '🪵', 9.5],
  ['Sarrafo 5x5 3m', 'Forma e escora', 'Madeira', 'un', '🪵', 14.0],
  ['Compensado naval 15mm 2,20x1,10', 'Forma e móveis', 'Madeira', 'chapa', '🪵', 165.0],
  ['Compensado 10mm 2,20x1,10', 'Divisórias', 'Madeira', 'chapa', '🪵', 98.0],
  ['OSB 11mm 2,44x1,22', 'Drywall e fechamento', 'Madeira', 'chapa', '🪵', 112.0],
  ['Porta de madeira 80cm esquerda', 'Interna', 'Madeira', 'un', '🚪', 185.0],
  ['Batente 14cm par', 'Completo', 'Madeira', 'par', '🚪', 95.0],
  ['Mão francesa 30cm', 'Prateleira', 'Madeira', 'un', '🪵', 12.9],
  // Hidráulica PVC
  ['Tubo PVC soldável 25mm 6m', 'Água fria', 'Hidráulica', 'barra', '🔧', 28.5],
  ['Tubo PVC soldável 32mm 6m', 'Água fria', 'Hidráulica', 'barra', '🔧', 38.9],
  ['Tubo PVC soldável 50mm 6m', 'Esgoto', 'Hidráulica', 'barra', '🔧', 52.0],
  ['Tubo PVC esgoto 100mm 6m', 'Esgoto principal', 'Hidráulica', 'barra', '🔧', 68.0],
  ['Joelho 90° soldável 25mm', 'Conexão', 'Hidráulica', 'un', '🔧', 2.8],
  ['Joelho 90° soldável 32mm', 'Conexão', 'Hidráulica', 'un', '🔧', 4.2],
  ['Tê soldável 25mm', 'Derivação', 'Hidráulica', 'un', '🔧', 4.5],
  ['Luva de correr 25mm', 'Reparo', 'Hidráulica', 'un', '🔧', 5.9],
  ['Registro de gaveta 25mm', 'Controle', 'Hidráulica', 'un', '🔧', 32.0],
  ['Registro de pressão 25mm', 'Pressão', 'Hidráulica', 'un', '🔧', 28.0],
  ['Caixa sifonada 100x100x50', 'Esgoto piso', 'Hidráulica', 'un', '🔧', 45.0],
  ['Curva longa esgoto 100mm', 'Esgoto', 'Hidráulica', 'un', '🔧', 12.5],
  // Metais e torneiras
  ['Torneira de jardim 1/2 metal', 'Externa', 'Metais', 'un', '🚰', 24.9],
  ['Torneira de cozinha parede', 'Bica móvel', 'Metais', 'un', '🚰', 89.0],
  ['Torneira lavatório mesa', 'Banheiro', 'Metais', 'un', '🚰', 65.0],
  ['Chuveiro elétrico 220V 7500W', 'Banho', 'Metais', 'un', '🚿', 185.0],
  ['Flexível metal 40cm', 'Água', 'Metais', 'un', '🔧', 18.5],
  ['Válvula de descarga 1 1/4', 'Caixa acoplada', 'Metais', 'un', '🚽', 42.0],
  ['Sifão flexível pia', 'Cozinha', 'Metais', 'un', '🔧', 22.0],
  ['Engate flexível 60cm', 'Máquina', 'Metais', 'un', '🔧', 15.9],
  ['Caixa d’água polietileno 500L', 'Reserva', 'Hidráulica', 'un', '💧', 385.0],
  // Elétrica
  ['Cabo flexível 2,5mm² 100m', 'Tomadas', 'Elétrica', 'rolo', '⚡', 185.0],
  ['Cabo flexível 4mm² 100m', 'Chuveiro', 'Elétrica', 'rolo', '⚡', 298.0],
  ['Cabo flexível 6mm² 100m', 'Entrada', 'Elétrica', 'rolo', '⚡', 420.0],
  ['Fio cabo PP 2x1,5mm 100m', 'Iluminação', 'Elétrica', 'rolo', '⚡', 145.0],
  ['Disjuntor monofásico 20A curva C', 'Proteção', 'Elétrica', 'un', '⚡', 28.9],
  ['Disjuntor monofásico 32A curva C', 'Proteção', 'Elétrica', 'un', '⚡', 32.0],
  ['Disjuntor bifásico 50A', 'Subpainel', 'Elétrica', 'un', '⚡', 85.0],
  ['DR 40A 30mA 2P', 'Proteção vida', 'Elétrica', 'un', '⚡', 118.0],
  ['Tomada 10A 2P+T branca', 'Padrão novo', 'Elétrica', 'un', '🔌', 8.5],
  ['Tomada 20A 2P+T vermelha', 'Equipamentos', 'Elétrica', 'un', '🔌', 14.9],
  ['Interruptor simples 10A', 'Iluminação', 'Elétrica', 'un', '💡', 6.9],
  ['Quadro de distribuição 12/18', 'Embutir', 'Elétrica', 'un', '⚡', 65.0],
  ['Lâmpada LED 9W bivolt', 'Econômica', 'Elétrica', 'un', '💡', 6.5],
  ['Lâmpada LED tubular T8 18W', 'Garagem', 'Elétrica', 'un', '💡', 18.9],
  ['Refletor LED 50W IP65', 'Externo', 'Elétrica', 'un', '💡', 45.0],
  ['Extensão 5m 3 tomadas', 'Provisório', 'Elétrica', 'un', '🔌', 42.0],
  // Pintura
  ['Tinta acrílica padrão 18L branco', 'Parede interna', 'Pintura', 'lata', '🎨', 165.0],
  ['Tinta acrílica padrão 3,6L', 'Pequenos reparos', 'Pintura', 'lata', '🎨', 48.9],
  ['Tinta esmalte sintético 900ml', 'Metal e madeira', 'Pintura', 'lata', '🎨', 38.5],
  ['Massa corrida PVA 25kg', 'Preparação', 'Pintura', 'saco', '🎨', 52.0],
  ['Selador acrílico 18L', 'Fundo', 'Pintura', 'lata', '🎨', 185.0],
  ['Textura rolada 25kg', 'Acabamento', 'Pintura', 'saco', '🎨', 98.0],
  ['Rodinho de espuma 23cm', 'Aplicação', 'Pintura', 'un', '🖌️', 18.0],
  ['Kit pincéis 3 peças', 'Detalhes', 'Pintura', 'kit', '🖌️', 24.9],
  ['Fita crepe 48mm 50m', 'Máscara', 'Pintura', 'un', '🎨', 8.9],
  ['Desempenadeira PVC 18cm', 'Massa', 'Pintura', 'un', '🖌️', 14.5],
  ['Balde plástico 15L', 'Mistura', 'Pintura', 'un', '🎨', 12.0],
  // Ferramentas
  ['Martelo de unha 27mm', 'Carpintaria', 'Ferramentas', 'un', '🔨', 38.9],
  ['Marreta 1,5kg', 'Demolição', 'Ferramentas', 'un', '🔨', 42.0],
  ['Serrote 22"', 'Madeira', 'Ferramentas', 'un', '🪚', 65.0],
  ['Nível de alumínio 40cm', 'Alvenaria', 'Ferramentas', 'un', '📐', 32.0],
  ['Trena 5m magnética', 'Medição', 'Ferramentas', 'un', '📏', 24.9],
  ['Esquadro carpinteiro 12"', 'Marcenaria', 'Ferramentas', 'un', '📐', 45.0],
  ['Furadeira impacto 550W 127V', 'Perfuração', 'Ferramentas', 'un', '🔧', 185.0],
  ['Parafusadeira 12V bateria', 'Montagem', 'Ferramentas', 'un', '🔧', 298.0],
  ['Lixadeira orbital 300W', 'Acabamento', 'Ferramentas', 'un', '🔧', 245.0],
  ['Misturador elétrico 1200W', 'Argamassa', 'Ferramentas', 'un', '🔧', 185.0],
  ['Betoneira 400L 2CV monofásica', 'Concreto', 'Ferramentas', 'un', '🏗️', 2185.0],
  ['Carrinho de mão pneu 90L', 'Transporte', 'Ferramentas', 'un', '🛒', 185.0],
  ['Cavadeira cabo longo', 'Vala', 'Ferramentas', 'un', '⛏️', 48.0],
  ['Pa quadrada cabo Y', 'Obra', 'Ferramentas', 'un', '⛏️', 42.0],
  // Cobertura
  ['Telha colonial cerâmica', 'M² cobertura', 'Cobertura', 'm²', '🏠', 42.0],
  ['Telha francesa', 'Colonial variante', 'Cobertura', 'm²', '🏠', 48.5],
  ['Telha de fibrocimento 6mm', 'Econômica', 'Cobertura', 'un', '🏠', 18.9],
  ['Cumeeira colonial', 'Acabamento', 'Cobertura', 'un', '🏠', 12.5],
  ['Rufo lateral 3m alumínio', 'Acabamento', 'Cobertura', 'un', '🏠', 38.0],
  ['Calha semicircular 3m', 'Águas pluviais', 'Cobertura', 'un', '🏠', 45.0],
  ['Manta asfáltica 3mm rolo 10m²', 'Impermeabilização', 'Cobertura', 'rolo', '🏠', 118.0],
  // Revestimentos
  ['Cerâmica 45x45 retificado', 'Piso porcelanato', 'Revestimentos', 'm²', '🧱', 68.0],
  ['Porcelanato 60x60 polido', 'Sala', 'Revestimentos', 'm²', '🧱', 95.0],
  ['Pastilha de vidro 30x30cm', 'Detalhe', 'Revestimentos', 'm²', '🧱', 85.0],
  ['Rodapé poliestireno 10cm', 'Acabamento', 'Revestimentos', 'm', '🧱', 12.9],
  ['Nicho embutir porcelanato', 'Banheiro', 'Revestimentos', 'un', '🧱', 85.0],
  ['Piso tátil alerta 25x25', 'Acessibilidade', 'Revestimentos', 'm²', '🧱', 78.0],
  ['Pedra mineira filete', 'Fachada', 'Revestimentos', 'm²', '🧱', 120.0],
  ['Granito branco São Gabriel m²', 'Bancada', 'Revestimentos', 'm²', '🧱', 285.0],
  ['Quartzito sintético 120x55', 'Pia', 'Revestimentos', 'un', '🧱', 890.0],
  // Drywall e gesso
  ['Placa drywall ST 12,5mm 1,20x2,50', 'Parede', 'Drywall', 'placa', '🪜', 48.9],
  ['Placa drywall RF 12,5mm', 'Umidade', 'Drywall', 'placa', '🪜', 62.0],
  ['Perfil montante 70mm 3m', 'Estrutura', 'Drywall', 'un', '🪜', 18.5],
  ['Perfil guia 70mm 3m', 'Base', 'Drywall', 'un', '🪜', 14.9],
  ['Parafuso drywall 3,5x25 (1000un)', 'Fixação', 'Drywall', 'caixa', '🪜', 28.0],
  ['Fita papel drywall 50mm 150m', 'Junta', 'Drywall', 'rolo', '🪜', 42.0],
  ['Massa drywall 25kg', 'Acabamento junta', 'Drywall', 'saco', '🪜', 58.0],
  ['Forro PVC branco 20cm largura', 'Teto', 'Drywall', 'm', '🪜', 28.0],
  // Impermeabilização
  ['Manta líquida acrílica 15kg', 'Laje e terraço', 'Impermeabilização', 'galão', '💧', 285.0],
  ['Impermeabilizante flexível 18L', 'Cimento queimado', 'Impermeabilização', 'lata', '💧', 198.0],
  ['Primer para manta 3,6L', 'Fundo', 'Impermeabilização', 'lata', '💧', 85.0],
  ['Manta aluminizada autoadesiva', 'Detalhe', 'Impermeabilização', 'rolo', '💧', 145.0],
  ['Hidrorepelente silicone 5L', 'Pedra e tijolo', 'Impermeabilização', 'lata', '💧', 118.0],
  ['Bentonita em placa 1x5m', 'Barreira', 'Impermeabilização', 'placa', '💧', 185.0],
  ['Geotêxtil 150g 2x25m', 'Proteção', 'Impermeabilização', 'rolo', '💧', 95.0],
  // EPI e obra
  ['Capacete de segurança classe B', 'Obrigatório canteiro', 'EPI', 'un', '⛑️', 28.9],
  ['Óculos de proteção incolor', 'Impacto', 'EPI', 'un', '🥽', 12.5],
  ['Protetor auricular tipo concha', 'Ruído', 'EPI', 'un', '🎧', 35.0],
  ['Luva vaqueta petroleira', 'Químico', 'EPI', 'par', '🧤', 8.9],
  ['Bota PVC cano curto', 'Obra úmida', 'EPI', 'par', '🥾', 42.0],
  ['Cinto paraquedista com talabarte', 'Trabalho altura', 'EPI', 'un', '🪢', 185.0],
  ['Máscara PFF2 sem válvula', 'Poeira', 'EPI', 'un', '😷', 4.5],
  ['Cones de sinalização 75cm', 'Sinalização', 'Obra', 'un', '🚧', 18.9],
  ['Tela de isolamento laranja 1,20x50m', 'Tapume', 'Obra', 'rolo', '🚧', 185.0],
  ['Lona preta 150 micras 6x100m', 'Cobertura provisória', 'Obra', 'rolo', '🚧', 420.0],
  ['Corda multifilamento 10mm 50m', 'Amarração', 'Obra', 'un', '🪢', 85.0],
  ['Gerador gasolina 3,5kVA', 'Obra sem rede', 'Obra', 'un', '⚡', 2185.0],
  ['Compressor ar 50L 2HP', 'Pintura e limpeza', 'Obra', 'un', '🔧', 685.0],
  ['Andaime tubular 1,5m (módulo)', 'Fachada', 'Obra', 'un', '🪜', 185.0],
  ['Betume em pasta 18kg', 'Vedação', 'Impermeabilização', 'lata', '💧', 98.0],
  ['Silicone neutro branco 280g', 'Vedação', 'Obra', 'un', '🔧', 18.9],
  ['Espuma expansiva PU 500ml', 'Vedação', 'Obra', 'un', '🔧', 28.0],
  ['Fita isolante 19mm 20m', 'Elétrica', 'Elétrica', 'un', '⚡', 4.5],
  ['Organizador maleta ferramentas', 'Transporte', 'Ferramentas', 'un', '🧰', 65.0],
]

const CLIENTES = [
  'Obra Residencial Silva — Japiim',
  'Construtora Horizonte Norte Ltda',
  'Reforma Apartamento 402 — Adrianópolis',
  'Marmoraria Costa & Irmãos',
  'Pedreiro João — obra particular',
  'Incorp. Vista do Rio SPE',
  'Loteamento Primavera (casa modelo)',
  'Cliente balcão — CPF',
  'Reforma comercial Centro',
  'Serralheria Metal Forte',
  'Instalações Hidráulicas AM',
  'Elétrica Silva Instalações',
  'Pinturas Expressa Manaus',
  'Telhados e Cia',
  'Drywall Pro Acabamentos',
  'Cliente PIX — retirada balcão',
  'Obra condomínio Ponta Negra',
  'Reforma banheiro — cliente Maria',
  'Empreiteira 3 Irmãos',
  'Vidraçaria Cristal do Sul',
  'Marcenaria do Zé',
  'Cliente corporativo — manutenção',
  'Obra galpão Distrito Industrial',
  'Reforma cozinha — bairro Aleixo',
  'Cliente fidelidade — cartão',
  'Construção civil autônomo — Lucas',
  'Pequena reforma laje — vizinho',
  'Cliente telefone — entrega',
  'Obra escola municipal (terceirizada)',
  'Reforma fachada — edifício',
]

function buildProdutos() {
  if (RAW_PRODUTOS.length !== 150) {
    throw new Error(`Lista de produtos deve ter 150 itens, tem ${RAW_PRODUTOS.length}`)
  }
  return RAW_PRODUTOS.map(([nome, descricao, categoria, unidade, emoji, compra], i) => {
    const mark = 1.2 + Math.random() * 0.28
    const venda = round2(compra * mark)
    const minimo = Math.max(5, Math.min(45, Math.floor(compra / 3)))
    const estoque = 4000 + Math.floor(Math.random() * 3500)
    return {
      id: crypto.randomUUID(),
      codigo: `MAT-${String(i + 1).padStart(5, '0')}`,
      nome,
      descricao,
      categoria,
      unidade,
      emoji,
      compra: round2(compra),
      venda,
      tributo: 8,
      operacional: 7,
      pix_desconto: 10,
      minimo,
      estoque,
    }
  })
}

function margemLinha(p, qty) {
  const prod = {
    compra: p.compra,
    venda: p.venda,
    tributo: p.tributo,
    operacional: p.operacional,
    pixDesconto: p.pix_desconto,
  }
  const c = calcProduto(prod)
  return qty * c.margem
}

function descontoPixLinha(p, qty) {
  const prod = {
    compra: p.compra,
    venda: p.venda,
    tributo: p.tributo,
    operacional: p.operacional,
    pixDesconto: p.pix_desconto,
  }
  const c = calcProduto(prod)
  return qty * (p.venda - c.precoPixFinal)
}

/** Distribui datas ao longo de ~3 anos (mais peso nos meses recentes). */
function randomPedidoTimestampMs(now) {
  const dayMs = 24 * 60 * 60 * 1000
  const u = Math.random()
  let daysAgo
  if (u < 0.1) daysAgo = randInt(0, 7)
  else if (u < 0.22) daysAgo = randInt(8, 29)
  else if (u < 0.4) daysAgo = randInt(30, 119)
  else if (u < 0.58) daysAgo = randInt(120, 364)
  else if (u < 0.75) daysAgo = randInt(365, 729)
  else daysAgo = randInt(730, 1095)
  return now - daysAgo * dayMs - randInt(0, dayMs - 1)
}

function buildPedidoLines(produtos) {
  const nItens = randInt(1, 7)
  const lines = []
  const used = new Set()
  let tries = 0
  while (lines.length < nItens && tries < 100) {
    tries++
    const idx = randInt(0, produtos.length - 1)
    if (used.has(idx)) continue
    const prod = produtos[idx]
    if (prod.estoque <= 0) continue
    const qty = Math.min(randInt(1, 12), prod.estoque)
    if (qty < 1) continue
    used.add(idx)
    lines.push({ prod, qty })
  }
  return lines
}

function nomeClienteSeeded(i) {
  const base = CLIENTES[i % CLIENTES.length]
  const n = Math.floor(i / CLIENTES.length)
  return n === 0 ? base : `${base} (#${n + 1})`
}

async function clearDemoData(client) {
  await client.query('DELETE FROM pedido_itens')
  await client.query('DELETE FROM pedidos')
  await client.query('DELETE FROM produtos')
}

async function insertProdutos(client, produtos) {
  for (const p of produtos) {
    await client.query(
      `INSERT INTO produtos (
        id, codigo, nome, descricao, categoria, unidade, emoji,
        compra, venda, tributo, operacional, estoque, minimo, pix_desconto
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        p.id,
        p.codigo,
        p.nome,
        p.descricao,
        p.categoria,
        p.unidade,
        p.emoji,
        p.compra,
        p.venda,
        p.tributo,
        p.operacional,
        p.estoque,
        p.minimo,
        p.pix_desconto,
      ]
    )
  }
}

async function seedVendas(client, produtos) {
  const now = Date.now()
  let inseridos = 0
  let tentativas = 0
  const maxTentativas = NUM_VENDAS * 8

  while (inseridos < NUM_VENDAS && tentativas < maxTentativas) {
    tentativas++
    const lines = buildPedidoLines(produtos)
    if (lines.length === 0) continue

    const payMode = Math.random() < 0.42 ? 'pix' : 'cartao'
    let subtotal = 0
    let lucro = 0
    let desconto = 0

    for (const { prod, qty } of lines) {
      subtotal += prod.venda * qty
      lucro += margemLinha(prod, qty)
      if (payMode === 'pix') {
        desconto += descontoPixLinha(prod, qty)
      }
    }

    const total = round2(subtotal - desconto)
    const itensQtd = lines.reduce((a, l) => a + l.qty, 0)
    const dataMs = randomPedidoTimestampMs(now)

    const ins = await client.query(
      `INSERT INTO pedidos (data_ms, cliente, pagamento, total, desconto, lucro_estimado, status, itens_qtd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        dataMs,
        nomeClienteSeeded(inseridos),
        payMode,
        total,
        round2(desconto),
        round2(lucro),
        'concluido',
        itensQtd,
      ]
    )
    const pedidoId = ins.rows[0].id

    for (const { prod, qty } of lines) {
      const unit = Number(prod.venda)
      const sub = round2(unit * qty)
      await client.query(
        `INSERT INTO pedido_itens (pedido_id, produto_id, qty, preco_unit, subtotal)
         VALUES ($1, $2::uuid, $3, $4, $5)`,
        [pedidoId, prod.id, qty, unit, sub]
      )
      await client.query(
        `UPDATE produtos SET estoque = estoque - $1, updated_at = NOW() WHERE id = $2::uuid`,
        [qty, prod.id]
      )
      prod.estoque -= qty
    }
    inseridos++
  }

  if (inseridos < NUM_VENDAS) {
    console.warn(`Aviso: apenas ${inseridos} vendas inseridas (estoque insuficiente para mais).`)
  }
}

async function main() {
  await migrate()
  const produtos = buildProdutos()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await clearDemoData(client)
    await insertProdutos(client, produtos)
    await seedVendas(client, produtos)
    await client.query('COMMIT')
    console.log(`Seed concluído: 150 produtos e até ${NUM_VENDAS} vendas (períodos variados em anos).`)
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
