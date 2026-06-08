import { type NextRequest, NextResponse } from 'next/server'
import { processCheckout, type CheckoutInput } from '@/lib/checkout'

/**
 * POST /api/checkout
 *
 * Accepts a checkout payload, enforces all business rules,
 * and returns a payment gateway redirect URL on success.
 *
 * Business rules enforced (in order):
 *   1. Monday-only ordering window (Asia/Kuala_Lumpur)
 *   2. Per-item stock limit check against paid orders
 *   3. Gateway redirect URL generation
 */
export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const { customerName, email, phone, productId, weeklyMenuId, quantity } =
    body as Partial<CheckoutInput>

  if (!customerName || typeof customerName !== 'string') {
    return NextResponse.json({ error: 'customerName is required.' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone is required.' }, { status: 400 })
  }
  if (!productId || typeof productId !== 'number') {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
  }
  if (!weeklyMenuId || typeof weeklyMenuId !== 'number') {
    return NextResponse.json({ error: 'weeklyMenuId is required.' }, { status: 400 })
  }
  if (!quantity || typeof quantity !== 'number' || quantity < 1) {
    return NextResponse.json({ error: 'quantity must be a positive number.' }, { status: 400 })
  }

  // ── Core checkout logic ─────────────────────────────────────────────────────
  const result = await processCheckout({ customerName, email, phone, productId, weeklyMenuId, quantity })

  if (!result.success) {
    const statusMap: Record<string, number> = {
      CLOSED: 403,
      SOLD_OUT: 409,
      INVALID: 422,
      SERVER_ERROR: 500,
    }
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: statusMap[result.code] ?? 500 },
    )
  }

  return NextResponse.json(
    {
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
    },
    { status: 200 },
  )
}
