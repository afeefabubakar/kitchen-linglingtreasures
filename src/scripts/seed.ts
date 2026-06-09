import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { getPayload } from 'payload'
import configPromise from '../payload.config'

async function seed() {
  console.log('--- Initializing PayloadCMS ---')
  const config = await configPromise
  const payload = await getPayload({ config })

  console.log('\n--- Seeding Locations ---')
  // 1. Seed Drop-off Location
  let locationDoc = await payload.find({
    collection: 'locations',
    where: {
      name: { equals: 'Sri KDU International School' },
    },
  })

  let locationId: number
  if (locationDoc.docs.length === 0) {
    const newLoc = await payload.create({
      collection: 'locations',
      data: {
        name: 'SMK Testing School',
        isActive: true,
      },
    })
    locationId = newLoc.id
    console.log(`✓ Created Location: "${newLoc.name}" (ID: ${newLoc.id})`)
  } else {
    locationId = locationDoc.docs[0].id
    console.log(`✓ Using existing Location: "${locationDoc.docs[0].name}" (ID: ${locationId})`)
  }

  console.log('\n--- Seeding Media (Product Images) ---')
  // 2. Seed Media
  let mediaDoc = await payload.find({
    collection: 'media',
    where: {
      alt: { equals: 'Gourmet Salmon Bento' },
    },
  })

  let mediaId: number
  if (mediaDoc.docs.length === 0) {
    const imagePath = path.resolve(dirname, '../../public/images/hero_lunchbox_placeholder.png')
    if (!fs.existsSync(imagePath)) {
      throw new Error(
        `Media file not found at ${imagePath}. Please make sure you generated the placeholder image first.`,
      )
    }

    const fileBuffer = fs.readFileSync(imagePath)
    const newMedia = await payload.create({
      collection: 'media',
      data: {
        alt: 'Gourmet Salmon Bento',
      },
      file: {
        data: fileBuffer,
        name: 'hero_lunchbox_placeholder.png',
        mimetype: 'image/png',
        size: fileBuffer.length,
      },
    })
    mediaId = newMedia.id
    console.log(`✓ Created Media item: "hero_lunchbox_placeholder.png" (ID: ${newMedia.id})`)
  } else {
    mediaId = mediaDoc.docs[0].id
    console.log(`✓ Using existing Media item: "Gourmet Salmon Bento" (ID: ${mediaId})`)
  }

  console.log('\n--- Seeding Products ---')
  // 3. Seed Products
  const mockProducts = [
    {
      title: 'Premium Grilled Salmon Bento',
      basePrice: 18.5,
      descriptionText:
        'A rich, gourmet salmon fillet grilled with teriyaki glaze, served on a bed of fluffy jasmine rice with steamed fresh broccoli and sweet cherry tomatoes.',
    },
    {
      title: 'Classic Beef Ribeye Bowl',
      basePrice: 22.0,
      descriptionText:
        'Tender, juicy slices of premium grilled beef ribeye seasoned with sesame soy sauce, served with roasted green beans and pickled carrots.',
    },
  ]

  const seededProductIds: number[] = []

  for (const item of mockProducts) {
    const existing = await payload.find({
      collection: 'products',
      where: {
        title: { equals: item.title },
      },
    })

    if (existing.docs.length === 0) {
      // Build Lexical RichText JSON structure
      const lexicalDescription = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  text: item.descriptionText,
                  version: 1,
                },
              ],
            },
          ],
        },
      }

      const newProduct = await payload.create({
        collection: 'products',
        data: {
          title: item.title,
          basePrice: item.basePrice,
          // @ts-expect-error test data
          description: lexicalDescription,
          image: mediaId,
        },
      })
      seededProductIds.push(newProduct.id)
      console.log(
        `✓ Created Product: "${newProduct.title}" (ID: ${newProduct.id}, Price: RM${newProduct.basePrice})`,
      )
    } else {
      const existingId = existing.docs[0].id
      seededProductIds.push(existingId)
      console.log(`✓ Using existing Product: "${existing.docs[0].title}" (ID: ${existingId})`)
    }
  }

  console.log('\n--- Seeding Weekly Menus ---')
  // 4. Seed Active WeeklyMenu
  // Calculate relative dates:
  // - startDate: yesterday
  // - orderCutoffDate: 3 days from now
  // - deliveryDate: 5 days from now
  const nowTime = new Date()

  const yesterday = new Date(nowTime)
  yesterday.setDate(nowTime.getDate() - 1)
  const startDateStr = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

  const cutoff = new Date(nowTime)
  cutoff.setDate(nowTime.getDate() + 3)
  cutoff.setHours(18, 0, 0, 0) // 6:00 PM
  const cutoffDateStr = cutoff.toISOString()

  const delivery = new Date(nowTime)
  delivery.setDate(nowTime.getDate() + 5)
  const deliveryDateStr = delivery.toISOString().split('T')[0] // YYYY-MM-DD

  // Check if there's already an active menu
  const activeMenus = await payload.find({
    collection: 'weekly-menus',
    where: {
      status: { equals: 'active' },
    },
  })

  if (activeMenus.docs.length === 0) {
    const newMenu = await payload.create({
      collection: 'weekly-menus',
      data: {
        startDate: startDateStr,
        orderCutoffDate: cutoffDateStr,
        deliveryDate: deliveryDateStr,
        status: 'active',
        menuItems: [
          {
            product: seededProductIds[0],
            stockLimit: 50,
          },
          {
            product: seededProductIds[1],
            stockLimit: 30,
          },
        ],
      },
    })
    console.log(`✓ Created Active Weekly Menu (ID: ${newMenu.id})`)
    console.log(`  - Starts: ${startDateStr} (Midnight KL)`)
    console.log(`  - Cutoff: ${cutoffDateStr}`)
    console.log(`  - Delivery: ${deliveryDateStr}`)
  } else {
    console.log(`✓ Active Weekly Menu already exists (ID: ${activeMenus.docs[0].id})`)
  }

  console.log('\n=== Database Seeding Complete ===\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('✗ Seeding failed:', err)
  process.exit(1)
})
