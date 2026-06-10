'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MessageSquare, ArrowLeft, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function OrderConfirmationClient() {
  const searchParams = useSearchParams()
  const orderIdsString = searchParams.get('orderIds') || ''
  const orderIds = orderIdsString ? orderIdsString.split(',') : []

  // Prefilled WhatsApp message
  const adminPhone = '60123456789' // Placeholder Malaysian WhatsApp phone number
  const formattedOrderIds = orderIds.map((id) => `#${id}`).join(', ')
  const messageText = `Hello Lingling Kitchen! I have just completed my pre-order. Here is my order reference: ${formattedOrderIds || 'N/A'}. Please verify my payment receipt screenshot.`
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(messageText)}`

  return (
    <div className="flex-grow flex items-center justify-center p-6 bg-secondary/15 min-h-[70vh]">
      <Card className="w-full max-w-lg border border-border/10 shadow-lg rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-8 sm:p-10 text-center space-y-6 flex flex-col items-center">
          {/* Animated success mark */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1
              id="order-success-title"
              className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Order Placed!
            </h1>
            <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto">
              Your payment receipt has been submitted and is currently pending verification.
            </p>
          </div>

          {/* Order Details box */}
          {orderIds.length > 0 && (
            <div className="w-full p-4 rounded-2xl bg-secondary/35 border border-border/10 space-y-2 text-left">
              <div className="flex items-center gap-1.5 font-sans text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Receipt className="h-4 w-4 text-primary" />
                Order Details
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {orderIds.map((id) => (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="font-sans font-bold text-xs px-2.5 py-0.5"
                  >
                    Order #{id}
                  </Badge>
                ))}
              </div>
              <p className="font-sans text-[11px] text-muted-foreground leading-normal mt-1">
                Please keep these order references handy for any inquiries regarding your booking.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 pt-2">
            {/* <Button
              asChild
              size="lg"
              id="wa-message-admin-btn"
              className="w-full rounded-full font-bold shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message Admin on WhatsApp
              </a>
            </Button> */}

            <Button
              asChild
              variant="outline"
              size="lg"
              id="return-menu-btn"
              className="w-full rounded-full font-bold border-border cursor-pointer transition-all duration-200 hover:bg-secondary/20"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Menu
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
