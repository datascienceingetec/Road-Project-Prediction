"use client"

import type React from "react"

import { useState } from "react"

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <details className="flex flex-col rounded-xl border border-[#dee2e6] bg-white group" open={isOpen}>
      <summary
        className="flex cursor-pointer items-center justify-between gap-6 p-4"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
      >
        <p className="text-[#071d49] text-base font-bold leading-normal">{title}</p>
        <span className={`material-symbols-outlined text-[#111418] transition-transform ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </summary>
      {isOpen && <div className="border-t border-[#dee2e6]">{children}</div>}
    </details>
  )
}
