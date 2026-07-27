import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Cell,
  LabelList,
  Label,
  Customized,
} from "recharts";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAqiColor(aqi: number) {
  if (aqi < 220) return "#4BB2E6";
  if (aqi < 260) return "#4ED2C8";
  if (aqi < 290) return "#86E255";
  if (aqi < 310) return "#C5DF4B";
  if (aqi < 330) return "#F4B942";
  if (aqi < 350) return "#F28533";
  if (aqi < 370) return "#D94928";
  return "#8B2C27";
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: BubblePoint }>;
};

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{d.district}</p>
      <p className="text-slate-600">
        Construction sites:{" "}
        <span className="font-medium text-slate-900">
          {d.constructionSites}
        </span>
      </p>
      <p className="text-slate-600">
        Citizen complaints:{" "}
        <span className="font-medium text-slate-900">
          {d.citizenComplaints}
        </span>
      </p>
      <p className="text-slate-600">
        Built-up area:{" "}
        <span className="font-medium text-slate-900">
          {d.builtUpArea.toLocaleString()} m²
        </span>
      </p>
      <p className="text-slate-600">
        Average AQI:{" "}
        <span className="font-medium text-slate-900">{d.averageAQI}</span>
      </p>
    </div>
  );
}

type CustomAnnotationProps = {
  viewBox: {
    cx: number;
    cy: number;
  };
};

function CustomAnnotation({ viewBox }: CustomAnnotationProps) {
  const { cx, cy } = viewBox;

  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return (
    <g>
      <rect
        x={cx - 90}
        y={cy - 34}
        width={180}
        height={44}
        rx={8}
        fill="#334155"
        opacity={0.95}
      />
      <text
        x={cx}
        y={cy - 16}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={12}
        fontWeight={600}
      >
        Industrial Row
      </text>
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#e2e8f0" fontSize={11}>
        Highest complaints &amp; AQI
      </text>
    </g>
  );
}

// Resolves the pixel position for a data-space (x, y) pair using the live
// axis scales exposed by recharts' <Customized> render-prop. This avoids the
// NaN x/y issues that come from relying on <Label>/<ReferenceDot> viewBox
// interpolation, which expects width/height rather than cx/cy.
function ChartAnnotationLayer({ xAxisMap, yAxisMap, dataX, dataY }) {
  if (!xAxisMap || !yAxisMap) return null;
  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
  if (!xAxis || !yAxis) return null;

  const cx = xAxis.scale(dataX);
  const cy = yAxis.scale(dataY);

  return <CustomAnnotation cx={cx} cy={cy} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ConstructionVsComplaintsChart() {
  return (
    <div className="w-full mx-auto font-sans bg-white">
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24 pb-6 pt-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Construction Activity vs Citizen Complaints
        </h2>
      </div>

      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24 pb-10">
        <div className="flex w-full items-start h-[560px]">
          {/* Main Chart Container */}
          <div className="flex-1 h-full pr-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 40, right: 20, bottom: 40, left: 20 }}
              >
                <CartesianGrid
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                  vertical
                  horizontal
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
                <Customized
                  component={(props) => (
                    <ChartAnnotationLayer {...props} dataX={152} dataY={845} />
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* AQI Custom Gradient Legend Component */}
          <div className="w-24 h-full flex flex-col items-center pt-8 pb-20 shrink-0">
            <span className="text-sm font-semibold text-slate-700 mb-3 whitespace-nowrap">
              Average AQI
            </span>
            <div className="relative h-[420px] flex">
              {/* Gradient Scale Box */}
              <div
                className="w-7 h-full shadow-[inset_0_0_2px_rgba(0,0,0,0.3)] rounded-sm"
                style={{
                  background:
                    "linear-gradient(to bottom, #8B2C27 0%, #D94928 20%, #F28533 28%, #F4B942 36%, #C5DF4B 44%, #86E255 52%, #4ED2C8 68%, #4BB2E6 76%, #5174D2 84%, #3C2D55 100%)",
                }}
              />
              {/* Tick Markers strictly positioned via percentages corresponding to actual AQI distribution */}
              <div className="absolute inset-y-0 -right-2 w-8">
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
      </div>
    </div>
  );
}

export default ConstructionVsComplaintsChart;
