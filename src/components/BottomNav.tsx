import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, MapPin, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/map", label: "Mapa", icon: MapPin },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-surface/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-brand" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
