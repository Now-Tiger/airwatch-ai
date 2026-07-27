"use client";

import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Strict TypeScript definitions (No 'any' types used)
type DailyTrendPoint = {
  date: string;
  complaints: number;
  aqi: number;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

// Time-series dataset comparing grievance counts with AQI fluctuations
const trendData: DailyTrendPoint[] = [
  { date: "Oct 15", complaints: 210, aqi: 245 },
  { date: "Oct 16", complaints: 240, aqi: 270 },
  { date: "Oct 17", complaints: 290, aqi: 310 },
  { date: "Oct 18", complaints: 320, aqi: 335 },
  { date: "Oct 19", complaints: 410, aqi: 380 },
  { date: "Oct 20", complaints: 530, aqi: 420 },
  { date: "Oct 21", complaints: 680, aqi: 455 },
  { date: "Oct 22", complaints: 750, aqi: 470 },
  { date: "Oct 23", complaints: 610, aqi: 410 },
  { date: "Oct 24", complaints: 480, aqi: 360 },
  { date: "Oct 25", complaints: 390, aqi: 320 },
  { date: "Oct 26", complaints: 340, aqi: 295 },
];

// Custom interactive Tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-xl text-xs space-y-2 border border-slate-700 min-w-52.5">
        <div className="font-semibold border-b border-slate-800 pb-1.5 text-slate-200">
          Date: {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div
              key={`tooltip-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{entry.name}:</span>
              </div>
              <span className="font-mono font-medium text-white">
                {entry.value} {entry.dataKey === "aqi" ? "AQI" : "Complaints"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ComplaintAqiTrendChart(): React.ReactElement {
  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Citizen Complaints vs. Delhi AQI Trend
            </CardTitle>
            <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2 max-w-4xl">
              Evaluating public behavioral response: Do citizen grievance
              reports increase proportionally as atmospheric air quality
              worsens?
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              High Correlation Tracked
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="h-115 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trendData}
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />

              {/* Left Y-Axis for AQI Trend Line */}
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[200, 500]}
                ticks={[200, 300, 400, 500]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
                stroke="#DC2626"
              />

              {/* Right Y-Axis for Daily Complaints Volume Bar */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 900]}
                ticks={[0, 200, 400, 600, 800]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
                stroke="#2563EB"
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs font-medium text-slate-700 mr-4">
                    {value}
                  </span>
                )}
              />

              {/* Bar Graph for Daily Complaints */}
              <Bar
                yAxisId="right"
                dataKey="complaints"
                name="Daily Complaints Volume"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                barSize={28}
                fillOpacity={0.85}
              />

              {/* Line Graph for AQI Trend */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="aqi"
                name="Delhi Average AQI"
                stroke="#DC2626"
                strokeWidth={3}
                dot={{ fill: "#DC2626", r: 4 }}
                activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
