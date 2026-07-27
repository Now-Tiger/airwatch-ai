// components/analytics/Timeline.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData } from "@/lib/types";

interface TimelineProps {
  data: AnalyticsData["timeline"];
}

function formatBucketLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Timeline({ data }: TimelineProps): React.JSX.Element {
  const max = Math.max(...data.map((d) => d.complaints), 1);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Complaint Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded for this window.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {data.map((bucket) => (
              <div key={bucket.time_bucket} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-32 w-full items-end overflow-hidden rounded-t-sm bg-secondary">
                  <motion.div
                    className="w-full bg-primary"
                    initial={{ height: 0 }}
                    animate={{ height: `${(bucket.complaints / max) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {bucket.urgent > 0 && (
                    <motion.div
                      className="absolute bottom-0 w-full bg-red-600"
                      initial={{ height: 0 }}
                      animate={{ height: `${(bucket.urgent / max) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {formatBucketLabel(bucket.time_bucket)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Total
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600" /> Urgent
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
