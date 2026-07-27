"use client";

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
  Label,
  LabelList,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BubblePoint = {
  district: string;
  constructionSites: number;
  citizenComplaints: number;
  offlineIndustries: number;
  averageAQI: number;
};

// Data aligned to the visual layout of the provided image
const data: BubblePoint[] = [
  {
    district: "North West",
    averageAQI: 432,
    citizenComplaints: 820,
    constructionSites: 220,
    offlineIndustries: 21.0,
  },
  {
    district: "North",
    averageAQI: 388,
    citizenComplaints: 540,
    constructionSites: 160,
    offlineIndustries: 13.5,
  },
  {
    district: "Shahdara",
    averageAQI: 340,
    citizenComplaints: 480,
    constructionSites: 130,
    offlineIndustries: 9.5,
  },
  {
    district: "East",
    averageAQI: 320,
    citizenComplaints: 410,
    constructionSites: 120,
    offlineIndustries: 7.0,
  },
  {
    district: "West",
    averageAQI: 295,
    citizenComplaints: 360,
    constructionSites: 100,
    offlineIndustries: 5.0,
  },
  {
    district: "South East",
    averageAQI: 260,
    citizenComplaints: 310,
    constructionSites: 90,
    offlineIndustries: 3.5,
  },
  {
    district: "South",
    averageAQI: 210,
    citizenComplaints: 270,
    constructionSites: 80,
    offlineIndustries: 2.5,
  },
  {
    district: "Central",
    averageAQI: 240,
    citizenComplaints: 250,
    constructionSites: 70,
    offlineIndustries: 1.5,
  },
];

// Mimics the 'Reds' colormap scale from the image legend
function aqiColor(val: number): string {
  if (val >= 20.0) return "#8c2226"; // Dark Maroon
  if (val >= 17.5) return "#b82b2e";
  if (val >= 15.0) return "#d93b33";
  if (val >= 12.5) return "#ee5643";
  if (val >= 10.0) return "#f77f61";
  if (val >= 7.5) return "#fba989";
  if (val >= 5.0) return "#fcd2c2";
  if (val >= 2.5) return "#feece6"; // Very Light Pink
  return "#ffffff"; // White
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: BubblePoint }>;
};

function BubbleTooltip({ active, payload }: TooltipProps) {
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
          <span>Offline Industries Index:</span>
          <span className="font-semibold text-gray-900">
            {item.offlineIndustries.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ConstructionActivityBubbleChart() {
  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          District Pollution Risk Assessment
        </CardTitle>
        <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2 max-w-4xl">
          Complaints vs AQI with Construction Activity and Offline Industries
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        {/* Container for Chart and Right-side Legend */}
        <div className="flex flex-row items-stretch w-full h-150 mt-4">
          {/* Main Chart Area */}
          <div className="flex-1 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis
                  type="number"
                  dataKey="averageAQI"
                  name="Average AQI"
                  domain={[200, 450]}
                  tick={{ fill: "#4b5563" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d1d5db" }}
                >
                  <Label
                    value="Average AQI"
                    position="bottom"
                    offset={15}
                    style={{
                      textAnchor: "middle",
                      fill: "#374151",
                      fontWeight: 500,
                    }}
                  />
                </XAxis>

                <YAxis
                  type="number"
                  dataKey="citizenComplaints"
                  name="Citizen Complaints"
                  domain={[200, 900]}
                  tick={{ fill: "#4b5563" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d1d5db" }}
                >
                  <Label
                    value="Citizen Complaints"
                    angle={-90}
                    position="insideLeft"
                    style={{
                      textAnchor: "middle",
                      fill: "#374151",
                      fontWeight: 500,
                    }}
                  />
                </YAxis>

                {/* ZAxis drives the radius (size) of the bubbles based on construction sites */}
                <ZAxis
                  type="number"
                  dataKey="constructionSites"
                  range={[100, 2500]}
                />

                <Tooltip
                  content={<BubbleTooltip />}
                  cursor={{ strokeDasharray: "3 3" }}
                />

                <Scatter data={data} isAnimationActive={false}>
                  {data.map((item, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={aqiColor(item.offlineIndustries)}
                      fillOpacity={0.85}
                      stroke="#1f2937"
                      strokeWidth={1}
                    />
                  ))}
                  {/* Always-on district labels positioned inside/near the bubble */}
                  <LabelList
                    dataKey="district"
                    position="right"
                    offset={10}
                    style={{
                      fill: "#1f2937",
                      fontSize: "12px",
                      pointerEvents: "none",
                    }}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Color Gradient Legend (Right Sidebar) */}
          <div className="w-24 flex items-center justify-center pl-2 border-l border-gray-100 pb-12 pt-6">
            <div className="h-full flex gap-3">
              {/* Gradient Bar */}
              <div
                className="w-5 h-full rounded "
                style={{
                  background:
                    "linear-gradient(to top, #ffffff, #feece6, #fcd2c2, #fba989, #f77f61, #ee5643, #d93b33, #b82b2e, #8c2226)",
                }}
              />

              {/* Legend Ticks */}
              <div className="flex flex-col justify-between h-full text-xs text-gray-700 font-medium py-1">
                <span>20.0</span>
                <span>17.5</span>
                <span>15.0</span>
                <span>12.5</span>
                <span>10.0</span>
                <span>7.5</span>
                <span>5.0</span>
                <span>2.5</span>
              </div>

              {/* Legend Title */}
              <div className="flex items-center justify-center ml-2 relative">
                <span
                  className="text-sm font-semibold text-gray-800 whitespace-nowrap absolute"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  Offline Industries
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
