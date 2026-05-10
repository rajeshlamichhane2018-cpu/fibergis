export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-[#030712] text-white relative">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-600/20 blur-[120px] rounded-full" />

      {/* Navbar */}
      <header className="h-16 border-b border-white/10 backdrop-blur-xl bg-[#030712]/70">
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">
              Fiber<span className="text-blue-500">GIS</span>
            </h1>

            <p className="text-[10px] text-gray-400">
              Smart Fiber Infrastructure Platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/10 transition">
              Login
            </button>

            <button className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/30">
              Open Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="h-[calc(100vh-64px)] flex items-center">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs mb-5">
                ⚡ ISP Fiber Management System
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1] tracking-tight mb-5">
                Manage Your
                <br />
                <span className="text-blue-500">
                  Fiber Network
                </span>
                <br />
                Visually
              </h2>

              <p className="text-gray-400 text-base leading-7 max-w-lg mb-8">
                Advanced GIS-based FTTH management platform for ISPs
                to manage trunk routes, splitters, poles and customer
                connections in real time.
              </p>

              <div className="flex gap-4 mb-10">
                <button className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition font-semibold shadow-xl shadow-blue-600/30">
                  Launch Dashboard
                </button>

                <button className="px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition font-semibold">
                  Watch Demo
                </button>
              </div>

              {/* Bottom Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-2xl font-black text-blue-500">
                    1284
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Routes
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-2xl font-black text-purple-400">
                    326
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Splitters
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-2xl font-black text-green-400">
                    8941
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Users
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative">
              {/* Alert */}
              <div className="absolute -top-6 left-6 hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 z-20">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  📡
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Active Alerts
                  </p>

                  <h3 className="text-2xl font-black text-red-400">
                    03
                  </h3>
                </div>
              </div>

              {/* Dashboard */}
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl p-5 shadow-2xl">
                {/* Top */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />

                  <span className="text-xs text-gray-400 ml-3">
                    fiber-gis-dashboard
                  </span>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-2xl bg-blue-500/20 border border-blue-500/20 p-4">
                    <p className="text-xs text-gray-300">
                      Active Routes
                    </p>

                    <h3 className="text-3xl font-black mt-1">
                      1284
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-purple-500/20 border border-purple-500/20 p-4">
                    <p className="text-xs text-gray-300">
                      Splitters
                    </p>

                    <h3 className="text-3xl font-black mt-1">
                      326
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-green-500/20 border border-green-500/20 p-4">
                    <p className="text-xs text-gray-300">
                      Users
                    </p>

                    <h3 className="text-3xl font-black mt-1">
                      8941
                    </h3>
                  </div>
                </div>

                {/* Visual */}
                <div className="rounded-3xl bg-[#050816] border border-white/10 p-6 relative overflow-hidden h-[260px]">
                  {/* Red */}
                  <div className="absolute top-16 left-8 w-[220px] h-[4px] bg-red-500 rotate-12 rounded-full" />
                  <div className="absolute top-14 left-32 w-4 h-4 bg-red-500 rounded-full" />

                  {/* Blue */}
                  <div className="absolute top-32 left-10 w-[180px] h-[4px] bg-blue-500 -rotate-6 rounded-full" />
                  <div className="absolute top-30 left-44 w-4 h-4 bg-blue-500 rounded-full" />

                  {/* Green */}
                  <div className="absolute bottom-14 left-8 w-[260px] h-[4px] bg-green-500 rounded-full" />
                  <div className="absolute bottom-12 left-36 w-4 h-4 bg-green-500 rounded-full" />

                  {/* Info */}
                  <div className="absolute top-6 right-6 rounded-2xl bg-white/5 border border-white/10 p-4 w-[180px]">
                    <p className="text-xs text-gray-400">
                      Trunk Route
                    </p>

                    <h3 className="text-lg font-bold mt-1">
                      Ringroad Backbone
                    </h3>

                    <div className="flex justify-between mt-4 text-xs">
                      <span className="text-gray-400">
                        Cores
                      </span>

                      <span>48</span>
                    </div>

                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-400">
                        Status
                      </span>

                      <span className="text-green-400">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="hidden lg:flex absolute -bottom-6 right-6 items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />

                <div>
                  <p className="text-xs text-gray-400">
                    Live Monitoring
                  </p>

                  <h3 className="text-sm font-bold">
                    All Systems Operational
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}