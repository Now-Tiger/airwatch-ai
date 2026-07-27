"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
} from "../charts/sankey";

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

const recovered = transitions
  .filter(([from, to]) => leftNodes.indexOf(from) > rightNodes.indexOf(to))
  .reduce((s, [, , v]) => s + v, 0);

const worsened = transitions
  .filter(([from, to]) => leftNodes.indexOf(from) < rightNodes.indexOf(to))
  .reduce((s, [, , v]) => s + v, 0);

const stable = transitions
  .filter(([from, to]) => from === to)
  .reduce((s, [, , v]) => s + v, 0);

const data = {
  nodes,
  links,
};

export function AQITransitionSankey() {
  return (
    <Card className="w-full rounded-xl border shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          Delhi AQI Category Transition Analysis
        </CardTitle>

        <p className="text-center text-muted-foreground">
          Previous Day → Next Day
        </p>
      </CardHeader>

      <CardContent>
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Total Daily Transitions
              </p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">
                Most Frequent Transition
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {largest[0]} → {largest[1]}
              </h2>

              <p className="text-muted-foreground">{largest[2]} observations</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>🟢 Improved</span>
                  <span>{recovered}</span>
                </div>

                <div className="flex justify-between">
                  <span>🟡 Stable</span>
                  <span>{stable}</span>
                </div>

                <div className="flex justify-between">
                  <span>🔴 Worsened</span>
                  <span>{worsened}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <SankeyChart
            data={{
              ...data,
              nodes: data.nodes.map((node) => ({
                ...node,
                category: node.category as "source" | "landing" | "outcome",
              })),
            }}
            aspectRatio="16 / 9"
          >
            <SankeyLink strokeOpacity={0.35} />

            <SankeyNode lineCap={8} labelOrientation="horizontal" />

            <SankeyTooltip />
          </SankeyChart>
        </div>

        <div className="mt-8 rounded-lg border bg-muted/40 p-5">
          <h3 className="mb-4 text-lg font-semibold">Executive Insights</h3>

          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            <li>• Wide flows indicate the most frequent AQI transitions.</li>

            <li>
              • Persistent Severe → Severe flow indicates prolonged pollution
              episodes.
            </li>

            <li>
              • Recovery flows represent improvement after pollution control
              measures.
            </li>

            <li>
              • Compare yearly transition diagrams to evaluate policy
              effectiveness.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
