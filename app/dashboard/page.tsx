"use client";

import dynamic from "next/dynamic";

const FiberMap = dynamic(
  () => import("@/components/FiberMap"),
  {
    ssr: false,
  }
);
<div className="h-14 bg-[#0f172a] border-b border-white/10 flex items-center justify-between px-4 text-white">
  
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
    <h1 className="font-bold text-lg">
      Fiber<span className="text-blue-500">GIS</span>
    </h1>
  </div>

  <div className="flex items-center gap-3">
    <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
      Dashboard
    </button>

    <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm">
      Admin
    </button>
  </div>

</div>
export default function DashboardPage() {
  return (
    <div className="h-screen bg-black text-white flex">

      {/* Sidebar */}
      <aside className="w-16 bg-[#0f172a] border-r border-white/10 flex flex-col items-center py-4 gap-4">

        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
          F
        </div>

        <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition">
          🏠
        </button>

        <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition">
          🗺️
        </button>

        <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition">
          📡
        </button>

        <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition">
          ⚙️
        </button>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <div className="h-14 bg-[#0f172a] border-b border-white/10 flex items-center justify-between px-4">

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>

            <h1 className="font-bold text-lg">
              Fiber<span className="text-blue-500">GIS</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
              Dashboard
            </button>

            <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm">
              Admin
            </button>

          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <FiberMap />
        </div>

      </div>
    </div>
  );
}