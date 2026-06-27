"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/documents", label: "Archive", icon: "📜" },
  { href: "/documents/upload", label: "Upload", icon: "↑" },
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/missionaries", label: "Missionaries", icon: "✦" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-56 min-h-screen bg-ink-800 text-parchment-100 flex flex-col">
      <div className="p-5 border-b border-ink-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-parchment-300 flex items-center justify-center text-ink-800 text-sm">
            ✦
          </div>
          <div>
            <p className="font-bold text-sm leading-none font-serif">Missionary</p>
            <p className="text-xs text-parchment-400 leading-none">Archive</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-ink-600 text-parchment-100"
                : "text-parchment-300 hover:bg-ink-700 hover:text-parchment-100"
            )}
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="p-3 border-t border-ink-700 text-xs text-parchment-400 space-y-1">
          <p className="truncate font-medium text-parchment-200">{user.full_name || user.username}</p>
          <p className="truncate">{user.email}</p>
          <button
            onClick={logout}
            className="mt-1 text-parchment-400 hover:text-parchment-200 underline text-xs"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
