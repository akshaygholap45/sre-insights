---
name: mintoak-design
description: Use this skill to generate well-branded interfaces and assets for Mintoak (merchant-payments & SaaS fintech), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, the logo, an icon convention, and UI kit components for prototyping the merchant app, bank CRM and marketing website.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key files:
- `README.md` — brand context, content fundamentals, visual foundations, iconography.
- `colors_and_type.css` — all design tokens (color, type scale, spacing, radius, elevation) + self-hosted **Lato** `@font-face`. Import this first.
- `shadcn-theme.css` — Mintoak tokens mapped to the **shadcn/ui** CSS-variable contract (light + dark). The UI kits mirror shadcn primitives, so to export to code: copy this over a shadcn project's `globals.css`, set Lato as `fontFamily.sans`, and `shadcn add` the components (button, card, badge, input, sidebar, sheet, sonner, tabs, table, dialog, …).
- `assets/logo/` — official Mintoak logos: horizontal lockups + vertical marks in green / white / black.
- `preview/` — foundation & component reference cards.
- `ui_kits/{crm,merchant-app,website}/` — high-fidelity, click-through product recreations to copy components from.

Brand in one line: clean light SaaS fintech, **Lato** typeface, **green** accent (Deep Mint #48821C / Mint #80C341 / Bright Mint #87BD28 for graphics), **Forest Ink #222A1E** dark surfaces, **Lucide** icons, 12px rounded-rectangle buttons, soft low-spread shadows. Sentence case, plain trustworthy copy, no emoji, Indian ₹ formatting.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
