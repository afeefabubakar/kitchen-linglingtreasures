import React from 'react'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="grow flex flex-col justify-start py-6">
        <Hero />
      </main>
      <footer className="py-8 border-t border-border/10 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {new Date().getFullYear()} LinglingKitchen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
