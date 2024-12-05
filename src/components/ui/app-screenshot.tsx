'use client'

import Image from 'next/image'

export function AppScreenshot() {
  return (
    <div className="mt-16 flow-root sm:mt-24">
      <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
        <Image
          src="/images/app-screenshot.png"
          alt="App screenshot"
          width={1920}
          height={1080}
          className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
          priority
          style={{
            width: '100%',
            height: 'auto',
          }}
          onError={(e) => {
            console.error('Error loading image:', e);
          }}
        />
      </div>
    </div>
  )
} 