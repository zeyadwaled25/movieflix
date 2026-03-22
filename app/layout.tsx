import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://movieflix.com"),
  title: {
    default: "MovieFlix - Stream Movies & TV Shows Online",
    template: "%s | MovieFlix"
  },
  description:
    "Discover and stream the best movies and TV shows. Create your personalized watchlist, rate content, and get recommendations with MovieFlix.",
  keywords: [
    "movies",
    "tv shows",
    "streaming",
    "entertainment",
    "watch online",
    "film database",
    "ratings",
    "watchlist"
  ],
  authors: [{ name: "MovieFlix" }],
  creator: "MovieFlix",
  publisher: "MovieFlix",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://movieflix.com",
    title: "MovieFlix - Stream Movies & TV Shows Online",
    description:
      "Discover and stream the best movies and TV shows. Create your personalized watchlist, rate content, and get recommendations.",
    siteName: "MovieFlix",
    images: [
      {
        url: "https://movieflix.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MovieFlix"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieFlix - Stream Movies & TV Shows",
    description: "Discover and stream movies and TV shows with ratings and recommendations.",
    images: ["https://movieflix.com/og-image.jpg"]
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#dc3545"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          crossOrigin="anonymous"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <link rel="canonical" href="https://movieflix.com" />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MovieFlix",
              description:
                "Discover and stream the best movies and TV shows with ratings and recommendations",
              url: "https://movieflix.com",
              applicationCategory: "EntertainmentApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              }
            })
          }}
        />
      </head>
      <body className="bg-dark text-white">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}