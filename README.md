# 🌌 OmniAI Workspace

**Production-ready AI content generation platform** with multi-provider support, secure API key management, and global deployment.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Multi-Provider AI** | OpenAI, Google Gemini, NVIDIA - configure per user |
| **Secure Key Storage** | API keys encrypted at rest, never exposed to client |
| **4 AI Tools** | Generate, Rewrite, Summarize, Translate |
| **User Auth** | Supabase Auth with RLS policies |
| **Projects & History** | Organize and revisit generations |
| **Global CDN** | Vercel edge network for fast loads |
| **CI/CD** | GitHub Actions for automated deploy |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- Vercel account
- At least one AI provider API key

### 1. Clone & Install
```bash
git clone https://github.com/your-org/OmniAI-Workspace.git
cd OmniAI-Workspace
npm install
```

### 2. Configure Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run migrations in Supabase SQL Editor (or `supabase db push` locally)
3. Deploy edge functions: `supabase functions deploy`

### 3. Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Deploy
```bash
# Push to GitHub - CI/CD handles the rest
git push origin main
```

Or deploy manually:
```bash
# Frontend
vercel --prod

# Backend
supabase db push
supabase functions deploy
```

---

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │  Supabase   │     │ AI Providers│
│  (Frontend) │◄───►│  (Backend)  │◄───►│  (OpenAI,   │
│             │     │             │     │  Gemini,    │
│ - React App │     │ - Postgres  │     │  NVIDIA)    │
│ - Edge CDN  │     │ - Auth      │     │             │
└─────────────┘     │ - Edge Funcs│     └─────────────┘
                    │ - Vault     │
                    └─────────────┘
```

### Data Flow
1. **Configure**: User adds API key in Settings → stored encrypted in `ai_provider_configs`
2. **Generate**: User requests content → calls Supabase Edge Function
3. **Process**: Edge Function decrypts key → calls AI provider → saves to `generations`
4. **Display**: Frontend shows result with metadata

---

## 📁 Project Structure

```
OmniAI-Workspace/
├── .github/workflows/ci-cd.yml    # CI/CD pipeline
├── supabase/
│   ├── config.toml                # Local Supabase config
│   ├── functions/                 # Edge Functions (Deno)
│   │   ├── ai-generate/           # Content generation
│   │   ├── ai-rewrite/            # Content rewriting
│   │   ├── ai-summarize/          # Text summarization
│   │   ├── ai-translate/          # Translation
│   │   └── ai-config/             # API key management
│   └── migrations/                # Database migrations
├── src/
│   ├── components/
│   │   ├── ai/                    # Model/Enhancer selectors
│   │   ├── assistant/             # Dashboard panels
│   │   ├── auth/                  # Auth + SettingsPanel
│   │   ├── layout/                # Sidebar, header
│   │   ├── tools/                 # UnifiedAITool (main)
│   │   ├── ui/                    # Reusable UI components
│   │   └── workspace/             # Projects, History
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + types
│   │   └── ai/                    # Legacy clients (deprecated)
│   ├── types/ai.ts                # TypeScript types
│   └── App.tsx
├── Dockerfile                     # Multi-stage build
├── nginx.conf                     # Production nginx config
├── vercel.json                    # Vercel config
└── package.json
```

---

## 🔐 Security

- **API Key Encryption**: pgcrypto / Web Crypto API
- **Row Level Security**: All tables protected by RLS
- **User Isolation**: Users only access own data
- **Server-side AI Calls**: Keys never touch client
- **CSP Headers**: Configured in nginx & Vercel

---

## 🛠 Development

```bash
# Local Supabase
supabase start

# Local dev server
npm run dev

# Local edge functions
supabase functions serve

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

---

## 📦 Adding New AI Providers

1. Add to `ai_provider_configs` CHECK constraint (migration)
2. Add case in edge functions' switch statements
3. Add provider UI in `SettingsPanel.tsx`
4. Add models to `PROVIDER_MODELS`
5. Deploy migrations & functions

---

## 💰 Cost Estimation (Monthly)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth | $20/mo |
| Supabase | 500MB DB, 2GB BW | $25/mo |
| OpenAI | $5 credit | Pay per token |
| Gemini | Generous free tier | Pay per token |
| NVIDIA | Free tier | Pay per token |

---

## 📄 License

MIT License - Use freely for personal or commercial projects.

---

## 🤝 Contributing

1. Fork → feature branch → PR
2. Run `npm run lint && npx tsc --noEmit`
3. Add tests for new features

---

## 📞 Support

- **Issues**: GitHub Issues
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **AI APIs**: Check provider status pages

---

Built with ❤️ for the next generation of AI-driven productivity.