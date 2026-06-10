import type { CollectionConfig } from 'payload'
import {
  sendEmail,
  buildOrderReceivedHtml,
  buildOrderConfirmedHtml,
  buildAdminNotificationHtml,
} from '../lib/email'

const MALAYSIAN_PHONE_REGEX = /^(\+?60|0)(1[0-9])[0-9]{7,8}$/

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Bookings',
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'email', 'paymentStatus', 'totalPaid', 'createdAt'],
    description: 'Sales ledger. Orders are created programmatically via the checkout API.',
  },
  access: {
    // Customers submit via API; only admins read/manage orders
    read: ({ req }) => Boolean(req.user),
    create: () => true, // API route uses local API with overrides
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        try {
          const payload = req.payload

          // Fetch related entities (avoiding populated object problems)
          const product =
            typeof doc.product === 'object' && doc.product !== null
              ? doc.product
              : await payload.findByID({ collection: 'products', id: doc.product })

          const location =
            typeof doc.dropOffLocation === 'object' && doc.dropOffLocation !== null
              ? doc.dropOffLocation
              : await payload.findByID({ collection: 'locations', id: doc.dropOffLocation })

          const weeklyMenu =
            typeof doc.weeklyMenu === 'object' && doc.weeklyMenu !== null
              ? doc.weeklyMenu
              : await payload.findByID({ collection: 'weekly-menus', id: doc.weeklyMenu })

          // Format delivery date nicely (e.g. 15 Jun 2026)
          const deliveryDateRaw = weeklyMenu?.deliveryDate
          let deliveryDateStr = 'TBC'
          if (deliveryDateRaw) {
            try {
              deliveryDateStr = new Date(deliveryDateRaw).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Kuala_Lumpur',
              })
            } catch {
              deliveryDateStr = String(deliveryDateRaw)
            }
          }

          if (operation === 'create') {
            // 1. Customer Order Received Email
            const customerHtml = buildOrderReceivedHtml({
              customerName: doc.customerName,
              orderId: doc.id,
              productTitle: product?.title || 'Lunchbox Special',
              quantity: doc.quantity,
              totalPaid: doc.totalPaid,
              locationName: location?.name || 'School Drop-off',
              deliveryDate: deliveryDateStr,
            })
            
            await sendEmail({
              to: doc.email,
              subject: `Order #${doc.id} Received - Verification Pending`,
              html: customerHtml,
            })

            // 2. Admin Notification Email
            const adminHtml = buildAdminNotificationHtml({
              customerName: doc.customerName,
              email: doc.email,
              phone: doc.phone,
              orderId: doc.id,
              productTitle: product?.title || 'Lunchbox Special',
              quantity: doc.quantity,
              totalPaid: doc.totalPaid,
              locationName: location?.name || 'School Drop-off',
            })

            const adminEmailAddress = process.env.ADMIN_EMAIL || 'admin@linglingkitchen.com'
            await sendEmail({
              to: adminEmailAddress,
              subject: `[ACTION REQUIRED] New Order #${doc.id} - Receipt verification`,
              html: adminHtml,
            })
          } else if (operation === 'update') {
            // 3. Customer Order Confirmed Email (transitioned from pending -> paid)
            const wasPaid = previousDoc?.paymentStatus === 'paid'
            const isPaid = doc?.paymentStatus === 'paid'

            if (!wasPaid && isPaid) {
              const confirmHtml = buildOrderConfirmedHtml({
                customerName: doc.customerName,
                orderId: doc.id,
                productTitle: product?.title || 'Lunchbox Special',
                quantity: doc.quantity,
                totalPaid: doc.totalPaid,
                locationName: location?.name || 'School Drop-off',
                deliveryDate: deliveryDateStr,
              })

              await sendEmail({
                to: doc.email,
                subject: `Payment Verified! Order #${doc.id} Confirmed`,
                html: confirmHtml,
              })
            }
          }
        } catch (err) {
          // Catch all errors so email failures don't block order creations or status saves
          console.error('Error executing email notification hook on Order:', err)
        }
      },
    ],
  },

  fields: [
    {
      name: 'customerName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      validate: (value: string | null | undefined) => {
        if (!value) return 'Phone number is required.'
        if (!MALAYSIAN_PHONE_REGEX.test(value)) {
          return 'Please enter a valid Malaysian phone number (e.g. 0123456789 or +60123456789).'
        }
        return true
      },
      admin: {
        description: 'Malaysian format — starts with 01x or +601x.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        description: 'The food item ordered.',
      },
    },
    {
      name: 'weeklyMenu',
      type: 'relationship',
      relationTo: 'weekly-menus',
      required: true,
      admin: {
        description: 'The weekly menu this order belongs to.',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      admin: {
        description: 'Number of lunchboxes ordered.',
      },
    },
    {
      name: 'totalPaid',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total amount charged in MYR.',
        step: 0.01,
      },
    },
    {
      name: 'dropOffLocation',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      admin: {
        description: 'The drop-off delivery location selected by the customer.',
        position: 'sidebar',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
      admin: {
        description: 'Status of the payment. Can be verified manually by admin for QR receipt uploads.',
        position: 'sidebar',
      },
    },
    {
      name: 'paymentReceipt',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Uploaded payment screenshot or bank receipt.',
        position: 'sidebar',
      },
    },
    {
      name: 'gatewayBillId',
      type: 'text',
      admin: {
        description: 'The bill/transaction reference ID returned by the payment gateway.',
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
