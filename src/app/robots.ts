import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/ops', '/ops/', '/ops/*'],
      },
    ],
    sitemap: undefined,
  }
}

