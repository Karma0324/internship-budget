# Internship Budget Manager

A self-contained web app for planning and tracking your internship finances — income, expenses, savings goals, and daily spending — all in one place, no account required.

**Live:** https://karma0324.github.io/internship-budget/

---

## Features

**Income calculator**
- Set your hourly rate (supports cents), hours/week, and work weeks
- Auto-calculates work weeks from internship start/end dates
- City tax rate presets for 60+ US cities with FICA breakdown
- Add a stipend or signing bonus as gross income

**Expenses**
- Editable monthly expense categories with a spending breakdown chart
- Add, rename, and delete categories
- Total auto-scales to your internship length

**Goals & savings**
- Create savings goals with custom names and icons
- Log actual contributions with dates and notes
- Dual progress bar: actual saved vs. projected by internship end
- "On track / Behind pace" indicator based on remaining weeks
- Confetti when a goal hits 100%
- Drag to reorder by priority

**Daily spending tracker**
- Log daily expenses by category
- Pace bar showing if you're on track vs. your monthly budget
- Entries persist across sessions

**Strategy**
- Auto-generated personalized strategy based on your real numbers
- Editable — make it your own
- AI chatbot (bring your own Anthropic API key) can adjust any value or rewrite the strategy via natural language

**Other**
- Dark mode toggle (also auto-detects system preference)
- Share link — encodes your full budget into a URL so others can open your exact setup
- Everything persists to `localStorage` — your data stays on your device

---

## Usage

Open the live link above, or clone and open `index.html` directly in any browser — no build step, no dependencies beyond the CDN icon font.

```bash
git clone https://github.com/Karma0324/internship-budget.git
open internship-budget/index.html
```

### AI chatbot

The chatbot uses the [Anthropic API](https://console.anthropic.com/) (Claude Haiku). To use it:
1. Click the chat button (bottom right)
2. Paste your `sk-ant-...` API key — it's never stored or sent anywhere except directly to Anthropic
3. Ask it anything: *"Set my rent to $1,400"*, *"I make $55.50/hr"*, *"Rewrite my strategy"*

Each user who opens the app uses their own API key and is billed to their own account.

---

## Deploying updates

```bash
cp ~/Documents/nyc-budget-manager.html ~/Documents/budget-app/index.html
cd ~/Documents/budget-app
git add index.html && git commit -m "Update" && git push
```

GitHub Pages rebuilds automatically on push (~60 seconds).

---

## Tech

Single HTML file — all CSS and JS inline, no framework, no build tools. Uses:
- [Tabler Icons](https://tabler.io/icons) (CDN)
- Anthropic Messages API via `fetch()` for the chatbot
- `localStorage` for persistence
- URL hash for shareable state encoding
