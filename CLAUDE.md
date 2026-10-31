# Mindfuels — project brief and rules for Claude Code

Read this file fully before doing any work in this project.

## 1. Safety rules (never break these)

The live website runs from the `main` branch on Hostinger and takes real orders.
All redesign work happens on the `ui-redesign` branch.

- Never switch to, commit to, push to, or merge into `main`. Never run `git push`, `git merge`, `git rebase`, `git reset --hard` or `git push --force` unless the owner explicitly asks in this session.
- Never edit, print or commit `.env` files or any secret keys. If a change needs a new environment variable, tell the owner what to add instead.
- Never write to the production database. Do not run migrations, seed scripts, `DELETE`/`UPDATE`/`DROP` queries, or any script that changes data, unless the owner confirms the database is the staging copy.
- Never use live Razorpay keys (`rzp_live_...`) for testing. Payment testing only with test keys (`rzp_test_...`).
- Do not delete files. Do not install packages without asking first.
- Before editing, list the files you plan to change and wait for an OK. Keep changes inside the agreed files.
- Do not change working logic (cart, payment, auth, orders, admin, APIs) unless the task explicitly asks for it. When a task does touch logic, explain the change and how to test it.
- After each task, summarise what changed and give a short test checklist (desktop + phone).

## 2. The business

- **Mindfuels Publisher and Distributors** — 20 years in children's educational publishing (Sri Nagar, Delhi 110034). Schools, teachers, parents and children love the books.
- **USP: practice worksheets and worksheet assignment books.** The whole site is built around this.
- **Hero headline:** "Fuel Your Child's Imagination"
- **Audience:** parents (main buyers), teachers and schools, students. Most visitors are on mobile phones, often mid-range Android on 4G.
- **Delivery:** 4–5 business days, pan-India, shipped by Mindfuels itself. Store this in ONE config constant and use it everywhere.
- **Returns:** offered (exact policy to be confirmed by the owner — keep it in the same config).
- **Payments:** Razorpay (UPI, cards). **Login:** Auth0.
- **Testimonials:** videos already on the site.
- **Product images:** many products do not have proper photos yet (some are Amazon listing URLs, to be replaced later). Every image spot must handle a missing or broken image with a branded placeholder, never a broken icon or layout shift.

## 3. What "good" means here

The goal is a store that brings customers, not just a pretty site.

- **Mobile-first, desktop-friendly.** Design for a 360px-wide phone first.
- **Fast on any device.** No jank, no layout shift, small bundles, lazy-load below the fold, WebP images with width/height.
- **Clear buying path:** find a book by class/age/subject → see what's inside → add to cart → pay. Fewer taps is better.
- **Trust for parents:** 20 years, schools served, real testimonials, delivery and returns shown near the buy button.
- **Playful for kids, calm for parents:** calm base, playful accents (age-group colours, friendly shapes). No heavy glassmorphism.
- **Buttons that invite action** (e.g. "Peek inside", "Start practising"), large touch targets (min 44px), clear feedback on every tap.
- **Accessibility:** WCAG AA contrast, real links and buttons, keyboard and screen-reader friendly, visible focus.

## 4. Tech notes

- `frontend/` — React. Styles live in inline styles, component `<style>` blocks and `src/index.css` (design tokens go here).
- Motion is already set up: `App.jsx` wraps the app in `LazyMotion strict` + `MotionConfig reducedMotion="user"`. Use `m.*` components from `motion/react` and the presets in `src/utils/motionPresets.js`. No new animation packages.
- Motion should be subtle, fast, purposeful, and always respect reduced motion. Never animate in a way that hurts performance on low-end phones.
- `backend/` — API, database (Hostinger MySQL), Razorpay, order handling.
- Skills available: `/ui-ux-pro-max` for design, `/motion` for animation.

## 5. Growth goals (later phases)

- **SEO:** real crawlable product and category URLs, per-page titles/descriptions, Product/Offer/Organization/FAQ/Breadcrumb structured data (JSON-LD), sitemap, prerendered HTML for key pages.
- **GEO/AEO (AI and answer engines):** clear factual pages that answer parents' questions (which worksheets for which class, what's inside each book), FAQ content, `llms.txt`.
- **Email marketing:** consent-based. Abandoned-cart reminder, post-purchase follow-up about a week later with recommendations and an offer. Every marketing email needs an unsubscribe link.
- **Owner order alerts:** automatic notification to the owner for every new order, without depending on the customer pressing send.
