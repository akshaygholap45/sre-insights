# Mintoak Merchant App — UI Kit

High-fidelity mobile recreation of the **Mintoak merchant app** — the white-labelled payments app small merchants use to collect and track payments.

## Run
Open `index.html` (single-file React in `App.jsx`). Loads `../../colors_and_type.css` + Lucide CDN. Rendered inside a 390×844 phone frame.

## Screens / flows (bottom-nav)
- **Dashboard** — dark Forest header with today's collection, floating quick-action card, recent payments.
- **Transactions** — filterable list (All / UPI / Card / Failed) with status.
- **Payment** — center FAB → amount keypad → **"Show QR" → success** confirmation screen.
- **Settlement** — next settlement card + settled history.
- **Profile** — merchant identity + settings list.

## Notes
- Active nav = green top indicator + green label; center **Payment FAB** is a raised mint circle.
- Money formatted in Indian grouping (₹ 42,155). Sample data only.
