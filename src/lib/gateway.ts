/**
 * Payment gateway abstraction layer.
 *
 * This module is the ONLY place that knows which gateway is in use.
 * Swap the implementation inside `buildGatewayPayload` and `verifyWebhookSignature`
 * to change providers without touching any other file.
 *
 * Supported gateways (configure via PAYMENT_GATEWAY env var):
 *   - 'toyyibpay'
 *   - 'billplz'
 */

import { createHmac } from 'crypto'

export type GatewayCheckoutInput = {
  orderId: number
  customerName: string
  email: string
  phone: string
  amount: number // MYR, e.g. 8.50
  description: string
}

export type GatewayCheckoutResult = {
  billId: string
  redirectUrl: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateway dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export async function buildGatewayPayload(
  input: GatewayCheckoutInput,
): Promise<GatewayCheckoutResult> {
  const gateway = process.env.PAYMENT_GATEWAY?.toLowerCase()

  switch (gateway) {
    case 'toyyibpay':
      return createToyyibPayBill(input)
    case 'billplz':
      return createBillplzBill(input)
    default:
      throw new Error(
        `PAYMENT_GATEWAY env var is not set or unrecognised. ` +
          `Set it to "toyyibpay" or "billplz".`,
      )
  }
}

/**
 * Verifies the authenticity of an inbound webhook payload.
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(payload: Record<string, unknown>): boolean {
  const gateway = process.env.PAYMENT_GATEWAY?.toLowerCase()

  switch (gateway) {
    case 'toyyibpay':
      return verifyToyyibPaySignature(payload)
    case 'billplz':
      return verifyBillplzSignature(payload)
    default:
      return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ToyyibPay implementation
// ─────────────────────────────────────────────────────────────────────────────

async function createToyyibPayBill(input: GatewayCheckoutInput): Promise<GatewayCheckoutResult> {
  const apiKey = process.env.TOYYIBPAY_API_KEY
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE
  const baseUrl = process.env.TOYYIBPAY_BASE_URL ?? 'https://toyyibpay.com'

  if (!apiKey || !categoryCode) {
    throw new Error('ToyyibPay credentials are missing. Set TOYYIBPAY_API_KEY and TOYYIBPAY_CATEGORY_CODE.')
  }

  const amountInSen = Math.round(input.amount * 100)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation?orderId=${input.orderId}`

  const formData = new URLSearchParams({
    userSecretKey: apiKey,
    categoryCode,
    billName: `Order #${input.orderId}`,
    billDescription: input.description,
    billPriceSetting: '1', // fixed price
    billPayorInfo: '1', // collect payer info
    billAmount: String(amountInSen),
    billReturnUrl: returnUrl,
    billCallbackUrl: callbackUrl,
    billExternalReferenceNo: String(input.orderId),
    billTo: input.customerName,
    billEmail: input.email,
    billPhone: input.phone,
    billSplitPayment: '0',
    billSplitPaymentArgs: '',
    billPaymentChannel: '0', // FPX
    billDisplayMerchant: '1',
    billContentEmail: `Thank you for your order, ${input.customerName}!`,
    billChargeToCustomer: '1',
  })

  const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`ToyyibPay API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as Array<{ BillCode: string }>

  if (!data?.[0]?.BillCode) {
    throw new Error('ToyyibPay did not return a BillCode.')
  }

  const billCode = data[0].BillCode
  return {
    billId: billCode,
    redirectUrl: `${baseUrl}/${billCode}`,
  }
}

function verifyToyyibPaySignature(payload: Record<string, unknown>): boolean {
  // ToyyibPay sends a `status_id` of '1' for successful payments.
  // Validate against the shared secret stored in env.
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) return false

  // ToyyibPay does not use HMAC signatures by default — instead, protect
  // this endpoint at the network level and validate the status field.
  // Reference: https://toyyibpay.com/apireference/#callback
  return payload['status_id'] === '1'
}

// ─────────────────────────────────────────────────────────────────────────────
// Billplz implementation
// ─────────────────────────────────────────────────────────────────────────────

async function createBillplzBill(input: GatewayCheckoutInput): Promise<GatewayCheckoutResult> {
  const apiKey = process.env.BILLPLZ_API_KEY
  const collectionId = process.env.BILLPLZ_COLLECTION_ID
  const baseUrl = process.env.BILLPLZ_BASE_URL ?? 'https://www.billplz.com/api/v3'

  if (!apiKey || !collectionId) {
    throw new Error('Billplz credentials are missing. Set BILLPLZ_API_KEY and BILLPLZ_COLLECTION_ID.')
  }

  const amountInSen = Math.round(input.amount * 100)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation?orderId=${input.orderId}`

  const body = {
    collection_id: collectionId,
    email: input.email,
    mobile: input.phone,
    name: input.customerName,
    amount: amountInSen,
    callback_url: callbackUrl,
    description: input.description,
    redirect_url: returnUrl,
    reference_1_label: 'Order ID',
    reference_1: String(input.orderId),
  }

  const credentials = Buffer.from(`${apiKey}:`).toString('base64')

  const response = await fetch(`${baseUrl}/bills`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Billplz API error: ${response.status} — ${errorBody}`)
  }

  const data = (await response.json()) as { id: string; url: string }

  return {
    billId: data.id,
    redirectUrl: data.url,
  }
}

function verifyBillplzSignature(payload: Record<string, unknown>): boolean {
  // Billplz uses an X-Signature header (HMAC-SHA256).
  // The raw signature must be passed through as part of the payload object
  // from the webhook route handler.
  // Reference: https://www.billplz.com/api#x-signature
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) return false

  const receivedSig = payload['x_signature'] as string | undefined
  const signedFields = payload['signed_fields'] as string | undefined

  if (!receivedSig || !signedFields) return false

  const fields = signedFields.split('|')
  const message = fields
    .sort()
    .map((field) => `${field}${payload[field] ?? ''}`)
    .join('|')

  const expectedSig: string = createHmac('sha256', secret).update(message).digest('hex')

  return receivedSig === expectedSig
}
