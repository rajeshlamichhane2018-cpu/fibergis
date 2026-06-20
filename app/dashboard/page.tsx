"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const FiberMap = dynamic(() => import("@/components/FiberMap"), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#060d1a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#060d1a] text-white overflow-hidden">

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header className="h-12 shrink-0 bg-[#0b1525] border-b border-white/8 flex items-center justify-between px-4 z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">F</span>
          </div>
          <span className="font-bold text-sm">
            Fiber<span className="text-blue-400">GIS</span>
          </span>
          <span className="ml-2 text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-semibold">
            Dashboard
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            Home
          </Link>
          {user && (
            <span className="text-xs text-zinc-500 hidden sm:block">
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition"
          >
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        <FiberMap />
      </main>
    </div>
  );
}
