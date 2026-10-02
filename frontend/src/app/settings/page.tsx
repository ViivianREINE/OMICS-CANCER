"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Server, Moon, Sun, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { useTheme } from "@/components/AppShell";

export default function SettingsPage() {
  const { dark, toggle } = useTheme();
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">Platform Settings</h1>
        <p className="text-sm text-[var(--mocha)]">Configure API gateways, visual themes, and local sequence storage indexes</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h3 className="text-lg font-bold border-b border-[var(--glass-border)] pb-2 flex items-center gap-2 font-serif">
          <Server size={18} className="text-[var(--dusty-rose)]" />
          Backend Connection Details
        </h3>
        
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold block text-[var(--cocoa)]">FastAPI API Base URL</label>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-[var(--mocha)]">Status: Connected to local uvicorn host</span>
            <button
              type="submit"
              className="btn-primary py-2 px-6 flex items-center gap-1.5"
            >
              {saved ? <Check size={14} /> : null}
              {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h3 className="text-lg font-bold border-b border-[var(--glass-border)] pb-2 flex items-center gap-2 font-serif">
          <Shield size={18} className="text-[var(--dusty-rose)]" />
          System & Database Indexes
        </h3>
        
        <div className="text-xs space-y-3 font-mono-gene text-[var(--mocha)]">
          <div className="flex justify-between">
            <span>Database provider:</span>
            <span className="font-bold text-[var(--cocoa)]">SQLite 3</span>
          </div>
          <div className="flex justify-between">
            <span>Seeded Samples:</span>
            <span className="font-bold text-[var(--cocoa)]">260 entries</span>
          </div>
          <div className="flex justify-between">
            <span>Seeded Expressions:</span>
            <span className="font-bold text-[var(--cocoa)]">68,000 records</span>
          </div>
          <div className="flex justify-between">
            <span>Local file path:</span>
            <span className="font-bold text-[var(--cocoa)]">backend/data/genescope.db</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 flex justify-between items-center">
        <div>
          <h3 className="text-md font-bold font-serif text-[var(--cocoa)] flex items-center gap-1.5">
            {dark ? <Moon size={16} className="text-[var(--dusty-rose)]" /> : <Sun size={16} className="text-[var(--dusty-rose)]" />}
            Visual Palette Theme
          </h3>
          <p className="text-xs text-[var(--mocha)]">Toggle between dark mode and warm beige themes</p>
        </div>
        <button
          onClick={toggle}
          className="text-[var(--dusty-rose)] focus:outline-none"
        >
          {dark ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
        </button>
      </div>
    </div>
  );
}
