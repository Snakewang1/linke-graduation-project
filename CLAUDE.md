# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run lint      # Run ESLint (flat config)
npm run preview   # Preview production build
```

No test runner is configured. Dependencies are managed with npm.

## Architecture overview

This is a **React 19 + Vite 8 + Tailwind CSS 3** single-page application — the **LinkE (领客) collaboration platform** frontend demo, built as part of a graduation thesis. It has no backend; all data is mock and all state is local React state.

### Routing & navigation

There is no router library. Tab-based navigation via `App.jsx` state variable `tab` with four views:

| Tab ID | Component | Purpose |
|--------|-----------|---------|
| `workbench` | `Workbench.jsx` | App launcher with nested navigation (app → module → form), admin dashboard with sales metric |
| `messages` | `Messages.jsx` | Chat list + full-screen chat overlay with multi-turn DeepSeek AI |
| `todo` | `TodoList.jsx` | Filterable task cards with status workflow, AI summary generation, mobile swipe gestures |
| `profile` | `Profile.jsx` | Role switcher, API key input, integration status display, entry to ApiConsole (admin only) |

Desktop uses a left sidebar; mobile uses a fixed bottom tab bar.

### Data layer

- `src/data/mock.js` — all mock data: users (admin/staff roles), todos, messages with chat history, integrations (ERP/OA/CRM/Finance), and `APP_MENUS` (the workbench navigation tree with form field definitions)
- All state is React `useState`/`useReducer`-style, lifted to `App.jsx`
- DeepSeek API key is persisted in `localStorage` under `"deepseek_api_key"`

### AI integration (`src/api/deepseek.jsx`)

- Calls `https://api.deepseek.com/chat/completions` with model `deepseek-chat`
- System prompt differs by role (`admin` → strategic/MBA-level responses calling user "张总", `staff` → task-level guidance)
- `callDeepSeek` supports both a legacy `(prompt, apiKey)` signature and an options-object signature `({ prompt, apiKey, role?, history? })` for multi-turn chat
- `formatContent` handles `**bold**` markdown rendering

### Key interaction patterns

- **Workbench** uses a `navStack` array as a simple stack-based sub-navigation (root → app → module → form), replacing react-router
- **Messages** uses a separate `chatHistories` state (keyed by message ID) to maintain local mutable copies of conversation history, decoupled from the list view's message metadata. Only chat ID 11 (AI assistant) triggers API calls on send
- **TodoList** supports swipe-left (advance status: pending → processing → done) and swipe-right (revert: processing → pending) on mobile via touch events
- **ApiConsole** (admin-only, accessed from Profile) simulates push/pull API calls to four enterprise systems (电商/ERP/OA/CRM), creates todos via `onPushTodo` callback, and maintains a webhook log

## Thesis code

Python scripts in the project root (`build_thesis.py`, `fix_thesis.py`, `final_citations_v2.py`, `clean_and_reinsert.py`, `reinsert_citations.py`, `final_citations.py`) manipulate a Word document (`LinkE协同_毕业论文.docx`) for the graduation thesis — inserting citations, fixing formatting, etc. Reference papers are in `引用论文/`. MATLAB chart generation scripts are in `matlab图表/`.

These Python scripts depend on `python-docx` and other libraries. They are thesis-building tooling, not part of the web application.
