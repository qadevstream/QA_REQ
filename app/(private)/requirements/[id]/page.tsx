import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { HistoryTable } from '@/components/history/HistoryTable'
import { findRequirementById } from '@/server/repositories/requirements.repository'
import { findHistoryByRequirement } from '@/server/repositories/history.repository'
import { getCurrentUser } from '@/server/actions/auth'
import { formatDate } from '@/lib/utils'
import { TIPO_REQUERIMIENTO_LABELS } from '@/lib/constants'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const req = await findRequirementById(id)
  return { title: req ? `${req.codigo_requerimiento} · ${req.titulo}` : 'Requerimiento' }
}

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [req, history] = await Promise.all([
    findRequirementById(id),
    findHistoryByRequirement(id),
  ])

  if (!req) notFound()

  const iters = req.iterations ?? []

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/requirements">
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <span className="font-mono text-sm text-muted-foreground">{req.codigo_requerimiento}</span>
            <h1 className="text-xl font-bold mt-0.5">{req.titulo || 'Sin título'}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Datos padre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoField label="Aplicativo" value={req.aplicativo} />
                <InfoField label="Tipo" value={req.tipo_requerimiento ? TIPO_REQUERIMIENTO_LABELS[req.tipo_requerimiento] : '—'} />
                <InfoField label="ATI" value={req.ati_responsable ?? '—'} />
                <InfoField label="QA Responsable" value={req.responsable_qa?.full_name ?? '—'} />
                <InfoField label="QA Apoyo 1" value={req.qa_apoyo_1?.full_name ?? '—'} />
                <InfoField label="QA Apoyo 2" value={req.qa_apoyo_2?.full_name ?? '—'} />
              </div>
              {req.descripcion && (
                <>
                  <Separator />
                  <InfoField label="Descripción" value={req.descripcion} vertical />
                </>
              )}
            </CardContent>
          </Card>

          {/* Iteraciones */}
          {iters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Iteraciones ({iters.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {iters.map((it) => (
                  <div key={it.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                        {it.iteracion}
                      </span>
                      <StatusBadge estado={it.estado_qa as any} />
                      <span className="text-xs text-slate-500">Avance: <strong>{it.avance_porcentaje}%</strong></span>
                      <span className="text-xs text-slate-500">H. Est: <strong>{it.horas_estimadas}</strong></span>
                      <span className="text-xs text-slate-500">H. Real: <strong>{it.horas_reales}</strong></span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      {it.fecha_asignacion && <span>F. Asig: {formatDate(it.fecha_asignacion)}</span>}
                      {it.fecha_entrega_planificada && <span>F. Ent. Plan: {formatDate(it.fecha_entrega_planificada)}</span>}
                      {it.fecha_entrega_real && <span>F. Ent. Real: {formatDate(it.fecha_entrega_real)}</span>}
                    </div>
                    {it.observaciones_estado && (
                      <p className="text-xs text-slate-600 border-t border-slate-200 pt-2">{it.observaciones_estado}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="historial">
            <TabsList>
              <TabsTrigger value="historial">Historial ({history.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="historial" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  <HistoryTable history={history} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Resumen métricas última iteración */}
        {iters.length > 0 && (() => {
          const last = iters[iters.length - 1]
          const cpTotal = last.cp_ok + last.cp_fallo
          const pctOk = cpTotal > 0 ? Math.round((last.cp_ok / cpTotal) * 100) : 0
          return (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Casos de Prueba (Iter. {last.iteracion})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
                    <div className="h-full bg-emerald-500" style={{ width: `${pctOk}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <InfoField label="Total" value={String(cpTotal)} />
                    <InfoField label="OK" value={String(last.cp_ok)} />
                    <InfoField label="Fallo" value={String(last.cp_fallo)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Defectos (Iter. {last.iteracion})
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-muted-foreground">QA</p><p className="text-xl font-bold">{last.defectos_qa}</p></div>
                  <div><p className="text-xs text-muted-foreground">UAT</p><p className="text-xl font-bold">{last.defectos_uat}</p></div>
                  <div><p className="text-xs text-muted-foreground">Prod.</p><p className="text-xl font-bold">{last.defectos_produccion}</p></div>
                </CardContent>
              </Card>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function InfoField({ label, value, vertical = false }: { label: string; value: React.ReactNode; vertical?: boolean }) {
  return (
    <div className={vertical ? 'col-span-full' : ''}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
