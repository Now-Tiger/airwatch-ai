"use client";

import React from "react";
import {
  Sankey,
  Tooltip,
  ResponsiveContainer,
  type SankeyNodeProps,
  type SankeyLinkProps,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AQINode {
  name: string;
  category?: string;
  color?: string;
}

interface AQILink {
  source: number;
  target: number;
  value: number;
}

interface AQISankeyData {
  nodes: AQINode[];
  links: AQILink[];
}

interface AQINode {
  name: string;
  category?: string;
  color?: string;
}

interface SankeyLinkPayload {
  source: AQINode;
  target: AQINode;
  value: number;
}

interface TooltipGraphicalPayload {
  payload: SankeyLinkPayload;
  name: string;
  value: number;
}

interface TooltipEntry {
  payload: TooltipGraphicalPayload;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

interface ExtendedSankeyNodeProps extends SankeyNodeProps {
  onMouseEnter?: React.MouseEventHandler<SVGGElement>;
  onMouseLeave?: React.MouseEventHandler<SVGGElement>;
}

interface ExtendedSankeyLinkProps extends Omit<
  SankeyLinkProps,
  "source" | "target"
> {
  onMouseEnter?: React.MouseEventHandler<SVGPathElement>;
  onMouseLeave?: React.MouseEventHandler<SVGPathElement>;
  source?: AQINode | number;
  target?: AQINode | number;
}

const AQI_COLORS: Record<string, string> = {
  Good: "#2ECC71",
  Satisfactory: "#8BC34A",
  Moderate: "#F1C40F",
  Poor: "#F39C12",
  "Very Poor": "#E74C3C",
  Severe: "#8E44AD",
};

const leftNodes = [
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
];

const rightNodes = [
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
];

const transitions = [
  ["Good", "Good", 82],
  ["Good", "Satisfactory", 18],
  ["Satisfactory", "Good", 26],
  ["Satisfactory", "Satisfactory", 105],
  ["Satisfactory", "Moderate", 58],
  ["Moderate", "Satisfactory", 35],
  ["Moderate", "Moderate", 148],
  ["Moderate", "Poor", 72],
  ["Poor", "Moderate", 24],
  ["Poor", "Poor", 132],
  ["Poor", "Very Poor", 63],
  ["Very Poor", "Poor", 16],
  ["Very Poor", "Very Poor", 116],
  ["Very Poor", "Severe", 71],
  ["Severe", "Very Poor", 48],
  ["Severe", "Severe", 94],
] as const;

const nodes = [
  ...leftNodes.map((name) => ({
    name,
    category: "previous-day",
    color: AQI_COLORS[name],
  })),

  ...rightNodes.map((name) => ({
    name,
    category: "next-day",
    color: AQI_COLORS[name],
  })),
];

const links = transitions.map(([from, to, value]) => ({
  source: leftNodes.indexOf(from),
  target: rightNodes.indexOf(to) + leftNodes.length,
  value,
}));

const total = transitions.reduce((s, [, , v]) => s + v, 0);
const largest = [...transitions].sort((a, b) => b[2] - a[2])[0];
const data: AQISankeyData = { nodes, links };

const getCategoryColor = (name: string): string => {
  return AQI_COLORS[name.trim()] || "#CBD5E1";
};

const CustomNode = ({
  x,
  y,
  width,
  height,
  index,
  payload,
  onMouseEnter,
  onMouseLeave,
}: ExtendedSankeyNodeProps): React.ReactElement => {
  const node = payload as AQINode;
  const isLeft = (index ?? 0) < 6;
  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getCategoryColor(node.name)}
        rx={2}
      />
      <text
        x={isLeft ? (x ?? 0) + (width ?? 0) + 10 : (x ?? 0) - 10}
        y={(y ?? 0) + (height ?? 0) / 2}
        dominantBaseline="middle"
        textAnchor={isLeft ? "start" : "end"}
        className="fill-slate-800"
        fontSize={13}
        fontWeight={600}
      >
        {node.name.trim()}
      </text>
    </g>
  );
};

const CustomLink = (props: ExtendedSankeyLinkProps): React.ReactElement => {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
    onMouseEnter,
    onMouseLeave,
    source,
  } = props;

  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  const sourceName =
    typeof source === "object" && source !== null && "name" in source
      ? String((source as AQINode).name)
      : typeof source === "number" && data.nodes[source]
        ? data.nodes[source].name
        : "";

  const stroke = getCategoryColor(sourceName);

  return (
    <path
      key={index}
      d={`M${sourceX},${sourceY}
          C${sourceControlX},${sourceY}
          ${targetControlX},${targetY}
          ${targetX},${targetY}`}
      fill="none"
      stroke={stroke}
      strokeOpacity={isHovered ? 0.9 : 0.4}
      strokeWidth={Math.max(linkWidth || 1, 1)}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (onMouseEnter) {
          onMouseEnter(e);
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (onMouseLeave) {
          onMouseLeave(e);
        }
      }}
      className="cursor-pointer transition-all duration-200"
    />
  );
};

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps): React.ReactElement | null => {
  if (!active || !payload?.length) return null;

  // Recharts Sankey stores the actual link object one level deeper
  const item = payload[0]?.payload?.payload;

  if (!item) return null;

  const sourceName =
    typeof item.source === "object" && item.source ? item.source.name : "";

  const targetName =
    typeof item.target === "object" && item.target ? item.target.name : "";

  const transitionValue = item.value ?? 0;

  return (
    <div className="rounded border border-gray-800 bg-green-200 px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-900">
        &quot;{sourceName}&quot; → &quot;{targetName}&quot;
      </p>

      <p className="mt-1 text-[11px] text-slate-700">
        Transitions: {transitionValue}
      </p>
    </div>
  );
};

export function AqiTransitionSankeyChart(): React.ReactElement {
  return (
    <Card className="w-full mx-auto relative font-sans bg-white border-white border-0 shadow-none">
      <CardHeader className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52 pb-8">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Delhi AQI Category Transition Analysis
        </CardTitle>

        <CardDescription className="text-gray-900 text-sm leading-relaxed mt-2 max-w-4xl">
          Previous Day → Next Day
        </CardDescription>
      </CardHeader>

      {/* Summary Cards */}
      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Total Daily Transitions
              </p>

              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">
                {total}
              </h2>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Most Frequent Transition
              </p>

              <h2 className="mt-2 text-lg sm:text-xl font-semibold text-slate-900">
                <span
                  style={{
                    color: AQI_COLORS[largest[0]],
                  }}
                >
                  {largest[0]}
                </span>

                {" → "}

                <span
                  style={{
                    color: AQI_COLORS[largest[1]],
                  }}
                >
                  {largest[1]}
                </span>
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {largest[2]} observations
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      {/* Sankey */}
      <CardContent className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-52">
        {/* Horizontal scroll only on very small devices */}
        <div className="overflow-x-auto">
          <div className="min-w-175 md:min-w-0">
            <div className="h-130 sm:h-155 lg:h-180 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={data}
                  nodeWidth={18}
                  nodePadding={18}
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                  node={(props: SankeyNodeProps) => (
                    <CustomNode {...(props as ExtendedSankeyNodeProps)} />
                  )}
                  link={(props: SankeyLinkProps) => (
                    <CustomLink {...(props as ExtendedSankeyLinkProps)} />
                  )}
                >
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                </Sankey>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AQI Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {Object.entries(AQI_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full border border-slate-300"
                style={{ backgroundColor: color }}
              />

              <span className="text-sm font-medium" style={{ color }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
