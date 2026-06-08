import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isWithinOrderingWindow, isPast } from './date-utils'
import { buildGatewayPayload, type GatewayCheckoutResult } from './gateway'
import type { Order, WeeklyMenu } from '@/payload-types'

export type CheckoutInput = {
  customerName: string
  email: string
  phone: string
  productId: number
  weeklyMenuId: number
  quantity: number
}

export type CheckoutResult =
  | { success: true; redirectUrl: string; orderId: number }
  | { success: false; error: string; code: 'CLOSED' | 'SOLD_OUT' | 'INVALID' | 'SERVER_ERROR' }

/**
 * Core checkout transaction logic.
 * Called by the /api/checkout route handler.
 *
 * Enforces (in order):
 *  1. Active menu exists and its ordering window is open
 *     (now >= startDate midnight KL  AND  now <= orderCutoffDate)
 *  2. Per-item stock limit check against paid orders
 *  3. Payment gateway redirect URL generation
 */
export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { customerName, email, phone, productId, weeklyMenuId, quantity } = input

  const payload = await getPayload({ config: configPromise })

  // ── 1. Fetch the active weekly menu ───────────────────────────────────────
  const menuResult = await payload.findByID({
    collection: 'weekly-menus',
    id: weeklyMenuId,
    depth: 1,
  })

  if (!menuResult || menuResult.status !== 'active') {
    return {
      success: false,
      error: 'This weekly menu is no longer available.',
      code: 'INVALID',
    }
  }

  const weeklyMenu = menuResult as WeeklyMenu

  // ── 2. Ordering window check (startDate → orderCutoffDate) ────────────────
  if (!weeklyMenu.startDate || !weeklyMenu.orderCutoffDate) {
    return {
      success: false,
      error: 'This menu is missing required date configuration.',
      code: 'INVALID',
    }
  }

  if (!isWithinOrderingWindow(weeklyMenu.startDate, weeklyMenu.orderCutoffDate)) {
    // Determine a helpful message based on which boundary was missed
    const windowNotYetOpen = !isPast(weeklyMenu.startDate)

    return {
      success: false,
      error: windowNotYetOpen
        ? 'Ordering is not open yet for this menu. Please check back on the start date.'
        : 'The order cutoff date for this menu has passed.',
      code: 'CLOSED',
    }
  }

  // ── 3. Find the matching menu item & its stock limit ──────────────────────
  const menuItem = (weeklyMenu.menuItems ?? []).find((item) => {
    const product = typeof item.product === 'object' ? item.product : null
    return product?.id === productId
  })

  if (!menuItem) {
    return {
      success: false,
      error: 'This product is not available on the current menu.',
      code: 'INVALID',
    }
  }

  const stockLimit = menuItem.stockLimit

  // ── 4. Stock verification — sum paid orders for this product + menu ────────
  const existingOrders = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { weeklyMenu: { equals: weeklyMenuId } },
        { product: { equals: productId } },
        { paymentStatus: { equals: 'paid' } },
      ],
    },
    limit: 0,
  })

  const paidQuantity = existingOrders.docs.reduce(
    (sum: number, order: Order) => sum + (order.quantity ?? 0),
    0,
  )

  if (paidQuantity + quantity > stockLimit) {
    const remaining = stockLimit - paidQuantity
    return {
      success: false,
      error: remaining > 0
        ? `Sorry, only ${remaining} box(es) remaining for this item.`
        : 'Sorry, this item is sold out.',
      code: 'SOLD_OUT',
    }
  }

  // ── 5. Resolve product & compute total ────────────────────────────────────
  const product = typeof menuItem.product === 'object' ? menuItem.product : null
  if (!product) {
    return { success: false, error: 'Product data could not be resolved.', code: 'SERVER_ERROR' }
  }

  const totalPaid = parseFloat((product.basePrice * quantity).toFixed(2))

  // ── 6. Create a pending Order record ──────────────────────────────────────
  const newOrder = await payload.create({
    collection: 'orders',
    data: {
      customerName,
      email,
      phone,
      product: productId,
      weeklyMenu: weeklyMenuId,
      quantity,
      totalPaid,
      dropOffLocation: 'SK_PROU_SCHOOL_1',
      paymentStatus: 'pending',
    },
  })

  // ── 7. Generate gateway redirect URL ──────────────────────────────────────
  let gatewayResult: GatewayCheckoutResult
  try {
    gatewayResult = await buildGatewayPayload({
      orderId: newOrder.id,
      customerName,
      email,
      phone,
      amount: totalPaid,
      description: `Lunchbox order — ${product.title} x${quantity}`,
    })
  } catch {
    await payload.update({
      collection: 'orders',
      id: newOrder.id,
      data: { paymentStatus: 'failed' },
    })
    return {
      success: false,
      error: 'Payment gateway is currently unavailable. Please try again.',
      code: 'SERVER_ERROR',
    }
  }

  // Persist the gateway bill ID for webhook reconciliation
  await payload.update({
    collection: 'orders',
    id: newOrder.id,
    data: { gatewayBillId: gatewayResult.billId },
  })

  return {
    success: true,
    redirectUrl: gatewayResult.redirectUrl,
    orderId: newOrder.id,
  }
}
