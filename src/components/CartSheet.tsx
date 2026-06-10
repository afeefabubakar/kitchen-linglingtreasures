'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/payload-types'
import Image from 'next/image'

export function CartSheet() {
  const router = useRouter()
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    addToCart,
  } = useCart()

  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const [weeklyMenuId, setWeeklyMenuId] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function fetchMenuItems() {
      try {
        const res = await fetch('/api/weekly-menus?where[status][equals]=active&depth=2')
        if (res.ok) {
          const data = await res.json()
          const menuId = data?.docs?.[0]?.id || null
          setWeeklyMenuId(menuId)
          const items = data?.docs?.[0]?.menuItems || []
          setMenuItems(items)
        }
      } catch (err) {
        console.error('Failed to fetch menu items for recommendations:', err)
      }
    }

    // Fetch only if cart is open
    if (isCartOpen) {
      fetchMenuItems()
    }
  }, [isCartOpen])

  const itemsNotInCart = menuItems
    .filter((menuItem) => {
      const product = menuItem.product
      if (!product || typeof product !== 'object') return false
      return !cart.some((cartItem) => cartItem.id === product.id)
    })
    .slice(0, 2)

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/10 bg-white">
          {/* Drawer Header */}
          <SheetHeader className="px-6 py-5 border-b border-border/20 shrink-0 flex-row items-center justify-between pr-14 space-y-0">
            <div className="flex items-center gap-2 leading-none">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
              <SheetTitle className="font-sans font-bold">Cart</SheetTitle>
              {cartCount > 0 && (
                <Badge variant="secondary" className="font-sans text-[11px] font-bold">
                  {cartCount} box{cartCount > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
            <SheetDescription className="sr-only">
              Your shopping cart items and order total.
            </SheetDescription>
          </SheetHeader>

          {/* Drawer Body (Scrollable list of items) */}
          <div className="grow overflow-y-auto px-4 py-6 space-y-4 bg-secondary/15">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground/60">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-sans font-bold text-foreground">Your cart is empty</p>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    Add some handcrafted items to get started!
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <Card
                  key={item.id}
                  size="sm"
                  className="py-0 border border-border/10 shadow-sm bg-card hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                    {/* Col 1: Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-secondary/20 shrink-0 border border-border/10">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Col 2: Details & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-20 sm:h-24 py-0.5">
                      {/* Top: Title */}
                      <div>
                        <h4 className="font-sans font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                      </div>

                      {/* Bottom: Quantity Selector & Price */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-border/60 rounded-full bg-secondary/10 px-1 py-0.5 w-fit">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeFromCart(item.id)
                              } else {
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            }}
                            className="p-1 rounded-full text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                            aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="font-sans font-bold text-xs text-foreground w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stockLimit}
                            className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price Container */}
                        <div className="flex items-center">
                          <span className="font-sans text-xs sm:text-sm font-bold text-primary">
                            RM {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Recommended Items Section (Add another item) */}
          {cart.length > 0 && itemsNotInCart.length > 0 && (
            <div className="px-6 py-4 border-t border-border/10 bg-white shrink-0 space-y-3">
              <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add another item?
              </h5>
              <div className="space-y-2">
                {itemsNotInCart.map((menuItem, index) => {
                  const product = menuItem.product as Product
                  if (!product || typeof product !== 'object') return null

                  const imageUrl =
                    product.image && typeof product.image === 'object' && 'url' in product.image
                      ? (product.image.url as string)
                      : undefined

                  return (
                    <div
                      key={product.id || index}
                      className="flex items-center justify-between gap-3 p-2 rounded-2xl border border-border/5 bg-secondary/5"
                    >
                      <div className="flex items-center gap-3">
                        {/* Image Thumbnail */}
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-secondary/20 shrink-0 border border-border/10">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={product.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Text details */}
                        <div>
                          <h6 className="font-sans font-bold text-foreground text-xs leading-none">
                            {product.title}
                          </h6>
                          <span className="inline-block font-sans text-[11px] font-bold text-primary mt-1 leading-none">
                            RM {product.basePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Add Button */}
                      <Button
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            title: product.title,
                            price: product.basePrice,
                            image: imageUrl,
                            stockLimit: menuItem.stockLimit,
                          })
                        }
                        size="xs"
                        variant="outline"
                        className="rounded-full font-bold cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                      >
                        + Add
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <SheetFooter className="px-6 py-6 border-t border-border/20 shrink-0 bg-secondary/10 space-y-4 flex flex-col mt-0">
              {/* Subtotal Display */}
              <div className="w-full flex items-center justify-between">
                <span className="font-sans text-sm font-bold text-muted-foreground">Subtotal</span>
                <span className="font-sans text-xl font-extrabold text-foreground">
                  RM {cartTotal.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="w-full space-y-2 flex flex-col">
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    router.push('/checkout')
                  }}
                  disabled={!weeklyMenuId}
                  size="lg"
                  className="w-full rounded-full font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer"
                >
                  {!weeklyMenuId ? 'No active menu available' : 'Checkout'}
                </Button>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Close Cart
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

