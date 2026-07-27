"use client";

import React from "react";
import {
  Scatter,
  ScatterChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceArea,
  Label,
  LabelList,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Strict TypeScript definitions (No 'any' types used)
type RiskTier = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

type IndustrialFacilityPoint = {
  facilityName: string;
  sector: string;
  staleCemsDays: number;
  emissionExceedanceFactor: number;
  facilityCapacity: number; // Controls Z-Axis bubble size
  riskTier: RiskTier;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: IndustrialFacilityPoint;
  }>;
}

// Extracted data representing industrial units mapped across compliance vs exceedance dimensions
const industrialData: IndustrialFacilityPoint[] = [
  {
    facilityName: "Mundka Steel Rolling Mill #4",
    sector: "Metallurgy",
    staleCemsDays: 95,
    emissionExceedanceFactor: 4.8,
    facilityCapacity: 45000,
    riskTier: "CRITICAL",
  },
  {
    facilityName: "Okhla Electroplating Unit",
    sector: "Chemicals",
    staleCemsDays: 110,
    emissionExceedanceFactor: 4.2,
    facilityCapacity: 38000,
    riskTier: "CRITICAL",
  },
  {
    facilityName: "Bawana Thermal Captive Plant",
    sector: "Power Generation",
    staleCemsDays: 82,
    emissionExceedanceFactor: 3.9,
    facilityCapacity: 52000,
    riskTier: "CRITICAL",
  },
  {
    facilityName: "Narela Plastic Recyclers",
    sector: "Processing",
    staleCemsDays: 74,
    emissionExceedanceFactor: 3.5,
    facilityCapacity: 31000,
    riskTier: "HIGH",
  },
  {
    facilityName: "Mayapuri Foundry & Forge",
    sector: "Metallurgy",
    staleCemsDays: 68,
    emissionExceedanceFactor: 3.2,
    facilityCapacity: 29000,
    riskTier: "HIGH",
  },
  {
    facilityName: "Wazirpur Acid & Dye Works",
    sector: "Chemicals",
    staleCemsDays: 88,
    emissionExceedanceFactor: 2.8,
    facilityCapacity: 24000,
    riskTier: "HIGH",
  },
  {
    facilityName: "Anand Parbat Rubber Works",
    sector: "Manufacturing",
    staleCemsDays: 45,
    emissionExceedanceFactor: 4.1,
    facilityCapacity: 21000,
    riskTier: "HIGH",
  },
  {
    facilityName: "Badli Paper & Packaging",
    sector: "Paper",
    staleCemsDays: 52,
    emissionExceedanceFactor: 2.5,
    facilityCapacity: 26000,
    riskTier: "MODERATE",
  },
  {
    facilityName: "Naraina Textile Dying",
    sector: "Textiles",
    staleCemsDays: 30,
    emissionExceedanceFactor: 2.1,
    facilityCapacity: 18000,
    riskTier: "MODERATE",
  },
  {
    facilityName: "Jhilmil Engineering Works",
    sector: "Engineering",
    staleCemsDays: 18,
    emissionExceedanceFactor: 1.8,
    facilityCapacity: 15000,
    riskTier: "LOW",
  },
  {
    facilityName: "Patparganj Dairy Processing",
    sector: "Food & Agro",
    staleCemsDays: 12,
    emissionExceedanceFactor: 1.4,
    facilityCapacity: 12000,
    riskTier: "LOW",
  },
  {
    facilityName: "Ghevra Brick Kiln Unit B",
    sector: "Building Materials",
    staleCemsDays: 62,
    emissionExceedanceFactor: 3.7,
    facilityCapacity: 34000,
    riskTier: "CRITICAL",
  },
];

// Color mapping based on risk tier
function getRiskTierColor(tier: RiskTier): string {
  switch (tier) {
    case "CRITICAL":
      return "#DC2626"; // Red 600
    case "HIGH":
      return "#EA580C"; // Orange 600
    case "MODERATE":
      return "#CA8A04"; // Yellow 600
    case "LOW":
      return "#16A34A"; // Green 600
  }
}

// Custom interactive Tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint: IndustrialFacilityPoint = payload[0].payload;
    const badgeColor = getRiskTierColor(dataPoint.riskTier);

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-xl text-xs space-y-2 border border-slate-700 min-w-60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-100">
          <span>{dataPoint.facilityName}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {dataPoint.riskTier}
          </span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span>Sector:</span>
            <span className="font-medium text-white">{dataPoint.sector}</span>
          </div>
          <div className="flex justify-between">
            <span>Stale CEMS / Expired Consent:</span>
            <span className="font-medium text-white">
              {dataPoint.staleCemsDays} Days
            </span>
          </div>
          <div className="flex justify-between">
            <span>Emission Exceedance:</span>
            <span className="font-medium text-white">
              {dataPoint.emissionExceedanceFactor}x Limit
            </span>
          </div>
          <div className="flex justify-between">
            <span>Facility Capacity:</span>
            <span className="font-medium text-white">
              {dataPoint.facilityCapacity.toLocaleString()} Tons/Yr
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function IndustrialRiskMatrixChart(): React.ReactElement {
  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Industrial Chronic Offender Risk Matrix
            </CardTitle>
            <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2 max-w-4xl">
              Isolating massive industrial units with high emission exceedance
              factors and prolonged non-compliance windows for immediate sealing
              orders.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Target Zone: Top-Right (Immediate Sealing)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="h-130 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />

              {/* X-Axis: Days with Expired Consent / Stale CEMS */}
              <XAxis
                type="number"
                dataKey="staleCemsDays"
                domain={[0, 120]}
                ticks={[0, 20, 40, 60, 80, 100, 120]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
              >
                <Label
                  value="Days Operating with Expired Consent / Stale CEMS Data"
                  position="insideBottom"
                  offset={-25}
                  style={{ fill: "#334155", fontSize: 13, fontWeight: 500 }}
                />
              </XAxis>

              {/* Y-Axis: Emission Exceedance Factor */}
              <YAxis
                type="number"
                dataKey="emissionExceedanceFactor"
                domain={[1.0, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
                unit="x"
              >
                <Label
                  value="Average Emission Exceedance Factor"
                  angle={-90}
                  position="insideLeft"
                  offset={-5}
                  style={{ fill: "#334155", fontSize: 13, fontWeight: 500 }}
                />
              </YAxis>

              {/* Z-Axis: Facility Capacity for Bubble Sizing */}
              <ZAxis
                type="number"
                dataKey="facilityCapacity"
                range={[80, 700]}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#94A3B8" }}
              />

              {/* 4 Quadrant Background Reference Areas */}
              {/* Bottom-Left: Low Risk / Compliant */}
              <ReferenceArea
                x1={0}
                x2={60}
                y1={1.0}
                y2={3.0}
                fill="#F8FAFC"
                fillOpacity={0.6}
              >
                <Label
                  value="Low Risk / Minor Deficits"
                  position="insideTopLeft"
                  offset={10}
                  style={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                />
              </ReferenceArea>

              {/* Top-Left: High Emission, Low Procedural Lag */}
              <ReferenceArea
                x1={0}
                x2={60}
                y1={3.0}
                y2={5.5}
                fill="#FFF7ED"
                fillOpacity={0.6}
              >
                <Label
                  value="High Emission / Active Monitoring"
                  position="insideTopLeft"
                  offset={10}
                  style={{ fill: "#C2410C", fontSize: 11, fontWeight: 500 }}
                />
              </ReferenceArea>

              {/* Bottom-Right: Administrative Violators (Stale CEMS, moderate emissions) */}
              <ReferenceArea
                x1={60}
                x2={120}
                y1={1.0}
                y2={3.0}
                fill="#FEFCE8"
                fillOpacity={0.6}
              >
                <Label
                  value="Procedural Non-Compliance"
                  position="insideTopLeft"
                  offset={10}
                  style={{ fill: "#A16207", fontSize: 11, fontWeight: 500 }}
                />
              </ReferenceArea>

              {/* Top-Right: High Risk Chronic Offenders (Immediate Sealing Target) */}
              <ReferenceArea
                x1={60}
                x2={120}
                y1={3.0}
                y2={5.5}
                fill="#FEF2F2"
                fillOpacity={0.8}
              >
                <Label
                  value="🚨 High Risk Chronic Offenders (Immediate Sealing Target)"
                  position="insideTopLeft"
                  offset={10}
                  style={{ fill: "#B91C1C", fontSize: 12, fontWeight: 600 }}
                />
              </ReferenceArea>

              {/* Scatter Plot Series */}
              <Scatter data={industrialData} shape="circle">
                {industrialData.map(
                  (entry: IndustrialFacilityPoint, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getRiskTierColor(entry.riskTier)}
                      stroke="#1E293B"
                      strokeWidth={1.5}
                      fillOpacity={0.85}
                    />
                  ),
                )}
                <LabelList
                  dataKey="facilityName"
                  position="top"
                  offset={10}
                  style={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
