# SemeSmart — Roadmap Completo para Claude Code
> Controle financeiro familiar + pessoal com múltiplos perfis e investimentos

---

## Visão Geral da Arquitetura

```
semesmart/
├── api/          → Express + MongoDB (backend)
└── app/          → React + Vite (frontend)
```

**Stack final:**
- Backend: Node.js + Express + Mongoose + Passport.js (Google OAuth)
- Frontend: React + TypeScript + Vite + Tailwind
- DB: MongoDB (local ou Atlas)
- Auth: Google OAuth 2.0 via Passport.js (sem Firebase)

---

## Modelo de Perfis

```
Rodrigo (owner)
├── Perfil: Família     → vê: gastos família + seus próprios
├── Perfil: PhanterAI   → vê: gastos PhanterAI + seus próprios

Deborah (membro família)
└── Perfil: Família     → vê: gastos família apenas

Outros membros família
└── Perfil: Família     → vê: gastos família apenas
```

**Regra de acesso:**
- `role: owner` → acessa todos os perfis que administra
- `role: member` → acessa apenas os perfis onde foi convidado

---

## Fase 1 — Limpeza e Configuração Base

### 1.1 Remover Firebase completamente do frontend

**Arquivos a deletar:**
```
app/firebaseConfig.ts
app/firestore.indexes.json
app/firestore.rules
app/functions/         (pasta inteira)
```

**Dependências a remover do `app/package.json`:**
```json
"firebase": "^10.12.3"
```

**Remover de `app/index.html`:**
```html
<!-- Remover do importmap -->
"firebase/": "...",
"firebase/app": "...",
"firebase/auth": "...",
"firebase/firestore": "..."
```

### 1.2 Atualizar dependências do backend (`api/package.json`)

**Adicionar:**
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "mongoose": "^8.9.0",
    "@google/genai": "^1.29.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.18.0",
    "connect-mongo": "^5.1.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.0"
  }
}
```

**Criar `api/.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/semesmart
SESSION_SECRET=sua_chave_secreta_aqui
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
PORT=3001
FRONTEND_URL=http://localhost:3000
API_KEY=sua_gemini_api_key
```

---

## Fase 2 — Modelos MongoDB (Mongoose Schemas)

### 2.1 `api/models/User.js`

```javascript
// Schema do usuário autenticado
{
  googleId: String,         // ID do Google OAuth
  email: String,            // único
  name: String,
  avatar: String,           // URL foto Google
  role: String,             // 'owner' | 'member'
  profiles: [ObjectId],     // refs para Profile
  createdAt: Date
}
```

### 2.2 `api/models/Profile.js`

```javascript
// Um perfil = um "espaço" de gastos (ex: Família, PhanterAI)
{
  name: String,             // "Família" | "PhanterAI"
  slug: String,             // "familia" | "phanterai"
  owner: ObjectId,          // ref User (Rodrigo)
  members: [{
    user: ObjectId,         // ref User
    canWrite: Boolean       // pode adicionar transações?
  }],
  avatar: String,           // emoji ou URL
  color: String,            // cor do perfil (#hex)
  createdAt: Date
}
```

### 2.3 `api/models/Transaction.js`

```javascript
// Transação financeira
{
  profile: ObjectId,        // ref Profile (OBRIGATÓRIO)
  createdBy: ObjectId,      // ref User (quem lançou)
  type: String,             // 'income' | 'expense'
  amount: Number,           // sempre positivo
  description: String,
  category: String,
  paymentMethod: String,
  date: Date,
  month: Number,
  year: Number,
  location: String,
  incomeSource: String,
  tags: [String],
  source: String,           // 'manual' | 'import'
  createdAt: Date
}
```

### 2.4 `api/models/Investment.js`

```javascript
// Investimento (ação, FII, renda fixa, etc.)
{
  profile: ObjectId,        // ref Profile
  createdBy: ObjectId,      // ref User
  type: String,             // 'stock' | 'fii' | 'fixed_income' | 'crypto' | 'other'
  ticker: String,           // ex: MXRF11, PETR4
  name: String,             // nome completo
  quantity: Number,
  averagePrice: Number,     // preço médio de compra
  currentPrice: Number,     // atualizado manualmente ou via API
  sector: String,
  broker: String,
  purchaseDate: Date,
  notes: String,
  updatedAt: Date,
  createdAt: Date
}
```

### 2.5 `api/models/Goal.js`

```javascript
// Meta financeira
{
  profile: ObjectId,
  createdBy: ObjectId,
  name: String,
  targetAmount: Number,
  currentAmount: Number,
  deadline: Date,
  illustration: String,
  status: String,           // 'active' | 'completed' | 'paused'
  createdAt: Date
}
```

---

## Fase 3 — Backend: Rotas e Autenticação

### 3.1 Estrutura de arquivos do backend

```
api/
├── server.js              → entry point
├── .env
├── models/
│   ├── User.js
│   ├── Profile.js
│   ├── Transaction.js
│   ├── Investment.js
│   └── Goal.js
├── routes/
│   ├── auth.js            → Google OAuth
│   ├── profiles.js        → CRUD perfis
│   ├── transactions.js    → CRUD transações
│   ├── investments.js     → CRUD investimentos
│   ├── goals.js           → CRUD metas
│   └── ai.js              → insights IA
├── middleware/
│   ├── auth.js            → isAuthenticated, hasProfileAccess
│   └── profile.js         → resolveProfile
└── config/
    └── passport.js        → Google OAuth config
```

### 3.2 `api/config/passport.js`

```javascript
// Configuração do Google OAuth
// Ao autenticar:
// 1. Busca usuário por googleId
// 2. Se não existe, cria novo User
// 3. Se Rodrigo (email owner), cria perfis padrão automaticamente
// 4. Retorna usuário com seus perfis populados
```

### 3.3 `api/routes/auth.js`

```
GET  /auth/google           → redirect para Google
GET  /auth/google/callback  → callback OAuth, redirect para frontend
GET  /auth/me               → retorna usuário logado + perfis
POST /auth/logout           → encerra sessão
```

### 3.4 `api/routes/profiles.js`

```
GET    /api/profiles                    → lista perfis do usuário logado
GET    /api/profiles/:profileId         → detalhes do perfil
POST   /api/profiles                    → cria novo perfil (owner only)
PUT    /api/profiles/:profileId         → edita perfil
POST   /api/profiles/:profileId/invite  → convida membro por email
DELETE /api/profiles/:profileId/members/:userId → remove membro
```

### 3.5 `api/routes/transactions.js`

```
GET    /api/profiles/:profileId/transactions        → lista com filtros
POST   /api/profiles/:profileId/transactions        → cria
PUT    /api/profiles/:profileId/transactions/:id    → edita
DELETE /api/profiles/:profileId/transactions/:id    → deleta

Query params para GET:
  ?month=11&year=2025
  ?type=expense|income
  ?category=Mercado
  ?page=1&limit=50
```

### 3.6 `api/routes/investments.js`

```
GET    /api/profiles/:profileId/investments         → lista
POST   /api/profiles/:profileId/investments         → adiciona
PUT    /api/profiles/:profileId/investments/:id     → edita (atualiza preço)
DELETE /api/profiles/:profileId/investments/:id     → remove
GET    /api/profiles/:profileId/investments/summary → resumo carteira
```

### 3.7 `api/middleware/auth.js`

```javascript
// isAuthenticated: verifica sessão ativa
// hasProfileAccess: verifica se user é owner ou member do perfil
// canWrite: verifica se member tem permissão de escrita
```

---

## Fase 4 — Frontend: Estrutura e Telas

### 4.1 Remover de `app/App.tsx`

- Toda importação de `firebase/auth`
- `onAuthStateChanged`, `getRedirectResult`
- Substituir por chamada a `GET /auth/me`

### 4.2 Nova estrutura de arquivos frontend

```
app/
├── api.ts                 → cliente HTTP (fetch wrapper)
├── App.tsx                → roteamento + auth state
├── types.ts               → interfaces TypeScript
├── contexts/
│   ├── AuthContext.tsx     → usuário logado
│   └── ProfileContext.tsx  → perfil ativo selecionado
├── components/
│   ├── common/
│   │   ├── Header.tsx      → com seletor de perfil
│   │   ├── BottomNav.tsx
│   │   ├── EmptyState.tsx
│   │   └── Icons.tsx
│   ├── Dashboard.tsx       → visão do perfil ativo
│   ├── Transactions.tsx
│   ├── Investments.tsx     → NOVO
│   ├── Reports.tsx
│   ├── Goals.tsx
│   └── Profile.tsx
├── pages/
│   ├── Login.tsx           → botão "Entrar com Google"
│   └── ProfileSelector.tsx → escolha de perfil ao entrar
└── modals/
    ├── TransactionFormModal.tsx
    ├── InvestmentFormModal.tsx  → NOVO
    ├── GoalModal.tsx
    └── ErrorModal.tsx
```

### 4.3 Fluxo de autenticação no frontend

```
1. App inicia → GET /auth/me
2. 401 → redireciona para /login
3. Login → clica "Entrar com Google" → GET /auth/google
4. Callback → backend cria/busca user → redirect frontend
5. Frontend recebe user com lista de perfis
6. Se user tem 1 perfil → entra direto
7. Se user tem 2+ perfis → mostra ProfileSelector
8. Perfil ativo salvo em context + localStorage
```

### 4.4 Header com seletor de perfil

O Header deve exibir o perfil ativo e permitir troca rápida:

```
[Avatar do perfil] Família ▼   [notificações] [avatar usuário]
                   PhanterAI
                   + Novo perfil
```

### 4.5 Tela de Investimentos (nova)

Seções:
- **Resumo**: valor total investido, rentabilidade, distribuição por tipo
- **Carteira**: lista de ativos com quantidade, preço médio, preço atual, variação
- **Adicionar ativo**: modal com tipo, ticker, quantidade, preço médio, corretora
- **Por perfil**: cada perfil tem sua carteira independente

---

## Fase 5 — `app/types.ts` Atualizado

```typescript
// Substituir o types.ts atual por:

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'member';
  profiles: Profile[];
}

export interface Profile {
  id: string;
  name: string;
  slug: string;
  owner: string;         // userId
  members: ProfileMember[];
  avatar?: string;
  color: string;
}

export interface ProfileMember {
  user: string;          // userId
  canWrite: boolean;
}

export interface Transaction {
  id: string;
  profile: string;       // profileId
  createdBy: string;     // userId
  type: 'income' | 'expense';
  amount: number;        // sempre positivo
  description: string;
  category: Category;
  paymentMethod?: PaymentMethod;
  date: string;
  month: number;
  year: number;
  location?: string;
  incomeSource?: string;
  tags?: string[];
  source: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  profile: string;
  createdBy: string;
  type: 'stock' | 'fii' | 'fixed_income' | 'crypto' | 'other';
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector?: string;
  broker?: string;
  purchaseDate: string;
  notes?: string;
}

export interface Goal {
  id: string;
  profile: string;
  createdBy: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  illustration: string;
  status: 'active' | 'completed' | 'paused';
}

export enum Category {
  Mercado = 'Mercado',
  Transporte = 'Transporte',
  Lazer = 'Lazer',
  Educacao = 'Educação',
  Contas = 'Contas',
  Saude = 'Saúde',
  Dizimo = 'Dízimo',
  Investimento = 'Investimento',
  IA = 'IA & Tecnologia',
  Marketing = 'Marketing',
  Ferramentas = 'Ferramentas',
  Outros = 'Outros',
  Entrada = 'Entrada',
}

export enum PaymentMethod {
  Debito = 'Cartão de Débito',
  CreditoAVista = 'Crédito à Vista',
  CreditoParcelado = 'Crédito Parcelado',
  Dinheiro = 'Dinheiro',
  PIX = 'PIX',
  VR = 'Vale Refeição',
  Boleto = 'Boleto',
  TED = 'TED',
}
```

---

## Fase 6 — `app/api.ts` Atualizado

```typescript
// Substituir o api.ts atual
// Base: fetch com credentials: 'include' (para session cookie)
// Sem tokens JWT, sem Firebase
// Toda rota passa pelo profileId ativo

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiFetch = (url: string, options = {}) =>
  fetch(`${API_URL}${url}`, {
    credentials: 'include',   // CRÍTICO: envia cookie de sessão
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

// Auth
getMe()                                    // GET /auth/me
logout()                                   // POST /auth/logout

// Profiles
getProfiles()                              // GET /api/profiles
createProfile(data)                        // POST /api/profiles
inviteMember(profileId, email)             // POST /api/profiles/:id/invite

// Transactions (sempre scoped ao profileId)
getTransactions(profileId, filters)        // GET /api/profiles/:id/transactions
addTransaction(profileId, data)            // POST /api/profiles/:id/transactions
updateTransaction(profileId, txId, data)   // PUT /api/profiles/:id/transactions/:txId
deleteTransaction(profileId, txId)         // DELETE /api/profiles/:id/transactions/:txId

// Investments
getInvestments(profileId)                  // GET /api/profiles/:id/investments
addInvestment(profileId, data)             // POST /api/profiles/:id/investments
updateInvestment(profileId, invId, data)   // PUT /api/profiles/:id/investments/:invId
deleteInvestment(profileId, invId)         // DELETE /api/profiles/:id/investments/:invId

// Goals
getGoals(profileId)                        // GET /api/profiles/:id/goals
createGoal(profileId, data)                // POST /api/profiles/:id/goals
updateGoal(profileId, goalId, data)        // PUT /api/profiles/:id/goals/:goalId
```

---

## Fase 7 — Google OAuth: Configuração

### 7.1 No Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Crie projeto ou use existente
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs:
   ```
   http://localhost:3001/auth/google/callback
   ```
6. Copie `Client ID` e `Client Secret` para o `.env`

### 7.2 No backend (`api/server.js`)

```javascript
// Configurar:
// - express-session com connect-mongo (sessão persistida no MongoDB)
// - passport com estratégia Google
// - CORS permitindo frontend com credentials
// - Rotas /auth/* antes das rotas /api/*
```

---

## Fase 8 — Lógica de Permissões

```
Rodrigo (owner):
  ✅ Criar perfis
  ✅ Convidar membros
  ✅ Ver/editar/deletar em TODOS os seus perfis
  ✅ Ver dashboard consolidado (Família + PhanterAI + pessoal)

Deborah (member da Família):
  ✅ Ver transações do perfil Família
  ✅ Adicionar transações no perfil Família (se canWrite: true)
  ❌ Ver perfil PhanterAI
  ❌ Criar/deletar perfis
  ❌ Remover membros

Middleware no backend:
  hasProfileAccess → verifica se user é owner ou está em members[]
  canWrite → verifica flag canWrite do member
```

---

## Fase 9 — Dashboard Consolidado (Rodrigo only)

Rodrigo, por ter múltiplos perfis, deve ter uma visão consolidada:

```
Visão: [Todos os perfis ▼] ou [Família] ou [PhanterAI]

Quando "Todos":
  - Soma total de receitas
  - Soma total de despesas
  - Saldo consolidado
  - Gráfico por perfil (comparativo)
  - Gastos por categoria (todos os perfis)

Quando perfil específico:
  - Dashboard atual com dados só daquele perfil
```

---

## Fase 10 — Ordem de Implementação no Claude Code

```
ETAPA 1 (Backend base):
  □ Criar modelos (User, Profile, Transaction, Investment, Goal)
  □ Configurar Passport + Google OAuth
  □ Implementar middleware de auth e permissões
  □ Rota GET /auth/me funcional

ETAPA 2 (Backend CRUD):
  □ Rotas de profiles (CRUD + invite)
  □ Rotas de transactions (CRUD + filtros)
  □ Rotas de investments (CRUD)
  □ Rotas de goals (CRUD)
  □ Rota de AI insights

ETAPA 3 (Frontend - Auth):
  □ Remover Firebase completamente
  □ Criar página Login (só botão Google)
  □ Implementar AuthContext
  □ Implementar ProfileContext + seletor
  □ Proteger rotas

ETAPA 4 (Frontend - Core):
  □ Atualizar api.ts (sem Firebase)
  □ Atualizar types.ts
  □ Header com seletor de perfil
  □ Dashboard com suporte multi-perfil
  □ Transações (scoped ao perfil ativo)

ETAPA 5 (Frontend - Investimentos):
  □ Tela de Investimentos
  □ InvestmentFormModal
  □ Resumo de carteira por perfil

ETAPA 6 (Polimento):
  □ Dashboard consolidado (todos os perfis)
  □ Reports por perfil
  □ Metas por perfil
  □ AI insights por perfil
```

---

## Resumo dos Arquivos que Mudam

| Arquivo | Ação |
|---|---|
| `api/server.js` | Reescrever completo |
| `api/package.json` | Adicionar passport, session, dotenv |
| `api/.env` | Criar com Google OAuth keys |
| `api/models/*` | Criar pasta e todos os models |
| `api/routes/*` | Criar pasta e todas as rotas |
| `api/middleware/*` | Criar pasta e middleware |
| `api/config/passport.js` | Criar |
| `app/firebaseConfig.ts` | **Deletar** |
| `app/firestore.*` | **Deletar** |
| `app/functions/` | **Deletar pasta** |
| `app/types.ts` | Reescrever |
| `app/api.ts` | Reescrever |
| `app/App.tsx` | Refatorar (remover Firebase, add ProfileContext) |
| `app/components/Auth.tsx` | Substituir por Login simples com Google |
| `app/components/Dashboard.tsx` | Adaptar para multi-perfil |
| `app/components/Investments.tsx` | **Criar novo** |
| `app/contexts/` | **Criar pasta** com AuthContext e ProfileContext |
| `app/package.json` | Remover firebase |
| `app/index.html` | Remover firebase do importmap |

---

## Notas para o Claude Code

1. **Sempre use `credentials: 'include'`** em todos os fetches do frontend — a sessão é baseada em cookie.

2. **O `profileId` deve estar sempre presente** nas rotas de transactions, investments e goals — nunca globais.

3. **Inicialização de perfis do Rodrigo**: ao primeiro login do owner, criar automaticamente os perfis "Família" e "PhanterAI" no backend.

4. **CORS no backend**:
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // OBRIGATÓRIO para session cookie
})
```

5. **Session store**: usar `connect-mongo` para que sessões sobrevivam a restart do servidor.

6. **Amount sempre positivo**: o `type` ('income'/'expense') determina o sinal, não o valor.