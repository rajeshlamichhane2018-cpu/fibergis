import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not set in .env" },
      { status: 500 }
    );
  }

  const { data: routes, error } = await supabase
    .from("fiber_routes")
    .select("id, route_name, fiber_type, core_count, marker_type, status, geojson");

  if (error || !routes) {
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
  }

  const lines   = routes.filter((r) => r.fiber_type);
  const markers = routes.filter((r) => r.marker_type);

  const byType = {
    trunk:        lines.filter((r) => r.fiber_type === "trunk").length,
    distribution: lines.filter((r) => r.fiber_type === "distribution").length,
    drop:         lines.filter((r) => r.fiber_type === "drop").length,
  };

  const byStatus = {
    active:  lines.filter((r) => r.status === "active").length,
    planned: lines.filter((r) => r.status === "planned").length,
    damaged: lines.filter((r) => r.status === "damaged").length,
  };

  const byMarker = markers.reduce((acc: Record<string, number>, r) => {
    const k = r.marker_type?.toLowerCase() ?? "unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const coreCounts = lines.reduce((acc: Record<string, number>, r) => {
    const k = r.core_count ?? "unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const unnamedLines = lines.filter(
    (r) => !r.route_name || r.route_name === "KML Import"
  ).length;

  const routeNameSample = lines
    .filter((r) => r.route_name && r.route_name !== "KML Import")
    .slice(0, 50)
    .map((r) => `[${r.fiber_type}|${r.core_count ?? "?"}c] ${r.route_name}`);

  const markerSample = markers
    .slice(0, 30)
    .map((r) => `[${r.marker_type}]`);

  // Bounding box
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  routes.forEach((r) => {
    try {
      const geo = r.geojson as any;
      const coords: number[][] =
        geo.geometry?.type === "LineString"      ? geo.geometry.coordinates :
        geo.geometry?.type === "MultiLineString"  ? geo.geometry.coordinates.flat() :
        geo.geometry?.type === "Point"            ? [geo.geometry.coordinates] : [];
      coords.forEach(([lng, lat]) => {
        if (typeof lat === "number" && typeof lng === "number") {
          if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        }
      });
    } catch (_) {}
  });

  const prompt = `You are an expert ISP fiber optic network planner. Analyze this FTTH fiber network data for Kapan area, Kathmandu, Nepal and provide actionable recommendations.

== NETWORK SUMMARY ==
Total features: ${routes.length}
Lines/Routes: ${lines.length}
  - Trunk: ${byType.trunk}
  - Distribution: ${byType.distribution}
  - Drop: ${byType.drop}
Markers: ${markers.length}
  ${Object.entries(byMarker).map(([k, v]) => `- ${k}: ${v}`).join("\n  ")}

Status: active=${byStatus.active}, planned=${byStatus.planned}, damaged=${byStatus.damaged}
Core counts: ${Object.entries(coreCounts).map(([k, v]) => `${k}c: ${v}`).join(", ")}
Unnamed routes: ${unnamedLines} / ${lines.length}

Coverage area: Lat ${minLat.toFixed(4)}–${maxLat.toFixed(4)}, Lng ${minLng.toFixed(4)}–${maxLng.toFixed(4)}

Sample route names:
${routeNameSample.join("\n")}

Sample markers: ${markerSample.join(", ")}

Return ONLY valid JSON (no markdown) with this structure:
{
  "networkHealth": { "score": 0-100, "summary": "2-3 sentence overview in English" },
  "issues": [
    { "severity": "high|medium|low", "category": "string", "title": "string", "detail": "string", "count": number }
  ],
  "suggestions": [
    { "priority": "high|medium|low", "title": "string", "detail": "string", "action": "string" }
  ],
  "planningRecommendations": [
    { "title": "string", "detail": "string" }
  ]
}

Focus on: FTTH hierarchy (OLT→Splitter→Customer), core count optimization, naming conventions, trunk redundancy, splitter ratios (1:8, 1:16, 1:32), drop coverage gaps. Be specific to this Kapan network.`;

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0].message.content ?? "{}";

  try {
    const analysis = JSON.parse(text);
    return NextResponse.json({
      analysis,
      meta: { totalRoutes: routes.length, lines: lines.length, markers: markers.length },
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 });
  }
}
