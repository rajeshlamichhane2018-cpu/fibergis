"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";

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

import {
  GeoSearchControl,
  OpenStreetMapProvider,
} from "leaflet-geosearch";

import { supabase } from "@/lib/supabase";

// ================================
// Load Routes From Supabase
// ================================

function LoadRoutes({ setRoutes }: any) {
  const map = useMap();

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data, error } = await supabase
        .from("fiber_routes")
        .select("*");

      if (error) {
        console.log(error);
        return;
      }

      setRoutes(data);
      console.log("ROUTES:", data);

      data.forEach((route: any) => {
        const layer = L.geoJSON(route.geojson);

        layer.eachLayer((l: any) => {
          if (route.fiber_type) {
            l.bindPopup(`
              <div>
                <h3>${route.route_name || "Unnamed Route"}</h3>
                <p>Type: ${route.fiber_type}</p>
                <p>Cores: ${route.core_count}</p>
              </div>
            `);
          }

          if (route.marker_type) {
            l.bindPopup(`
              <div>
                <b>${route.marker_type}</b>
              </div>
            `);
          }
        });

        layer.addTo(map);
      });
    };

    fetchRoutes();
  }, [map, setRoutes]);

  return null;
}

// ================================
// Search Component
// ================================

function SearchField() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider,
    });

    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

// ================================
// Marker Icons
// ================================

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ================================
// Save Route
// ================================

const saveRoute = async (
  layer: any,
  extraData: any = {}
) => {
  const geojson = layer.toGeoJSON();

  const { error } = await supabase
    .from("fiber_routes")
    .insert([
      {
        geojson: geojson,
        route_name: extraData.routeName || null,
        fiber_type: extraData.fiberType || null,
        core_count: extraData.coreCount || null,
        marker_type: extraData.markerType || null,
      },
    ]);

  if (error) {
    console.log(error);
  } else {
    console.log("Saved");
  }
};

// ================================
// Main Map
// ================================

export default function FiberMap() {
  const [routes, setRoutes] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

const deleteRoute = async (id: string) => {
  await supabase
    .from("fiber_routes")
    .delete()
    .eq("id", id);

  setRoutes(routes.filter((r) => r.id !== id));
};

const zoomToRoute = (route: any) => {
  if (!mapRef.current) return;

  if (route.geometry?.coordinates) {
    const coords = route.geometry.coordinates.map(
      (c: any) => [c[1], c[0]]
    );

    mapRef.current.fitBounds(coords);
  }
};

  const handleCreated = (e: any) => {
    const layer = e.layer;

    // =========================
    // Fiber Route
    // =========================

    if (e.layerType === "polyline") {
      const routeName =
        prompt("Enter Route Name") ||
        "Unnamed Route";

      const fiberType =
        prompt(
          "Fiber Type (Trunk / Distribution / Drop)"
        ) || "distribution";

      const coreCount =
        prompt("Core Count") || "12";

      let lineColor = "#2563eb";

      if (
        fiberType.toLowerCase() === "trunk"
      ) {
        lineColor = "#dc2626";
      }

      if (
        fiberType.toLowerCase() === "drop"
      ) {
        lineColor = "#16a34a";
      }

      layer.setStyle({
        color: lineColor,
        weight: 5,
      });

      layer.bindPopup(`
        <div style="min-width:200px">
          <h3><b>${routeName}</b></h3>
          <p>Type: ${fiberType}</p>
          <p>Cores: ${coreCount}</p>
        </div>
      `);

      saveRoute(layer, {
        routeName,
        fiberType,
        coreCount,
      });
    }

    // =========================
    // Marker
    // =========================

    if (e.layerType === "marker") {
      const markerType =
        prompt(
          "Marker Type (Pole / Splitter / Customer)"
        ) || "Pole";

      if (
        markerType.toLowerCase() === "pole"
      ) {
        layer.setIcon(redIcon);
      }

      if (
        markerType.toLowerCase() === "splitter"
      ) {
        layer.setIcon(blueIcon);
      }

      if (
        markerType.toLowerCase() === "customer"
      ) {
        layer.setIcon(greenIcon);
      }

      layer.bindPopup(`
        <div>
          <b>${markerType}</b>
        </div>
      `);

      saveRoute(layer, {
        markerType,
      });
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}

      <div className="w-80 h-screen bg-black text-white p-5 overflow-y-auto">

        <h1 className="text-3xl font-bold mb-6">
          Fiber GIS
        </h1>

        <div className="space-y-3 mb-8">

          <button className="w-full bg-blue-600 p-3 rounded-xl font-semibold">
            Add Fiber Route
          </button>

          <button className="w-full bg-green-600 p-3 rounded-xl font-semibold">
            Add Joint Box
          </button>

          <button className="w-full bg-yellow-500 text-black p-3 rounded-xl font-semibold">
            Add Splitter
          </button>

          <button className="w-full bg-purple-600 p-3 rounded-xl font-semibold">
            Add Pole
          </button>

        </div>

        <h2 className="text-2xl font-bold mb-4">
          Saved Routes
        </h2>

        <div className="space-y-4">

          {routes.map((route: any) => (
            <div
              key={route.id}
              className="bg-slate-900 p-4 rounded-xl border border-slate-800"
            >
              <h3 className="font-bold text-lg">
                {route.route_name || "Unnamed"}
              </h3>

              <p className="text-sm text-gray-300">
                {route.fiber_type ||
                  route.marker_type ||
                  "Marker"}
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* Map */}

      <div className="flex-1">

       <MapContainer
  ref={mapRef}
  center={[27.7172, 85.324]}
  zoom={13}
  style={{ height: "100vh", width: "100%" }}
>

          {/* Load Routes */}

          <LoadRoutes setRoutes={setRoutes} />

          {/* Search */}

          <SearchField />

          {/* Satellite Map */}

          <TileLayer
            attribution="&copy; Google"
            url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
          />

          {/* Drawing */}

          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              draw={{
                rectangle: true,
                polyline: true,
                polygon: true,
                circle: true,
                marker: true,
                circlemarker: false,
              }}
            />
          </FeatureGroup>

        </MapContainer>

      </div>
    </div>
  );
}