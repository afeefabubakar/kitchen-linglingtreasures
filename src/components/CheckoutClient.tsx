'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShoppingBag,
  Loader2,
  QrCode,
  Upload,
  ArrowLeft,
  Receipt,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'

interface LocationData {
  id: number
  name: string
}

export function CheckoutClient() {
  const { cart, cartTotal, clearCart } = useCart()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [locationId, setLocationId] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const [locations, setLocations] = useState<LocationData[]>([])
  const [weeklyMenuId, setWeeklyMenuId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPageMounted, setIsPageMounted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setIsPageMounted(true)
  }, [])

  // Fetch active drop-off locations & active weekly menu
  useEffect(() => {
    async function fetchData() {
      try {
        const [locRes, menuRes] = await Promise.all([
          fetch('/api/locations?where[isActive][equals]=true&limit=100'),
          fetch('/api/weekly-menus?where[status][equals]=active&depth=2'),
        ])

        if (locRes.ok) {
          const locData = await locRes.json()
          setLocations(locData?.docs || [])
        }

        if (menuRes.ok) {
          const menuData = await menuRes.json()
          const menuId = menuData?.docs?.[0]?.id || null
          setWeeklyMenuId(menuId)
        }
      } catch (err) {
        console.error('Failed to fetch checkout setup data:', err)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.')
      return
    }
    if (!weeklyMenuId) {
      setErrorMsg('No active weekly menu is currently available for ordering.')
      return
    }
    if (!name.trim()) {
      setErrorMsg('Full Name is required.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required.')
      return
    }
    if (!phone.trim()) {
      setErrorMsg('WhatsApp phone number is required.')
      return
    }
    if (!locationId) {
      setErrorMsg('Please select a drop-off delivery location.')
      return
    }
    if (!receiptFile) {
      setErrorMsg('Please upload your payment receipt screenshot.')
      return
    }

    setIsLoading(true)

    try {
      const orderIds: number[] = []

      // Submit checkout requests in sequence for each cart item
      for (const item of cart) {
        const formData = new FormData()
        formData.append('customerName', name.trim())
        formData.append('email', email.trim())
        formData.append('phone', phone.trim())
        formData.append('productId', String(item.id))
        formData.append('weeklyMenuId', String(weeklyMenuId))
        formData.append('locationId', String(locationId))
        formData.append('quantity', String(item.quantity))
        formData.append('receipt', receiptFile)

        const res = await fetch('/api/checkout', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to place order.')
        }

        orderIds.push(data.orderId)
      }

      // Success flow
      clearCart()

      // Redirect to confirmation page
      router.push(`/order-confirmation?orderIds=${orderIds.join(',')}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during checkout.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isPageMounted) {
    return (
      <div className="grow flex items-center justify-center p-6 bg-secondary/15 min-h-[70vh]">
        <div className="font-sans text-sm text-muted-foreground animate-pulse">
          Loading checkout...
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="grow flex items-center justify-center p-6 bg-secondary/15 min-h-[70vh]">
        <Card className="w-full max-w-md border border-border/10 shadow-lg rounded-3xl bg-white p-8 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mx-auto">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-lg text-foreground">Your cart is empty</h3>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              Add lunchboxes from the home screen menu to checkout.
            </p>
          </div>
          <Button asChild className="rounded-full w-full font-bold shadow-md cursor-pointer mt-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4 animate-pulse" />
              Return to Menu
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="grow bg-secondary/15 w-full">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-8">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0 border-border bg-white cursor-pointer shadow-sm hover:bg-secondary/20 transition-all duration-200"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Checkout</h1>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Confirm your pre-order and complete the payment below.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-4 rounded-2xl border border-rose-100 shadow-sm">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-border/10 shadow-md rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <h2 className="font-sans font-bold text-base text-foreground flex items-center gap-2 border-b border-border/10 pb-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  Order Summary
                </h2>

                {/* Items List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 justify-between items-center text-sm">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-secondary/20 shrink-0 border border-border/10">
                          {item.image ? (
                            <ImageWithSkeleton
                              src={item.image}
                              alt={item.title}
                              fill
                              containerClassName="w-full h-full"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans font-bold text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground mt-0.5">
                            RM {item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-sans font-bold text-foreground shrink-0">
                        RM {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-border/10 pt-4 flex justify-between items-center">
                  <span className="font-sans text-sm font-bold text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="font-sans text-xl font-extrabold text-primary">
                    RM {cartTotal.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* DuitNow QR placeholder box */}
            <Card className="border border-border/10 shadow-md rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-1.5">
                  <QrCode className="h-4.5 w-4.5 text-primary shrink-0" />
                  Manual Payment (DuitNow)
                </h3>

                <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl bg-secondary/5 p-6 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-sm border border-border/5">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-xs text-foreground">
                      Lingling Kitchen DuitNow QR
                    </p>
                    <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                      Scan & pay exactly{' '}
                      <span className="font-bold text-primary">RM {cartTotal.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-[10px] bg-primary text-white font-semibold font-sans px-3 py-1 rounded-full shadow-sm">
                    DuitNow ID: 123-456-789
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Checkout Form (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border border-border/10 shadow-md rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <h2 className="font-sans font-bold text-base text-foreground flex items-center gap-2 border-b border-border/10 pb-3">
                  <User className="h-5 w-5 text-primary" />
                  Delivery & Contact Details
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="checkout-name"
                      className="font-sans text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input
                      id="checkout-name"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      required
                      className="rounded-xl border-border/60 bg-secondary/5 focus-visible:ring-primary/20 h-10"
                    />
                  </div>

                  {/* Email */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="checkout-email"
                      className="font-sans text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input
                      id="checkout-email"
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="rounded-xl border-border/60 bg-secondary/5 focus-visible:ring-primary/20 h-10"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="checkout-phone"
                      className="font-sans text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      WhatsApp Phone Number
                    </Label>
                    <Input
                      id="checkout-phone"
                      type="tel"
                      placeholder="e.g. 0123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading}
                      required
                      className="rounded-xl border-border/60 bg-secondary/5 focus-visible:ring-primary/20 h-10"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 font-sans leading-none">
                      Format: 01x-xxxxxxx or +601x-xxxxxxx (starts with 01x or +601x).
                    </span>
                  </div>

                  {/* Drop-off Location */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="checkout-location"
                      className="font-sans text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Drop-off Delivery Location
                    </Label>
                    <select
                      id="checkout-location"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full px-3 h-10 rounded-xl border border-border/60 bg-secondary/5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-sm text-foreground transition-all duration-200"
                    >
                      <option value="">Select Drop-off Point</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Receipt Uploader */}
                  <div className="grid gap-1.5 pt-2 border-t border-border/10 mt-4">
                    <Label
                      htmlFor="checkout-receipt"
                      className="font-sans text-xs font-bold text-foreground flex items-center gap-1"
                    >
                      <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                      Upload Payment Screenshot
                    </Label>
                    <div className="relative flex items-center justify-center border border-dashed border-border/60 rounded-xl bg-secondary/5 px-4 py-5 text-center cursor-pointer hover:bg-secondary/10 transition-colors">
                      <input
                        id="checkout-receipt"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        disabled={isLoading}
                        required
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Upload className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-sans text-xs font-bold text-foreground">
                          {receiptFile ? receiptFile.name : 'Choose receipt image...'}
                        </span>
                        <span className="font-sans text-[10px]">
                          PDF, JPG, or PNG files accepted.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="w-full rounded-full font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Confirm Pre-Order'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
