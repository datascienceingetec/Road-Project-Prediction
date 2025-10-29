import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import "./globals.css"
import { SettingsProvider } from "@/contexts/settings-context"
import { AppLayout } from "@/layouts"
import { GoogleMapsProvider } from "@/contexts/map-context"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "INGETEC - Sistema de Predicción de Costos",
  description: "Sistema de gestión y predicción de costos en proyectos de infraestructura vial",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      </head>
      <body className={manrope.className}>
        <GoogleMapsProvider>
          <SettingsProvider>
            <AppLayout>{children}</AppLayout>
          </SettingsProvider>
        </GoogleMapsProvider>
      </body>
    </html>
  )
}
