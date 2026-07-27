// components/analytics/SummaryCards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MessageSquareWarning } from "lucide-react";
import type { AnalyticsData } from "@/lib/types";

interface SummaryCardsProps {
  summary: AnalyticsData["summary"];
}

export function SummaryCards({ summary }: SummaryCardsProps): React.JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Complaints</p>
            <p className="text-xl font-bold text-foreground">{summary.total_complaints.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Urgent Complaints</p>
            <p className="text-xl font-bold text-foreground">{summary.urgent_complaints.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-sm font-bold">
            {Math.round(summary.avg_priority_score)}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Priority Score</p>
            <p className="text-xl font-bold text-foreground">{summary.avg_priority_score.toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
