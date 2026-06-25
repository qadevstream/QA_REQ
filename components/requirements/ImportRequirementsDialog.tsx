'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { bulkImportRequirementsAction } from '@/server/actions/requirements'
import type { RequirementImportRow, OmittedRow } from '@/server/actions/requirements'

// Mapea los encabezados reales del Excel del equipo a nuestras claves internas.
const HEADER_MAP: Record<string, keyof RequirementImportRow> = {
  // Nro. Req
  'nro. req': 'nro_req', 'nro req': 'nro_req', 'nro.req': 'nro_req',
  // Título
  'título': 'titulo', 'titulo': 'titulo', 'title': 'titulo',
  // Descripción
  'descripción': 'descripcion', 'descripcion': 'descripcion',
  // ATI
  'ati': 'ati_responsable', 'ati responsable': 'ati_responsable', 'responsable ati': 'ati_responsable',
  // Tipo
  'tipo': 'tipo', 'tipo requerimiento': 'tipo', 'tipo req': 'tipo',
  // Prioridad
  'prioridad': 'prioridad',
  // Fechas
  'f. asig.': 'fecha_asignacion', 'f.asig.': 'fecha_asignacion',
  'fecha asignación': 'fecha_asignacion', 'fecha asignacion': 'fecha_asignacion',
  'f. ent. est.': 'fecha_entrega_estimacion', 'f.ent.est.': 'fecha_entrega_estimacion',
  'fecha entrega estimación': 'fecha_entrega_estimacion', 'fecha entrega estimacion': 'fecha_entrega_estimacion',
  'f. apr. est.': 'fecha_aprobacion_estimacion', 'f.apr.est.': 'fecha_aprobacion_estimacion',
  'fecha aprobación estimación': 'fecha_aprobacion_estimacion', 'fecha aprobacion estimacion': 'fecha_aprobacion_estimacion',
  'f. ent. plan.': 'fecha_entrega_planificada', 'f.ent.plan.': 'fecha_entrega_planificada',
  'fecha de entrega planificada': 'fecha_entrega_planificada', 'fecha entrega planificada': 'fecha_entrega_planificada',
  'f. ent. real': 'fecha_entrega_real', 'f.ent.real': 'fecha_entrega_real',
  'fecha de entrega real': 'fecha_entrega_real', 'fecha entrega real': 'fecha_entrega_real',
  'f. ini. plan.': 'fecha_inicio_planificada', 'f.ini.plan.': 'fecha_inicio_planificada',
  'fecha inicio atención planificada': 'fecha_inicio_planificada', 'fecha inicio atencion planificada': 'fecha_inicio_planificada',
  'f. ini. real': 'fecha_inicio_real', 'f.ini.real': 'fecha_inicio_real',
  'fecha inicio atención real': 'fecha_inicio_real', 'fecha inicio atencion real': 'fecha_inicio_real',
  // Aplicativo
  'aplicativo': 'aplicativo',
  // QA
  'qa resp.': 'qa_responsable', 'qa responsable': 'qa_responsable', 'qa resp': 'qa_responsable',
  'qa apoyo 1': 'qa_apoyo_1', 'apoyo 1': 'qa_apoyo_1',
  'qa apoyo 2': 'qa_apoyo_2', 'apoyo 2': 'qa_apoyo_2',
  'qa apoyo 3': 'qa_apoyo_3', 'apoyo 3': 'qa_apoyo_3',
  // Avance
  'avance (%)': 'avance_porcentaje', 'avance': 'avance_porcentaje', 'avance%': 'avance_porcentaje',
  // Estado
  'estado qa': 'estado_qa',
  'estado req.': 'estado_req', 'estado req': 'estado_req', 'estado del req': 'estado_req',
  // Iter
  'iter': 'iteracion', 'iter.': 'iteracion', 'iteración': 'iteracion', 'iteracion': 'iteracion',
  // CP
  'cp tot.': 'cp_total', 'cp total': 'cp_total', 'cp tot': 'cp_total',
  'cp ok': 'cp_ok',
  'cp fal.': 'cp_fallo', 'cp fallo': 'cp_fallo',
  // Horas
  'h. est.': 'horas_estimadas', 'h.est.': 'horas_estimadas', 'total horas estimadas': 'horas_estimadas',
  'h. real': 'horas_reales', 'h.real': 'horas_reales', 'total horas reales': 'horas_reales',
  // Defectos
  'def. qa': 'defectos_qa', 'def.qa': 'defectos_qa', 'defectos en qa': 'defectos_qa',
  'def. uat': 'defectos_uat', 'def.uat': 'defectos_uat', 'defectos en uat': 'defectos_uat',
  'def. prod.': 'defectos_produccion', 'def.prod.': 'defectos_produccion',
  'defectos en producción': 'defectos_produccion', 'defectos en produccion': 'defectos_produccion',
  // Evidencias y observaciones
  'evidencias': 'rutas_evidencias', 'rutas de estimación y evidencias de pruebas': 'rutas_evidencias',
  'rutas de estimacion y evidencias de pruebas': 'rutas_evidencias',
  'observaciones': 'observaciones_estado', 'observaciones estado tck': 'observaciones_estado',
  'observaciones estado': 'observaciones_estado',
}

function normalizeHeader(h: string): string {
  return h.replace(/\s+/g, ' ').trim().toLowerCase()
}

const PREVIEW_COLUMNS: { key: keyof RequirementImportRow; label: string }[] = [
  { key: 'nro_req', label: 'Nro. Req' },
  { key: 'aplicativo', label: 'Aplicativo' },
  { key: 'qa_responsable', label: 'QA Responsable' },
  { key: 'estado_qa', label: 'Estado QA' },
  { key: 'estado_req', label: 'Estado del Req' },
  { key: 'avance_porcentaje', label: 'Avance %' },
  { key: 'iteracion', label: 'Iter.' },
  { key: 'cp_total', label: 'CP' },
  { key: 'cp_ok', label: 'CP OK' },
  { key: 'cp_fallo', label: 'CP Fallo' },
  { key: 'horas_estimadas', label: 'H. Estimadas' },
  { key: 'horas_reales', label: 'H. Reales' },
  { key: 'fecha_asignacion', label: 'F. Asignación' },
  { key: 'fecha_entrega_planificada', label: 'F. Entrega Plan.' },
  { key: 'fecha_entrega_real', label: 'F. Entrega Real' },
  { key: 'defectos_qa', label: 'Def. QA' },
  { key: 'defectos_uat', label: 'Def. UAT' },
  { key: 'defectos_produccion', label: 'Def. Prod' },
  { key: 'observaciones_estado', label: 'Observaciones' },
]

interface ImportRequirementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ImportRequirementsDialog({ open, onOpenChange, onImported }: ImportRequirementsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<RequirementImportRow[]>([])
  const [isPending, startTransition] = useTransition()
  const [isParsing, setIsParsing] = useState(false)
  const [omitidos, setOmitidos] = useState<OmittedRow[]>([])

  function mapSheetRows(raw: Record<string, unknown>[]): RequirementImportRow[] {
    return raw.map((row) => {
      const out: RequirementImportRow = {}
      for (const [header, value] of Object.entries(row)) {
        const key = HEADER_MAP[normalizeHeader(header)]
        if (!key) continue

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          const y = value.getFullYear()
          const m = String(value.getMonth() + 1).padStart(2, '0')
          const d = String(value.getDate()).padStart(2, '0')
          ;(out as Record<string, unknown>)[key] = `${y}-${m}-${d}`
        } else {
          (out as Record<string, unknown>)[key] = String(value).trim()
        }
      }
      return out
    }).filter((r) => r.nro_req)
  }

  async function handleFile(file: File) {
    setIsParsing(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

      const dataSheetName = workbook.SheetNames.find((n) => n.trim().toLowerCase() === 'data')
      const sheetName = dataSheetName ?? workbook.SheetNames[0]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })

      const mapped = mapSheetRows(raw)
      setRows(mapped)
      setFileName(file.name)
      if (mapped.length === 0) {
        toast.error('No se encontraron filas con columna "Nro. Req" reconocible.')
      }
    } catch {
      toast.error('No se pudo leer el archivo. Verifica que sea un .xlsx, .xls o .csv válido.')
    } finally {
      setIsParsing(false)
    }
  }

  function handleImport() {
    if (rows.length === 0) { toast.error('Carga primero un archivo con filas válidas.'); return }

    startTransition(async () => {
      const result = await bulkImportRequirementsAction(rows)
      if (result.success) {
        if (result.message) toast.success(result.message)
        onImported()
        if (result.data.omitidos.length > 0) {
          setOmitidos(result.data.omitidos)
          setRows([])
          setFileName('')
          if (fileInputRef.current) fileInputRef.current.value = ''
        } else {
          reset()
          onOpenChange(false)
        }
      } else {
        toast.error(result.error)
      }
    })
  }

  function reset() {
    setRows([])
    setFileName('')
    setOmitidos([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-w-0">
        <DialogHeader>
          <DialogTitle>Importar Requerimientos desde Excel</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Columnas esperadas: Nro. Req, Fecha Asignación, Fecha Entrega Estimación, Fecha Aprobación Estimación,
            Aplicativo, QA Responsable, Avance (%), Estado QA, Estado del Req, Fecha de Entrega Planificada/Real,
            Iteración, CP, CP OK, CP Fallo, Total Horas Estimadas/Reales, Fecha Inicio Atención Planificada/Real,
            Defectos en QA/UAT/Producción, Rutas de Estimación y Evidencias, Observaciones estado tck.
          </p>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div>
            <Label>Archivo Excel / CSV *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {!fileName ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 hover:border-[#0184EF] hover:text-[#0184EF] transition-colors disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {isParsing ? 'Leyendo archivo…' : 'Click para seleccionar archivo (busca la pestaña "Data")'}
              </button>
            ) : (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  {fileName} · {rows.length} fila{rows.length !== 1 ? 's' : ''} detectada{rows.length !== 1 ? 's' : ''}
                </div>
                <button onClick={reset} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              No olvides incluir un "Título" propio luego si lo necesitas — por defecto se usa el Nro. Req.
            </p>
          </div>

          {rows.length > 0 && (
            <div className="max-h-72 w-full min-w-0 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[1400px] text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {PREVIEW_COLUMNS.map((c) => (
                      <th key={c.key} className="px-2 py-1.5 text-left font-semibold text-slate-500 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {PREVIEW_COLUMNS.map((c) => (
                        <td key={c.key} className="px-2 py-1.5 whitespace-nowrap">{r[c.key] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {omitidos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-700">
                {omitidos.length} fila{omitidos.length !== 1 ? 's' : ''} no importada{omitidos.length !== 1 ? 's' : ''}:
              </p>
              <div className="max-h-56 overflow-auto rounded-lg border border-amber-200 bg-amber-50">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-amber-100">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-amber-800">Nro. Req</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-amber-800">Aplicativo (Excel)</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-amber-800">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {omitidos.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 font-mono font-semibold">{r.nro_req}</td>
                        <td className="px-3 py-1.5">{r.aplicativo}</td>
                        <td className="px-3 py-1.5 text-amber-700">{r.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Los requerimientos son únicos por número. Si un ticket tiene múltiples iteraciones o avances, regístralos en la sección <strong>Actividades → Registro Diario</strong>.
                Los omitidos por aplicativo no reconocido deben corregirse en el catálogo o en el Excel.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
            {omitidos.length > 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          {rows.length > 0 && (
            <Button onClick={handleImport} disabled={isPending}>
              {isPending ? 'Importando…' : `Importar ${rows.length} requerimientos`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
