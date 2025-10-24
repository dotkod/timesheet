'use client'

import { useEffect } from 'react'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })

      // Handle PWA install prompt
      let deferredPrompt: any = null

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault()
        // Stash the event so it can be triggered later
        deferredPrompt = e
        console.log('PWA install prompt available')
      })

      // Handle PWA installed
      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed')
        deferredPrompt = null
      })
    }
  }, [])

  return <>{children}</>
}
