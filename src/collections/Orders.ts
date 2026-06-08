import type { CollectionConfig } from 'payload'

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
        description: 'Updated automatically by the payment webhook.',
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
