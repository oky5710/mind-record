"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/calendar", label: "입력하기" },
  { href: "/medicine", label: "복용약" },
  { href: "/chart", label: "차트보기" },
  { href: "/hrv-analysis", label: "심박변이 분석" },
  { href: "/settings", label: "설정" },
];

interface Props {
  transparent?: boolean;
}

export default function Navigation({ transparent = false }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav
      className={[
        "flex items-center justify-between px-4 py-3",
        transparent
          ? "absolute top-0 left-0 right-0 z-20"
          : "relative z-20 border-b border-border bg-background",
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

      {/* 데스크톱 네비게이션 */}
      <div className="hidden sm:flex gap-1">
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
        {session && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              transparent
                ? "text-white/90 hover:bg-white/20"
                : "text-muted-foreground hover:bg-muted",
            ].join(" ")}
          >
            로그아웃
          </button>
        )}
      </div>

      {/* 모바일 햄버거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className={[
          "sm:hidden p-2 rounded-full transition-colors",
          transparent ? "text-white hover:bg-white/20" : "text-foreground hover:bg-muted",
        ].join(" ")}
      >
        <span className={`menu-trigger${open ? " active-5" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* 모바일 드롭다운 메뉴 */}
      {open && (
        <div
          className={[
            "sm:hidden absolute top-full left-0 right-0 flex flex-col gap-1 p-3 border-t",
            transparent
              ? "bg-black/80 backdrop-blur-sm border-white/10"
              : "bg-background border-border",
          ].join(" ")}
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
          {session && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={[
                "px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors",
                transparent
                  ? "text-white/90 hover:bg-white/20"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              로그아웃
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
