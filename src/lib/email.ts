import type { Order, Product, Location, WeeklyMenu } from '@/payload-types'

const PLUNK_API_KEY = process.env.PLUNK_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@linglingkitchen.com'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Sends an email using the Plunk API.
 * If PLUNK_API_KEY is not defined in the environment, it falls back to mocking
 * the email by logging the contents to the console (useful for local development).
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!PLUNK_API_KEY) {
    console.log('\n========================================================================');
    console.log(`[MOCK EMAIL SENT]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Snippet: ${html.substring(0, 300)}...`);
    console.log('========================================================================\n');
    return true
  }

  try {
    const res = await fetch('https://api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body: html,
        subscribed: true,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Plunk Email sending failed with status ${res.status}: ${errText}`)
      return false
    }

    return true
  } catch (err) {
    console.error('Error sending email through Plunk:', err)
    return false
  }
}

/**
 * Standard HTML layout wrapper for email templates.
 * Matches storefront design tokens (Sage Green themes).
 */
function wrapLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lingling Kitchen</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f7f9f7;
            margin: 0;
            padding: 20px;
            color: #2d3b2e;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2ece3;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(67, 104, 80, 0.05);
          }
          .header {
            background-color: #436850; /* Sage Green */
            padding: 36px 24px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-family: Georgia, Cambria, "Times New Roman", Times, serif;
            font-size: 26px;
            font-weight: bold;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 6px 0 0 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2.5px;
            opacity: 0.85;
            font-weight: bold;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .footer {
            background-color: #f8faf8;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #7a8a7c;
            border-top: 1px solid #eaf0eb;
          }
          .footer a {
            color: #436850;
            text-decoration: none;
            font-weight: bold;
          }
          .btn {
            display: inline-block;
            padding: 12px 28px;
            background-color: #436850;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 14px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 2px 6px rgba(67, 104, 80, 0.15);
          }
          .card {
            background-color: #fcfdfc;
            border: 1px solid #eaf0eb;
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
          }
          .grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #eaf0eb;
            padding-bottom: 10px;
            font-size: 14px;
            align-items: center;
          }
          .row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .label {
            font-weight: bold;
            color: #436850;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            color: #2d3b2e;
            text-align: right;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 12px;
            background-color: #e2ece3;
            color: #436850;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge.paid {
            background-color: #d1ebd6;
            color: #2b7a3b;
          }
          .badge.pending {
            background-color: #fef3c7;
            color: #d97706;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lingling Kitchen</h1>
            <p>Healthy Lunchbox Service</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LingLing Kitchen. All rights reserved.</p>
            <p>Need support? <a href="https://wa.me/60123456789">Message us on WhatsApp</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Builds HTML for Customer Order Received email
 */
export function buildOrderReceivedHtml(params: {
  customerName: string
  orderId: number
  productTitle: string
  quantity: number
  totalPaid: number
  locationName: string
  deliveryDate: string
}) {
  return wrapLayout(`
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; color: #436850;">Order Received!</h2>
    <p>Hi ${params.customerName},</p>
    <p>Thank you for pre-ordering with Lingling Kitchen! We have received your order details and uploaded payment screenshot. Our team is currently verifying your bank transfer.</p>
    
    <div class="card">
      <div class="grid">
        <div class="row">
          <span class="label">Order Reference</span>
          <span class="value" style="font-weight: bold; font-family: monospace; font-size: 15px;">#${params.orderId}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value"><span class="badge pending">Verification Pending</span></span>
        </div>
        <div class="row">
          <span class="label">Item Ordered</span>
          <span class="value">${params.productTitle} × ${params.quantity}</span>
        </div>
        <div class="row">
          <span class="label">Total Amount</span>
          <span class="value" style="font-weight: bold; color: #436850; font-size: 16px;">RM ${params.totalPaid.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Drop-off Point</span>
          <span class="value">${params.locationName}</span>
        </div>
        <div class="row">
          <span class="label">Delivery Date</span>
          <span class="value">${params.deliveryDate}</span>
        </div>
      </div>
    </div>
    
    <p>We will send you another email as soon as your payment has been manual verified by our admin. If you have any questions, feel free to contact us via WhatsApp.</p>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://wa.me/60123456789?text=Hi%20Lingling%20Kitchen,%20I'm%20asking%20about%20order%20%23${params.orderId}" class="btn">Chat on WhatsApp</a>
    </div>
  `)
}

/**
 * Builds HTML for Customer Order Confirmed / Paid email
 */
export function buildOrderConfirmedHtml(params: {
  customerName: string
  orderId: number
  productTitle: string
  quantity: number
  totalPaid: number
  locationName: string
  deliveryDate: string
}) {
  return wrapLayout(`
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; color: #2b7a3b;">Payment Verified!</h2>
    <p>Hi ${params.customerName},</p>
    <p>Great news! We have successfully verified your manual payment receipt. Your pre-order is now confirmed and will be ready for drop-off on your scheduled delivery date.</p>
    
    <div class="card">
      <div class="grid">
        <div class="row">
          <span class="label">Order Reference</span>
          <span class="value" style="font-weight: bold; font-family: monospace; font-size: 15px;">#${params.orderId}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value"><span class="badge paid">Confirmed / Paid</span></span>
        </div>
        <div class="row">
          <span class="label">Item Ordered</span>
          <span class="value">${params.productTitle} × ${params.quantity}</span>
        </div>
        <div class="row">
          <span class="label">Total Amount</span>
          <span class="value" style="font-weight: bold; color: #436850; font-size: 16px;">RM ${params.totalPaid.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Drop-off Point</span>
          <span class="value">${params.locationName}</span>
        </div>
        <div class="row">
          <span class="label">Delivery Date</span>
          <span class="value">${params.deliveryDate}</span>
        </div>
      </div>
    </div>
    
    <h3 style="font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin-top: 24px; color: #436850;">Collection Instructions</h3>
    <p>Your lunchbox will be delivered to your selected drop-off point <strong>(${params.locationName})</strong> on <strong>${params.deliveryDate}</strong>. Please collect it from the designated area during lunch break.</p>
    
    <p>Thank you for choosing Lingling Kitchen! We look forward to cooking a fresh, healthy meal for you.</p>
  `)
}

/**
 * Builds HTML for Admin Order Notification email
 */
export function buildAdminNotificationHtml(params: {
  customerName: string
  email: string
  phone: string
  orderId: number
  productTitle: string
  quantity: number
  totalPaid: number
  locationName: string
}) {
  const adminPanelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/collections/orders/${params.orderId}`
  
  return wrapLayout(`
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; color: #d97706;">Receipt Verification Required</h2>
    <p>A new customer order has been placed with manual receipt upload. Please verify the bank transfer receipt in the admin panel.</p>
    
    <div class="card">
      <div class="grid">
        <div class="row">
          <span class="label">Order Reference</span>
          <span class="value" style="font-weight: bold; font-family: monospace; font-size: 15px;">#${params.orderId}</span>
        </div>
        <div class="row">
          <span class="label">Customer Name</span>
          <span class="value">${params.customerName}</span>
        </div>
        <div class="row">
          <span class="label">Customer Email</span>
          <span class="value">${params.email}</span>
        </div>
        <div class="row">
          <span class="label">Customer Phone</span>
          <span class="value">${params.phone}</span>
        </div>
        <div class="row">
          <span class="label">Item Ordered</span>
          <span class="value">${params.productTitle} × ${params.quantity}</span>
        </div>
        <div class="row">
          <span class="label">Total Paid</span>
          <span class="value" style="font-weight: bold;">RM ${params.totalPaid.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Drop-off Point</span>
          <span class="value">${params.locationName}</span>
        </div>
      </div>
    </div>
    
    <p>Log in to your admin dashboard to review the payment receipt image and toggle the payment status to <strong>Paid</strong> once verified.</p>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${adminPanelUrl}" class="btn">Verify Order in Dashboard</a>
    </div>
  `)
}
