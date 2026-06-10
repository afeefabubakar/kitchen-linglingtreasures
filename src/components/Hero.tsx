'use client'

import React from 'react'
import { MapPin, Navigation, ArrowRight, Utensils, Award, Clock } from 'lucide-react'
import Image from 'next/image'

interface HeroProps {
  onPreOrderClick?: () => void
  onViewMenuClick?: () => void
}

export function Hero({ onPreOrderClick, onViewMenuClick }: HeroProps) {
  return (
    <section className="relative px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Outer Hero Container with Light Sage Background */}
      <div className="relative rounded-2xl bg-secondary/60 px-6 py-12 sm:px-12 md:py-14 lg:px-18 overflow-hidden border border-primary/5">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-linear-to-tr from-secondary via-transparent to-accent/5 pointer-events-none" />

        <div className="relative flex flex-col-reverse md:flex-row gap-12 lg:gap-8 items-center z-10">
          {/* Left Column: Text Content & CTAs */}
          <div className="lg:basis-1/2 space-y-8 max-w-2xl">
            {/* Main Heading */}
            <h1>
              Handcrafted <br />
              <span className="text-primary">Gourmet Lunchboxes</span>
            </h1>

            {/* Description */}
            <p className="text-justify">
              Healthy, high-quality meals handcrafted with premium, wholesome ingredients. Pre-order
              from our weekly rotating menu, prepared fresh on the morning of delivery and dropped
              off straight to your location.
            </p>

            {/* Badges / Micro-selling points */}
            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-primary/10 max-w-md">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Pre-order Only</span>
              </div>
            </div>
          </div>

          {/* Right Column: Placeholder Image */}
          <div className="lg:basis-1/2 flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all duration-500">
              <Image
                src="/images/hero_lunchbox_placeholder.png"
                alt="Handcrafted gourmet lunchbox with salmon, rice, and broccoli"
                width={800}
                height={800}
                className="w-full h-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
