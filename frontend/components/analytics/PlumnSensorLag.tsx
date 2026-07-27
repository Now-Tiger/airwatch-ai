"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Explicit type definitions to ensure full typesafety (No 'any' types)
type TimeLag = "+0h" | "+12h" | "+24h" | "+36h" | "+48h" | "+60h" | "+72h";

interface CorrelationData {
  lag: TimeLag;
  correlation: number;
}

interface DistrictData {
  district: string;
  distanceKm: number;
  data: CorrelationData[];
}

interface TooltipState {
  x: number;
  y: number;
  district: string;
  lag: string;
  correlation: number;
  distanceKm: number;
  isVisible: boolean;
}

// Scientifically mocked data reflecting the plume travel concept
// Further districts peak at higher time delays (lags).
const heatmapData: DistrictData[] = [
  {
    district: "Amritsar",
    distanceKm: 450,
    data: [
      { lag: "+0h", correlation: 0.05 },
      { lag: "+12h", correlation: 0.15 },
      { lag: "+24h", correlation: 0.4 },
      { lag: "+36h", correlation: 0.75 },
      { lag: "+48h", correlation: 0.85 }, // Peak
      { lag: "+60h", correlation: 0.6 },
      { lag: "+72h", correlation: 0.3 },
    ],
  },
  {
    district: "Ludhiana",
    distanceKm: 310,
    data: [
      { lag: "+0h", correlation: 0.1 },
      { lag: "+12h", correlation: 0.25 },
      { lag: "+24h", correlation: 0.7 },
      { lag: "+36h", correlation: 0.82 }, // Peak
      { lag: "+48h", correlation: 0.55 },
      { lag: "+60h", correlation: 0.25 },
      { lag: "+72h", correlation: 0.1 },
    ],
  },
  {
    district: "Patiala",
    distanceKm: 230,
    data: [
      { lag: "+0h", correlation: 0.15 },
      { lag: "+12h", correlation: 0.45 },
      { lag: "+24h", correlation: 0.78 }, // Peak
      { lag: "+36h", correlation: 0.6 },
      { lag: "+48h", correlation: 0.3 },
      { lag: "+60h", correlation: 0.15 },
      { lag: "+72h", correlation: 0.05 },
    ],
  },
  {
    district: "Ambala",
    distanceKm: 200,
    data: [
      { lag: "+0h", correlation: 0.2 },
      { lag: "+12h", correlation: 0.65 },
      { lag: "+24h", correlation: 0.8 }, // Peak
      { lag: "+36h", correlation: 0.45 },
      { lag: "+48h", correlation: 0.2 },
      { lag: "+60h", correlation: 0.1 },
      { lag: "+72h", correlation: 0.05 },
    ],
  },
  {
    district: "Karnal",
    distanceKm: 120,
    data: [
      { lag: "+0h", correlation: 0.35 },
      { lag: "+12h", correlation: 0.88 }, // Peak
      { lag: "+24h", correlation: 0.5 },
      { lag: "+36h", correlation: 0.2 },
      { lag: "+48h", correlation: 0.1 },
      { lag: "+60h", correlation: 0.05 },
      { lag: "+72h", correlation: 0.02 },
    ],
  },
  {
    district: "Rohtak",
    distanceKm: 70,
    data: [
      { lag: "+0h", correlation: 0.85 }, // Peak
      { lag: "+12h", correlation: 0.6 },
      { lag: "+24h", correlation: 0.25 },
      { lag: "+36h", correlation: 0.1 },
      { lag: "+48h", correlation: 0.05 },
      { lag: "+60h", correlation: 0.02 },
      { lag: "+72h", correlation: 0.01 },
    ],
  },
];

const lagLabels: TimeLag[] = [
  "+0h",
  "+12h",
  "+24h",
  "+36h",
  "+48h",
  "+60h",
  "+72h",
];

// Helper function to map correlation coefficients to a fiery gradient scale
function getCorrelationColor(correlation: number): string {
  if (correlation >= 0.8) return "#7F1D1D"; // Red 900 (High correlation)
  if (correlation >= 0.6) return "#DC2626"; // Red 600
  if (correlation >= 0.4) return "#EA580C"; // Orange 600
  if (correlation >= 0.2) return "#FACC15"; // Yellow 400
  if (correlation >= 0.1) return "#FEF08A"; // Yellow 200
  return "#F8FAFC"; // Slate 50 (Minimal/No correlation)
}

// Ensure optimal contrasting text color depending on the background intensity
function getTextColor(correlation: number): string {
  return correlation >= 0.4 ? "#FFFFFF" : "#334155";
}

export function PlumeSensorLagHeatmap(): React.ReactElement {
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0,
    y: 0,
    district: "",
    lag: "",
    correlation: 0,
    distanceKm: 0,
    isVisible: false,
  });

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    district: DistrictData,
    cell: CorrelationData,
  ): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      district: district.district,
      lag: cell.lag,
      correlation: cell.correlation,
      distanceKm: district.distanceKm,
      isVisible: true,
    });
  };

  const handleMouseLeave = (): void => {
    setTooltip((prev: TooltipState) => ({ ...prev, isVisible: false }));
  };

  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Plume Travel & Sensor Lag Analysis
        </CardTitle>
        <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2 max-w-4xl">
          Correlation between daily stubble fire radiative power in upstream
          districts and Delhi&apos;s ground-level AQI across staggered time
          delays.
        </CardDescription>
        <CardDescription className="text-gray-900 text-sm leading-relaxed max-w-4xl">
          The diagonal gradient reveals the natural lag window as smoke plumes
          travel downwind over 1 to 3 days.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="w-full overflow-x-auto">
          <div className="flex flex-col min-w-255 lg:min-w-full pb-6">
            <div className="w-28 sm:w-32 lg:w-36 shrink-0 flex items-end justify-start pb-2 pr-4">
              <span className="text-sm font-semibold text-slate-500">
                Upstream District
              </span>
            </div>
            <div className="flex-1 flex justify-between">
              {lagLabels.map((lag: TimeLag) => (
                <div
                  key={lag}
                  className="flex-1 flex flex-col items-center justify-end pb-2"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {lag}
                  </span>
                  <span className="text-xs text-slate-400">Delay</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Body (Y-Axis & Grid) */}
          <div className="flex flex-col w-full min-w-150 gap-0.5">
            {heatmapData.map((district: DistrictData) => (
              <div key={district.district} className="flex w-full">
                {/* Y-Axis Label */}
                <div className="w-28 sm:w-32 lg:w-36 shrink-0 flex flex-col items-start justify-center pr-4 border-r border-slate-100">
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-700">
                    {district.district}
                  </span>
                  <span className="text-xs text-slate-400">
                    {district.distanceKm} km from Delhi
                  </span>
                </div>

                {/* Heatmap Cells */}
                <div className="flex-1 flex gap-0.5 pl-0.5">
                  {district.data.map((cell: CorrelationData) => (
                    <div
                      key={`${district.district}-${cell.lag}`}
                      onMouseEnter={(
                        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                      ) => handleMouseEnter(e, district, cell)}
                      onMouseLeave={handleMouseLeave}
                      className="flex-1 h-10 sm:h-12 lg:h-14 rounded-sm flex items-center justify-center cursor-crosshair transition-all duration-200 hover:ring-2 hover:ring-slate-400 hover:ring-offset-1 hover:z-10"
                      style={{
                        backgroundColor: getCorrelationColor(cell.correlation),
                        color: getTextColor(cell.correlation),
                      }}
                    >
                      <span className="text-[10px] sm:text-xs lg:text-sm font-medium opacity-90">
                        {cell.correlation.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend Component */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start sm:items-center w-full min-w-255 lg:min-w-full mt-10 pt-6 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">
              Pearson Correlation Coefficient (r)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-2">Low</span>
              {[0.0, 0.15, 0.3, 0.5, 0.7, 0.9].map(
                (val: number, idx: number) => (
                  <div
                    key={`legend-${idx}`}
                    className="w-6 sm:w-7 lg:w-8 h-3 rounded-sm"
                    style={{ backgroundColor: getCorrelationColor(val) }}
                  />
                ),
              )}
              <span className="text-xs text-slate-500 ml-2">High</span>
            </div>
          </div>
        </div>

        {/* Global Floating Tooltip */}
        {tooltip.isVisible && (
          <div
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md shadow-xl text-xs sm:text-sm flex flex-col gap-1 border border-slate-700/50 min-w-45 max-w-65 transform"
            style={{ top: tooltip.y, left: tooltip.x }}
          >
            <div className="font-semibold border-b border-slate-600 pb-1 mb-1">
              {tooltip.district}{" "}
              <span className="text-slate-400 font-normal">
                ({tooltip.distanceKm}km)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Time Lag:</span>
              <span className="font-medium">{tooltip.lag}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Correlation:</span>
              <span
                className="font-medium"
                style={{ color: getCorrelationColor(tooltip.correlation) }}
              >
                {tooltip.correlation.toFixed(2)}
              </span>
            </div>

            {/* Tooltip Down Arrow */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-slate-800" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
