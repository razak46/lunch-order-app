import './globals.css'

export const metadata = {
  title: 'Objednávka obědů',
  description: 'Týmový systém pro objednávání obědů',
}

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
