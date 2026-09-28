"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import CartIndicator from "@/components/CartIndicator";

type MegaMenuTab = {
  label: string;
  href: string;
  items: { href: string; image: string; alt: string; label: string }[];
};

type MegaMenu = {
  collectionName: string;
  viewAllHref: string;
  tabs: MegaMenuTab[];
};

type NavLink = { href: string; label: string; menu?: MegaMenu };

const TILE_BG = ["bg-rose-soft", "bg-green-soft"];

export default function NavbarClient({ links }: { links: NavLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer if the viewport grows past mobile (e.g. rotating a tablet).
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openMenuFor = (href: string | undefined) => {
    cancelClose();
    setActiveTab(0);
    setOpenMenu(href ?? null);
  };

  const activeMenu = links.find((l) => l.href === openMenu)?.menu;
  const currentTab = activeMenu?.tabs[activeTab] ?? activeMenu?.tabs[0];

  return (
    <>
      <div
        className={`relative border-b border-border bg-surface/90 backdrop-blur transition-shadow ${
          scrolled ? "shadow-sm" : ""
        }`}
        onMouseLeave={scheduleClose}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 transition-[padding] duration-200 sm:px-6 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
            <Image src="/logo/icon.png" alt="" width={25} height={36} className="h-9 w-auto" priority />
            Joyería <span className="text-xs tracking-[0.3em] text-muted">STUDIO</span>
          </Link>

          <nav
            className="hidden items-center gap-1 text-sm text-foreground/80 md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => {
                  setHovered(link.href);
                  openMenuFor(link.menu ? link.href : undefined);
                }}
                className="relative px-3 py-2 hover:text-rose"
              >
                {link.label}
                {hovered === link.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-rose"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <CartIndicator />
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Picture mega menu: a tab row of jewelry types, and a row of
            product tiles on a pastel block for whichever tab is active —
            the layout used by luxury jewelry sites' category dropdowns. */}
        <AnimatePresence>
          {activeMenu && currentTab && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="absolute inset-x-0 top-full hidden border-b border-border bg-surface shadow-lg md:block"
            >
              <div className="mx-auto max-w-6xl px-6 py-6">
                <div className="flex items-center gap-7 border-b border-border pb-3">
                  {activeMenu.tabs.map((tab, i) => (
                    <button
                      key={tab.label}
                      onMouseEnter={() => setActiveTab(i)}
                      onClick={() => setActiveTab(i)}
                      className={`relative pb-3 text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
                        i === activeTab ? "text-foreground" : "text-muted hover:text-foreground/70"
                      }`}
                    >
                      {tab.label}
                      {i === activeTab && (
                        <motion.span
                          layoutId="mega-tab-underline"
                          className="absolute inset-x-0 -bottom-[13px] h-[2px] bg-rose"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  ))}
                  <Link
                    href={activeMenu.viewAllHref}
                    onClick={() => setOpenMenu(null)}
                    className="ml-auto text-xs font-medium text-rose hover:underline"
                  >
                    Shop all {activeMenu.collectionName} →
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-6">
                  {currentTab.items.map((item, i) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMenu(null)}
                      className="group text-left"
                    >
                      <div
                        className={`relative aspect-square overflow-hidden rounded-md ${TILE_BG[i % TILE_BG.length]}`}
                      >
                        <Image
                          src={item.image}
                          alt={item.alt}
                          fill
                          sizes="200px"
                          className="object-contain p-5 transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <span className="mt-2 block text-sm text-foreground/80 group-hover:text-rose">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href={currentTab.href}
                    onClick={() => setOpenMenu(null)}
                    className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-center text-sm text-muted hover:border-rose hover:text-rose"
                  >
                    View all
                    <span className="text-xs">{currentTab.label}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col overflow-y-auto bg-surface p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-foreground">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                >
                  ✕
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {links.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.25 }}
                  >
                    <div className="flex items-center">
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block flex-1 rounded-lg px-3 py-3 text-base text-foreground hover:bg-rose-soft hover:text-rose"
                      >
                        {link.label}
                      </Link>
                      {link.menu && link.menu.tabs.length > 0 && (
                        <button
                          aria-label={`Show ${link.label} categories`}
                          onClick={() =>
                            setMobileExpanded((cur) => (cur === link.href ? null : link.href))
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted"
                        >
                          <motion.span
                            animate={{ rotate: mobileExpanded === link.href ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            ⌄
                          </motion.span>
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {link.menu && mobileExpanded === link.href && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-4"
                        >
                          <div className="flex flex-col gap-0.5 border-l border-border py-1 pl-4">
                            {link.menu.tabs.map((tab) => (
                              <Link
                                key={tab.href}
                                href={tab.href}
                                onClick={() => setMobileOpen(false)}
                                className="rounded px-2 py-2 text-sm text-foreground/70 hover:bg-rose-soft hover:text-rose"
                              >
                                {tab.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
