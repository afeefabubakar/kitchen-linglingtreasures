import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { processCheckout, type CheckoutInput } from '@/lib/checkout'

/**
 * POST /api/checkout
 *
 * Accepts a checkout payload (JSON or multipart/form-data for manual receipt uploads),
 * enforces all business rules, and returns a payment gateway redirect URL
 * or a local confirmation redirect on success.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  
  let customerName = ''
  let email = ''
  let phone = ''
  let productId = 0
  let weeklyMenuId = 0
  let locationId = 0
  let quantity = 0
  let paymentReceiptId: number | undefined = undefined
  let paymentMethod: 'manual' | 'gateway' = (process.env.PAYMENT_METHOD as 'manual' | 'gateway') || 'manual'

  const payload = await getPayload({ config: configPromise })

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    customerName = formData.get('customerName') as string || ''
    email = formData.get('email') as string || ''
    phone = formData.get('phone') as string || ''
    productId = Number(formData.get('productId') || 0)
    weeklyMenuId = Number(formData.get('weeklyMenuId') || 0)
    locationId = Number(formData.get('locationId') || 0)
    quantity = Number(formData.get('quantity') || 0)
    
    // Check for uploaded receipt file
    const receiptFile = formData.get('receipt') as File | null
    if (paymentMethod === 'manual') {
      if (!receiptFile || !(receiptFile instanceof File) || receiptFile.size === 0) {
        return NextResponse.json({ error: 'Payment receipt file is required.' }, { status: 400 })
      }

      // Upload file to Payload media collection
      try {
        const buffer = Buffer.from(await receiptFile.arrayBuffer())
        const uploadedMedia = await payload.create({
          collection: 'media',
          data: {
            alt: `Receipt for ${customerName} (${new Date().toLocaleDateString('en-MY')})`,
          },
          file: {
            data: buffer,
            name: receiptFile.name,
            mimetype: receiptFile.type,
            size: receiptFile.size,
          },
        })
        paymentReceiptId = uploadedMedia.id
      } catch (uploadErr) {
        console.error('Failed to upload receipt:', uploadErr)
        return NextResponse.json({ error: 'Failed to upload receipt file.' }, { status: 500 })
      }
    }
  } else {
    // application/json
    let jsonBody: any
    try {
      jsonBody = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    customerName = jsonBody.customerName || ''
    email = jsonBody.email || ''
    phone = jsonBody.phone || ''
    productId = Number(jsonBody.productId || 0)
    weeklyMenuId = Number(jsonBody.weeklyMenuId || 0)
    locationId = Number(jsonBody.locationId || 0)
    quantity = Number(jsonBody.quantity || 0)
  }

  // ── Input validation ────────────────────────────────────────────────────────
  if (!customerName) {
    return NextResponse.json({ error: 'customerName is required.' }, { status: 400 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!phone) {
    return NextResponse.json({ error: 'phone is required.' }, { status: 400 })
  }
  if (!productId) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
  }
  if (!weeklyMenuId) {
    return NextResponse.json({ error: 'weeklyMenuId is required.' }, { status: 400 })
  }
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required.' }, { status: 400 })
  }
  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: 'quantity must be a positive number.' }, { status: 400 })
  }

  // ── Core checkout logic ─────────────────────────────────────────────────────
  const result = await processCheckout({
    customerName,
    email,
    phone,
    productId,
    weeklyMenuId,
    locationId,
    quantity,
    paymentReceiptId,
  })

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
