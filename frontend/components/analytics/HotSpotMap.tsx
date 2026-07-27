// components/analytics/HotSpotMap.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AlertTriangle, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

interface DefaultIcon extends L.Icon.Default {
  _getIconUrl?: string;
}

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as DefaultIcon)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

export interface Hotspot {
  area: string;
  complaints: number;
  urgent: number;
  lat: number;
  lng: number;
}

interface MapProps {
  hotspots: Hotspot[];
}

function hotspotIcon(hotspot: Hotspot, active: boolean): L.DivIcon {
  const isUrgent = hotspot.urgent > 0;
  
  // High-contrast, premium color palette
  const bg = isUrgent ? "#e11d48" : "#0f172a"; // Rose-600 vs Slate-900
  const activeRing = active 
    ? `box-shadow: 0 0 0 4px ${isUrgent ? 'rgba(225,29,72,0.25)' : 'rgba(15,23,42,0.25)'}, 0 10px 15px -3px rgba(0,0,0,0.1);` 
    : `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);`;
  const scale = active ? "scale(1.05)" : "scale(1)";

  const iconSvg = isUrgent
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  return L.divIcon({
    className: "bg-transparent border-none",
    iconSize: [0, 0], // Let the HTML dictate the size
    iconAnchor: [0, 0],
    html: `<div style="
      transform: translate(-50%, -100%) ${scale};
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: ${bg};
      color: #fff;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      ${activeRing}
    ">
      ${iconSvg}
      ${hotspot.complaints}
    </div>`,
  });
}

export default function HotspotMap({ hotspots }: MapProps) {
  const [activeArea, setActiveArea] = useState<string | null>(hotspots[0]?.area ?? null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const defaultCenter: [number, number] = [19.076, 72.8777]; // Mumbai fallback
  const active = hotspots.find((h) => h.area === activeArea) ?? hotspots[0];

  return (
    <div className="relative z-0 w-full h-125 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      
      {/* Sleek Floating Legend */}
      <div className="absolute left-4 top-4 z-1000 flex items-center gap-5 rounded-full border border-white/60 bg-white/80 px-5 py-2.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm backdrop-blur-md">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-900 shadow-sm" /> 
          Standard
        </span>
        <span className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-600 shadow-sm"></span>
          </span>
          Urgent Zone
        </span>
      </div>

      <MapContainer
        center={hotspots.length > 0 ? [hotspots[0].lat, hotspots[0].lng] : defaultCenter}
        zoom={11}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />
        
        {hotspots.map((h) => (
          <Marker
            key={h.area}
            position={[h.lat, h.lng]}
            icon={hotspotIcon(h, h.area === activeArea)}
            eventHandlers={{ click: () => setActiveArea(h.area) }}
          />
        ))}
      </MapContainer>

      {/* Premium Glassmorphism Preview Card */}
      {active && (
        <div className="absolute bottom-6 left-1/2 z-1000 w-[calc(100%-3rem)] -translate-x-1/2 max-w-sm rounded-2xl border border-white/50 bg-white/95 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl sm:left-6 sm:translate-x-0 transition-all duration-300 ease-out">
          <div className="flex flex-col gap-4">
            
            {/* Card Header */}
            <div>
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 leading-tight">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <span className="truncate">{active.area}</span>
                </h3>
                {active.urgent > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    <AlertTriangle className="h-3 w-3" />
                    {active.urgent} Urgent
                  </span>
                )}
              </div>
              <p className="pl-7 text-sm font-medium text-slate-500">
                {active.complaints} total complaint{active.complaints === 1 ? "" : "s"} reported
              </p>
            </div>

            {/* Action Button */}
            <Link
              href={`/`}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/50 focus:ring-offset-2"
            >
              Investigate Area
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
