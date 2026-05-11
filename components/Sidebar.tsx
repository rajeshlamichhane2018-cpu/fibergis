type SidebarProps = {
  routes: any[];
  onZoom: (route: any) => void;
};

export default function Sidebar({
  routes,
  onZoom,
}: SidebarProps) {
  return (
    <div className="w-72 h-screen bg-black text-white p-5 fixed left-0 top-0 z-[1000] overflow-y-auto">

      <h1 className="text-2xl font-bold mb-8">
        Fiber GIS
      </h1>

      <div className="space-y-3">

        <button className="w-full bg-blue-600 p-3 rounded-lg">
          Add Fiber Route
        </button>

        <button className="w-full bg-green-600 p-3 rounded-lg">
          Add Joint Box
        </button>

        <button className="w-full bg-yellow-500 text-black p-3 rounded-lg">
          Add Splitter
        </button>

        <button className="w-full bg-purple-600 p-3 rounded-lg">
          Add Pole
        </button>

      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">
          Saved Routes
        </h2>

        <div className="space-y-3">

          {routes.map((route, index) => (
            <div
              key={index}
              onClick={() => onZoom(route)}
              className="bg-slate-900 p-4 rounded-lg cursor-pointer hover:bg-slate-800 transition"
            >
              <h3 className="font-bold text-lg">
                {route.route_name ||
                  route.marker_type ||
                  "Unnamed"}
              </h3>

              <p className="text-sm text-gray-400">
                {route.fiber_type || "Marker"}
              </p>

              {route.core_count && (
                <p className="text-xs text-gray-500 mt-1">
                  {route.core_count} Core
                </p>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}