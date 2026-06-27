import * as React from "react";
import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ChartPoint = {
  label: string;
  value: number;
};

function getPoints(data: ChartPoint[], width: number, height: number) {
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return data
    .map((item, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = height - ((item.value - min) / range) * height;

      return `${x},${y}`;
    })
    .join(" ");
}

function SparklineChart({
  className,
  data,
  height = 72,
}: {
  className?: string;
  data: ChartPoint[];
  height?: number;
}) {
  return (
    <svg
      aria-label="Trend chart"
      className={cn("h-[72px] w-full overflow-visible", className)}
      role="img"
      viewBox={`0 0 240 ${height}`}
    >
      <polyline
        fill="none"
        points={getPoints(data, 240, height)}
        stroke="var(--accent)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((item) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={item.label}>
          <div
            className="bg-info/20 w-full rounded-sm transition-all duration-300"
            style={{ height: `${Math.max((item.value / max) * 100, 8)}%` }}
          >
            <div className="bg-info h-full rounded-sm" />
          </div>
          <span className="text-muted-foreground truncate text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricChartCard({
  data,
  delta,
  label,
  value,
}: {
  data: ChartPoint[];
  delta: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <Badge variant="success">
          <TrendingUp aria-hidden="true" className="size-3.5" />
          {delta}
        </Badge>
      </CardHeader>
      <CardContent>
        <SparklineChart data={data} />
      </CardContent>
    </Card>
  );
}

export { BarChart, MetricChartCard, SparklineChart };
