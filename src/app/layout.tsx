import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { LocaleProviderInner } from '@/components/i18n/LocaleProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { AppDialogProvider } from '@/components/ui/app-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { BRAND_NAME } from '@/lib/brand'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, LOCALE_STORAGE_KEY_LEGACY } from '@/i18n'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: BRAND_NAME,
  description:
    'Velum — CRM operativo para PYMEs. Capa fina que ordena consultas, ventas, inventario y cobros. Hecho en Costa Rica.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const localeScript = `
(function () {
  try {
    var k = 'velum-locale';
    var l = localStorage.getItem(k);
    if (l === 'es' || l === 'en') document.documentElement.lang = l;
  } catch (e) {}
})();
`

const themeScript = `
(function () {
  try {
    var k = 'velum-theme';
    var t = localStorage.getItem(k) || 'system';
    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', d);
    document.documentElement.style.colorScheme = d ? 'dark' : 'light';
  } catch (e) {}
})();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieLocale =
    cookieStore.get(LOCALE_STORAGE_KEY)?.value ??
    cookieStore.get(LOCALE_STORAGE_KEY_LEGACY)?.value
  const initialLocale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LocaleProviderInner initialLocale={initialLocale}>
          <ThemeProvider>
            <ToastProvider>
              <AppDialogProvider>{children}</AppDialogProvider>
            </ToastProvider>
          </ThemeProvider>
        </LocaleProviderInner>
      </body>
    </html>
  )
}
