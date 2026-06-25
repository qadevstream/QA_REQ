'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ESTADO_QA_LABELS } from '@/lib/constants'
import type { DashboardMetrics } from '@/types/domain.types'

const COLORS = [
  '#94a3b8', // BACKLOG - slate
  '#60a5fa', // ANALISIS - blue
  '#818cf8', // ESTIMACION - indigo
  '#a78bfa', // PREPARACION - purple
  '#34d399', // EJECUCION - emerald
  '#2dd4bf', // PRUEBAS - teal
  '#fbbf24', // OBSERVADO - amber
  '#f87171', // BLOQUEADO - red
  '#10b981', // COMPLETADO - green
  '#6b7280', // CANCELADO - gray
]

interface ChartByStatusProps {
  data: DashboardMetrics['by_estado']
}

export function ChartByStatus({ data }: ChartByStatusProps) {
  const chartData = data.map((d) => ({
    name: ESTADO_QA_LABELS[d.estado] ?? d.estado,
    value: d.count,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
