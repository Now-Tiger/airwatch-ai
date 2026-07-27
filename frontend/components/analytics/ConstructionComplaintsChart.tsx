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
  LabelList,
  Label,
  ReferenceDot,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BubblePoint = {
  district: string;
  constructionSites: number;
  citizenComplaints: number;
  builtUpArea: number;
  averageAQI: number;
};

// Extracted data matching the precise visual layout of the image
const data: BubblePoint[] = [
  {
    district: "North West",
    constructionSites: 152,
    citizenComplaints: 845,
    builtUpArea: 420000,
    averageAQI: 432,
  },
  {
    district: "North",
    constructionSites: 128,
    citizenComplaints: 640,
    builtUpArea: 355000,
    averageAQI: 401,
  },
  {
    district: "West",
    constructionSites: 110,
    citizenComplaints: 585,
    builtUpArea: 318000,
    averageAQI: 382,
  },
  {
    district: "Shahdara",
    constructionSites: 88,
    citizenComplaints: 505,
    builtUpArea: 240000,
    averageAQI: 360,
  },
  {
    district: "East",
    constructionSites: 95,
    citizenComplaints: 470,
    builtUpArea: 280000,
    averageAQI: 340,
  },
  {
    district: "South West",
    constructionSites: 98,
    citizenComplaints: 430,
    builtUpArea: 260000,
    averageAQI: 325,
  },
  {
    district: "South",
    constructionSites: 78,
    citizenComplaints: 390,
    builtUpArea: 190000,
    averageAQI: 285,
  },
  {
    district: "South East",
    constructionSites: 70,
    citizenComplaints: 340,
    builtUpArea: 175000,
    averageAQI: 270,
  },
  {
    district: "Central",
    constructionSites: 52,
    citizenComplaints: 240,
    builtUpArea: 120000,
    averageAQI: 248,
  },
  {
    district: "New Delhi",
    constructionSites: 41,
    citizenComplaints: 180,
    builtUpArea: 90000,
    averageAQI: 220,
  },
];

function getAqiColor(aqi: number): string {
  if (aqi >= 420) return "#8B2C27"; // Dark Red
  if (aqi >= 400) return "#D94928"; // Red
  if (aqi >= 380) return "#F28533"; // Orange
  if (aqi >= 360) return "#F4B942"; // Yellow-Orange
  if (aqi >= 340) return "#C5DF4B"; // Yellow-Green
  if (aqi >= 320) return "#86E255"; // Green
  if (aqi >= 280) return "#4ED2C8"; // Cyan
  if (aqi >= 260) return "#4BB2E6"; // Light Blue
  if (aqi >= 240) return "#5174D2"; // Blue
  return "#3C2D55"; // Dark Purple
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: BubblePoint }>;
};

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-3 pb-2 text-lg font-bold text-gray-800">
        {item.district}
      </div>
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex justify-between gap-4">
          <span>Average AQI:</span>
          <span className="font-semibold text-gray-900">{item.averageAQI}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Citizen Complaints:</span>
          <span className="font-semibold text-gray-900">
            {item.citizenComplaints}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Active Construction Sites:</span>
          <span className="font-semibold text-gray-900">
            {item.constructionSites}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Built-up Area (Sqm):</span>
          <span className="font-semibold text-gray-900">
            {item.builtUpArea.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

type CustomAnnotationProps = {
  viewBox: {
    cx: number;
    cy: number;
  };
};

const CustomAnnotation = ({ viewBox }: CustomAnnotationProps) => {
  const { cx, cy } = viewBox;

  return (
    <g>
      {/* Connecting Line */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + 35}
        y2={cy - 45}
        stroke="#334155"
        strokeWidth={1.5}
      />

      {/* Box Background */}
      <rect
        x={cx - 10}
        y={cy - 85}
        width={130}
        height={38}
        fill="#FEF7E2"
        stroke="#475569"
        strokeWidth={1}
        rx={2}
      />

      {/* Text inside box */}
      <text
        x={cx + 55}
        y={cy - 70}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill="#0F172A"
      >
        North West
      </text>

      <text
        x={cx + 55}
        y={cy - 55}
        textAnchor="middle"
        fontSize={11}
        fill="#334155"
      >
        Inspection Priority
      </text>

      {/* Connecting Dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="#334155" />
    </g>
  );
};

export function ConstructionVsComplaintsChart() {
  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Construction Activity vs Citizen Complaints
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="flex h-150 w-full items-start">
          {/* Main Chart Container */}
          <div className="flex-1 h-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 40, right: 20, bottom: 40, left: 20 }}
              >
                <CartesianGrid
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                  vertical={true}
                  horizontal={true}
                />

                {/* Active Construction Sites Axis */}
                <XAxis
                  type="number"
                  dataKey="constructionSites"
                  domain={[20, 170]}
                  ticks={[40, 60, 80, 100, 120, 140, 160]}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13 }}
                >
                  <Label
                    value="Active Construction Sites"
                    position="insideBottom"
                    offset={-30}
                    style={{ fill: "#334155", fontSize: 15, fontWeight: 500 }}
                  />
                </XAxis>

                {/* Citizen Complaints Axis */}
                <YAxis
                  type="number"
                  dataKey="citizenComplaints"
                  domain={[100, 950]}
                  ticks={[100, 200, 300, 400, 500, 600, 700, 800, 900]}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13 }}
                >
                  <Label
                    value="Citizen Complaints"
                    angle={-90}
                    position="insideLeft"
                    offset={-10}
                    style={{ fill: "#334155", fontSize: 15, fontWeight: 500 }}
                  />
                </YAxis>

                {/* Built Up Area controls Bubble Size */}
                <ZAxis
                  type="number"
                  dataKey="builtUpArea"
                  range={[400, 4500]}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ strokeDasharray: "3 3", stroke: "#cbd5e1" }}
                />

                {/* Reference Area: High Complaint Zone */}
                <ReferenceArea
                  y1={550}
                  y2={900}
                  fill="#FFEBEB"
                  fillOpacity={0.6}
                >
                  <Label
                    value="High Complaint Zone"
                    position="insideTopLeft"
                    offset={15}
                    style={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                  />
                </ReferenceArea>

                {/* Reference Area: High Construction Activity */}
                <ReferenceArea
                  x1={110}
                  x2={170}
                  fill="#FFF4EB"
                  fillOpacity={0.6}
                >
                  <Label
                    value="High Construction Activity"
                    position="insideTopLeft"
                    offset={15}
                    style={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                  />
                </ReferenceArea>

                {/* Scatter Points overlay */}
                <Scatter data={data} shape="circle">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getAqiColor(entry.averageAQI)}
                      stroke="#334155"
                      strokeWidth={1}
                      fillOpacity={0.9}
                    />
                  ))}
                  <LabelList
                    dataKey="district"
                    position="top"
                    offset={12}
                    style={{ fill: "#475569", fontSize: 13, fontWeight: 400 }}
                  />
                </Scatter>

                {/* Custom Annotation matching the reference image precisely */}
                <ReferenceDot x={152} y={845} r={0} stroke="none">
                  <Label
                    content={
                      <CustomAnnotation
                        viewBox={{
                          cx: 152,
                          cy: 845,
                        }}
                      />
                    }
                  />
                </ReferenceDot>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* AQI Custom Gradient Legend Component */}
          <div className="w-25 h-full flex flex-col items-center pt-8 pb-20">
            <span className="text-sm font-semibold text-slate-700 mb-3 whitespace-nowrap">
              Average AQI
            </span>
            <div className="relative h-120 flex">
              {/* Gradient Scale Box */}
              <div
                className="w-7 h-full shadow-[inset_0_0_2px_rgba(0,0,0,0.3)] rounded-xs"
                style={{
                  background:
                    "linear-gradient(to bottom, #8B2C27 0%, #D94928 20%, #F28533 28%, #F4B942 36%, #C5DF4B 44%, #86E255 52%, #4ED2C8 68%, #4BB2E6 76%, #5174D2 84%, #3C2D55 100%)",
                }}
              />
              {/* Tick Markers strictly positioned via percentages corresponding to actual AQI distribution */}
              <div className="absolute inset-y-0 -right-8 w-8 flex flex-col justify-between">
                <span
                  className="absolute text-[13px] text-slate-600 font-medium"
                  style={{ top: "20%", transform: "translateY(-50%)" }}
                >
                  400
                </span>
                <span
                  className="absolute text-[13px] text-slate-600 font-medium"
                  style={{ top: "40%", transform: "translateY(-50%)" }}
                >
                  350
                </span>
                <span
                  className="absolute text-[13px] text-slate-600 font-medium"
                  style={{ top: "60%", transform: "translateY(-50%)" }}
                >
                  300
                </span>
                <span
                  className="absolute text-[13px] text-slate-600 font-medium"
                  style={{ top: "80%", transform: "translateY(-50%)" }}
                >
                  250
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
