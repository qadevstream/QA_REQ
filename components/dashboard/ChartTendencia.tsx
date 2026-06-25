'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { TendenciaDiariaResult } from '@/server/usecases/getTendenciaDiaria'

interface Props {
  data: TendenciaDiariaResult
}

function fmtDay(iso: string) {
  const [, , dd] = iso.split('-')
  return `${parseInt(dd, 10)}`
}

export function ChartTendencia({ data }: Props) {
  const chartData = data.items.map(d => ({ dia: fmtDay(d.fecha), total: d.total, fecha: d.fecha }))

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base font-semibold">Tendencia de Ingreso de Tickets</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{data.periodoLabel}</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700">
              {data.totalPeriodo} req.
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTendencia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                fontSize: 12,
              }}
              formatter={(value: number) => [value, 'Requerimientos']}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload
                return item ? `Día ${label} (${item.fecha})` : `Día ${label}`
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradTendencia)"
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
