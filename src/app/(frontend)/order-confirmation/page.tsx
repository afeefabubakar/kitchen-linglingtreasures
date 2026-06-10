import React, { Suspense } from 'react'
import { Header } from '@/components/Header'
import { OrderConfirmationClient } from '@/components/OrderConfirmationClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Confirmation | Lingling Kitchen',
  description: 'Thank you for your pre-order! Your payment receipt has been submitted and is pending verification.',
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col">
        <Suspense
          fallback={
            <div className="flex-grow flex items-center justify-center min-h-[70vh] bg-secondary/15">
              <div className="font-sans text-sm text-muted-foreground animate-pulse">
                Loading order confirmation...
              </div>
            </div>
          }
        >
          <OrderConfirmationClient />
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
