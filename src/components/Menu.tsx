'use client'

import React from 'react'
import { useCart } from '@/context/CartContext'
import type { WeeklyMenu, Product, Media } from '@/payload-types'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface MenuProps {
  menuItems: WeeklyMenu['menuItems']
}

// Utility to parse Payload's Lexical editor JSON block to standard text
function renderDescription(description: any): string {
  try {
    if (description?.root?.children?.[0]?.children?.[0]?.text) {
      return description.root.children[0].children[0].text
    }
  } catch (e) {
    // fallback if structure differs
  }
  return typeof description === 'string'
    ? description
    : 'Handcrafted weekly special cooked fresh for you.'
}

export function Menu({ menuItems }: MenuProps) {
  const { cart, addToCart, setIsCartOpen } = useCart()

  return (
    <section className="px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Menu Heading & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
          Discover Our Menu
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
          This week's handcrafted lunchboxes, prepared fresh on the morning of delivery using
          high-quality, wholesome ingredients. Pre-order yours before the cutoff!
        </p>
      </div>

      {/* Centered Flex Container */}
      <div className="flex flex-col md:flex-row flex-wrap justify-center gap-8 mx-auto">
        {menuItems.map((item, index) => {
          const product = item.product as Product
          if (!product || typeof product !== 'object') return null

          const imageUrl =
            typeof product.image === 'object' && product.image?.url ? product.image.url : undefined
          const descriptionText = renderDescription(product.description)

          return (
            <div
              key={product.id || index}
              className="flex flex-col bg-white rounded-3xl border border-border/20 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full md:max-w-lg grow"
            >
              {/* Product Picture */}
              <div className="relative w-full aspect-video overflow-hidden bg-secondary/30">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-sans text-sm">
                    No image available
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col grow">
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {product.title}
                </h3>
                <p className="font-sans text-muted-foreground text-sm leading-relaxed mb-6 grow">
                  {descriptionText}
                </p>

                {/* Footer: Price & Add to Cart */}
                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <span className="font-sans text-xl font-extrabold text-primary">
                    RM {product.basePrice.toFixed(2)}
                  </span>

                  {cart.some((cartItem) => cartItem.id === product.id) ? (
                    <Button
                      onClick={() => setIsCartOpen(true)}
                      size="sm"
                      variant="outline"
                      className="rounded-full font-bold cursor-pointer active:scale-95 shadow-sm border-primary/30 text-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      View Cart
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          title: product.title,
                          price: product.basePrice,
                          image: imageUrl,
                          stockLimit: item.stockLimit,
                        })
                      }
                      size="sm"
                      className="rounded-full font-bold cursor-pointer active:scale-95 shadow-sm shadow-primary/10 transition-all duration-200"
                    >
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
