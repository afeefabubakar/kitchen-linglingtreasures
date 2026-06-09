import React from 'react'
import { Lora, Inter } from 'next/font/google'
import './styles.css'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  description: 'Gourmet lunchbox pre-order service.',
  title: 'LingLingKitchen',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
