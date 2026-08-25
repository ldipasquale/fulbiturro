"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Users, Trophy, BarChart3, Shuffle } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: Home, match: (p: string) => p === "/" },
  { href: "/jugadores", label: "Plantel", icon: Users, match: (p: string) => p.startsWith("/jugadores") },
  { href: "/partidos", label: "Partidos", icon: Trophy, match: (p: string) => p.startsWith("/partidos") },
  {
    href: "/estadisticas",
    label: "Stats",
    icon: BarChart3,
    match: (p: string) => p.startsWith("/estadisticas") || p.startsWith("/stats"),
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-pitch-dark/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-display text-2xl tracking-widest text-gold">FULBITO</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                match(pathname)
                  ? "bg-gold/20 text-gold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SuggestTeamsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border-2 border-gold bg-gold px-5 py-3 font-display text-lg tracking-wide text-pitch-dark shadow-xl transition-transform hover:scale-105 hover:bg-gold-dark"
    >
      <Shuffle className="h-5 w-5" />
      Armar equipos
    </button>
  );
}
