"use client";
import { MoreVertical, ChevronLast, ChevronFirst } from "lucide-react";
import { useContext, createContext, useState } from "react";

const SidebarContext = createContext();

export default function SideBar({ children }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="h-screen">
      <nav
        className={`flex flex-col h-full bg-white border-r border-gray-300 shadow-sm transition-all duration-300 ${
          expanded ? "w-64" : "w-16"
        }`}
      >
        <div className="h-16 p-4 flex justify-between items-center">
          <img
            src="/adarsh Full logo (1).png"
            className={`overflow-hidden transition-all duration-300 shrink-0 ${
              expanded ? "w-32 opacity-100" : "w-0 opacity-0"
            }`}
            alt="Logo"
          />
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 shrink-0"
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">{children}</ul>
        </SidebarContext.Provider>

        <div className="border-t border-gray-300 flex p-3 items-center h-16">
          <img
            src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
            alt=""
            className="w-10 h-10 rounded-md shrink-0"
          />
          <div
            className={`
              flex justify-between items-center overflow-hidden transition-all duration-300
              ${expanded ? "w-44 ml-3 opacity-100" : "w-0 ml-0 opacity-0"}
            `}
          >
            <div className="leading-4 whitespace-nowrap">
              <h4 className="font-semibold">John Doe</h4>
              <span className="text-xs text-gray-600">johndoe@gmail.com</span>
            </div>
            <MoreVertical size={20} className="shrink-0" />
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function SidebarItem({ icon, text, active, alert }) {
  const { expanded } = useContext(SidebarContext);

  return (
    <li
      className={`
        relative flex items-center py-2 my-1
        font-medium rounded-md cursor-pointer
        transition-all duration-300 group 
        ${expanded ? "px-3" : "px-2"}
        ${
          active
            ? "bg-linear-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
            : "hover:bg-indigo-50 text-gray-600"
        }
    `}
    >
      {/* (Notice the 'group' class added 5 lines up ^) */}
      
      <div className="flex items-center justify-center min-w-6">
        {icon}
      </div>
      
      <span
        className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
          expanded ? "w-40 ml-3 opacity-100" : "w-0 opacity-0"
        }`}
      >
        {text}
      </span>

      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 transition-all duration-300 ${
            expanded ? "top-1/2 -translate-y-1/2" : "top-2"
          }`}
        />
      )}

      {!expanded && (
        <div
          className={`
            absolute left-full rounded-md px-2 py-1 ml-6
            bg-indigo-100 text-indigo-800 text-sm
            invisible opacity-20 -translate-x-3 transition-all duration-300
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50
          `}
        >
          {text}
        </div>
      )}
    </li>
  );
}
