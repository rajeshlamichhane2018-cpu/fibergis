"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { kml } from "@tmcw/togeojson";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geosearch/dist/geosearch.css";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import { supabase } from "@/lib/supabase";

// ─── Icons ────────────────────────────────────────────────────────────────────
const makeIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

const MARKER_ICONS: Record<string, L.Icon> = {
  pole:       makeIcon("red"),
  splitter:   makeIcon("blue"),
  "joint box":makeIcon("orange"),
  olt:        makeIcon("violet"),
  customer:   makeIcon("green"),
  manhole:    makeIcon("grey"),
};

// ─── Colors & Styles ──────────────────────────────────────────────────────────
const FIBER_COLORS: Record<string, string> = {
  trunk:        "#ef4444",
  distribution: "#3b82f6",
  drop:         "#22c55e",
};

function getLineStyle(fiberType: string, status?: string) {
  const baseColor = FIBER_COLORS[fiberType?.toLowerCase()] ?? "#3b82f6";
  const color     = status === "damaged" ? "#ef4444" : baseColor;
  return {
    color,
    weight:    status === "damaged" ? 4 : 5,
    opacity:   status === "planned" ? 0.55 : 0.9,
    dashArray: status === "damaged" ? "10, 6" : status === "planned" ? "5, 10" : undefined,
  };
}

const TYPE_BADGE: Record<string, string> = {
  trunk:        "bg-red-500/20 text-red-400 border-red-500/30",
  distribution: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  drop:         "bg-green-500/20 text-green-400 border-green-500/30",
  pole:         "bg-orange-500/20 text-orange-400 border-orange-500/30",
  splitter:     "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "joint box":  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  customer:     "bg-teal-500/20 text-teal-400 border-teal-500/30",
  olt:          "bg-pink-500/20 text-pink-400 border-pink-500/30",
  manhole:      "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function getBadge(type?: string) {
  return TYPE_BADGE[type?.toLowerCase() ?? ""] ?? "bg-zinc-700/40 text-zinc-400 border-zinc-600/30";
}

const STATUS_BADGE: Record<string, string> = {
  active:  "bg-green-500/15 text-green-400 border-green-500/25",
  planned: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  damaged: "bg-red-500/15 text-red-400 border-red-500/25",
};

// ─── Layer Controller (inside MapContainer) ───────────────────────────────────
type LayerGroups = Record<string, L.LayerGroup>;

function MapLayerController({
  routes,
  layerVis,
  groupsRef,
  routeLayersRef,
}: {
  routes: any[];
  layerVis: Record<string, boolean>;
  groupsRef: React.MutableRefObject<LayerGroups>;
  routeLayersRef: React.MutableRefObject<Record<string, L.GeoJSON>>;
}) {
  const map = useMap();

  // Init groups once
  useEffect(() => {
    if (Object.keys(groupsRef.current).length > 0) return;
    ["trunk", "distribution", "drop", "markers"].forEach((k) => {
      groupsRef.current[k] = L.layerGroup().addTo(map);
    });
  }, [map]); // eslint-disable-line

  // Sync route layers when routes change
  useEffect(() => {
    if (Object.keys(groupsRef.current).length === 0) return;

    // Clear all groups
    Object.values(groupsRef.current).forEach((g) => g.clearLayers());
    routeLayersRef.current = {};

    routes.forEach((route) => {
      try {
        const geoLayer = L.geoJSON(route.geojson, {
          style: route.fiber_type
            ? getLineStyle(route.fiber_type, route.status)
            : undefined,
          pointToLayer: (_f, latlng) => {
            const icon =
              MARKER_ICONS[route.marker_type?.toLowerCase() ?? ""] ??
              makeIcon("grey");
            return L.marker(latlng, { icon });
          },
        });

        geoLayer.eachLayer((l: any) => {
          const popup = route.fiber_type
            ? `<div style="min-width:170px;font-family:system-ui">
                <p style="font-weight:700;margin:0 0 4px">${route.route_name || "Unnamed"}</p>
                <p style="margin:2px 0;color:#94a3b8;font-size:12px">Type: ${route.fiber_type}</p>
                <p style="margin:2px 0;color:#94a3b8;font-size:12px">Cores: ${route.core_count ?? "—"}</p>
                <p style="margin:2px 0;color:#94a3b8;font-size:12px">Status: ${route.status ?? "active"}</p>
              </div>`
            : `<div style="font-family:system-ui"><p style="font-weight:700;margin:0">${route.marker_type || "Marker"}</p></div>`;
          l.bindPopup(popup);
        });

        const groupKey = route.fiber_type
          ? route.fiber_type.toLowerCase()
          : "markers";
        groupsRef.current[groupKey]?.addLayer(geoLayer);
        routeLayersRef.current[route.id] = geoLayer;
      } catch (_) {}
    });
  }, [routes]); // eslint-disable-line

  // Handle visibility toggles
  useEffect(() => {
    if (Object.keys(groupsRef.current).length === 0) return;
    Object.entries(layerVis).forEach(([key, visible]) => {
      const group = groupsRef.current[key];
      if (!group) return;
      if (visible && !map.hasLayer(group)) map.addLayer(group);
      if (!visible && map.hasLayer(group)) map.removeLayer(group);
    });
  }, [layerVis, map]); // eslint-disable-line

  return null;
}

// ─── Search ───────────────────────────────────────────────────────────────────
function SearchField() {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    // @ts-ignore
    const ctrl = new GeoSearchControl({ provider, style: "bar", showMarker: false });
    map.addControl(ctrl);
    return () => { map.removeControl(ctrl); };
  }, [map]);
  return null;
}

// ─── Layer Toggle Config ──────────────────────────────────────────────────────
const LAYER_CONFIG = [
  { key: "trunk",        label: "Trunk",        color: "#ef4444", dot: "bg-red-500" },
  { key: "distribution", label: "Distribution", color: "#3b82f6", dot: "bg-blue-500" },
  { key: "drop",         label: "Drop",         color: "#22c55e", dot: "bg-green-500" },
  { key: "markers",      label: "Markers",      color: "#a78bfa", dot: "bg-purple-500" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FiberMap() {
  const [routes, setRoutes]           = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab]     = useState<"layers" | "list">("list");
  const [filter, setFilter]           = useState("all");
  const [layerVis, setLayerVis]       = useState<Record<string, boolean>>({
    trunk: true, distribution: true, drop: true, markers: true,
  });

  const mapRef           = useRef<any>(null);
  const featureGroupRef  = useRef<any>(null);
  const groupsRef        = useRef<LayerGroups>({});
  const routeLayersRef   = useRef<Record<string, L.GeoJSON>>({});
  const kmlInputRef      = useRef<HTMLInputElement>(null);
  const kmlLayerRef      = useRef<L.GeoJSON | null>(null);

  // ── KML import state ──
  const [kmlPreview, setKmlPreview] = useState<{
    features: any[];
    fileName: string;
    lineCount: number;
    pointCount: number;
  } | null>(null);
  const [kmlSaving, setKmlSaving] = useState(false);

  // ── AI Analysis state ──
  const [aiPanel, setAiPanel]       = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState<any | null>(null);
  const [aiError, setAiError]       = useState("");
  const [aiTab, setAiTab]           = useState<"issues"|"suggestions"|"planning">("issues");

  // ── Draw panel ──
  const [panel, setPanel] = useState<{
    open: boolean; type: "polyline" | "marker" | null; layer: any;
  }>({ open: false, type: null, layer: null });

  const [routeName, setRouteName] = useState("");
  const [fiberType, setFiberType] = useState("distribution");
  const [coreCount, setCoreCount] = useState("12");
  const [status,    setStatus]    = useState("active");
  const [markerType, setMarkerType] = useState("Pole");
  const [saving, setSaving]       = useState(false);

  // ── Edit panel ──
  const [editRoute, setEditRoute] = useState<any | null>(null);
  const [editName,    setEditName]    = useState("");
  const [editType,    setEditType]    = useState("");
  const [editCores,   setEditCores]   = useState("");
  const [editStatus,  setEditStatus]  = useState("active");
  const [editMarker,  setEditMarker]  = useState("");
  const [editSaving,  setEditSaving]  = useState(false);

  // ── Load routes on mount ──
  useEffect(() => {
    supabase.from("fiber_routes").select("*").then(({ data }) => {
      if (data) setRoutes(data);
    });
  }, []);

  // ── Draw handlers ──
  const handleCreated = useCallback((e: any) => {
    const { layer, layerType } = e;
    if (layerType === "polyline") {
      setRouteName(""); setFiberType("distribution"); setCoreCount("12"); setStatus("active");
      setPanel({ open: true, type: "polyline", layer });
    } else if (layerType === "marker") {
      setMarkerType("Pole");
      setPanel({ open: true, type: "marker", layer });
    }
  }, []);

  const handleDrawSave = async () => {
    if (!panel.layer) return;
    setSaving(true);

    const geojson = panel.layer.toGeoJSON();
    const insert: any = { geojson };

    if (panel.type === "polyline") {
      insert.route_name = routeName || "Unnamed Route";
      insert.fiber_type = fiberType;
      insert.core_count = coreCount;
      insert.status     = status;
    } else {
      insert.marker_type = markerType;
    }

    const { data, error } = await supabase
      .from("fiber_routes").insert([insert]).select().single();

    // Remove the drawn layer (MapLayerController will render it via routes)
    if (featureGroupRef.current && panel.layer) {
      try { featureGroupRef.current.removeLayer(panel.layer); } catch (_) {}
    }

    if (!error && data) setRoutes((prev) => [...prev, data]);
    setSaving(false);
    setPanel({ open: false, type: null, layer: null });
  };

  const handleDrawCancel = () => {
    if (featureGroupRef.current && panel.layer) {
      try { featureGroupRef.current.removeLayer(panel.layer); } catch (_) {}
    }
    setPanel({ open: false, type: null, layer: null });
  };

  // ── Edit handlers ──
  const openEdit = (route: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditRoute(route);
    setEditName(route.route_name   ?? "");
    setEditType(route.fiber_type   ?? "distribution");
    setEditCores(route.core_count  ?? "12");
    setEditStatus(route.status     ?? "active");
    setEditMarker(route.marker_type ?? "Pole");
    setPanel({ open: false, type: null, layer: null }); // close draw panel
  };

  const handleEditSave = async () => {
    if (!editRoute) return;
    setEditSaving(true);

    const patch: any = {};
    if (editRoute.fiber_type) {
      patch.route_name = editName;
      patch.fiber_type = editType;
      patch.core_count = editCores;
      patch.status     = editStatus;
    } else {
      patch.marker_type = editMarker;
    }

    const { error } = await supabase
      .from("fiber_routes").update(patch).eq("id", editRoute.id);

    if (!error) {
      setRoutes((prev) =>
        prev.map((r) => r.id === editRoute.id ? { ...r, ...patch } : r)
      );
    }
    setEditSaving(false);
    setEditRoute(null);
  };

  // ── Delete ──
  const deleteRoute = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this route/marker?")) return;
    await supabase.from("fiber_routes").delete().eq("id", id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Zoom ──
  const zoomToRoute = (route: any) => {
    if (!mapRef.current || !route.geojson) return;
    try {
      const b = L.geoJSON(route.geojson).getBounds();
      mapRef.current.fitBounds(b, { padding: [60, 60] });
    } catch (_) {}
  };

  // ── AI Network Analysis ──
  const runAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    setAiPanel(true);
    try {
      const res = await fetch("/api/analyze-network", { method: "POST" });
      const json = await res.json();
      if (json.error) { setAiError(json.error); }
      else { setAiResult(json); }
    } catch (e: any) {
      setAiError(e.message ?? "Unknown error");
    }
    setAiLoading(false);
  };

  // ── Toggle layer visibility ──
  const toggleLayer = (key: string) => {
    setLayerVis((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── KML import handlers ──
  const handleKmlFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(text, "text/xml");
      const geojson = kml(kmlDom);

      // Remove previous KML overlay
      if (kmlLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(kmlLayerRef.current);
        kmlLayerRef.current = null;
      }

      if (geojson.features.length > 0 && mapRef.current) {
        const layer = L.geoJSON(geojson as any, {
          style: { color: "#f59e0b", weight: 3, opacity: 0.9 },
          pointToLayer: (_f, latlng) =>
            L.circleMarker(latlng, {
              radius: 7,
              fillColor: "#f59e0b",
              color: "#fff",
              weight: 1.5,
              fillOpacity: 0.95,
            }),
        }).addTo(mapRef.current);
        try { mapRef.current.fitBounds(layer.getBounds(), { padding: [60, 60] }); } catch (_) {}
        kmlLayerRef.current = layer;
      }

      const lineCount  = geojson.features.filter((f: any) =>
        ["LineString", "MultiLineString"].includes(f.geometry?.type)
      ).length;
      const pointCount = geojson.features.filter((f: any) =>
        f.geometry?.type === "Point"
      ).length;

      setKmlPreview({ features: geojson.features, fileName: file.name, lineCount, pointCount });
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-import of same file
  };

  const discardKml = () => {
    if (kmlLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(kmlLayerRef.current);
      kmlLayerRef.current = null;
    }
    setKmlPreview(null);
  };

  const saveKmlToDb = async () => {
    if (!kmlPreview || kmlPreview.features.length === 0) return;
    setKmlSaving(true);

    const detectFiberType = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes("trunk"))                          return "trunk";
      if (n.includes("drop") || n.includes("home"))    return "drop";
      return "distribution";
    };

    const detectCoreCount = (name: string): string => {
      const m = name.match(/(\d+)\s*cor/i);
      if (m) return m[1];
      return "12";
    };

    const detectMarkerType = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes("olt"))                           return "OLT";
      if (n.includes("splitter") || n.includes("master") || n.startsWith("knmt") || n.startsWith("nmt")) return "Splitter";
      if (n.includes("joint") || n.includes("jb"))    return "Joint Box";
      if (n.includes("manhole"))                       return "Manhole";
      if (n.includes("customer") || n.includes("ont") || n.includes("home")) return "Customer";
      if (n.includes("pod"))                           return "Splitter";
      return "Pole";
    };

    const inserts = kmlPreview.features
      .filter((f: any) => f.geometry)
      .map((f: any) => {
        const name    = f.properties?.name || f.properties?.Name || "KML Import";
        const isLine  = ["LineString", "MultiLineString"].includes(f.geometry.type);
        return {
          route_name:  isLine ? name : null,
          fiber_type:  isLine ? detectFiberType(name) : null,
          marker_type: isLine ? null : detectMarkerType(name),
          core_count:  isLine ? detectCoreCount(name) : null,
          geojson:     f,
          status:      "active",
        };
      });

    const { data, error } = await supabase
      .from("fiber_routes").insert(inserts).select();

    if (!error && data) {
      setRoutes((prev) => [...prev, ...data]);
      // Remove overlay — MapLayerController will render saved routes
      if (kmlLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(kmlLayerRef.current);
        kmlLayerRef.current = null;
      }
      setKmlPreview(null);
    }
    setKmlSaving(false);
  };

  // ── Derived ──
  const filtered = (() => {
    if (filter === "routes")  return routes.filter((r) => r.fiber_type);
    if (filter === "markers") return routes.filter((r) => r.marker_type);
    return routes;
  })();

  const counts = {
    trunk:        routes.filter((r) => r.fiber_type?.toLowerCase() === "trunk").length,
    distribution: routes.filter((r) => r.fiber_type?.toLowerCase() === "distribution").length,
    drop:         routes.filter((r) => r.fiber_type?.toLowerCase() === "drop").length,
    splitters:    routes.filter((r) => r.marker_type?.toLowerCase() === "splitter").length,
    poles:        routes.filter((r) => r.marker_type?.toLowerCase() === "pole").length,
    customers:    routes.filter((r) => r.marker_type?.toLowerCase() === "customer").length,
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#060d1a]">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside
        className={`${sidebarOpen ? "w-72" : "w-0"} shrink-0 transition-all duration-300 overflow-hidden bg-[#0b1525] border-r border-white/8 flex flex-col`}
      >
        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {(["list", "layers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition ${
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "list" ? "Routes" : "Layers"}
            </button>
          ))}
        </div>

        {/* ── LAYERS TAB ── */}
        {activeTab === "layers" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Stats grid */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 font-semibold">Network Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Trunk",        val: counts.trunk,        color: "text-red-400" },
                  { label: "Distribution", val: counts.distribution,  color: "text-blue-400" },
                  { label: "Drop",         val: counts.drop,          color: "text-green-400" },
                  { label: "Splitters",    val: counts.splitters,     color: "text-purple-400" },
                  { label: "Poles",        val: counts.poles,         color: "text-orange-400" },
                  { label: "Customers",    val: counts.customers,     color: "text-teal-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                    <p className={`font-bold text-lg ${color}`}>{val}</p>
                    <p className="text-zinc-500 text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer toggle buttons */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 font-semibold">Layer Visibility</p>
              <div className="space-y-2">
                {LAYER_CONFIG.map(({ key, label, dot }) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${
                      layerVis[key]
                        ? "bg-white/6 border-white/12 text-white"
                        : "bg-transparent border-white/5 text-zinc-600"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${dot} ${!layerVis[key] ? "opacity-30" : ""}`} />
                    <span className="text-sm font-medium flex-1 text-left">{label}</span>
                    <span className={`text-xs font-semibold ${layerVis[key] ? "text-blue-400" : "text-zinc-600"}`}>
                      {layerVis[key] ? "ON" : "OFF"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Analysis button */}
            <div>
              <button
                onClick={runAnalysis}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition disabled:opacity-50"
              >
                {aiLoading ? (
                  <><span className="animate-spin">⟳</span> Analyzing…</>
                ) : (
                  <><span>🤖</span> AI Network Analysis</>
                )}
              </button>
            </div>

            {/* Legend */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 font-semibold">Line Style Guide</p>
              <div className="space-y-2 bg-white/4 rounded-xl p-3 border border-white/6">
                {[
                  { label: "Active",  style: "border-solid",  color: "border-green-400" },
                  { label: "Planned", style: "border-dotted", color: "border-yellow-400" },
                  { label: "Damaged", style: "border-dashed", color: "border-red-400" },
                ].map(({ label, style, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`flex-1 border-b-2 ${style} ${color}`} />
                    <span className="text-zinc-400 text-xs w-16 text-right">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LIST TAB ── */}
        {activeTab === "list" && (
          <>
            {/* Import KML button */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/8">
              <button
                onClick={() => kmlInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
              >
                <span>📂</span> Import KML File
              </button>
              <input
                ref={kmlInputRef}
                type="file"
                accept=".kml,.KML"
                className="hidden"
                onChange={handleKmlFile}
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 px-3 py-2 border-b border-white/8">
              {[["all", "All"], ["routes", "Routes"], ["markers", "Markers"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition ${
                    filter === v ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {filtered.length === 0 && (
                <div className="text-center py-12 text-zinc-600">
                  <p className="text-sm">No items yet</p>
                  <p className="text-xs mt-1 text-zinc-700">Draw on the map to add</p>
                </div>
              )}
              {filtered.map((route) => {
                const typeKey = route.fiber_type || route.marker_type;
                return (
                  <div
                    key={route.id}
                    onClick={() => zoomToRoute(route)}
                    className="group bg-white/4 hover:bg-white/7 border border-white/8 rounded-xl px-3 py-2.5 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {route.route_name || route.marker_type || "Unnamed"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getBadge(typeKey)}`}>
                            {typeKey || "—"}
                          </span>
                          {route.core_count && (
                            <span className="text-[10px] text-zinc-600">{route.core_count}c</span>
                          )}
                          {route.status && route.status !== "active" && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_BADGE[route.status] ?? ""}`}>
                              {route.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={(e) => openEdit(route, e)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 text-xs transition"
                          title="Edit"
                        >✎</button>
                        <button
                          onClick={(e) => deleteRoute(route.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition"
                          title="Delete"
                        >✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* ══ MAP AREA ═════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="absolute top-3 left-3 z-[1001] w-8 h-8 bg-[#0b1525]/90 backdrop-blur border border-white/10 rounded-lg text-white text-xs hover:bg-white/10 transition flex items-center justify-center"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* Map Legend (bottom left) */}
        <div className="absolute bottom-6 left-3 z-[1001] bg-[#0b1525]/90 backdrop-blur border border-white/10 rounded-xl p-3 space-y-1.5">
          {LAYER_CONFIG.slice(0, 3).map(({ key, label, dot }) => (
            layerVis[key] && (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-1.5 rounded-full ${dot}`} />
                <span className="text-[10px] text-zinc-400">{label}</span>
              </div>
            )
          ))}
        </div>

        <MapContainer
          ref={mapRef}
          center={[27.7172, 85.324]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <MapLayerController
            routes={routes}
            layerVis={layerVis}
            groupsRef={groupsRef}
            routeLayersRef={routeLayersRef}
          />
          <SearchField />

          <TileLayer
            attribution="&copy; Google"
            url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
          />

          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              draw={{
                rectangle:    false,
                polyline:     true,
                polygon:      false,
                circle:       false,
                marker:       true,
                circlemarker: false,
              }}
            />
          </FeatureGroup>
        </MapContainer>

        {/* ══ DRAW PANEL ══════════════════════════════════════════════════ */}
        {panel.open && (
          <div className="absolute top-14 right-4 z-[2000] w-80 bg-[#0b1525]/95 backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                {panel.type === "polyline"
                  ? <><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> New Fiber Route</>
                  : <><span className="text-base">📍</span> New Marker</>}
              </h3>
              <button onClick={handleDrawCancel} className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            {panel.type === "polyline" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Route Name *</label>
                  <input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. Baneshwor Main Trunk"
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Fiber Type</label>
                    <select
                      value={fiberType}
                      onChange={(e) => setFiberType(e.target.value)}
                      className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="trunk">🔴 Trunk</option>
                      <option value="distribution">🔵 Distribution</option>
                      <option value="drop">🟢 Drop</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Cores</label>
                    <select
                      value={coreCount}
                      onChange={(e) => setCoreCount(e.target.value)}
                      className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {["2","4","12","24","48","96","144"].map((c) => (
                        <option key={c} value={c}>{c} Core</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Status</label>
                  <div className="flex gap-2">
                    {["active","planned","damaged"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition capitalize ${
                          status === s
                            ? STATUS_BADGE[s] + " border-current"
                            : "bg-white/5 border-white/10 text-zinc-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Marker Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "Pole",      e: "🪵" },
                    { v: "Splitter",  e: "📡" },
                    { v: "Joint Box", e: "📦" },
                    { v: "OLT",       e: "🖥️" },
                    { v: "Customer",  e: "🏠" },
                    { v: "Manhole",   e: "⭕" },
                  ].map(({ v, e }) => (
                    <button
                      key={v}
                      onClick={() => setMarkerType(v)}
                      className={`py-2 px-3 rounded-xl border text-sm transition flex items-center gap-2 ${
                        markerType === v
                          ? "bg-blue-500/20 border-blue-500/40 text-white"
                          : "bg-white/5 border-white/8 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <span>{e}</span> {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDrawSave}
                disabled={saving || (panel.type === "polyline" && !routeName.trim())}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleDrawCancel}
                className="px-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ══ AI ANALYSIS PANEL ══════════════════════════════════════════ */}
        {aiPanel && (
          <div className="absolute inset-y-0 right-0 z-[3000] w-96 bg-[#07101f]/98 backdrop-blur-xl border-l border-violet-500/20 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  🤖 AI Network Analysis
                </h3>
                {aiResult && (
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    {aiResult.meta.totalRoutes} features analyzed
                  </p>
                )}
              </div>
              <button onClick={() => setAiPanel(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Loading */}
            {aiLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                <p className="text-sm">Analyzing {routes.length} network features…</p>
                <p className="text-xs text-zinc-700">This takes ~10 seconds</p>
              </div>
            )}

            {/* Error */}
            {aiError && !aiLoading && (
              <div className="m-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm font-semibold mb-1">Error</p>
                <p className="text-red-300 text-xs">{aiError}</p>
                {aiError.includes("OPENAI_API_KEY") && (
                  <p className="text-zinc-500 text-xs mt-2">
                    Add <code className="text-yellow-400">OPENAI_API_KEY=sk-...</code> to your <code className="text-zinc-300">.env</code> file and restart the dev server.
                  </p>
                )}
              </div>
            )}

            {/* Results */}
            {aiResult && !aiLoading && (
              <>
                {/* Health score */}
                <div className="px-5 py-4 border-b border-white/8">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke={aiResult.analysis.networkHealth.score >= 70 ? "#22c55e" : aiResult.analysis.networkHealth.score >= 40 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${aiResult.analysis.networkHealth.score} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">
                        {aiResult.analysis.networkHealth.score}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold mb-1">Network Health Score</p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">{aiResult.analysis.networkHealth.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/8">
                  {([
                    ["issues",      "⚠ Issues",      aiResult.analysis.issues?.length],
                    ["suggestions", "💡 Fix",         aiResult.analysis.suggestions?.length],
                    ["planning",    "📋 Plan",        aiResult.analysis.planningRecommendations?.length],
                  ] as const).map(([tab, label, count]) => (
                    <button
                      key={tab}
                      onClick={() => setAiTab(tab as any)}
                      className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition flex items-center justify-center gap-1 ${
                        aiTab === tab
                          ? "text-violet-400 border-b-2 border-violet-500"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {label}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${aiTab === tab ? "bg-violet-500/20 text-violet-300" : "bg-white/8 text-zinc-600"}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">

                  {/* Issues */}
                  {aiTab === "issues" && aiResult.analysis.issues?.map((issue: any, i: number) => (
                    <div key={i} className={`rounded-xl border p-3.5 ${
                      issue.severity === "high"   ? "bg-red-500/8 border-red-500/20" :
                      issue.severity === "medium" ? "bg-yellow-500/8 border-yellow-500/20" :
                                                    "bg-blue-500/8 border-blue-500/20"
                    }`}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${
                          issue.severity === "high"   ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          issue.severity === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                                        "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}>{issue.severity}</span>
                        <p className="text-white text-xs font-semibold">{issue.title}</p>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">{issue.detail}</p>
                      {issue.count > 0 && (
                        <p className="text-zinc-600 text-[10px] mt-1.5">Affects: {issue.count} features</p>
                      )}
                    </div>
                  ))}

                  {/* Suggestions */}
                  {aiTab === "suggestions" && aiResult.analysis.suggestions?.map((s: any, i: number) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                          s.priority === "high"   ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          s.priority === "medium" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                                    "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                        }`}>{s.priority}</span>
                        <p className="text-white text-xs font-semibold">{s.title}</p>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed mb-2">{s.detail}</p>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                        <p className="text-violet-300 text-[11px]">→ {s.action}</p>
                      </div>
                    </div>
                  ))}

                  {/* Planning */}
                  {aiTab === "planning" && aiResult.analysis.planningRecommendations?.map((p: any, i: number) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3.5">
                      <p className="text-white text-xs font-semibold mb-1.5 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                        {p.title}
                      </p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">{p.detail}</p>
                    </div>
                  ))}

                </div>

                {/* Re-analyze */}
                <div className="px-4 py-3 border-t border-white/8">
                  <button
                    onClick={runAnalysis}
                    className="w-full py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition"
                  >
                    🔄 Re-analyze
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ KML IMPORT PREVIEW PANEL ═══════════════════════════════════ */}
        {kmlPreview && (
          <div className="absolute bottom-6 right-4 z-[2000] w-80 bg-[#0b1525]/95 backdrop-blur-lg border border-amber-500/30 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span>📂</span> KML Imported
              </h3>
              <button onClick={discardKml} className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            <p className="text-zinc-400 text-xs truncate mb-3">{kmlPreview.fileName}</p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 text-center">
                <p className="text-amber-400 font-bold text-lg">{kmlPreview.features.length}</p>
                <p className="text-zinc-500 text-[10px]">Total</p>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 text-center">
                <p className="text-blue-400 font-bold text-lg">{kmlPreview.lineCount}</p>
                <p className="text-zinc-500 text-[10px]">Routes</p>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl p-2.5 text-center">
                <p className="text-green-400 font-bold text-lg">{kmlPreview.pointCount}</p>
                <p className="text-zinc-500 text-[10px]">Markers</p>
              </div>
            </div>

            {/* Type breakdown */}
            <div className="bg-white/4 rounded-xl p-3 border border-white/6 space-y-1 mb-3 text-[11px]">
              {(() => {
                const lines = kmlPreview.features.filter((f: any) =>
                  ["LineString","MultiLineString"].includes(f.geometry?.type)
                );
                const n = (s: string) => (f: any) => {
                  const nm = (f.properties?.name || "").toLowerCase();
                  if (s === "trunk")        return nm.includes("trunk");
                  if (s === "drop")         return nm.includes("drop") || nm.includes("home");
                  return !nm.includes("trunk") && !nm.includes("drop") && !nm.includes("home");
                };
                return (
                  <>
                    <div className="flex justify-between"><span className="text-red-400">🔴 Trunk</span><span className="text-zinc-400">{lines.filter(n("trunk")).length} routes</span></div>
                    <div className="flex justify-between"><span className="text-blue-400">🔵 Distribution</span><span className="text-zinc-400">{lines.filter(n("dist")).length} routes</span></div>
                    <div className="flex justify-between"><span className="text-green-400">🟢 Drop</span><span className="text-zinc-400">{lines.filter(n("drop")).length} routes</span></div>
                    <div className="flex justify-between"><span className="text-purple-400">📍 Markers</span><span className="text-zinc-400">{kmlPreview.pointCount} points</span></div>
                  </>
                );
              })()}
            </div>

            <p className="text-zinc-600 text-[10px] mb-3">
              Auto-detected from name. Edit individually after saving.
            </p>

            <div className="flex gap-2">
              <button
                onClick={saveKmlToDb}
                disabled={kmlSaving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition"
              >
                {kmlSaving ? "Saving…" : "Save All to DB"}
              </button>
              <button
                onClick={discardKml}
                className="px-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ══ EDIT PANEL ══════════════════════════════════════════════════ */}
        {editRoute && (
          <div className="absolute top-14 right-4 z-[2000] w-80 bg-[#0b1525]/95 backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="text-base">✎</span> Edit{" "}
                {editRoute.fiber_type ? "Route" : "Marker"}
              </h3>
              <button onClick={() => setEditRoute(null)} className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            {editRoute.fiber_type ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Route Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Fiber Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="trunk">🔴 Trunk</option>
                      <option value="distribution">🔵 Distribution</option>
                      <option value="drop">🟢 Drop</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Cores</label>
                    <select
                      value={editCores}
                      onChange={(e) => setEditCores(e.target.value)}
                      className="w-full bg-[#060d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {["2","4","12","24","48","96","144"].map((c) => (
                        <option key={c} value={c}>{c} Core</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Status</label>
                  <div className="flex gap-2">
                    {["active","planned","damaged"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition capitalize ${
                          editStatus === s
                            ? STATUS_BADGE[s] + " border-current"
                            : "bg-white/5 border-white/10 text-zinc-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Marker Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "Pole",      e: "🪵" },
                    { v: "Splitter",  e: "📡" },
                    { v: "Joint Box", e: "📦" },
                    { v: "OLT",       e: "🖥️" },
                    { v: "Customer",  e: "🏠" },
                    { v: "Manhole",   e: "⭕" },
                  ].map(({ v, e }) => (
                    <button
                      key={v}
                      onClick={() => setEditMarker(v)}
                      className={`py-2 px-3 rounded-xl border text-sm transition flex items-center gap-2 ${
                        editMarker === v
                          ? "bg-blue-500/20 border-blue-500/40 text-white"
                          : "bg-white/5 border-white/8 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <span>{e}</span> {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditRoute(null)}
                className="px-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-semibold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
