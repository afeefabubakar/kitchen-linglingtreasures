'use client'

import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

interface ImageWithSkeletonProps extends Omit<ImageProps, 'onLoad'> {
  containerClassName?: string
  skeletonClassName?: string
}

export function ImageWithSkeleton({
  src,
  alt,
  containerClassName,
  skeletonClassName,
  className,
  fill,
  width,
  height,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && (
        <Skeleton
          className={cn(
            "absolute inset-0 w-full h-full z-10",
            skeletonClassName
          )}
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        onLoad={() => setIsLoading(false)}
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
    </div>
  )
}
