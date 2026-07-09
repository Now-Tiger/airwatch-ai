"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Activity,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

// Import your API function and types
import { fetchHotspotsApi } from "@/lib/api";
import { AnalyticsData, AnalyticsApiResponse } from "@/lib/types";
import { containerVariants, itemVariants } from "@/lib/animations";

export default function CRMDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeWindow, setTimeWindow] = useState<string>("24h");

  // Hooking directly into the live API service layer
  useEffect(() => {
    async function getDashboardTelemetry() {
      setLoading(true);
      try {
        const res = (await fetchHotspotsApi(timeWindow)) as unknown as AnalyticsApiResponse;
        
        // Safely unwrap the payload
        if (res && res.success && res.data) {
          setData(res.data);
        } else if (res && res.data) {
          // Fallback just in case success boolean is omitted
          setData(res.data);
        } else {
          // Fallback if the API returns unwrapped data directly
          setData(res as unknown as AnalyticsData);
        }
      } catch (error) {
        console.error("Failed parsing live telemetry streams:", error);
      } finally {
        setLoading(false);
      }
    }

    getDashboardTelemetry();
  }, [timeWindow]);

  if (loading || !data || !data.summary) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-slate-50/50">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-slate-700" />
          Synchronizing live telemetry data...
        </div>
      </div>
    );
  }

  // Safe calculation using optional chaining
  const totalComplaints = data.summary?.total_complaints || 0;
  const urgentComplaints = data.summary?.urgent_complaints || 0;

  const urgentRatio =
    totalComplaints > 0
      ? Math.round((urgentComplaints / totalComplaints) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* --- Header Section --- */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Environmental Telemetry & Incidents
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Telemetry Sync:{" "}
              {new Date(data.generated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              • DPCC Real-time Pipeline
            </p>
          </div>

          {/* Minimalist Filter Controls */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/60 p-1 text-xs font-medium">
            {["12h", "24h", "7d", "30d"].map((win) => (
              <button
                key={win}
                onClick={() => setTimeWindow(win)}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  timeWindow === win
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {win.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* --- Top Row: KPI Cards --- */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {/* Total Volume */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Complaints
              </span>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data.summary.total_complaints}
              </span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                Active <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Aggregated across all monitored zones
            </p>
          </div>

          {/* Urgent Cases */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Urgent Action Required
              </span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight text-rose-600">
                {data.summary.urgent_complaints}
              </span>
              <span className="rounded-md bg-rose-100/80 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                {urgentRatio}% Response Ratio
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{ width: `${urgentRatio}%` }}
              />
            </div>
          </div>

          {/* Intensity Score */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Avg Intensity Score
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {data.summary.avg_priority_score}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / 100 severity
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-amber-600">
              Requires Operational Level Dispatch
            </p>
          </div>
        </motion.div>

        {/* --- Middle Row: Timeline & Categories --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Time-series Area Chart (2 Cols) */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs lg:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Incident Frequency & Surge Velocity
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time correlation tracking normal volume against
                  prioritized escalations
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Total
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Urgent
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.12}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorUrgent"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#f43f5e"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#f43f5e"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="time_bucket"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    name="Total Claims"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="urgent"
                    name="Urgent Alerts"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUrgent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category Breakdown (1 Col) */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Violation Vector Profile
              </h2>
              <p className="text-xs text-slate-500">
                Sorted structural categorization
              </p>

              <div className="mt-6 space-y-5">
                {data.category_breakdown.map((cat, idx) => {
                  const percentage =
                    data.summary.total_complaints > 0
                      ? Math.round(
                          (cat.complaints / data.summary.total_complaints) *
                            100
                        )
                      : 0;
                  const colors = [
                    "bg-blue-500",
                    "bg-slate-700",
                    "bg-amber-500",
                  ];

                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{cat.category}</span>
                        <span className="text-slate-500 font-semibold">
                          {cat.complaints}{" "}
                          <span className="text-slate-400 font-normal">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="text-[11px] leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-900">
                  Distribution Metric:
                </span>{" "}
                Primary infrastructure vulnerabilities contribute directly to
                systemic risk velocity profiles.
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- Bottom Row: Geographic Hotspots --- */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                Regional Hotspot Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Geographic monitoring zones sorted by priority density and case
              status profiles
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.top_hotspots}
                margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="area"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="complaints"
                  name="Complaints"
                  stackId="hotspot_stack"
                  fill="#cbd5e1"
                />
                <Bar
                  dataKey="urgent"
                  name="Urgent Cases"
                  stackId="hotspot_stack"
                  fill="#e11d48"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
