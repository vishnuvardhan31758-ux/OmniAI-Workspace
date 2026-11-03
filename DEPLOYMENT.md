# OmniAI Workspace - Production Deployment Guide

## 🎯 Overview
This is a production-ready AI content generation platform with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **AI Providers**: OpenAI, Google Gemini, NVIDIA (configurable per user)
- **Deployment**: Vercel (frontend) + Supabase (backend) + GitHub Actions CI/CD

---

## 📋 Prerequisites

1. **GitHub Account** - For CI/CD and container registry
2. **Vercel Account** - For frontend hosting
3. **Supabase Account** - For backend (database, auth, edge functions)
4. **AI Provider API Keys** - At least one of:
   - OpenAI API key (`sk-...`)
   - Google Gemini API key (from Google AI Studio)
   - NVIDIA API key (`nvapi-...` from NGC)

---

## 🚀 Quick Deploy

### 1. Create Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Create new project
# Note your: Project URL, Anon Key, Service Role Key, Database Password
```

### 2. Configure GitHub Repository Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions → Add:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | From Vercel CLI: `vercel inspect <deployment-url>` |
| `VERCEL_PROJECT_ID` | From Vercel CLI: `vercel inspect <deployment-url>` |
| `SUPABASE_PROJECT_REF` | Your Supabase project ref (from URL) |
| `SUPABASE_DB_PASSWORD` | Your Supabase database password |
| `SUPABASE_ACCESS_TOKEN` | From Supabase Dashboard → Access Tokens |

### 3. Deploy
```bash
# Push to main branch - CI/CD will handle everything
git push origin main
```

---

## 🔧 Local Development

### Setup
```bash
# Clone and install
git clone <your-repo>
cd OmniAI-Workspace-main
npm install

# Copy env template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

### .env.local Template
```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Default AI keys for development (override per-user in UI)
VITE_OPENAI_API_KEY=sk-...
VITE_GEMINI_API_KEY=...
VITE_NVIDIA_API_KEY=nvapi-...

# App
VITE_APP_TITLE=OmniAI Workspace
```

### Run Locally
```bash
# Start Supabase locally (optional)
supabase start

# Run dev server
npm run dev
```

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Vercel       │     │    Supabase      │     │   AI Providers  │
│   (Frontend)    │◄───►│  (Backend)       │◄───►│  (OpenAI,       │
│                 │     │                  │     │   Gemini,       │
│  - React App    │     │  - PostgreSQL    │     │   NVIDIA)       │
│  - Edge Cache   │     │  - Auth          │     │                 │
│  - Global CDN   │     │  - Edge Funcs    │     │                 │
└─────────────────┘     │  - Vault/Secrets │     └─────────────────┘
                        └──────────────────┘
```

### Data Flow
1. User configures AI provider in Settings → saved to `ai_provider_configs` (encrypted)
2. User requests generation → calls Supabase Edge Function (`ai-generate`, etc.)
3. Edge Function:
   - Verifies user auth
   - Retrieves user's active AI config
   - Decrypts API key
   - Calls AI provider API
   - Saves result to `generations` table
   - Returns response
4. Frontend displays result

---

## 📦 Project Structure

```
OmniAI-Workspace-main/
├── .github/workflows/ci-cd.yml    # CI/CD pipeline
├── supabase/
│   ├── config.toml                # Supabase local config
│   ├── functions/                 # Edge Functions
│   │   ├── ai-generate/           # Content generation
│   │   ├── ai-rewrite/            # Content rewriting
│   │   ├── ai-summarize/          # Text summarization
│   │   ├── ai-translate/          # Translation
│   │   └── ai-config/             # API key management
│   └── migrations/                # Database migrations
├── src/
│   ├── components/
│   │   ├── ai/                    # AI model selection, settings
│   │   ├── assistant/             # Dashboard, panels
│   │   ├── auth/                  # Auth forms, SettingsPanel
│   │   ├── layout/                # Sidebar, header
│   │   ├── tools/                 # Unified AI tool
│   │   ├── ui/                    # Reusable UI components
│   │   └── workspace/             # Projects, History
│   ├── hooks/                     # Custom React hooks
│   ├── lib/
│   │   ├── ai/                    # AI clients (legacy - being replaced)
│   │   ├── supabase.ts            # Supabase client + types
│   │   └── ...                    # Utilities
│   ├── types/                     # TypeScript types
│   └── ...
├── Dockerfile                     # Multi-stage Docker build
├── nginx.conf                     # Nginx config for production
├── vercel.json                    # Vercel deployment config
└── package.json
```

---

## 🔐 Security Features

- **API Key Encryption**: Keys encrypted at rest using pgcrypto / Web Crypto API
- **Row Level Security**: All tables protected by RLS policies
- **User Isolation**: Users only access their own data/configs
- **Server-side AI Calls**: API keys never exposed to client
- **CSP Headers**: Configured in nginx and Vercel
- **Rate Limiting**: Add via Supabase Edge Function middleware (TODO)

---

## 🛠 Adding New AI Providers

1. Add provider to `ai_provider_configs` migration CHECK constraint
2. Add case in edge functions' switch statements
3. Add provider config UI in `SettingsPanel.tsx`
4. Add model list in `PROVIDER_MODELS`
5. Deploy migrations and functions

---

## 📝 Environment Variables Reference

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `VITE_APP_TITLE` | No | App title |

### Supabase Edge Functions (auto-injected)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Auto-injected |
| `SUPABASE_ANON_KEY` | Yes | Auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin ops | Set in Supabase Dashboard → Settings → Edge Functions |

---

## 🧪 Testing Edge Functions Locally

```bash
# Start Supabase local dev
supabase start

# Serve functions locally
supabase functions serve --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-generate \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a haiku","contentType":"poem","tone":"creative","length":"short"}'
```

---

## 📊 Monitoring & Observability

### Recommended Additions
- **Sentry** - Error tracking (add to frontend + edge functions)
- **Vercel Analytics** - Web vitals
- **Supabase Logs** - Edge function logs in Dashboard
- **Custom Metrics** - Track generations, costs, errors

---

## 💰 Cost Optimization

- **Vercel**: Free tier covers most hobby projects
- **Supabase**: Free tier (500MB DB, 2GB bandwidth, 500MB edge functions)
- **AI APIs**: Pay per token - implement usage tracking per user

---

## 🐛 Troubleshooting

### Build Fails
- Check Node version (20+)
- Clear cache: `npm ci --prefer-offline`
- Check TypeScript errors: `npx tsc --noEmit`

### Edge Function Errors
- Check Supabase Dashboard → Edge Functions → Logs
- Verify environment variables in Supabase project settings
- Test API keys independently

### Auth Issues
- Confirm Supabase URL and Anon Key are correct
- Check RLS policies in SQL editor
- Verify email confirmation settings in Supabase Auth

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes with tests
4. Submit PR

---

## 📞 Support

- Open GitHub Issues for bugs
- Check Supabase/Vercel docs for platform issues
- AI API issues → check respective provider status pages