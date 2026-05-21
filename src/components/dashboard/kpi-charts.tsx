"use client";

import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(BarController, BarElement, CategoryScale, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);

type ChartDatum = {
  label: string;
  value: number;
};

function KpiChart({ data, title, type = "bar" }: { data: ChartDatum[]; title: string; type?: "bar" | "line" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, {
      type,
      data: {
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: title,
            data: data.map((item) => item.value),
            backgroundColor: type === "bar" ? "rgba(50, 18, 184, 0.72)" : "rgba(50, 18, 184, 0.18)",
            borderColor: "#3212b8",
            borderWidth: 2,
            tension: 0.35,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });

    return () => chart.destroy();
  }, [data, title, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCharts({
  assetByCategory,
  assetByLocation,
  assetByStatus,
  disposalTrend,
  movementTrend,
}: {
  assetByCategory: ChartDatum[];
  assetByLocation: ChartDatum[];
  assetByStatus: ChartDatum[];
  disposalTrend: ChartDatum[];
  movementTrend: ChartDatum[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <KpiChart title="Asset per Status" data={assetByStatus} />
      <KpiChart title="Asset per Category" data={assetByCategory} />
      <KpiChart title="Asset per Location" data={assetByLocation} />
      <KpiChart title="Movement per Bulan" data={movementTrend} type="line" />
      <div className="xl:col-span-2">
        <KpiChart title="Disposal Trend" data={disposalTrend} type="line" />
      </div>
    </div>
  );
}
