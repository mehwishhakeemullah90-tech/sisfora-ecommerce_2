# Sisfora — Reveal Your Natural Beauty 🌸

A modern, luxury, fully responsive e-commerce platform for the Sisfora cosmetics brand, built as a production-ready MVC application:

- **Frontend:** HTML5, CSS3, Bootstrap 5, vanilla JavaScript — server-rendered with EJS for SEO
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT (httpOnly cookies), bcrypt password hashing
- **Payments:** Stripe (test mode) + Cash on Delivery
- **Images:** Multer + Cloudinary uploads

---

## 1. Requirements

- Node.js 18+
- A MongoDB database — either:
  - **Local:** install MongoDB Community Server ([docs](https://www.mongodb.com/docs/manual/administration/install-community/)), or
  - **Cloud (recommended, fastest):** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- A free [Stripe](https://dashboard.stripe.com/register) account for **test mode** API keys (optional — Cash on Delivery works without it)

## 2. Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env — at minimum set MONGO_URI, JWT_SECRET, and (optionally) STRIPE keys

# 3. Seed the database with demo categories, products, blog posts, coupons & accounts
npm run seed

# 4. Start the server
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

Visit:
- **Storefront:** http://localhost:5000
- **Admin dashboard:** http://localhost:5000/admin/login

### Demo accounts (created by `npm run seed`)

| Role     | Email                 | Password       |
|----------|------------------------|----------------|
| Admin    | admin@sisfora.com      | Admin@12345    |
| Customer | customer@sisfora.com   | Customer@123   |

**Change these before deploying to production.** They're controlled by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

To wipe all demo data: `npm run seed:destroy`

## 2b. Design system (2026 redesign — "Noir & Gold Atelier")

- **Look:** black / gold / cream luxury theme, vertical side menu on desktop (slide-in drawer + bottom quick bar on phones), rotating announcement bar, dark page headers with breadcrumbs on every page.
- **Motion (3D / depth):** `public/js/motion.js` — 3D tilt cards, pointer-driven hero scene with orbiting gold rings and floating products, scroll parallax, word-by-word headline reveal, magnetic buttons, animated gold cursor. Everything switches off automatically for visitors who ask their phone/computer for reduced motion.
- **Fonts:** self-hosted in `public/fonts/` (Lora + Poppins) — no extra request to Google, faster on mobile data.
- **Images:** consistent studio renders in `public/images/sisfora/` (same backdrop, size and lighting). Regenerate with `python scripts/generate-product-renders.py public/images/sisfora` (needs Python + Playwright).
  To switch the existing demo Skincare products in the database to these images run `npm run images:studio` — it never replaces photos uploaded through the Admin Panel.
- **Clean logo:** `public/images/brand/imagesisfora.png` (and the `sisfora-*` variants) no longer has the stray sparkle or the AI watermark.
- **One place to edit:** header, side menu, footer, contact email/phone, social links, live categories, promo pop-up and Tawk.to chat all come from `config/storefront.js` + `public/js/layout.js`.

## 3. Project Structure

```
sisfora/
├── server.js               # App entry point
├── config/                 # DB + Stripe configuration
├── models/                 # Mongoose schemas (User, Product, Category, Order, Review, Coupon, Blog)
├── controllers/             # Business logic for each resource
├── routes/                  # Express routers (API + server-rendered pages)
│   ├── *Routes.js           # /api/* JSON endpoints
│   ├── pageRoutes.js         # Public storefront pages (EJS)
│   └── adminPageRoutes.js    # Admin dashboard pages (EJS)
├── middleware/               # auth (JWT), error handling, file upload, async wrapper
├── views/                    # EJS templates
│   ├── partials/              # Shared layout, navbar, footer, product card
│   ├── auth/                  # Login / Register / Forgot / Reset password
│   └── admin/                 # Admin dashboard screens
├── public/
│   ├── css/                   # Design system (style.css) + admin.css
│   ├── js/                    # Client-side behaviour (cart, wishlist, checkout, admin, etc.)
│   ├── images/                 # Brand + placeholder product/category/blog imagery
│   └── uploads/                # Admin-uploaded images land here
├── seed/seedData.js           # Demo data importer
└── scripts/generateAssets.js  # Regenerates the placeholder SVG imagery
```

## 4. Feature Overview

**Storefront pages:** Home, About, Shop (search/filter/sort/pagination), Product Details (gallery, reviews, related products), Categories, Best Sellers, New Arrivals, Offers & Discounts, Blog, Contact, FAQ, Privacy Policy, Terms & Conditions.

**Shopping:** client-side cart (persisted in `localStorage`, synced/re-priced server-side at checkout for security), wishlist (server-side, per account), coupon codes, Stripe card payments or Cash on Delivery, order confirmation, order history.

**Accounts:** register/login/logout, forgot/reset password (emails log to the console in dev if SMTP isn't configured — see `utils/sendEmail.js`), profile editing, saved shipping addresses, change password.

**Admin dashboard** (`/admin`): analytics overview, sales reports & charts, product CRUD with image upload, category CRUD, order management (status updates), customer management (ban/unban), review moderation, coupon CRUD.

## 5. Connecting Stripe (optional but recommended)

1. Create a free Stripe account and switch to **Test mode**.
2. Copy your test **Publishable key** and **Secret key** from the Stripe Dashboard → Developers → API keys.
3. Paste them into `.env` as `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.
4. Use [Stripe's test card numbers](https://docs.stripe.com/testing) (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) to test checkout.

Cash on Delivery works out of the box with no configuration.

## 6. Deploying to Production

- Set `NODE_ENV=production` and use strong, unique values for `JWT_SECRET`.
- Use a managed MongoDB (Atlas) rather than a local instance.
- Admin image uploads go to Cloudinary (`middleware/upload.js`); set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` locally and in Vercel.
- Switch Stripe to live keys once you're ready to accept real payments.
- Put the app behind HTTPS (cookies are marked `secure` automatically when `NODE_ENV=production`).
- Consider adding a process manager (PM2) or containerizing with Docker.

## 7. Regenerating Placeholder Imagery

All product/category/hero imagery ships as lightweight on-brand SVG placeholders (soft pink/gold/black) so the store looks polished immediately — swap them for real photography any time via the admin panel's image upload, or by replacing files in `public/images/products/`. To regenerate the placeholder set: `node scripts/generateAssets.js`.

---

Built for **Sisfora** — *Reveal Your Natural Beauty.*
