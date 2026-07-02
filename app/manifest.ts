import type { MetadataRoute } from 'next'

// Makes the planner installable: pin it to a phone home screen or a desktop
// dock and it opens in its own window, like the local-first app it is.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Better Every Day',
    short_name: 'Every Day',
    description: 'A small daily planner that improves a little every day.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#fafafa',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
