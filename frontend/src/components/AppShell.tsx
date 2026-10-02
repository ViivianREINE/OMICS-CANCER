"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Dna, BarChart3, Flame, Mountain, PieChart,
  FlaskConical, Brain, Bone, FileText, Settings, ChevronLeft, ChevronRight, Moon, Sun, Menu,
} from "lucide-react";

const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

const NAV = [
  { href: "/",            label: "Dashboard",          icon: Home },
  { href: "/dataset",     label: "Dataset Explorer",   icon: Dna },
  { href: "/dge",         label: "Differential Expression", icon: BarChart3 },
  { href: "/volcano",     label: "Volcano Plot",       icon: Mountain },
  { href: "/heatmap",     label: "Heatmap",            icon: Flame },
  { href: "/pca",         label: "PCA Analysis",       icon: PieChart },
  { href: "/gene-explorer", label: "Gene Explorer",    icon: FlaskConical },
  { href: "/tp53",        label: "TP53 Pathway",       icon: Brain },
  { href: "/sarcoma",     label: "Sarcoma Analysis",   icon: Bone },
  { href: "/export",      label: "Report Export",      icon: FileText },
  { href: "/settings",    label: "Settings",           icon: Settings },
];

function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 5}px`,
            height: `${3 + Math.random() * 5}px`,
            background: ["var(--blush-pink)", "var(--dusty-rose)", "var(--lavender)", "var(--soft-rose)"][i % 4],
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 8}s`,
            bottom: "-10px",
          }}
        />
      ))}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();

  const toggle = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className={`flex min-h-screen ${dark ? "dark" : ""}`}>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 md:hidden p-2 glass-card-sm"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Sidebar overlay for mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          className={`sidebar fixed md:sticky top-0 left-0 h-screen z-40 flex flex-col py-6 transition-all duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
          style={{ width: collapsed ? 72 : 260 }}
        >
          {/* Logo */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style={{ background: "linear-gradient(135deg, var(--dusty-rose), var(--soft-rose))" }}>
              G
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--cocoa)" }}>
                    GeneScope
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--mocha)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    AI Platform
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-2 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                    active
                      ? "bg-[var(--blush-pink)] text-[var(--cocoa)] font-semibold shadow-sm"
                      : "text-[var(--mocha)] hover:bg-[var(--blush-pink)]/40"
                  }`}
                >
                  <Icon size={18} className={active ? "text-[var(--gene-up)]" : "text-[var(--mocha)] group-hover:text-[var(--dusty-rose)]"} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Bottom controls */}
          <div className="px-3 pt-4 space-y-2 border-t border-[var(--glass-border)]">
            <button onClick={toggle}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--mocha)] hover:bg-[var(--blush-pink)]/40 w-full transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--mocha)] hover:bg-[var(--blush-pink)]/40 w-full transition-colors">
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main */}
        <main className="flex-1 relative overflow-x-hidden" style={{ background: "var(--bg-primary)" }}>
          <Particles />
          <div className="gradient-blob w-72 h-72 top-0 right-0" style={{ background: "var(--blush-pink)" }} />
          <div className="gradient-blob w-96 h-96 bottom-20 left-10" style={{ background: "var(--dusty-rose)", animationDelay: "4s" }} />

          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 p-4 md:p-8 max-w-[1400px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
