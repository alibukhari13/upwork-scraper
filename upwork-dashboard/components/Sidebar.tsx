"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isSyncing?: boolean;
}

export default function Sidebar({ isSyncing = false }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Live Monitor", href: "/", icon: "M4 6h16M4 12h16M4 18h16" },
    { name: "My Portfolio", href: "/projects", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { name: "AI History", href: "/history", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { name: "Proposal Format", href: "/format", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-slate-800/60 bg-[#0B1120] lg:flex shadow-2xl z-40">
      <div className="flex h-24 items-center gap-4 px-8 border-b border-slate-800/50">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20 rotate-3">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-black tracking-tighter uppercase text-white">
          Job<span className="text-emerald-500">Pulse</span>
        </span>
      </div>

      <nav className="flex-1 p-6 space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 transition-all font-bold ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-slate-800/50 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
          <div className={`h-2 w-2 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isSyncing ? "Syncing" : "System Live"}
          </span>
        </div>
      </div>
    </aside>
  );
}