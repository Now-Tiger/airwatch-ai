// components/analytics/Dashboard.tsx
"use client";

import { ConstructionActivityBubbleChart } from "@/components/analytics/ConstructionActivityBubbleChart";
import { ConstructionVsComplaintsChart } from "@/components/analytics/ConstructionComplaintsChart";
import { PlumeSensorLagHeatmap } from "@/components/analytics/PlumnSensorLag";
import { MicroHotspotMapComponent } from "@/components/analytics/MicroHotspotMap";
import { GrapEfficacyApportionmentChart } from "@/components/analytics/GrapEfficacyApportionment";
import { IndustrialRiskMatrixChart } from "@/components/analytics/IndustrialChronicOffender";
import { ComplaintAqiTrendChart } from "@/components/analytics/ComplaintAqiTrend";
import { AqiTransitionSankeyChart } from "@/components/analytics/AqiTransitionSankeyV2";

export default function Dashboard(): React.JSX.Element {
  return (
    <div className="">
      <MicroHotspotMapComponent />
      <GrapEfficacyApportionmentChart />
      <PlumeSensorLagHeatmap />
      <IndustrialRiskMatrixChart />
      <ComplaintAqiTrendChart />
      <AqiTransitionSankeyChart />

      <ConstructionActivityBubbleChart />
      <ConstructionVsComplaintsChart />
    </div>
  );
}
