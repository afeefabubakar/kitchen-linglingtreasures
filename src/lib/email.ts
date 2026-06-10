import type { Order, Product, Location, WeeklyMenu } from '@/payload-types'

const PLUNK_API_KEY = process.env.PLUNK_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@linglingkitchen.com'
const SENDER_EMAIL = process.env.SENDER_EMAIL || ADMIN_EMAIL

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
    const res = await fetch('https://next-api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body: html,
        from: SENDER_EMAIL,
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
 * ALL STYLES ARE INLINED for maximum compatibility with email clients (Gmail, Outlook, etc.).
 */
function wrapLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lingling Kitchen</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f7; margin: 0; padding: 20px; color: #2d3b2e;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2ece3; overflow: hidden; box-shadow: 0 4px 16px rgba(67, 104, 80, 0.05);">
          <!-- Header -->
          <div style="background-color: #436850; padding: 36px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-family: Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 26px; font-weight: bold; letter-spacing: -0.5px; color: #ffffff;">Lingling Kitchen</h1>
            <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; opacity: 0.85; font-weight: bold; color: #ffffff;">Healthy Lunchbox Service</p>
          </div>
          <!-- Body Content -->
          <div style="padding: 32px 24px; line-height: 1.6; font-size: 14px;">
            ${content}
          </div>
          <!-- Footer -->
          <div style="background-color: #f8faf8; padding: 24px; text-align: center; font-size: 12px; color: #7a8a7c; border-top: 1px solid #eaf0eb;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LingLing Kitchen. All rights reserved.</p>
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
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px; color: #436850;">Order Received!</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">Thank you for pre-ordering with Lingling Kitchen! We have received your order details and uploaded payment screenshot. Our team is currently verifying your bank transfer.</p>
    
    <div style="background-color: #fcfdfc; border: 1px solid #eaf0eb; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; font-weight: bold; font-family: monospace; color: #2d3b2e;">#${params.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Status</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 12px; background-color: #fef3c7; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">Verification Pending</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Item Ordered</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.productTitle} &times; ${params.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 15px; text-align: right; font-weight: bold; color: #436850;">RM ${params.totalPaid.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Drop-off Point</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Date</td>
          <td style="padding: 12px 0; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: bold;">${params.deliveryDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">We will send you another email as soon as your payment has been manually verified by our admin. If you have any questions, feel free to contact us via WhatsApp.</p>
    
    <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
      <a href="https://wa.me/60123456789?text=Hi%20Lingling%20Kitchen,%20I'm%20asking%20about%20order%20%23${params.orderId}" style="display: inline-block; padding: 12px 28px; background-color: #436850; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; text-align: center; box-shadow: 0 2px 6px rgba(67, 104, 80, 0.15);">Chat on WhatsApp</a>
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
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px; color: #2b7a3b;">Payment Verified!</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">Great news! We have successfully verified your manual payment receipt. Your pre-order is now confirmed and will be ready for drop-off on your scheduled delivery date.</p>
    
    <div style="background-color: #fcfdfc; border: 1px solid #eaf0eb; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; font-weight: bold; font-family: monospace; color: #2d3b2e;">#${params.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Status</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 12px; background-color: #d1ebd6; color: #2b7a3b; text-transform: uppercase; letter-spacing: 0.5px;">Confirmed / Paid</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Item Ordered</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.productTitle} &times; ${params.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 15px; text-align: right; font-weight: bold; color: #436850;">RM ${params.totalPaid.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Drop-off Point</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.locationName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Date</td>
          <td style="padding: 12px 0; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: bold;">${params.deliveryDate}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin-top: 24px; margin-bottom: 10px; color: #436850;">Collection Instructions</h3>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">Your lunchbox will be delivered to your selected drop-off point <strong>(${params.locationName})</strong> on <strong>${params.deliveryDate}</strong>. Please collect it from the designated area during lunch break.</p>
    
    <p style="margin: 0; font-size: 14px; color: #4a554d; line-height: 1.6;">Thank you for choosing Lingling Kitchen! We look forward to cooking a fresh, healthy meal for you.</p>
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
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px; color: #d97706;">Receipt Verification Required</h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">A new customer order has been placed with manual receipt upload. Please verify the bank transfer receipt in the admin panel.</p>
    
    <div style="background-color: #fcfdfc; border: 1px solid #eaf0eb; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; font-weight: bold; font-family: monospace; color: #2d3b2e;">#${params.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Customer Name</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Customer Email</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.email}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Customer Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.phone}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Item Ordered</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.productTitle} &times; ${params.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Total Paid</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #eaf0eb; font-size: 15px; text-align: right; font-weight: bold; color: #2d3b2e;">RM ${params.totalPaid.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 11px; font-weight: bold; color: #436850; text-transform: uppercase; letter-spacing: 0.5px;">Drop-off Point</td>
          <td style="padding: 12px 0; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.locationName}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">Log in to your admin dashboard to review the payment receipt image and toggle the payment status to <strong>Paid</strong> once verified.</p>
    
    <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
      <a href="${adminPanelUrl}" style="display: inline-block; padding: 12px 28px; background-color: #436850; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; text-align: center; box-shadow: 0 2px 6px rgba(67, 104, 80, 0.15);">Verify Order in Dashboard</a>
    </div>
  `)
}

/**
 * Builds HTML for Customer Order Failed / Receipt Rejected email
 */
export function buildOrderFailedHtml(params: {
  customerName: string
  orderId: number
  productTitle: string
  quantity: number
  totalPaid: number
}) {
  return wrapLayout(`
    <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px; color: #d93838;">Payment Verification Failed</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px;">Hi ${params.customerName},</p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">We were unable to verify your manual payment receipt for order <strong>#${params.orderId}</strong>. As a result, your order payment status has been marked as <strong>Failed</strong>.</p>
    
    <div style="background-color: #fffafa; border: 1px solid #fce8e8; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 11px; font-weight: bold; color: #d93838; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 14px; text-align: right; font-weight: bold; font-family: monospace; color: #2d3b2e;">#${params.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 11px; font-weight: bold; color: #d93838; text-transform: uppercase; letter-spacing: 0.5px;">Status</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 14px; text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 12px; background-color: #fee2e2; color: #d93030; text-transform: uppercase; letter-spacing: 0.5px;">Failed / Declined</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 11px; font-weight: bold; color: #d93838; text-transform: uppercase; letter-spacing: 0.5px;">Item Ordered</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fce8e8; font-size: 14px; text-align: right; color: #2d3b2e; font-weight: 500;">${params.productTitle} &times; ${params.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 11px; font-weight: bold; color: #d93838; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</td>
          <td style="padding: 12px 0; font-size: 15px; text-align: right; font-weight: bold; color: #d93838;">RM ${params.totalPaid.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; font-size: 14px; color: #4a554d; line-height: 1.6;">If you believe this is a mistake, or if you would like to submit a new payment receipt, please contact our support team on WhatsApp with your Order Reference.</p>
    
    <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
      <a href="https://wa.me/60123456789?text=Hi%20Lingling%20Kitchen,%20I'm%20asking%20about%20my%20failed%20order%20%23${params.orderId}" style="display: inline-block; padding: 12px 28px; background-color: #d93838; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; text-align: center; box-shadow: 0 2px 6px rgba(217, 56, 56, 0.15);">Resolve on WhatsApp</a>
    </div>
  `)
}

