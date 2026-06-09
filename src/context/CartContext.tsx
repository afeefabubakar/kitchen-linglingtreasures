'use client'

import React, { createContext, useContext, useState } from 'react'

export interface CartItem {
  id: number
  title: string
  price: number
  image?: string
  quantity: number
  stockLimit: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: {
    id: number
    title: string
    price: number
    image?: string
    stockLimit: number
  }) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (item: {
    id: number
    title: string
    price: number
    image?: string
    stockLimit: number
  }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        const newQuantity = Math.min(item.stockLimit, existing.quantity + 1)
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    setIsCartOpen(true) // Automatically slide open cart drawer when item is added
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const clamped = Math.max(1, Math.min(item.stockLimit, quantity))
          return { ...item, quantity: clamped }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
