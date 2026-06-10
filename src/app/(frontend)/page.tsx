import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Menu } from '@/components/Menu'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // Fetch the active weekly menu and resolve products & media (depth 2)
  const activeMenus = await payload.find({
    collection: 'weekly-menus',
    where: {
      status: { equals: 'active' },
    },
    depth: 2,
  })

  const weeklyMenu = activeMenus.docs[0] || null
  const menuItems = weeklyMenu?.menuItems || []

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="grow flex flex-col py-6">
        {/* <Hero /> */}
        {menuItems.length > 0 ? (
          <Menu menuItems={menuItems} />
        ) : (
          <div className="text-center py-12 px-6">
            <p className="text-muted-foreground font-sans">
              No active menu available this week. Please check back later!
            </p>
          </div>
        )}
      </main>
      <footer className="py-8 border-t border-border/10 text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs">
            © {new Date().getFullYear()} LinglingKitchen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
