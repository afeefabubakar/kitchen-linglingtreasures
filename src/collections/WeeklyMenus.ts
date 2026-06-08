import type { CollectionConfig } from 'payload'

export const WeeklyMenus: CollectionConfig = {
  slug: 'weekly-menus',
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        // Warn (but do not block) if activating a menu that overlaps with another active menu.
        if (data?.status === 'active') {
          const payload = req.payload
          const existingActive = await payload.find({
            collection: 'weekly-menus',
            where: {
              and: [
                { status: { equals: 'active' } },
                // Exclude the current document being saved
                ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
              ],
            },
            limit: 5,
          })

          if (existingActive.totalDocs > 0) {
            const names = existingActive.docs
              .map((m) => `ID ${m.id} (starts ${m.startDate ?? 'unknown'})`)
              .join(', ')
            console.warn(
              `[WeeklyMenus] WARNING: Setting menu to 'active' while ${existingActive.totalDocs} ` +
                `other active menu(s) exist: ${names}. ` +
                `Only one menu should be active at a time to avoid ordering conflicts.`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    group: 'Menu',
    useAsTitle: 'startDate',
    defaultColumns: ['startDate', 'deliveryDate', 'status', 'updatedAt'],
    description: 'Schedule weekly menus. Only one menu should be set to "active" at a time.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: "The day this week's menu goes live.",
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyyy',
        },
      },
    },
    {
      name: 'orderCutoffDate',
      type: 'date',
      required: true,
      admin: {
        description: 'The deadline for customers to place orders (inclusive).',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy HH:mm',
          timeIntervals: 30,
        },
      },
    },
    {
      name: 'deliveryDate',
      type: 'date',
      required: true,
      admin: {
        description: 'The date the lunchboxes will be delivered to the drop-off location.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyyy',
        },
      },
    },
    {
      name: 'menuItems',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 2,
      admin: {
        description: 'Select up to 2 food items for this week. Each item has its own stock limit.',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          admin: {
            description: "The food item to include in this week's menu.",
          },
        },
        {
          name: 'stockLimit',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            description: 'Maximum number of boxes available for this item this week.',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      admin: {
        description:
          'Only one menu should be "Active" at a time. Set to "Draft" while preparing, "Archived" when the week has passed.',
        position: 'sidebar',
      },
    },
  ],
}
