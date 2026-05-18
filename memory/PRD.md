# Master Liquors — PRD

## Problem Statement (original)
> My friend has bought a domain masterliqours.my and wants me to help him to build a website for 21 and above to sell and taking care of the liquors inventory. The theme he wants is neon vibes, and for the selling he wants to integrate online payments or banking, then continue with the purchase or delivery on WhatsApp.

## User Personas
- **Customer (KL adult, 21+)**: Browses bottles, adds to cart, pays via bank transfer, finalizes/talks to shop on WhatsApp.
- **Shop Admin (owner)**: Manages inventory (CRUD), monitors orders, updates order status.

## Core Requirements (static)
- 21+ age gate (DOB picker) on every public route
- Product catalog with categories, filters, search, sort
- Cart + Checkout with manual bank transfer flow
- WhatsApp click-to-chat handoff (pre-filled order summary)
- Admin login & dashboard for inventory + orders
- Tokyo speakeasy NEON theme — pink/cyan/yellow on pure black

## Architecture
- **Frontend**: React + React Router + Tailwind + Lucide icons. Auth in `lib/auth.jsx`, cart in `lib/cart.jsx` (localStorage), API client in `lib/api.js` (Bearer JWT from localStorage).
- **Backend**: FastAPI + Motor + MongoDB. JWT (HS256) auth with cookie + Bearer. bcrypt hashing. Idempotent admin + 12-product seed on startup.
- **Routes**: `/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/admin/login`, `/admin`.
- **API**: `/api/auth/{login,me,logout}`, `/api/products` (CRUD), `/api/orders`, `/api/admin/stats`, `/api/config/storefront`.

## What's Been Implemented — Feb 2026
- ✅ Backend: 18/18 pytest cases (auth, products CRUD, orders with delivery-fee logic, admin stats, storefront config)
- ✅ Frontend: Age gate, hero, marquee, featured grid, shop with filters/sort/search, product detail, cart, checkout with bank-transfer + WhatsApp handoff, admin login & dashboard (inventory CRUD + orders status)
- ✅ Seeded admin: `admin@masterliquors.my / Neon@2026`
- ✅ Seeded 12 products across 8 categories (Whisky/Vodka/Gin/Rum/Tequila/Cognac/Beer/Champagne)
- ✅ WhatsApp number, bank details, currency configurable via backend `.env`

## Prioritized Backlog
### P1
- Admin: change admin password from dashboard
- Admin: upload receipt screenshot to mark order paid (object storage)
- Customer: order tracking page by order_number + phone
- Atomic stock decrement (prevent oversell on concurrent orders)
- Brute-force lockout on `/api/auth/login`

### P2
- Real online payment integration (Razorpay / Stripe / FPX)
- Multi-language (EN / BM / 中文)
- Wishlist / save-for-later
- Promo codes & loyalty
- Email + WhatsApp Business API order confirmations

### P3
- Loyalty tier with neon badges
- "Curator's note" video clips on product detail
- Subscription bottle-of-the-month

## Next Tasks
1. Replace WhatsApp placeholder (60123456789) and bank details with real ones from the owner.
2. Add object storage for product images so admin doesn't paste URLs.
3. Integrate Razorpay or FPX for online payments (currently bank-transfer-only).
