"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Explicit type definitions (Strictly avoiding 'any')
type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

interface DirectionalSector {
  direction: WindDirection;
  angleDegrees: number;
  pm25: number;
  pm10: number;
  windSpeedMs: number;
  isHotspot: boolean;
}

interface MonitoringStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentAQI: number;
  primarySourceSector: WindDirection;
  sectors: DirectionalSector[];
}

// Scientifically structured mock data for monitoring stations across Delhi NCR
const stationsData: MonitoringStation[] = [
  {
    id: "station-01",
    name: "Anand Vihar Monitoring Hub",
    lat: 28.6469,
    lng: 77.316,
    currentAQI: 425,
    primarySourceSector: "E",
    sectors: [
      {
        direction: "N",
        angleDegrees: 0,
        pm25: 120,
        pm10: 210,
        windSpeedMs: 2.1,
        isHotspot: false,
      },
      {
        direction: "NE",
        angleDegrees: 45,
        pm25: 180,
        pm10: 290,
        windSpeedMs: 2.5,
        isHotspot: false,
      },
      {
        direction: "E",
        angleDegrees: 90,
        pm25: 395,
        pm10: 580,
        windSpeedMs: 4.2,
        isHotspot: true,
      }, // Source Direction
      {
        direction: "SE",
        angleDegrees: 135,
        pm25: 280,
        pm10: 410,
        windSpeedMs: 3.8,
        isHotspot: true,
      },
      {
        direction: "S",
        angleDegrees: 180,
        pm25: 140,
        pm10: 230,
        windSpeedMs: 1.9,
        isHotspot: false,
      },
      {
        direction: "SW",
        angleDegrees: 225,
        pm25: 95,
        pm10: 160,
        windSpeedMs: 1.5,
        isHotspot: false,
      },
      {
        direction: "W",
        angleDegrees: 270,
        pm25: 110,
        pm10: 190,
        windSpeedMs: 2.0,
        isHotspot: false,
      },
      {
        direction: "NW",
        angleDegrees: 315,
        pm25: 130,
        pm10: 220,
        windSpeedMs: 2.3,
        isHotspot: false,
      },
    ],
  },
  {
    id: "station-02",
    name: "Punjabi Bagh Station",
    lat: 28.6619,
    lng: 77.1295,
    currentAQI: 380,
    primarySourceSector: "NW",
    sectors: [
      {
        direction: "N",
        angleDegrees: 0,
        pm25: 210,
        pm10: 340,
        windSpeedMs: 3.0,
        isHotspot: false,
      },
      {
        direction: "NE",
        angleDegrees: 45,
        pm25: 150,
        pm10: 250,
        windSpeedMs: 2.2,
        isHotspot: false,
      },
      {
        direction: "E",
        angleDegrees: 90,
        pm25: 90,
        pm10: 150,
        windSpeedMs: 1.4,
        isHotspot: false,
      },
      {
        direction: "SE",
        angleDegrees: 135,
        pm25: 80,
        pm10: 130,
        windSpeedMs: 1.2,
        isHotspot: false,
      },
      {
        direction: "S",
        angleDegrees: 180,
        pm25: 110,
        pm10: 180,
        windSpeedMs: 1.8,
        isHotspot: false,
      },
      {
        direction: "SW",
        angleDegrees: 225,
        pm25: 130,
        pm10: 210,
        windSpeedMs: 2.0,
        isHotspot: false,
      },
      {
        direction: "W",
        angleDegrees: 270,
        pm25: 260,
        pm10: 390,
        windSpeedMs: 3.5,
        isHotspot: false,
      },
      {
        direction: "NW",
        angleDegrees: 315,
        pm25: 370,
        pm10: 540,
        windSpeedMs: 4.8,
        isHotspot: true,
      }, // Source Direction
    ],
  },
  {
    id: "station-03",
    name: "RK Puram Air Sensor",
    lat: 28.5645,
    lng: 77.1855,
    currentAQI: 310,
    primarySourceSector: "W",
    sectors: [
      {
        direction: "N",
        angleDegrees: 0,
        pm25: 110,
        pm10: 180,
        windSpeedMs: 1.9,
        isHotspot: false,
      },
      {
        direction: "NE",
        angleDegrees: 45,
        pm25: 95,
        pm10: 160,
        windSpeedMs: 1.6,
        isHotspot: false,
      },
      {
        direction: "E",
        angleDegrees: 90,
        pm25: 85,
        pm10: 140,
        windSpeedMs: 1.3,
        isHotspot: false,
      },
      {
        direction: "SE",
        angleDegrees: 135,
        pm25: 100,
        pm10: 170,
        windSpeedMs: 1.7,
        isHotspot: false,
      },
      {
        direction: "S",
        angleDegrees: 180,
        pm25: 130,
        pm10: 210,
        windSpeedMs: 2.1,
        isHotspot: false,
      },
      {
        direction: "SW",
        angleDegrees: 225,
        pm25: 190,
        pm10: 290,
        windSpeedMs: 3.0,
        isHotspot: false,
      },
      {
        direction: "W",
        angleDegrees: 270,
        pm25: 295,
        pm10: 440,
        windSpeedMs: 4.1,
        isHotspot: true,
      }, // Source Direction
      {
        direction: "NW",
        angleDegrees: 315,
        pm25: 220,
        pm10: 330,
        windSpeedMs: 3.4,
        isHotspot: false,
      },
    ],
  },
];

// Dynamically import react-leaflet components with SSR disabled to prevent window object reference errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false },
);

// Helper function for AQI color badges
function getAqiBadgeColor(aqi: number): string {
  if (aqi >= 400) return "bg-red-700 text-white";
  if (aqi >= 300) return "bg-orange-600 text-white";
  if (aqi >= 200) return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

export function MicroHotspotMapComponent(): React.ReactElement {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation>(
    stationsData[0],
  );
  const [activeRaidDispatched, setActiveRaidDispatched] =
    useState<boolean>(false);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDispatchRaid = (stationName: string, sector: string): void => {
    setActiveRaidDispatched(true);
    setTimeout(() => {
      alert(
        `Inspection Raid Unit successfully dispatched to target quadrant [${sector}] upstream of ${stationName}!`,
      );
      setActiveRaidDispatched(false);
    }, 400);
  };

  if (!isMounted) {
    return (
      <Card className="w-full max-w-6xl mx-auto border-slate-200 shadow-sm h-162.5 flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">
          Initializing Geospatial Directionality Engine...
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none pb-20">
        <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-96 max-w-full" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-0 min-h-155">
            <div className="xl:col-span-7 h-80 sm:h-105 md:h-130 xl:h-auto relative z-0 p-2">
              <Skeleton className="w-full h-full min-h-[320px] xl:min-h-[550px] rounded-lg" />
            </div>
            <div className="xl:col-span-5 p-4 sm:p-5 md:p-6 flex flex-col justify-between bg-slate-50/50 border-t xl:border-t-0 xl:border-l border-slate-100 space-y-4">
              <div className="space-y-4">
                <Skeleton className="h-4 w-36" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none pb-20">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Micro-Hotspot Source Directionality Map
            </CardTitle>
            <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2">
              Cross-referencing PM2.5/PM10 concentrations against wind vector
              quadrants to locate exact emission origins and coordinate targeted
              enforcement raids.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Monitoring Network:
            </span>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              3 Stations Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-0 min-h-155">
          {/* Left Column: Interactive Leaflet Map */}
          <div className="xl:col-span-7 h-80 sm:h-105 md:h-130 xl:h-auto relative z-0">
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossOrigin=""
            />
            <MapContainer
              center={[28.6139, 77.209]}
              zoom={11}
              scrollWheelZoom={false}
              style={{
                width: "100%",
                height: "100%",
                minHeight: window.innerWidth < 768 ? "320px" : "550px",
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {stationsData.map((station: MonitoringStation) => (
                <React.Fragment key={station.id}>
                  {/* Outer Pulsing Indicator Ring for Hotspots */}
                  <CircleMarker
                    center={[station.lat, station.lng]}
                    radius={station.id === selectedStation.id ? 32 : 20}
                    pathOptions={{
                      color:
                        station.id === selectedStation.id
                          ? "#2563EB"
                          : "#DC2626",
                      fillColor:
                        station.id === selectedStation.id
                          ? "#3B82F6"
                          : "#EF4444",
                      fillOpacity: 0.25,
                      weight: 2,
                    }}
                  />
                  <Marker
                    position={[station.lat, station.lng]}
                    eventHandlers={{
                      click: () => setSelectedStation(station),
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans">
                        <p className="font-bold text-slate-800">
                          {station.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Current AQI: {station.currentAQI}
                        </p>
                        <p className="text-xs text-rose-600 font-medium mt-0.5">
                          Primary Source Wind: {station.primarySourceSector}{" "}
                          Quad
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
            </MapContainer>
          </div>

          {/* Right Column: Directional Analytics & Raid Planner */}
          <div className="xl:col-span-5 p-4 sm:p-5 md:p-6 flex flex-col justify-between bg-slate-50/50 border-t xl:border-t-0 xl:border-l border-slate-100">
            <div>
              {/* Station Selection Tabs */}
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Monitoring Station
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                  {stationsData.map((station: MonitoringStation) => (
                    <button
                      key={station.id}
                      onClick={() => setSelectedStation(station)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedStation.id === station.id
                          ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500"
                          : "bg-white/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {station.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Primary Plume Origin: Sector{" "}
                          {station.primarySourceSector}
                        </p>
                      </div>
                      <Badge className={getAqiBadgeColor(station.currentAQI)}>
                        AQI {station.currentAQI}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Station Directional Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Wind Quadrant Emissions Breakdown
                  </h3>
                  <span className="text-xs text-slate-500">
                    PM2.5 / PM10 (µg/m³)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-55 overflow-y-auto pr-1">
                  {selectedStation.sectors.map((sector: DirectionalSector) => (
                    <div
                      key={sector.direction}
                      className={`p-2.5 rounded border flex flex-col justify-between transition-colors ${
                        sector.isHotspot
                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">
                          Quadrant {sector.direction} ({sector.angleDegrees}
                          &deg;)
                        </span>
                        {sector.isHotspot && (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-medium">
                            HOTSPOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs space-y-0.5 font-mono">
                        <p>
                          PM2.5:{" "}
                          <strong className="font-semibold">
                            {sector.pm25}
                          </strong>
                        </p>
                        <p>
                          PM10:{" "}
                          <strong className="font-semibold">
                            {sector.pm10}
                          </strong>
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Wind: {sector.windSpeedMs} m/s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Footer: Targeted Raid Trigger */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Targeted Plume Vector:</span>
                <span className="font-bold text-rose-600">
                  Sector {selectedStation.primarySourceSector} (High Confidence)
                </span>
              </div>
              <Button
                onClick={() =>
                  handleDispatchRaid(
                    selectedStation.name,
                    selectedStation.primarySourceSector,
                  )
                }
                disabled={activeRaidDispatched}
                className="w-full whitespace-normal text-center leading-snug bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all shadow-sm rounded-md"
              >
                {activeRaidDispatched
                  ? "Dispatching Enforcement Unit..."
                  : `Deploy Inspection Raid to Quadrant ${selectedStation.primarySourceSector}`}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
