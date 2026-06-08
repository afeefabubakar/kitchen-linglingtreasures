import type { CollectionConfig } from 'payload'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    group: 'Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'isActive', 'updatedAt'],
    description:
      'Drop-off delivery locations. Active locations are shown to customers at checkout.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'The full display name of the drop-off location.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: {
        description:
          'Only active locations are available for customers to select at checkout. ' +
          'Deactivate instead of deleting to preserve order history.',
        position: 'sidebar',
      },
    },
  ],
}
