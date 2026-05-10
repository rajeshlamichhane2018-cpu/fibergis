export default function Sidebar() {
  return (
    <div className="w-72 h-screen bg-black text-white p-5 fixed left-0 top-0 z-[1000]">

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

        <button className="w-full bg-yellow-600 p-3 rounded-lg text-black">
          Add Splitter
        </button>

        <button className="w-full bg-purple-600 p-3 rounded-lg">
          Add Pole
        </button>

      </div>
    </div>
  );
}