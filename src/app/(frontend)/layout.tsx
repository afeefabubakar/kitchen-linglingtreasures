import React from 'react'
import { Lora, Inter } from 'next/font/google'
import './styles.css'
import { CartProvider } from '@/context/CartContext'

const lora = Lora({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

import { CartSheet } from '@/components/CartSheet'

export const metadata = {
  description: 'Gourmet lunchbox pre-order service.',
  title: 'LinglingKitchen',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <CartProvider>
          <CartSheet />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  )
}
