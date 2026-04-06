# ConstruFácil — Descrição Completa do Projeto para Cursor AI

## 1. Visão Geral

**ConstruFácil** é um sistema de e-commerce e gestão administrativa para uma loja virtual de material de construção. O projeto é um SPA (Single Page Application) desenvolvido com **React 18 + Vite**, sem backend — todo o estado é gerenciado em memória via `useState`. O layout segue o padrão visual **AdminLTE** (sidebar escura, header azul, fundo cinza), implementado com CSS puro (sem Tailwind, sem MUI, sem Bootstrap JS).

### Propósito educacional
O sistema foi criado como projeto escolar para demonstrar conceitos de:
- Formação de preço e margem de lucro
- Impacto de tributos e custos operacionais
- Desconto estratégico via PIX com validação anti-prejuízo
- Controle de estoque com alerta de mínimo
- Dashboard financeiro com indicadores gerenciais

---

## 2. Stack Tecnológica

| Camada        | Tecnologia                                |
|---------------|-------------------------------------------|
| Framework     | React 18.x (JSX sem TypeScript)           |
| Build tool    | Vite 8.x                                  |
| Roteamento    | Manual via `useState` (sem React Router)  |
| Gráficos      | Recharts 3.x                              |
| Ícones        | Lucide React 1.x                          |
| Estilos       | CSS puro — `src/styles/global.css`        |
| Estado global | Props drilling + `useState` no `App.jsx`  |
| Dados         | Constantes e funções em `src/data.js`     |
| Persistência  | Nenhuma — dados em memória (sem localStorage, sem API) |

---

## 3. Estrutura de Arquivos

```
construfacil/
├── index.html                    ← entry point HTML (carrega Source Sans 3 do Google Fonts)
├── package.json                  ← deps: react, react-dom, recharts, lucide-react, vite
├── vite.config.js                ← config padrão Vite com plugin React
└── src/
    ├── main.jsx                  ← ReactDOM.createRoot, importa global.css e App.jsx
    ├── App.jsx                   ← roteador + todo o estado global do sistema
    ├── data.js                   ← dados, lógica de negócio, formatadores, mocks
    ├── styles/
    │   └── global.css            ← design system AdminLTE completo (tokens, classes utilitárias)
    ├── components/
    │   └── Layout.jsx            ← shell da aplicação + componentes compartilhados
    └── pages/
        ├── Dashboard.jsx         ← tela principal com KPIs, gráficos e tabelas
        ├── Loja.jsx              ← catálogo de produtos (cliente)
        ├── Carrinho.jsx          ← carrinho + checkout + seleção de pagamento
        ├── Pedidos.jsx           ← histórico de pedidos + timeline + análises
        ├── Produtos.jsx          ← gestão de produtos com modal CRUD
        ├── Relatorios.jsx        ← relatórios financeiros com múltiplos gráficos
        └── Config.jsx            ← configurações do sistema e regras de negócio
```

---

## 4. Roteamento e Estado Global — `App.jsx`

O `App.jsx` é o único lugar com estado global. **Não existe React Router.** A tela ativa é controlada por um `useState('dashboard')` e o componente correto é renderizado via switch/case dentro de `renderScreen()`.

### Estado gerenciado em App.jsx

```js
const [screen,   setScreen]   = useState('dashboard')  // tela ativa
const [produtos, setProdutos] = useState(INITIAL_PRODUCTS) // array de produtos
const [cart,     setCart]     = useState([])            // array { produto, qty }
const [pedidos,  setPedidos]  = useState([])            // pedidos finalizados na sessão
```

### Screens disponíveis (values do estado `screen`)
- `'dashboard'`  → `<Dashboard>`
- `'loja'`       → `<Loja>`
- `'carrinho'`   → `<Carrinho>`
- `'pedidos'`    → `<Pedidos>`
- `'produtos'`   → `<Produtos>`
- `'relatorios'` → `<Relatorios>`
- `'config'`     → `<Config>`

### Funções de negócio em App.jsx

| Função               | O que faz                                                                 |
|----------------------|---------------------------------------------------------------------------|
| `salvarProduto(p)`   | Insert ou update em `produtos` pelo `id`                                  |
| `excluirProduto(id)` | Remove de `produtos` e remove itens do carrinho com aquele produto        |
| `adicionarAoCarrinho(produto)` | Adiciona ou incrementa qty no cart, navega para `'carrinho'`  |
| `atualizarQtd(id,qty)` | Atualiza qty ou remove item se qty <= 0                                 |
| `removerDoCarrinho(id)` | Remove item do cart pelo produto.id                                    |
| `limparCarrinho()`   | Esvazia o cart                                                            |
| `finalizarPedido(payMode)` | Cria pedido, decrementa estoque, limpa cart, retorna objeto pedido  |

### Valores derivados passados como props

```js
const cartCount  = cart.reduce((s,i) => s + i.qty, 0)      // total de items no carrinho
const alertCount = produtos.filter(p => p.estoque <= p.minimo).length // badges de alerta
```

---

## 5. Design System — `src/styles/global.css`

CSS puro com variáveis CSS customizadas. **Nenhum framework de CSS é usado.** Todas as classes são definidas neste arquivo.

### Tokens (CSS variables)

```css
--sidebar-bg:    #222d32   /* fundo da sidebar */
--sidebar-w:     230px     /* largura da sidebar */
--header-bg:     #3c8dbc   /* fundo do header azul */
--header-h:      50px      /* altura do header */
--body-bg:       #ecf0f5   /* fundo cinza da página */
--c-blue:        #3c8dbc
--c-aqua:        #00c0ef
--c-green:       #00a65a
--c-yellow:      #f39c12
--c-red:         #dd4b39
--c-teal:        #39cccc
--c-purple:      #605ca8
--text:          #333
--text-muted:    #777
--border:        #d2d6de
--r:             3px        /* border-radius padrão */
--shadow:        0 1px 1px rgba(0,0,0,.1)
```

### Classes utilitárias principais

**Layout do shell:**
- `.cf-wrap` — wrapper geral (flex-column, min-height 100vh)
- `.cf-body` — área abaixo do header (flex-row)
- `.cf-header` — barra de topo azul, sticky, z-index 300
- `.cf-logo` — logo ConstruFácil (azul escuro, 230px)
- `.cf-sidebar` — sidebar escura, flex-column, overflow-y auto
- `.cf-sidebar.collapsed` — largura 0, overflow hidden
- `.cf-content` — área de conteúdo principal (flex:1)
- `.cf-page-header` — cabeçalho interno da página (título + breadcrumb)
- `.cf-page-body` — padding:20px do conteúdo

**Componentes de card:**
- `.box` — card branco com borda e sombra suave
- `.box-header` — cabeçalho do card com `.box-title` e `.box-tools`
- `.box-body` — corpo do card (padding 15px)
- `.box-footer` — rodapé cinza claro
- `.box.box-primary/success/warning/danger/info/teal` — colored top border (3px)

**Métricas coloridas:**
- `.small-box` — card colorido grande (fundo sólido, texto branco)
- `.small-box-val` — número grande (38px, bold)
- `.small-box-lbl` — rótulo (15px, 85% opacity)
- `.small-box-icon` — emoji decorativo (72px, 15% opacity, posição absoluta)
- `.small-box-footer` — rodapé dark (10% rgba black)
- `.info-box` — card menor com ícone lateral colorido

**Tipografia e cores:**
- `.text-muted/success/warning/danger/info/primary` — cores semânticas
- `.text-bold/sm/xs/lg` — variações de peso/tamanho
- `.bg-blue/aqua/green/yellow/red/teal/purple` — fundos coloridos

**Labels/badges:**
- `.label` — base (border-radius 3px, 11px, bold)
- `.label-primary/success/warning/danger/info/default/teal/purple`
- `.badge-pill` — border-radius 10px (pílula)

**Formulários:**
- `.form-group` — wrapper com margin-bottom 15px
- `.form-group > label` — uppercase, 12px, color muted, letter-spacing
- `.input-group` — flexbox para prefixo/sufixo em inputs
- `.input-addon` / `.input-addon-left` / `.input-addon-right` — addon lateral

**Botões:**
- `.btn` — base (inline-flex, gap, padding, border-radius 3px)
- `.btn-primary/success/warning/danger/default/info/teal/purple/link`
- `.btn-xs/sm/lg` — tamanhos
- `.btn-block` — largura 100%, justify-content center
- `.btn-group` — grupo de botões (border-radius apenas nas bordas)

**Tabelas:**
- `.table` — tabela com cabeçalho cinza, bordas suaves
- `.table-hover` — hover cinza claro nas linhas
- `.table-striped` — zebra nas linhas pares
- `.table-bordered` — borda em todas as células

**Grid:**
- `.row` — flex-wrap com margin negativo de 8px
- `.col-1` a `.col-12` — larguras percentuais com padding 8px

**Utilitários:**
- `.d-flex/block/none` — display
- `.items-center`, `.justify-between`, `.justify-center`
- `.gap-1/2/3/4` — gaps de 4/8/12/16px
- `.flex-wrap`, `.flex-1`, `.ml-auto`, `.mr-auto`
- `.mt-1/2/3`, `.mb-0/1/2/3`, `.p-0/2/3/4`
- `.ellipsis` — text-overflow: ellipsis
- `.nowrap` — white-space: nowrap

**Componentes especiais:**
- `.alert.alert-success/warning/danger/info` — alertas com borda e fundo colorido
- `.progress` / `.progress-bar` / `.progress-sm/xs` — barras de progresso
- `.modal-backdrop`, `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`
- `.timeline`, `.tl-item`, `.tl-badge`, `.tl-content` — linha do tempo para pedidos
- `.stat-row` / `.stat-row-bold` — linhas de resumo financeiro
- `.empty-state` — estado vazio centralizado
- `.form-hint`, `.form-error`, `.has-error`, `.has-success` — validação visual

---

## 6. Dados e Lógica de Negócio — `src/data.js`

### Estrutura de um Produto

```js
{
  id:           Number,   // identificador único
  nome:         String,   // ex: "Cimento CP-II 50kg"
  unidade:      String,   // ex: "saco", "m²", "lata"
  emoji:        String,   // ícone visual do produto
  categoria:    String,   // ex: "Estrutura", "Acabamento"
  compra:       Number,   // custo de aquisição (R$)
  venda:        Number,   // preço ao cliente no cartão (R$)
  tributo:      Number,   // % de tributos sobre o preço de venda
  operacional:  Number,   // % de custo operacional sobre o preço de venda
  estoque:      Number,   // quantidade disponível em unidades
  minimo:       Number,   // gatilho de alerta de reposição
  pixDesconto:  Number,   // % de desconto aplicado no PIX
}
```

### Função `calcProduto(p)` — núcleo das regras de negócio

```js
calcProduto(produto) → {
  tribVal,        // R$ de tributos (venda * tributo / 100)
  operVal,        // R$ de custo operacional (venda * operacional / 100)
  custoTotal,     // compra + tribVal + operVal
  margem,         // venda - custoTotal (R$ disponível)
  margemPct,      // (margem / venda) * 100 — margem percentual
  pixDescontoVal, // R$ do desconto PIX (venda * pixDesconto / 100)
  precoPixFinal,  // venda - pixDescontoVal — preço final no PIX
  pixValido,      // Boolean: pixDescontoVal <= margem && margem > 0
}
```

**Regra central:** `pixValido` é `false` se o desconto PIX consumir mais do que a margem disponível — ou seja, se a empresa venderia com prejuízo.

### Função `stockStatus(p)`

```js
stockStatus(produto) → {
  label:     String,  // "Normal" | "Atenção" | "Crítico" | "Sem estoque"
  cls:       String,  // classe CSS: "label-success" | "label-warning" | "label-danger" | "label-default"
  color:     String,  // hex para uso em SVG/inline styles
  textColor: String,  // sempre "#fff"
}
```

Lógica:
- `estoque === 0` → Sem estoque (cinza)
- `estoque < minimo` → Crítico (vermelho)
- `estoque === minimo` → Atenção (amarelo)
- `estoque > minimo` → Normal (verde)

### Formatadores

```js
fmt(v)         // → "R$ 1.234,56" (moeda BRL)
fmtN(v, dec)   // → "1.234" (número com separador)
fmtPct(v)      // → "12.50%" (percentual)
fmtDate(d)     // → "28/03/2026 14:35" (data/hora pt-BR)
```

### Constantes de domínio

```js
CATEGORIAS // ['Estrutura','Acabamento','Cobertura','Insumos','Hidráulica','Elétrica','Ferragens']
UNIDADES   // ['unidade','saco','lata','m²','m³','rolo','cento','milheiro','barra','par','caixa','kg','litro']
EMOJIS     // array de 20 emojis para seleção no cadastro
```

### Dados mock (para dashboard e relatórios)

```js
MOCK_WEEK      // 7 objetos { dia, valor } — vendas da semana
MOCK_MONTH     // 4 objetos { sem, valor } — vendas do mês por semana
MOCK_RANKING   // 5 objetos { id, nome, qtd, faturamento } — ranking de produtos
MOCK_SUMMARY   // { totalFaturamento, lucroEstimado, totalPedidos, pedidosPix, descontosPix, margemMedia, ticketMedio }
MOCK_PEDIDOS   // 8 pedidos históricos { id, data, cliente, pagamento, total, desconto, status, itens }
gerarPedidoId()// retorna próximo id sequencial (começa em 1001)
```

---

## 7. Componentes Compartilhados — `src/components/Layout.jsx`

### `<Layout>` (default export)

Shell principal da aplicação. Renderiza header + sidebar + `<main>`.

**Props:**
```js
active:      String    // screen ativa (controla .active na sidebar)
onNav:       Function  // (screenId: string) => void
cartCount:   Number    // badge do carrinho
alertCount:  Number    // badge de alertas (cor amarela)
children:    ReactNode // conteúdo da página
```

**Comportamento:**
- Sidebar colapsável via botão de hambúrguer no header
- `cf-sidebar.collapsed` → largura 0, overflow hidden
- Sidebar exibe badge vermelho no Carrinho (cartCount) e amarelo no Dashboard (alertCount)

### `<PageHeader>` (named export)

Cabeçalho interno de cada página.

```js
// Props
title:       String    // título grande (22px)
sub:         String    // subtítulo (small tag, 14px muted)
breadcrumbs: String[]  // ex: ['Produtos', 'Editar']
actions:     ReactNode // botões/badges no lado direito
```

### `<Box>` (named export)

Card branco (equivalente ao `.box` do AdminLTE).

```js
// Props
title:     ReactNode  // título do box-header (pode conter ícone Lucide)
type:      String     // 'primary'|'success'|'warning'|'danger'|'info'|'teal' — colored top border
tools:     ReactNode  // botões no box-header (lado direito)
children:  ReactNode  // conteúdo do box-body
footer:    ReactNode  // rodapé (box-footer)
style:     Object     // inline style
className: String     // classes adicionais
```

### `<SmallBox>` (named export)

Card colorido de métrica grande (topo do dashboard).

```js
// Props
value:   String    // número/texto grande
label:   String    // rótulo
icon:    String    // emoji decorativo
color:   String    // CSS color ou var(--c-*)
sub:     String    // texto do rodapé (opcional)
onClick: Function  // navegação ao clicar (opcional)
```

### `<InfoBox>` (named export)

Card menor com ícone lateral colorido.

```js
// Props
icon:   String  // emoji
color:  String  // cor do fundo do ícone
text:   String  // rótulo (uppercase, muted)
number: String  // valor destacado
```

### `<Modal>` (named export)

Modal com backdrop. Fecha ao clicar no backdrop ou no X.

```js
// Props
title:    ReactNode  // título (no modal-header azul)
onClose:  Function   // callback de fechamento
children: ReactNode  // conteúdo (modal-body)
footer:   ReactNode  // botões (modal-footer)
size:     String     // 'lg' → maxWidth 720px (padrão: 520px)
```

---

## 8. Páginas

### `Dashboard.jsx`

**Props recebidas:** `{ produtos, onNav }`

**Seções:**
1. **Row de SmallBoxes** (4 cols): Faturamento, Lucro, Pedidos, Descontos PIX
2. **Row de InfoBoxes** (4 cols): Total produtos, Alertas, % PIX, Poupado no PIX
3. **Gráficos:** AreaChart de vendas (8 cols) + PieChart de estoque + BarChart mensal (4 cols)
4. **Tabelas:** Ranking de produtos mais vendidos + Alertas de estoque (side by side)
5. **Tabela completa:** Análise de margem e PIX por produto (toda a largura)

Todos os dados de KPI vêm de `MOCK_SUMMARY`. Alertas de estoque são calculados em tempo real a partir do array `produtos`.

---

### `Loja.jsx`

**Props recebidas:** `{ produtos, onAddCart }`

**Funcionalidades:**
- Busca por texto (nome ou categoria)
- Filtros: Todos / Disponíveis / Alerta de estoque
- Filtro por categoria (select + chips de atalho)
- Alternância visualização: Grade (cards) / Lista (tabela)
- Cada card mostra: emoji, nome, unidade, preço cartão (riscado), preço PIX (verde, badge), estoque, status, progress bar de estoque, botão desabilitado se sem estoque
- Rodapé do card mostra margem % e custo de compra

---

### `Carrinho.jsx`

**Props recebidas:** `{ cart, onQty, onRemove, onClear, onNav }`

**Estados internos:**
- `payMode`: `'pix'` | `'card'` (default: `'pix'`)
- `finalizado`: Boolean — exibe tela de confirmação

**Regras de cálculo:**
```
subtotal = Σ (produto.venda × qty)
desconto = Σ ((produto.venda - precoPixFinal) × qty)  [apenas se payMode === 'pix']
total    = payMode === 'pix' ? subtotal - desconto : subtotal
```

**Layout:** 2 colunas (8/4)
- Esquerda: tabela com controles +/- por item, preço riscado (cartão) e verde (PIX), botão remover
- Direita: seletor de pagamento (radio estilizado), resumo financeiro, breakdown de economia por produto

**Tela de confirmação:** exibida quando `finalizado === true` — mostra pedido, total, economia, botões para voltar à loja ou ver pedidos.

---

### `Pedidos.jsx`

**Props recebidas:** `{ pedidos }` (pedidos da sessão atual)

**Dados:** combina `pedidos` (prop) com `MOCK_PEDIDOS` (mock histórico)

**Seções:**
1. **InfoBoxes:** Total pedidos, Via PIX, Via Cartão, Total descontos
2. **Filtros:** busca por cliente/id + botão PIX/Cartão/Todos
3. **Tabela:** id, data/hora, cliente, itens, pagamento (ícone Zap/CreditCard), desconto (verde), total, status
4. **Timeline** (6 últimos pedidos) + **Tabela PIX vs Cartão** com progress bars de share

---

### `Produtos.jsx`

**Props recebidas:** `{ produtos, onSave, onDelete }`

**Estados internos:**
- `modal`: `null` | `'novo'` | `{...produto}` — controla abertura do modal
- `delConf`: `null` | `{...produto}` — modal de confirmação de exclusão

**Filtros:** busca por nome/categoria + filtros PIX válido/inválido/alerta

**Modal `<ProdutoModal>`:** componente interno com formulário completo
- Seleção de emoji (grid de botões)
- Campos: nome, categoria (select), unidade (select)
- Preços: compra e venda com prefixo "R$"
- Tributos e operacional com sufixo "%"
- Estoque atual e mínimo
- Desconto PIX com sufixo "%"
- Painel lateral sticky com calculadora ao vivo (calcula em tempo real ao digitar)
- Validação: alerta vermelho/verde do desconto PIX
- Validações com mensagens de erro inline (`errors` state)

**Tabela principal:** 11 colunas — produto, categoria, custo, venda, margem R$, margem %, preço PIX, desc PIX, estoque, status, ações (editar/excluir)

---

### `Relatorios.jsx`

**Props recebidas:** `{ produtos }`

**Seções:**
1. **SmallBoxes:** Faturamento, Lucro, % PIX, Concedido em PIX
2. **BarChart duplo** (faturamento × lucro por dia, 8 cols) + **PieChart PIX vs Cartão** + **AreaChart mensal** (4 cols)
3. **Horizontal BarChart** de margem média por categoria
4. **Tabela de ranking** de faturamento com progress bars de share
5. **Tabela completa** de análise financeira com rodapé de médias (calculadas em tempo real do array produtos)

Margem por categoria é calculada em tempo real agrupando produtos por `p.categoria`.

---

### `Config.jsx`

**Estado interno:** `form` com todos os campos de configuração

**Seções:**
1. **Dados da empresa:** nome, CNPJ, email, telefone, cidade, UF
2. **Padrões financeiros:** PIX padrão %, tributos padrão %, operacional padrão %, estoque mínimo padrão
3. **Regras e segurança:** toggles para alertas e confirmação de exclusão
4. **Regras de negócio:** exibição das 6 RNs imutáveis do sistema (RN1–RN6)
5. **Sobre o projeto:** tabela com informações técnicas

**Comportamento do save:** `setSaved(true)` por 3 segundos, exibindo toast no canto inferior direito.

---

## 9. Regras de Negócio Implementadas

| Código | Regra                                                                                    | Onde é validada                           |
|--------|------------------------------------------------------------------------------------------|-------------------------------------------|
| RN1    | Vendas exclusivamente online — sem balcão físico                                          | Estrutura do sistema (não há tela física) |
| RN2    | Desconto automático apenas no PIX — cliente não digita desconto                           | `Carrinho.jsx` — seletor de pagamento     |
| RN3    | Desconto PIX não pode gerar prejuízo (pixDescontoVal ≤ margem)                           | `calcProduto()` em `data.js`              |
| RN4    | Preço mínimo de venda = custo total (compra + tributos + operacional)                    | `calcProduto()` + validação no modal      |
| RN5    | Estoque decrementado ao finalizar pedido, botão desabilitado com estoque = 0             | `App.jsx:finalizarPedido()` + `Loja.jsx`  |
| RN6    | Alerta automático quando estoque ≤ estoque mínimo                                        | `stockStatus()` + badges no header/sidebar|

---

## 10. Fluxo de Dados (Props Drilling)

```
App.jsx
├── produtos (state) ──────────────────────────────────────────────────────┐
│   ├── → Dashboard (leitura)                                               │
│   ├── → Loja (leitura + onAddCart)                                        │
│   ├── → Produtos (leitura + onSave + onDelete)                            │
│   └── → Relatorios (leitura)                                              │
│                                                                            │
├── cart (state) ──────────────────────────────────────────────────────────┐│
│   ├── → Carrinho (leitura + onQty + onRemove + onClear + onNav)           ││
│   └── → Layout (cartCount derivado)                                        ││
│                                                                             ││
├── pedidos (state) → Pedidos (leitura)                                       ││
│                                                                              ││
└── setScreen ──────────────────────────────────────────────────────────────┘┘
    → passado como onNav para todos os componentes que precisam navegar
```

---

## 11. Como Evoluir o Projeto

### Adicionar backend (FastAPI + SQLite)
1. Criar API REST com endpoints: `GET/POST/PUT/DELETE /produtos`, `GET/POST /pedidos`
2. Substituir `INITIAL_PRODUCTS` por `useEffect(() => fetch('/api/produtos'), [])`
3. `salvarProduto` → `fetch('/api/produtos', { method: 'POST', body: JSON.stringify(p) })`
4. O `calcProduto()` permanece no frontend (é lógica de display, não precisa ir ao servidor)

### Adicionar React Router
1. `npm install react-router-dom`
2. Envolver App em `<BrowserRouter>`
3. Substituir o switch/case em `renderScreen()` por `<Routes><Route path="/" element={<Dashboard/>}/>`
4. Substituir `onNav(id)` por `navigate('/'+id)`

### Adicionar persistência no localStorage
```js
// Em App.jsx
const [produtos, setProdutos] = useState(() => {
  const saved = localStorage.getItem('produtos')
  return saved ? JSON.parse(saved) : INITIAL_PRODUCTS
})
useEffect(() => {
  localStorage.setItem('produtos', JSON.stringify(produtos))
}, [produtos])
```

### Adicionar TypeScript
Renomear `.jsx` para `.tsx`, criar `src/types.ts` com interfaces `Produto`, `ItemCarrinho`, `Pedido`, tipar todas as props e retornos de função.

---

## 12. Comandos Úteis

```bash
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run build        # build de produção (dist/)
npm run preview      # preview do build de produção
```

---

## 13. Convenções do Código

- **Nomes em português:** variáveis, funções, estados e props são em português (ex: `produtos`, `pedidos`, `calcProduto`)
- **Nomes de componentes em PascalCase:** `Dashboard`, `Produtos`, `SmallBox`
- **Sem TypeScript:** projeto é JS puro com JSX
- **Sem CSS Modules:** todas as classes são globais, definidas em `global.css`
- **Sem bibliotecas de form:** validação manual com estado `errors` local
- **Cálculos sempre em `calcProduto()`:** nunca recalcular tributos/margens inline nos componentes
- **`fmt()` obrigatório** para qualquer valor monetário exibido na tela
- **Dados mock separados** de dados reais — `MOCK_*` são apenas para gráficos e histórico
