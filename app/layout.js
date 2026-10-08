import './globals.css'

export const metadata = {
  title: 'Itqan Quran Academy',
  description: 'Academy Management System',
  manifest: '/manifest.json',
  themeColor: '#0b6b2f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Itqan Academy',
  },
}

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0b6b2f" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`,
        }} />
      </body>
    </html>
  )
}
