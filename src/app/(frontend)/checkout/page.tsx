import React, { Suspense } from 'react'
import { Header } from '@/components/Header'
import { CheckoutClient } from '@/components/CheckoutClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Secure Checkout | Lingling Kitchen',
  description: 'Confirm your healthy lunchbox pre-order, verify DuitNow details, and upload your payment screenshot.',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col">
        <Suspense
          fallback={
            <div className="flex-grow flex items-center justify-center min-h-[70vh] bg-secondary/15">
              <div className="font-sans text-sm text-muted-foreground animate-pulse">
                Loading secure checkout...
              </div>
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </main>
      <footer className="py-8 border-t border-border/10 text-center text-xs text-muted-foreground bg-white shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {new Date().getFullYear()} LingLing Treasures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
