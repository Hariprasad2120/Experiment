"use client"

import { createContext, useContext, useState } from "react"
import { signOut } from "next-auth/react"
import {
  ChevronFirst, ChevronLast, LayoutDashboard, Users, ClipboardList,
  BarChart3, LogOut, User, CheckSquare, Star, Calendar, FileText, Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type SidebarContextType = { expanded: boolean }
const SidebarContext = createContext<SidebarContextType>({ expanded: true })

interface NavItem {
  icon: React.ReactNode
  text: string
  href: string
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  ADMIN: [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/dashboard/admin" },
    { icon: <Users size={20} />, text: "Employees", href: "/dashboard/admin/employees" },
    { icon: <ClipboardList size={20} />, text: "Appraisals", href: "/dashboard/admin/appraisals" },
    { icon: <BarChart3 size={20} />, text: "Reports", href: "/dashboard/admin/reports" },
    { icon: <Settings size={20} />, text: "Users", href: "/dashboard/admin/users" },
  ],
  HR: [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/dashboard/hr" },
    { icon: <CheckSquare size={20} />, text: "Availability", href: "/dashboard/hr" },
    { icon: <Star size={20} />, text: "Ratings", href: "/dashboard/hr" },
    { icon: <Calendar size={20} />, text: "Vote", href: "/dashboard/hr" },
  ],
  TL: [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/dashboard/tl" },
    { icon: <CheckSquare size={20} />, text: "Availability", href: "/dashboard/tl" },
    { icon: <Star size={20} />, text: "Ratings", href: "/dashboard/tl" },
    { icon: <Calendar size={20} />, text: "Vote", href: "/dashboard/tl" },
  ],
  MANAGER: [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/dashboard/manager" },
    { icon: <CheckSquare size={20} />, text: "Availability", href: "/dashboard/manager" },
    { icon: <Star size={20} />, text: "Ratings", href: "/dashboard/manager" },
    { icon: <Calendar size={20} />, text: "Vote", href: "/dashboard/manager" },
  ],
  EMPLOYEE: [
    { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/dashboard/employee" },
    { icon: <ClipboardList size={20} />, text: "My Appraisal", href: "/dashboard/employee" },
    { icon: <FileText size={20} />, text: "Results", href: "/dashboard/employee" },
  ],
}

interface SideBarProps {
  role: string
  userName: string
  userEmail: string
}

export default function SideBar({ role, userName, userEmail }: SideBarProps) {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()
  const navItems = NAV_ITEMS[role] ?? []
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <aside className="h-screen sticky top-0 shrink-0">
      <nav
        className={cn(
          "flex flex-col h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300",
          expanded ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <div className="h-16 px-4 flex justify-between items-center border-b border-gray-100">
          {expanded && (
            <img src="/adarsh Full logo (1).png" alt="Adarsh Shipping Logo" className="w-40"/>
          )}
          <button
            onClick={() => setExpanded((c) => !c)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 ml-auto shrink-0"
          >
            {expanded ? <ChevronFirst size={18} /> : <ChevronLast size={18} />}
          </button>
        </div>

        {/* Nav */}
        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarItem
                key={item.href + item.text}
                icon={item.icon}
                text={item.text}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </ul>
        </SidebarContext.Provider>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            )}
            {expanded && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {!expanded && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 w-full flex justify-center p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </nav>
    </aside>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  text: string
  href: string
  active?: boolean
}

export function SidebarItem({ icon, text, href, active }: SidebarItemProps) {
  const { expanded } = useContext(SidebarContext)

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "relative flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors group",
          active
            ? "bg-indigo-50 text-indigo-700 font-semibold"
            : "text-gray-600 hover:bg-gray-100"
        )}
      >
        <span className="shrink-0">{icon}</span>
        {expanded && <span className="ml-3 text-sm whitespace-nowrap">{text}</span>}
        {!expanded && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 pointer-events-none">
            {text}
          </div>
        )}
      </Link>
    </li>
  )
}
