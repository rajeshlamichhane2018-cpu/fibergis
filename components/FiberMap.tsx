"use client";

import { useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import {
  MapContainer,
  TileLayer,
  FeatureGroup,
} from "react-leaflet";

import { EditControl } from "react-leaflet-draw";

// =========================
// Custom Marker Icons
// =========================

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

export default function FiberMap() {

  const [routeInfo, setRouteInfo] = useState<any>(null);

  // =========================
  // Draw Created
  // =========================

  const handleCreated = (e: any) => {

    const layer = e.layer;

    // =========================
    // Fiber Route
    // =========================

    if (e.layerType === "polyline") {

     const routeName =
  prompt("Enter Route Name") || "Unnamed Route";

const fiberType =
  prompt(
    "Fiber Type (Trunk / Distribution / Drop)"
  ) || "distribution";

const coreCount =
  prompt("Core Count") || "12";

      let lineColor = "#2563eb";

      // Trunk
      if (fiberType?.toLowerCase() === "trunk") {
        lineColor = "#dc2626";
      }

      // Distribution
      if (fiberType?.toLowerCase() === "distribution") {
        lineColor = "#2563eb";
      }

      // Drop
      if (fiberType?.toLowerCase() === "drop") {
        lineColor = "#16a34a";
      }

      // Route Style
      layer.setStyle({
        color: lineColor,
        weight: 5,
      });

      // Route Tooltip
      layer.bindTooltip(
        `${routeName} (${fiberType})`,
        {
          permanent: true,
          direction: "center",
        }
      );

      // Route Popup
      layer.bindPopup(`
        <div style="min-width:220px">

          <h3>
            <strong>${routeName}</strong>
          </h3>

          <p>
            <strong>Type:</strong>
            ${fiberType}
          </p>

          <p>
            <strong>Cores:</strong>
            ${coreCount}
          </p>

        </div>
      `);

      const geojson = layer.toGeoJSON();

      setRouteInfo({
        routeName,
        fiberType,
        coreCount,
        geojson,
      });

      console.log({
        routeName,
        fiberType,
        coreCount,
        geojson,
      });
    }

    // =========================
    // Joint Marker
    // =========================

    if (e.layerType === "marker") {

      const jointName =
  prompt("Joint Box Name") || "Unnamed Joint";

const jointType =
  prompt(
    "Joint Type (Main / Distribution / Splitter)"
  ) || "distribution";

const note =
  prompt("Note") || "No note added";

      // Main Joint
      if (jointType?.toLowerCase() === "main") {
        layer.setIcon(redIcon);
      }

      // Distribution Joint
      if (jointType?.toLowerCase() === "distribution") {
        layer.setIcon(blueIcon);
      }

      // Splitter
      if (jointType?.toLowerCase() === "splitter") {
        layer.setIcon(greenIcon);
      }

      // Permanent Label
      layer.bindTooltip(
        `${jointName} (${jointType})`,
        {
          permanent: true,
          direction: "top",
          offset: [0, -20],
        }
      );

      // Popup
      layer.bindPopup(`
        <div style="min-width:220px">

          <h3>
            <strong>${jointName}</strong>
          </h3>

          <p>
            <strong>Type:</strong>
            ${jointType}
          </p>

          <p>
            <strong>Note:</strong>
            ${note}
          </p>

        </div>
      `);

      console.log({
        jointName,
        jointType,
        note,
      });
    }
  };

  return (
    <div className="relative h-full w-full">

      {/* Route Info Panel */}

      {routeInfo && (
        <div className="absolute top-4 right-4 z-[2000] bg-white shadow-xl rounded-xl p-4 w-72">

          <h2 className="text-lg font-bold mb-3">
            Fiber Route
          </h2>

          <div className="space-y-2 text-sm">

            <p>
              <strong>Name:</strong>{" "}
              {routeInfo.routeName}
            </p>

            <p>
              <strong>Type:</strong>{" "}
              {routeInfo.fiberType}
            </p>

            <p>
              <strong>Cores:</strong>{" "}
              {routeInfo.coreCount}
            </p>

          </div>
        </div>
      )}

      {/* MAP */}

      <MapContainer
        center={[27.7172, 85.324]}
        zoom={13}
        style={{
          height: "100%",
          width: "100%",
        }}
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FeatureGroup>

          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polygon: false,
            }}
          />

        </FeatureGroup>

      </MapContainer>

    </div>
  );
}