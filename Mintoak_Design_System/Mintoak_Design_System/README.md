# Mintoak Design System ("MintDS 1.0.0")

A working design system for **Mintoak** — a merchant‑payments & SaaS fintech platform. Mintoak builds white‑labelled merchant solutions distributed through banks: a **merchant payments app**, a **CRM / relationship‑management web platform** for bank staff, and a **marketing website**. The brand centres on a stylised green **oak‑tree mark** and the **mintOak** wordmark, expressing growth, trust and "minting" value for small merchants.

This repository turns the Figma file **"MintDS 1.0.0"** into design‑agent‑ready assets: brand foundations (color, type, spacing, elevation), the logo, an icon convention, and high‑fidelity **UI kits** that recreate the real product surfaces.

> The product is a fintech platform; treat all currency, merchant and settlement copy as illustrative sample data.

---

## Sources

- **Figma file:** `MintDS 1.0.0.fig` (mounted, read‑only). Pages explored: Logo, Color, Typography, Spacing, Elevation‑shadow, Icon, App‑header (incl. **CRM Header**, **Website Header**), Side‑bar, Bottom‑navigation, Bottom‑sheet, Badge, Button, cards, Charts, plus form components (Input, Checkbox, Radio, Date‑picker, OTP, Upload, etc.) and the **Brand Color Change Proposal** ("Almaas" / "Roslin" rebrand sheets — the canonical current palette).
- The system is assembled on top of three open references, re‑skinned in Mintoak green: **Ant Design** (color tokens, control aliases), **IBM Carbon** (type & spacing token naming), and **shadcn/ui + Lucide** (sidebar, app shell, icons).

No code repository was provided — UI kits are reconstructed from the Figma design source, not production code.

---

## Brand at a glance

| | |
|---|---|
| **Mark** | Abstract layered **oak tree** (sprout → canopy), flat brand green. Official SVGs in `assets/logo/`. |
| **Wordmark** | `mintOak` — lowercase rounded geometric, capital **O**. Official horizontal & vertical lockups in `assets/logo/` (green / white / black). |
| **Primary green** | Deep Mint `#48821C` (accessible on white) · Mint `#80C341` (legacy fills) · Bright Mint `#87BD28` (graphics only) |
| **Dark brand** | Forest Oak `#2A4D1F` / Forest Ink `#222A1E` (nav, sidebar, reversed lockups) |
| **Type** | **Lato** (the Mintoak typeface — UI & product), IBM Plex Mono (data/code) |
| **Feel** | Clean, light, data‑dense but airy; SaaS‑professional with a friendly green accent |

---

## CONTENT FUNDAMENTALS

How Mintoak writes. The product is bank‑facing and merchant‑facing fintech, so copy is **plain, direct and trustworthy** — never playful to the point of being unserious about money.

- **Voice:** Professional, helpful, confident. Reads like a competent colleague, not a marketer. Avoids hype words ("revolutionary", "seamless‑synergy").
- **Person:** Addresses the user as **you** ("Your account has been successfully verified", "Funds have been transferred"). System refers to itself implicitly, rarely "we".
- **Casing:** **Sentence case** everywhere — buttons, menu items, headings, table headers ("Total volume", "Recent merchant", "Accept payment"). Title Case is reserved for proper product names (CRM, UPI, KYC, GSTIN). Never ALL‑CAPS except tiny eyebrow labels.
- **Tone by surface:** Marketing site is slightly more aspirational ("Products", "Solutions", "Pricing"); the CRM and merchant app are terse and functional ("Settled", "Pending", "Settlement complete").
- **Microcopy:** Short, status‑first. Tags are single words: *Settled · Pending · Failed · Active*. Toasts state the outcome then the detail ("Settlement complete — ₹4,82,300 credited to HDFC ••4521").
- **Numbers & money:** Indian formatting — `₹` symbol, lakh grouping (`₹ 4,82,300`), masked account tails (`••4521`). Dates are plain ("Onboarded 2 days ago").
- **Emoji:** **None** in product UI. Status is carried by color + icon, not emoji.
- **Examples:** "A comprehensive style guide for the Mintoak SaaS platform" · "Your account has been successfully verified." · "3 merchants need re‑verification this week." · "Accept payment →".

---

## VISUAL FOUNDATIONS

The Mintoak look is **light, neutral and structured**, with green used as a precise accent rather than a flood.

- **Color usage:** Backgrounds are white `#FFFFFF` and layout grey `#F5F5F5`; the brand‑tinted surface `#F4F9F2` (Mint Tint) appears behind hero/empty states. Green is concentrated in primary buttons, active states, avatars, the logo and small accents — it never fills large areas. **Dark Forest Ink surfaces are deliberate attention‑grabbers** — because a dark block pulls the eye to itself, reserve it for focus moments (marketing hero/footer & stats band, the mobile balance header) and keep default app chrome light, content‑first (e.g. the CRM uses a light sidebar). Text is near‑black `#1C1C1C` with a warm‑grey secondary `#434240` and tertiary `#928F8B`.
- **Type:** **Lato** everywhere — the Mintoak typeface (humanist sans, warm and highly legible). Default body **14/22** (Ant convention), weights Regular/Bold/Black. Headings use Forest Oak `#2A4D1F` and tight tracking (‑0.01em). Data/amounts often set in IBM Plex Mono.
- **Spacing & layout:** 4px base grid (4‑8‑12‑16‑24‑32‑40‑48, then 64/80/96 for page rhythm). Generous whitespace; content sits in 1200px doc columns or app shells with a 240–280px sidebar and 64px header.
- **Corner radii:** 4px on inputs/buttons (small), 6–8px on default controls, **8–12px on cards & modals**, 16px avatars, full‑round for chips, pills and avatars. Nothing is sharp‑cornered.
- **Cards:** White fill, **1px `#F0F0F0` hairline border**, radius 12, very soft `shadow-sm`/`shadow` (low spread, ~10% black). Not heavy, not flat — a quiet lift off the grey background. No colored left‑border accent cards.
- **Borders & dividers:** 1px, `#D9D9D9` for inputs, `#F0F0F0`/`#E8E8E6` for structural hairlines, `rgba(0,0,0,.06)` splits.
- **Elevation:** Tailwind‑style soft shadow ramp (`sm → 2xl`) plus `inner`. Used for cards, popovers, dropdowns, modals and toasts; modals add a scrim.
- **Backgrounds:** Solid colors and the Mint Tint wash. **No** noisy gradients, no purple/blue AI gradients, no photographic hero textures in‑product. The only gradient is the **logo mark's** vertical green ramp (#A4D233 → #80C341 → #4E9A2E).
- **Imagery vibe:** When photography is used (marketing), it skews bright, warm and human (merchants, shops). Product UI is illustration‑light and chart‑forward.
- **Data viz:** A dedicated categorical palette (blue/teal/amber/violet/coral + two greens) keeps charts readable while green stays the brand anchor.
- **Motion:** Restrained. Short fades and ~150–200ms ease transitions on hover/expand; no bounces, no infinite decorative loops. Skeletons for loading.
- **Hover states:** Primary buttons darken (mint → mint‑600); ghost/text gain a faint mint‑tint fill; rows get a `#F5F5F5` wash. **Press:** slightly darker again (mint‑700), no scale‑down.
- **Focus:** 3px soft green ring `rgba(128,195,65,.2)` + mint‑600 border. Error swaps to a red ring.
- **Transparency/blur:** Sparing — modal scrims and the occasional frosted header. Not a glassmorphism system.

---

## ICONOGRAPHY

- **Icon set:** **Lucide** (the open‑source successor to Feather) — consistent ~1.75px stroke, rounded joins, 24px grid. The Figma "Icon / Icon‑24" page is the Lucide library; the app shell, sidebar and nav all draw from it.
- **In these files:** load Lucide from CDN — `https://unpkg.com/lucide@latest` (or `lucide-static` SVGs). Use `data-lucide="name"` markup, or inline the SVG. Stroke color inherits `currentColor`; size 16/20/24.
- **Brand mark:** the oak tree is **not** a Lucide icon — it is the logo. Use the official SVGs in `assets/logo/` — `mintoak-horizontal-{green,white,black}.svg` (full lockup), `mintoak-mark-{green,white,black}.svg` (stacked mark + wordmark), and `mintoak-symbol-{green,white,black}.svg` (oak symbol only, for avatars/favicons/tight spots). Pick white on Forest Ink, green/black on light.
- **Emoji:** never used as UI iconography. **Unicode** is used only for tiny inline glyphs (arrows `→`, chevrons, check `✓`, status dots).
- **Style rules:** line icons only (no filled/duotone), match Lucide weight, keep 24px touch alignment, pair an icon with a color for status rather than relying on color alone.

---

## Files in this repo

| Path | What |
|---|---|
| `colors_and_type.css` | All design tokens — color, type scale, spacing, radius, elevation. Import this first. |
| `shadcn-theme.css` | **Export helper** — Mintoak tokens mapped to the shadcn/ui CSS‑variable contract (light + dark). |
| `assets/logo/` | Official Mintoak logos — horizontal lockups + vertical marks, in green / white / black. |
| `preview/` | Design‑System tab cards (foundations + components + brand). |
| `ui_kits/crm/` | **CRM web platform** UI kit (app shell, dashboard, contacts, merchant detail). |
| `ui_kits/merchant-app/` | **Merchant mobile app** UI kit (dashboard, transactions, payment, settlement). |
| `ui_kits/website/` | **Marketing website** UI kit (header, hero, products, footer). |
| `SKILL.md` | Agent‑Skill manifest so this system can be used in Claude Code. |

**Start here:** import `colors_and_type.css`, then open the relevant `ui_kits/<product>/index.html`.

---

## Exporting to code (shadcn/ui)

The UI kits are built to mirror **[shadcn/ui](https://ui.shadcn.com)** primitives, so this system drops straight into a shadcn + Tailwind + React codebase:

1. Copy `shadcn-theme.css` over the `:root` / `.dark` blocks in your project's `globals.css` — it maps every Mintoak token onto shadcn's variable contract (`--primary`, `--background`, `--muted`, `--ring`, `--sidebar-*`, `--chart-*`, `--radius`, …).
2. Set Lato as `fontFamily.sans` in `tailwind.config` (self-host from `/fonts`).
3. `npx shadcn@latest add button card badge input sidebar sheet sonner tabs table dialog avatar tooltip dropdown-menu` — they'll inherit the theme automatically.
4. Use **Lucide** (shadcn's default icon set) and the `assets/logo/` SVGs for branding.

The kit `.jsx` files are cosmetic recreations for reference — read them for layout/spacing intent, then render the real shadcn components against the theme.

