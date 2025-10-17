import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Objednávka Oběda',
  description: 'Systém pro týmové objednávání obědů s AI rozpoznáváním menu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
