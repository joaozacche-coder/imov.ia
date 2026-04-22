# IMOV.IA — Analista Estratégico Imobiliário

Agente de IA para análise de imóveis, leilões, matrículas e regularização imobiliária.  
Stack: **Next.js + Vercel + Supabase + Anthropic API**

---

## 🚀 Setup Completo

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/imovel-ia.git
cd imovel-ia
npm install
```

### 2. Crie o arquivo `.env.local`

Copie o `.env.example` e preencha:

```bash
cp .env.example .env.local
```

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase/migrations/001_init.sql`
3. Copie as chaves em **Project Settings → API** para o `.env.local`

### 4. Rode localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## ☁️ Deploy na Vercel

1. Suba o código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repo
3. Em **Environment Variables**, adicione as 4 variáveis do `.env.local`
4. Clique em **Deploy** ✅

---

## 🗄️ Estrutura do Banco (Supabase)

| Tabela | Descrição |
|--------|-----------|
| `analyses` | Análises de imóveis com resultado, risco e recomendação |
| `documents` | PDFs enviados com texto extraído |
| `conversations` | Histórico de conversas com o agente |

PDFs ficam no **Supabase Storage** (bucket `documents`).

---

## 📁 Estrutura do Projeto

```
imovel-ia/
├── pages/
│   ├── index.tsx          # App principal (chat + análise + histórico)
│   └── api/
│       ├── chat.ts        # Endpoint do consultor IA
│       ├── analyze.ts     # Análise completa (form + PDFs)
│       └── analyses.ts    # Histórico de análises
├── lib/
│   ├── supabase.ts        # Cliente Supabase
│   └── prompts.ts         # System prompt do agente
├── styles/
│   ├── globals.css
│   └── app.module.css
└── supabase/
    └── migrations/
        └── 001_init.sql   # Tabelas e storage bucket
```

---

## ✨ Funcionalidades

- 💬 **Consultor IA** — Chat em tempo real sobre leilões, matrículas, ROI, regularização
- 🔍 **Nova Análise** — Formulário + upload de PDFs (matrícula, edital, certidões)
- 📊 **Relatório estruturado** — Resumo, riscos, impacto financeiro, recomendação
- 📂 **Histórico** — Todas as análises salvas no Supabase
- 💾 **Armazenamento** — PDFs no Storage + textos extraídos no banco
