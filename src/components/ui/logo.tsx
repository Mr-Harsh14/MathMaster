'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number
}

export function Logo({ className = '', showText = true, size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/images/hazz.png"
        alt="MathMaster Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="font-bold text-gray-900">MathMaster</span>
      )}
    </div>
  )
} 