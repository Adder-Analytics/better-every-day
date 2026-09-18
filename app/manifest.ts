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
    // Let the installed app receive shared text, so a link or note handed to it
    // from another app's share sheet becomes a new task. A GET target hands the
    // shared title/text/url to the home page as query params, which the planner
    // reads on load and drops into the add box for a look before it's added —
    // capture stays on this device, like everything else here.
    share_target: {
      action: '/',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  }
}
