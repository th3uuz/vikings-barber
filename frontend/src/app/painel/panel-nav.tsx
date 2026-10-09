"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export interface NavItem {
  href: string;
  label: string;
}

export function PanelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Painel" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = item.href === "/painel" ? pathname === "/painel" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-gold-500/15 text-gold-300" : "text-bone-400 hover:bg-coal-800 hover:text-bone-50",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
