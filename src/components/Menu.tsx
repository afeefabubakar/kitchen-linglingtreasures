'use client'

import React from 'react'
import { useCart } from '@/context/CartContext'
import type { WeeklyMenu, Product, Media } from '@/payload-types'

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
  const { addToCart } = useCart()

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      {/* Menu Heading & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
          Discover Our Menu
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
          This week's handcrafted lunchboxes, prepared fresh on the morning of delivery using
          high-quality, wholesome ingredients. Pre-order yours before the cutoff!
        </p>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto">
        {menuItems.map((item, index) => {
          const product = item.product as Product
          if (!product || typeof product !== 'object') return null

          const imageUrl =
            typeof product.image === 'object' && product.image?.url ? product.image.url : undefined
          const descriptionText = renderDescription(product.description)

          return (
            <div
              key={product.id || index}
              className="flex flex-col bg-white rounded-3xl border border-border/20 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Product Picture */}
              <div className="relative w-full aspect-video overflow-hidden bg-secondary/30">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-sans text-sm">
                    No image available
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {product.title}
                </h3>
                <p className="font-sans text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                  {descriptionText}
                </p>

                {/* Footer: Price & Add to Cart */}
                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <span className="font-sans text-xl font-extrabold text-primary">
                    RM {product.basePrice.toFixed(2)}
                  </span>

                  <button
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.basePrice,
                        image: imageUrl,
                      })
                    }
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/95 text-xs transition-all duration-200 active:scale-95 shadow-sm shadow-primary/10 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
