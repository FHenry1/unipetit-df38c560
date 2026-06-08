import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, UtensilsCrossed, Star, User } from "lucide-react";

const items = [
  { to: "/owner", label: "Dashboard", icon: LayoutDashboard },
  { to: "/owner/menu", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/owner/reviews", label: "Avaliações", icon: Star },
  { to: "/owner/profile", label: "Perfil", icon: User },
] as const;

export function OwnerBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex justify-center">
              <Link
                to={to}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition ${
                  active ? "text-[#e85d75]" : "text-neutral-400"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                    active ? "bg-[#5d0a1a] text-white shadow-[0_8px_20px_-8px_rgba(232,93,117,0.6)]" : ""
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
