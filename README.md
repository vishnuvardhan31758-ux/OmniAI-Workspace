# 🌌 OmniAI Workspace

OmniAI Workspace is a comprehensive, multi-model AI orchestration platform designed to provide a unified interface for the world's most powerful large language models. It transforms the AI experience from a simple chat interface into a professional productivity ecosystem.

## ✨ Key Features

### 🤖 Multi-Model Integration
Access a diverse array of AI intelligence from a single dashboard:
- **Google Gemini**: High-performance multimodal capabilities.
- **OpenAI GPT Series**: Industry-leading reasoning and creativity.
- **Custom Model Selection**: Choose between **Language**, **Creative**, **Analytical**, and **Multimodal** model categories based on your specific task.

### 🛠 Professional Workspace
Beyond chatting, OmniAI provides a structured environment for power users:
- **Assistant Dashboard**: A centralized hub for AI interaction.
- **Device Control Panel**: Interface for system-level AI integrations.
- **Voice Commands**: Hands-free interaction for seamless workflow.
- **System Monitor**: Real-time tracking of AI performance and system health.
- **Project & History Management**: Organize your AI conversations into projects and access your history effortlessly.

### ⚙️ Advanced Configuration
- **API Key Management**: Securely configure your own API keys for Gemini and OpenAI.
- **Parameter Control**: Fine-tune AI output using temperature and token limits.
- **Streaming Responses**: Real-time, token-by-token content generation for a natural experience.

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React
- **Backend/Auth**: Supabase (Database & Edge Functions)
- **AI Clients**: `@google/generative-ai`, `openai`
- **Routing**: React Router DOM

## 📦 Installation & Setup

### Local Development
1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_BLACKBOX_API_KEY=your_gemini_key
   VITE_OPENAI_API_KEY=your_openai_key
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🗺️ Project Structure
- `src/components/ai`: Model selection and API setup logic.
- `src/components/assistant`: Core dashboard and control panels.
- `src/lib/ai`: Custom clients for Gemini and OpenAI integration.
- `src/lib/voice`: Speech recognition and voice command logic.
- `supabase/`: Database migrations and AI-powered edge functions.

---
**Built for the next generation of AI-driven productivity.**
