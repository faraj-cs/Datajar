# Log File Debugger (Vercel + Next.js)

Concise log analysis mini‑agent. Upload a log file, get flagged lines and a short, actionable summary. Single tool: OpenAI.

## Quick Start

1) Install

```bash
npm install --prefix frontend
```

2) Configure env

- Copy `.env.example` to `frontend/.env.local`
- Set `OPENAI_API_KEY`

```bash
cp .env.example frontend/.env.local
# edit frontend/.env.local and set OPENAI_API_KEY
```

3) Run

```bash
npm --prefix frontend run dev
```

Visit http://localhost:3000 and upload a `.log`/`.txt` file.

## Deploy to Vercel

- Framework: Next.js
- Root Directory: `frontend`
- Build Command: default (`npm run build`)
- Output Directory: auto
- Env Vars:
  - `OPENAI_API_KEY` (required)
  - `OPENAI_MODEL` (optional, default `gpt-4o-mini`)

## Notes

- Single tool only: OpenAI via `src/app/api/log/route.ts`
- No separate backend or database.
- API keys remain server‑side.