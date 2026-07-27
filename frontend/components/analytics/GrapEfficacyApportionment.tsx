"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Strict TypeScript definitions (No 'any' types used)
type PollutionSourceKey =
  | "vehicular"
  | "constructionDust"
  | "industrial"
  | "stubbleBiomass";

interface DailyRecord {
  date: string;
  dayIndex: number;
  vehicular: number;
  constructionDust: number;
  industrial: number;
  stubbleBiomass: number;
  totalPM25: number;
}

interface GrapIntervention {
  dayIndex: number;
  date: string;
  stage: string;
  title: string;
  description: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: PollutionSourceKey;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

// Comprehensive daily time-series dataset showing source apportionment across an anti-pollution campaign
const timeSeriesData: DailyRecord[] = [
  {
    date: "Oct 05",
    dayIndex: 1,
    vehicular: 85,
    constructionDust: 60,
    industrial: 45,
    stubbleBiomass: 30,
    totalPM25: 220,
  },
  {
    date: "Oct 08",
    dayIndex: 4,
    vehicular: 90,
    constructionDust: 65,
    industrial: 48,
    stubbleBiomass: 40,
    totalPM25: 243,
  },
  {
    date: "Oct 11",
    dayIndex: 7,
    vehicular: 95,
    constructionDust: 70,
    industrial: 50,
    stubbleBiomass: 75,
    totalPM25: 290,
  },
  {
    date: "Oct 14",
    dayIndex: 10,
    vehicular: 92,
    constructionDust: 75,
    industrial: 52,
    stubbleBiomass: 110,
    totalPM25: 329,
  },
  {
    date: "Oct 17",
    dayIndex: 13,
    vehicular: 88,
    constructionDust: 80,
    industrial: 55,
    stubbleBiomass: 160,
    totalPM25: 383,
  },
  {
    date: "Oct 20",
    dayIndex: 16,
    vehicular: 90,
    constructionDust: 85,
    industrial: 58,
    stubbleBiomass: 210,
    totalPM25: 443,
  },
  {
    date: "Oct 23",
    dayIndex: 19,
    vehicular: 85,
    constructionDust: 50,
    industrial: 55,
    stubbleBiomass: 240,
    totalPM25: 430,
  }, // Post Stage I & II drop in construction
  {
    date: "Oct 26",
    dayIndex: 22,
    vehicular: 80,
    constructionDust: 35,
    industrial: 50,
    stubbleBiomass: 290,
    totalPM25: 455,
  },
  {
    date: "Oct 29",
    dayIndex: 25,
    vehicular: 75,
    constructionDust: 25,
    industrial: 48,
    stubbleBiomass: 340,
    totalPM25: 488,
  },
  {
    date: "Nov 01",
    dayIndex: 28,
    vehicular: 70,
    constructionDust: 20,
    industrial: 45,
    stubbleBiomass: 380,
    totalPM25: 515,
  }, // Peak stubble + emergency measures
  {
    date: "Nov 04",
    dayIndex: 31,
    vehicular: 60,
    constructionDust: 18,
    industrial: 40,
    stubbleBiomass: 280,
    totalPM25: 398,
  },
  {
    date: "Nov 07",
    dayIndex: 34,
    vehicular: 55,
    constructionDust: 15,
    industrial: 38,
    stubbleBiomass: 190,
    totalPM25: 298,
  },
  {
    date: "Nov 10",
    dayIndex: 37,
    vehicular: 52,
    constructionDust: 15,
    industrial: 35,
    stubbleBiomass: 110,
    totalPM25: 212,
  },
  {
    date: "Nov 13",
    dayIndex: 40,
    vehicular: 50,
    constructionDust: 12,
    industrial: 32,
    stubbleBiomass: 60,
    totalPM25: 154,
  },
];

// Exact GRAP Stage Enforcement Triggers
const grapTriggers: GrapIntervention[] = [
  {
    dayIndex: 12,
    date: "Oct 16",
    stage: "GRAP Stage I",
    title: "Poor AQI Trigger",
    description:
      "Ban on coal/firewood in eateries, strict dust mitigation at construction sites.",
    color: "#3B82F6", // Blue
  },
  {
    dayIndex: 18,
    date: "Oct 22",
    stage: "GRAP Stage II",
    title: "Very Poor AQI Trigger",
    description:
      "Ban on diesel generator sets, enhanced parking fees to curb vehicular traffic.",
    color: "#F59E0B", // Amber
  },
  {
    dayIndex: 24,
    date: "Oct 28",
    stage: "GRAP Stage III",
    title: "Severe AQI Trigger",
    description:
      "Strict ban on inter-state BS-III/IV diesel buses, halting non-essential construction & demolition.",
    color: "#EF4444", // Red
  },
  {
    dayIndex: 30,
    date: "Nov 03",
    stage: "GRAP Stage IV",
    title: "Severe+ AQI Trigger",
    description:
      "Ban on entry of truck traffic into Delhi, mandatory work-from-home guidelines.",
    color: "#7C3AED", // Purple
  },
];

// Clean formatting labels for map sources
const sourceConfig: Record<
  PollutionSourceKey,
  { label: string; color: string }
> = {
  stubbleBiomass: { label: "Stubble & Biomass Burning", color: "#DC2626" }, // Red
  industrial: { label: "Industrial Emissions", color: "#D97706" }, // Amber/Orange
  constructionDust: { label: "Construction & Dust", color: "#10B981" }, // Emerald
  vehicular: { label: "Vehicular Exhaust", color: "#2563EB" }, // Blue
};

// Custom interactive Tooltip component ensuring precise analytics overview
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, item) => sum + item.value, 0);

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-2xl text-xs space-y-2 border border-slate-700 min-w-55">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-200">
          <span>Date: {label}</span>
          <span className="text-slate-400 font-mono">Total: {total} µg/m³</span>
        </div>
        <div className="space-y-1">
          {payload
            .slice()
            .reverse()
            .map((entry, index) => (
              <div
                key={`tooltip-item-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300">{entry.name}:</span>
                </div>
                <span className="font-mono font-medium">
                  {entry.value} µg/m³
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

export function GrapEfficacyApportionmentChart(): React.ReactElement {
  const [activeStage, setActiveStage] = useState<GrapIntervention | null>(
    grapTriggers[2],
  ); // Default to Stage III

  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              GRAP Policy Efficacy & Source Apportionment
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm mt-3">
              Tracking daily PM2.5 contribution volumes across pollution sources
              against staged emergency GRAP enforcement milestones.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
            >
              Policy Evaluation Active
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        {/* GRAP Intervention Control & Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {grapTriggers.map((trigger: GrapIntervention) => {
            const isSelected = activeStage?.stage === trigger.stage;
            return (
              <button
                key={trigger.stage}
                onClick={() => setActiveStage(trigger)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: isSelected ? "#93C5FD" : trigger.color }}
                  >
                    {trigger.stage}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                  >
                    {trigger.date}
                  </span>
                </div>
                <p
                  className={`text-xs line-clamp-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                >
                  {trigger.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Policy Detail Callout */}
        {activeStage && (
          <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeStage.color }}
                />
                <h4 className="text-sm font-bold text-slate-800">
                  {activeStage.stage}: {activeStage.title}
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  ({activeStage.date})
                </span>
              </div>
              <p className="text-xs text-slate-600 pl-4">
                {activeStage.description}
              </p>
            </div>
            <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded border border-slate-200 self-start md:self-auto">
              <strong>Efficacy Insight:</strong> Notice sharp downward
              inflection in construction dust following Stage III
              implementation.
            </div>
          </div>
        )}

        {/* Main Stacked Area Chart Container */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-175 h-80 sm:h-105 md:h-130 lg:h-155 xl:h-175">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeriesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  interval="preserveStartEnd"
                  minTickGap={25}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#CBD5E1" }}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  width={60}
                  unit=" µg/m³"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={60}
                  wrapperStyle={{
                    fontSize: 12,
                    paddingBottom: 12,
                  }}
                />

                {/* Stacked Pollution Sources Areas */}
                <Area
                  type="monotone"
                  dataKey="vehicular"
                  name={sourceConfig.vehicular.label}
                  stackId="1"
                  stroke={sourceConfig.vehicular.color}
                  fill={sourceConfig.vehicular.color}
                  fillOpacity={0.85}
                />
                <Area
                  type="monotone"
                  dataKey="constructionDust"
                  name={sourceConfig.constructionDust.label}
                  stackId="1"
                  stroke={sourceConfig.constructionDust.color}
                  fill={sourceConfig.constructionDust.color}
                  fillOpacity={0.85}
                />
                <Area
                  type="monotone"
                  dataKey="industrial"
                  name={sourceConfig.industrial.label}
                  stackId="1"
                  stroke={sourceConfig.industrial.color}
                  fill={sourceConfig.industrial.color}
                  fillOpacity={0.85}
                />
                <Area
                  type="monotone"
                  dataKey="stubbleBiomass"
                  name={sourceConfig.stubbleBiomass.label}
                  stackId="1"
                  stroke={sourceConfig.stubbleBiomass.color}
                  fill={sourceConfig.stubbleBiomass.color}
                  fillOpacity={0.9}
                />

                {/* Overlaid Vertical Reference Lines for GRAP Stages */}
                {grapTriggers.map((trigger: GrapIntervention) => {
                  const matchRecord = timeSeriesData.find(
                    (d: DailyRecord) => d.date === trigger.date,
                  );
                  if (!matchRecord) return null;

                  const isHighlighted = activeStage?.stage === trigger.stage;

                  return (
                    <ReferenceLine
                      key={trigger.stage}
                      x={matchRecord.date}
                      stroke={trigger.color}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: trigger.stage,
                        position: "top",
                        fill: trigger.color,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
