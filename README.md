# Mindfuels E-Commerce Platform

A full-stack, production-ready e-commerce website for **Mindfuels** — a children's book publisher. Built with React (Vite) frontend and Node.js/Express backend, deployed as two separate Render services.

---

## 🗂️ Project Structure

```
MINDFUELS/
├── backend/           # Node.js Express REST API
│   ├── config/        # Database pool
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Auth0 JWT + rate limiting
│   ├── routes/        # API route definitions
│   ├── services/      # Google Sheets sync + Fship
│   └── server.js      # App entry point
├── frontend/          # React Vite SPA
│   ├── public/        # Static assets (photos, videos)
│   └── src/
│       ├── components/ # Shared UI components
│       ├── context/    # Cart & Wishlist providers
│       └── pages/      # Page views
├── schema.sql         # MySQL database schema
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MySQL** database (Hostinger / local)
- **Auth0** account — SPA app + API registered
- **Razorpay** account (test keys work for local dev)
- **Fship** account with API token
- **Google Cloud** project with Sheets API enabled + Service Account

---

## 🗄️ Database Setup

1. Create a MySQL database on Hostinger (or local MySQL).
2. Import the schema via phpMyAdmin or CLI:
   ```bash
   mysql -u YOUR_USER -p YOUR_DB_NAME < schema.sql
   ```
3. Configure your Google Sheet with the following column headers (row 1):
   `product_id | title | tag1 | tag2 | tag3 | mrp | sp | stock_qty | description | image1 | image2 | image3 | image4 | image5 | image6 | image7 | weight | length | width | height`
4. Share the sheet with your Google Service Account email.

---

## 🚀 Backend Setup & Deployment

### Local Development

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev        # Starts with nodemon on port 5000
```

### Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `FRONTEND_URL` | Allowed CORS origin (e.g. https://mindfuels.onrender.com) |
| `DB_HOST` | MySQL host (Hostinger) |
| `DB_PORT` | MySQL port (default: 3306) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `AUTH0_ISSUER_BASE_URL` | Auth0 domain URL (e.g. https://dev-xyz.us.auth0.com/) |
| `AUTH0_AUDIENCE` | Auth0 API audience (e.g. https://api.mindfuels.com) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `FSHIP_BASE_URL` | Fship base URL (staging or production) |
| `FSHIP_API_KEY` | Fship signature/token |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google private key (replace `\n` with actual newlines) |
| `GOOGLE_SHEET_ID` | Google Spreadsheet ID from URL |

### Render Deployment (Backend)

1. Create a new **Web Service** on Render.
2. Connect your GitHub repo and set **Root Directory** to `backend`.
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. Add all environment variables from the table above.
6. Set environment to **Node** with version 18+.

---

## 🌐 Frontend Setup & Deployment

### Local Development

```bash
cd frontend
cp .env.example .env
# Fill in VITE_API_BASE_URL=http://localhost:5000 for local dev
npm install
npm run dev        # Opens on http://localhost:3000
```

### Environment Variables (frontend/.env)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (no trailing slash) |
| `VITE_AUTH0_DOMAIN` | Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA Client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |
| `VITE_SHOW_TEACHERS_RECOMMENDATION` | Toggle teacher's section (true/false) |
| `VITE_SHOW_PARENTS_FIRST_CHOICE` | Toggle parents' section (true/false) |

### Render Deployment (Frontend)

1. Create a new **Static Site** on Render.
2. Connect your GitHub repo and set **Root Directory** to `frontend`.
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. Add a **Rewrite Rule**: Source `/*` → Destination `/index.html` (for SPA routing).
6. Add all `VITE_*` environment variables.

---

## 🔑 Auth0 Setup

1. Create a **Single Page Application** in Auth0 → note Client ID and Domain.
2. Create an **API** in Auth0 → set identifier as `https://api.mindfuels.com` (or your choice).
3. Under your SPA app settings, add:
   - **Allowed Callback URLs**: `http://localhost:3000, https://mindfuels.onrender.com`
   - **Allowed Logout URLs**: same
   - **Allowed Web Origins**: same
4. Optionally enable **Google Social Connection** under Authentication → Social.
5. To propagate `email` in JWT, enable the custom action or ensure your API returns `email` scope.

---

## 📦 Google Sheets Sync

- The backend auto-syncs every **30 minutes** via `node-cron`.
- Trigger a manual sync by calling `POST /api/sync/products` with a valid Auth0 bearer token.
- The Google Sheet **must have column headers in row 1** (case-insensitive).

---

## 💳 Razorpay Integration

- For testing, use Razorpay test keys (no real charges).
- The frontend loads the Razorpay Checkout JS SDK dynamically at checkout.
- All payment verification is done **server-side** (signature HMAC-SHA256 check).
- When `RAZORPAY_KEY_ID` is set to `your-razorpay-key-id` (the placeholder), the app runs in **MOCK MODE** — showing confirmation dialogs instead of real payment flow.

---

## 🚚 Fship Integration

- Fship API key goes in `FSHIP_API_KEY` env variable.
- Use `https://capi-qc.fship.in` for sandbox testing (set in `FSHIP_BASE_URL`).
- Use `https://capi.fship.in` for production.
- If Fship booking fails (wallet empty, KYC pending), the order is still saved and a `Failed` shipment record is created for manual booking.

---

## 🧪 Health Check

```bash
curl https://mindfuels-backend.onrender.com/health
# Returns: {"status":"healthy","database":"connected"}
```

---

## 📝 License

© 2024 Mindfuels Book Publishers. All rights reserved.
