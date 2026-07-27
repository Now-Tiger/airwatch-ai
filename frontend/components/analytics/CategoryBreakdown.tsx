// components/analytics/CategoryBreakdown.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData } from "@/lib/types";

interface CategoryBreakdownProps {
  data: AnalyticsData["category_breakdown"];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps): React.JSX.Element {
  const max = Math.max(...data.map((d) => d.complaints), 1);
  const sorted = [...data].sort((a, b) => b.complaints - a.complaints);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No category data for this window.</p>
        ) : (
          sorted.map((row) => (
            <div key={row.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{row.category}</span>
                <span className="text-muted-foreground">{row.complaints}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.complaints / max) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
