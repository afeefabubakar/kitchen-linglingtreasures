import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyWebhookSignature } from '@/lib/gateway'

/**
 * POST /api/webhooks/payment
 *
 * Receives payment status callbacks from the configured gateway
 * (ToyyibPay or Billplz). Validates the signature, then updates
 * the matching pending Order's paymentStatus to 'paid'.
 *
 * Security:
 *   - Signature is verified against PAYMENT_WEBHOOK_SECRET env var.
 *   - Invalid signatures receive a 401 with no further processing.
 *   - Errors are logged server-side; the gateway always receives a 200
 *     to prevent retries on non-payment errors.
 */
export async function POST(req: NextRequest) {
  let rawBody: Record<string, unknown>

  try {
    // Gateways may send either JSON or form-encoded bodies
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      rawBody = (await req.json()) as Record<string, unknown>
    } else {
      // application/x-www-form-urlencoded (ToyyibPay default)
      const formData = await req.formData()
      rawBody = Object.fromEntries(formData.entries())
    }
  } catch {
    return NextResponse.json({ error: 'Could not parse webhook body.' }, { status: 400 })
  }

  // Billplz sends its signature via the X-Signature header — attach it for verification
  const xSignature = req.headers.get('x-signature')
  if (xSignature) {
    rawBody['x_signature'] = xSignature
  }

  // ── Signature verification ──────────────────────────────────────────────────
  const isValid = verifyWebhookSignature(rawBody)
  if (!isValid) {
    console.warn('[webhook] Invalid signature received. Request rejected.')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  // ── Resolve the bill / order reference ─────────────────────────────────────
  // ToyyibPay: bill_code field; Billplz: id field
  const billId =
    (rawBody['bill_code'] as string | undefined) ??
    (rawBody['id'] as string | undefined)

  if (!billId) {
    console.warn('[webhook] No bill identifier found in payload.')
    return NextResponse.json({ error: 'Bill identifier missing.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Find the pending order with this gateway bill ID
    const ordersResult = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { gatewayBillId: { equals: billId } },
          { paymentStatus: { equals: 'pending' } },
        ],
      },
      limit: 1,
    })

    if (ordersResult.docs.length === 0) {
      // Order may have already been updated (idempotency) or bill ID is unknown
      console.info(`[webhook] No pending order found for billId=${billId}. Skipping.`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const order = ordersResult.docs[0]

    // ── Update order to paid ──────────────────────────────────────────────────
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { paymentStatus: 'paid' },
    })

    console.info(`[webhook] Order ${order.id} marked as paid (billId=${billId}).`)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('[webhook] Error processing payment callback:', err)
    // Return 200 so the gateway does not retry — log the error for investigation
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
