'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, Sprout } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform duration-200 active:scale-95"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/90">
            <Sprout className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">
              Lingling
              <span className="text-primary font-normal font-serif italic ml-0.5">Kitchen</span>
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase mt-1 font-semibold">
              healthy lunchbox
            </span>
          </div>
        </Link>

        {/* Cart */}
        <button
          aria-label="Shopping Cart"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all duration-300 hover:border-primary hover:bg-secondary hover:text-primary active:scale-95 shadow-sm cursor-pointer group"
        >
          <ShoppingBag className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-accent-foreground shadow-sm">
            0
          </span>
        </button>
      </div>
    </header>
  )
}
