# Mintoak Bank CRM — UI Kit

High-fidelity, click-through recreation of the **Mintoak CRM** — the web platform bank relationship managers use to onboard, monitor and serve their merchant portfolio.

## Run
Open `index.html`. Loads `../../colors_and_type.css` (tokens + Lato) and Lucide from CDN.

## Screens / flows
- **Dashboard** — greeting, KPI stat cards, weekly volume chart, recent-activity feed.
- **Merchants** — searchable table; click any row to open the **merchant detail drawer** (status, VPA, settlement account, actions).
- **Transactions / Settlements / Reports / Settings** — placeholder states with on-brand empty cards.

## Components (`*.jsx`)
- `Primitives.jsx` — `Icon` (Lucide), `Button` (primary/deep/ghost/neutral/text/danger), `Badge`, `Avatar`, `Input`, `Card`.
- `Shell.jsx` — dark **Forest Ink** sidebar (green active state) + light header (breadcrumbs, search, notifications, avatar).
- `Dashboard.jsx`, `Merchants.jsx`, `App.jsx` (route state).

## Notes
- Each `.jsx` is loaded via `<script type="text/babel" src>` and exports its components to `window` (separate Babel scopes).
- Buttons use 12px rounded-rectangle radius; cards use 12px + soft `shadow-sm`.
- Sample data only (merchants, amounts in ₹).
