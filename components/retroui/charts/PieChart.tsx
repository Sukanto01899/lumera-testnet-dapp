"use client"

import { cn } from "@/lib/utils"
import React from "react"

interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, unknown>[]
  dataKey: string
  nameKey: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  className?: string
  innerRadius?: number
}

const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  (
    {
      data = [],
      dataKey,
      nameKey,
      colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"],
      valueFormatter = (value: number) => value.toString(),
      className,
      innerRadius,
      ...props
    },
    ref
  ) => {
    const size = 220
    const radius = innerRadius ?? 80
    const circumference = 2 * Math.PI * radius
    const total = data.reduce((sum, item) => sum + Number(item[dataKey] ?? 0), 0)
    let cumulative = 0

    return (
      <div ref={ref} className={cn("w-full flex flex-col items-center gap-4", className)} {...props}>
        <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label="Portfolio breakdown">
          <g transform="translate(110,110) rotate(-90)">
            {total === 0 ? (
              <circle
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={20}
              />
            ) : (
              data.map((entry, index) => {
                const value = Number(entry[dataKey] ?? 0)
                const pct = value / total
                const dash = pct * circumference
                const offset = -cumulative * circumference
                cumulative += pct
                return (
                  <circle
                    key={`${entry[nameKey as string]}-${index}`}
                    r={radius}
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth={20}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                  />
                )
              })
            )}
          </g>
        </svg>

        <div className="flex flex-col gap-2">
          {data.map((entry, index) => (
            <div key={`${entry[nameKey as string]}-legend`} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="font-medium">{String(entry[nameKey])}</span>
              <span className="text-muted-foreground">
                {valueFormatter(Number(entry[dataKey] ?? 0))}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

PieChart.displayName = "PieChart"

export { PieChart, type PieChartProps }
