# Kitchen LingLing Treasures — Project Memory

This file serves as the persistent memory and status tracker for the project. Both the developer and the agent can read/update this file to maintain context across sessions.

---

## Project Overview
Single-page localized e-commerce landing page for a **weekly lunchbox pre-order service** in Malaysia.
- Orders are time-windowed (controlled via CMS, not hardcoded to a day)
- Menu changes weekly, max 2 food items
- Single drop-off location (one school — label TBC by owner)
- Phase 1 only for initial launch

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS v4 + Shadcn UI |
| CMS / Backend | PayloadCMS v3 (integrated into Next.js) |
| Database | PostgreSQL |
| Deployment | Vercel Free Tier |
| Payment | ToyyibPay **or** Billplz (swappable via env) |
| Language | English (structured for easy bilingual expansion later) |

---

## Key Architectural Decisions

### Ordering Window
- **NOT day-of-week gated** — data-driven via CMS.
- Window is open if: `status === 'active'` AND `now >= startDate (midnight KL)` AND `now <= orderCutoffDate`
- `startDate` = **any calendar day** — ordering window opens at midnight Asia/Kuala_Lumpur on this date. Orders before this moment are rejected.
- `orderCutoffDate` = stored with a time component — ordering window closes at this exact moment.

### Stock Limits
- **Per menu item**, not per weekly menu total.
- Lives as `stockLimit: number` inside the `menuItems` array on `WeeklyMenus`.
- Stock check sums `quantity` across all `paid` Orders matching `{weeklyMenu, product}`.

### Payment Gateway
- Swappable between ToyyibPay and Billplz.
- Both are fully implemented in [gateway.ts](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/lib/gateway.ts).
- Switch by setting `PAYMENT_GATEWAY=toyyibpay` or `PAYMENT_GATEWAY=billplz` in `.env`.

### Drop-off Location
- Configured via the [Locations](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/collections/Locations.ts) collection.
- All active locations appear at checkout.

---

## Collections Schema

### `locations`
- `name`: Text (required) — display name shown to customers
- `isActive`: Checkbox (required, default: true) — deactivate instead of deleting

### `products`
- `title`: Text (required)
- `description`: RichText (required)
- `basePrice`: Number in MYR (required)
- `image`: Upload → media (required)

### `weekly-menus`
- `startDate`: Date, day-only (required) — window opens at midnight KL
- `orderCutoffDate`: Date + time (required)    — window closes here
- `deliveryDate`: Date, day-only (required)
- `menuItems`: Array, min 1 / max 2:
  - `product`: Relationship → products (required)
  - `stockLimit`: Number (required, per-item cap)
- `status`: Select: draft | active | archived (default: draft)

### `orders`
- `customerName`: Text (required)
- `email`: Email (required)
- `phone`: Text (required) — Malaysian format validation
- `product`: Relationship → products (required)
- `weeklyMenu`: Relationship → weekly-menus (required)
- `quantity`: Number (required, default 1, min 1)
- `totalPaid`: Number in MYR (required)
- `dropOffLocation`: Relationship → locations (required)
- `paymentStatus`: Select: pending | paid | failed (default: pending)
- `gatewayBillId`: Text (read-only, set by checkout API, used by webhook)

### `media`
- Standard Payload upload collection with `alt` text.

---

## API Routes

### `POST /api/checkout`
- **File**: [route.ts](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/app/api/api/checkout/route.ts)
- **Logic**: [checkout.ts](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/lib/checkout.ts)
- **Flow**:
  1. Input validation.
  2. Fetch weekly menu (must be `status: active`).
  3. Ordering window check.
  4. Stock availability check.
  5. Compute total and create a pending Order record.
  6. Call gateway → get billId + redirectUrl.
  7. Return redirect link to frontend.

### `POST /api/webhooks/payment`
- **File**: [route.ts](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/app/api/webhooks/payment/route.ts)
- **Flow**:
  1. Parse body and verify webhook signature.
  2. Match order via `gatewayBillId`.
  3. Mark order as `paid`.

---

## Status Roadmap

### Phase 1 Remaining 🔲
- [ ] **Restart dev server** — verify DB schema applies cleanly (especially the new `paymentMethod` and `paymentReceipt` fields in the `orders` collection).
- [ ] **Confirm school name** → seed at least one Location in Payload admin dashboard.
- [ ] **Seed data** — create a test Product, Location, and WeeklyMenu (status set to `active`) in the Payload admin dashboard to view the active storefront menu.
- [ ] **Gateway sandbox test** — (Optional) if switching `PAYMENT_METHOD` to `gateway` in `.env`.

### Phase 1 Completed ✅
- [x] **Backend Dual-Payment Flow**: Supports `PAYMENT_METHOD=manual` (for DuitNow QR + screenshot upload) and `PAYMENT_METHOD=gateway` (for automatic FPX redirects via ToyyibPay/Billplz).
- [x] **Database Schema Extension**: Added `paymentMethod` and `paymentReceipt` fields to the `orders` collection.
- [x] **Checkout Endpoint Upgrade**: `/api/checkout` supports both JSON payloads and multipart/form-data to seamlessly upload receipt screenshot files to the Payload Media collection.
- [x] **Frontend storefront**: Single-page responsive landing built using Tailwind CSS v4 in [Storefront.tsx](file:///Users/afeef/Documents/Projects/software/personal/kitchen-linglingtreasures/src/components/Storefront.tsx).
- [x] **Active Menu state**: Displaying menu items from active week, including description rendering and live paid stock remaining.
- [x] **Cart Checkout form**: Form inputs, Malaysian phone number regex checks, drop-off location selector, and DuitNow QR payment card with a screenshot upload field.
- [x] **Closed state fallback**: Renders clean calendar dates for the next upcoming menu opening date and an email/phone "notify me" form.
- [x] **Order confirmation page**: Details on delivery dates, pickup spots, and instructions for manual/gateway payment status checks.

### Phase 2 Scope (Future)
- **Inventory System**: Hybrid ledger — `InventoryItems` + `InventoryTransactions` log. Auto-depletion based on Product Recipes/BOM.
- **Invoices**: Auto-generated PDF when order is marked `paid` using `@react-pdf/renderer`.
- **Finance**: `DeliveryExpenses` (per trip), `CapitalInjections`, `AdvanceWithdrawals`, `Budget` global settings.
- **Salary (Phase 3+)**: `SalaryPayments` collection tracking disbursements.
