"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/calendar", label: "입력하기" },
  { href: "/medicine", label: "복용약" },
  { href: "/chart", label: "차트보기" },
];

interface Props {
  transparent?: boolean;
}

export default function Navigation({ transparent = false }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className={[
        "flex items-center justify-between px-4 py-3",
        transparent
          ? "absolute top-0 left-0 right-0 z-10"
          : "border-b border-border bg-background",
      ].join(" ")}
    >
      <Link
        href="/"
        className={[
          "text-lg font-bold tracking-tight",
          transparent ? "text-white drop-shadow" : "text-foreground",
        ].join(" ")}
      >
        Mind Chart
      </Link>

      <div className="flex gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                transparent
                  ? active
                    ? "bg-white/90 text-gray-900"
                    : "text-white/90 hover:bg-white/20"
                  : active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
