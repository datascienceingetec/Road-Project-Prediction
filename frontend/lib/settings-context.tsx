"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SettingsContextType {
  useSidebar: boolean
  toggleNavigation: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [useSidebar, setUseSidebar] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedUseSidebar = localStorage.getItem("useSidebar")
    if (savedUseSidebar !== null) {
      setUseSidebar(savedUseSidebar === "true")
    }
  }, [])

  const toggleNavigation = () => {
    const newValue = !useSidebar
    setUseSidebar(newValue)
    localStorage.setItem("useSidebar", String(newValue))
  }

  return (
    <SettingsContext.Provider value={{ useSidebar, toggleNavigation, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
