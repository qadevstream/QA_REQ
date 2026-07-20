'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Upload, FileSpreadsheet, X, Download } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { bulkImportRegistroDiarioAction } from '@/server/actions/registroDiario'
import type { ImportRow } from '@/server/actions/registroDiario'
import type { Profile } from '@/types/domain.types'

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}
        className="w-full appearance-none rounded-md border border-input bg-white px-3 py-2 pr-8 text-sm
          outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  )
}

// Mapea distintos encabezados posibles (Excel del equipo) a nuestras claves internas.
const HEADER_MAP: Record<string, keyof ImportRow> = {
  'periodo': 'periodo',
  'iteracion': 'iteracion',
  'iteración': 'iteracion',
  'aplicacion': 'aplicativo',
  'aplicación': 'aplicativo',
  'codigo app': 'codigo_app',
  'código app': 'codigo_app',
  'tipo de solicitud': 'tipo_solicitud',
  'tipo solicitud': 'tipo_solicitud',
  'tipo de tarea': 'tipo_tarea',
  'tipo tarea': 'tipo_tarea',
  'horas ejecutadas': 'horas_ejecutadas',
  'horas ejecutada': 'horas_ejecutadas',
  'perfil': 'perfil',
  'nro de ticket': 'nro_ticket',
  'nro ticket': 'nro_ticket',
  'fecha de reporte': 'fecha_reporte',
  'fecha reporte': 'fecha_reporte',
  'observaciones': 'observaciones',
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase()
}

interface ImportRegistroDiarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analistas: Profile[]
  onImported: () => void
}

export function ImportRegistroDiarioDialog({
  open, onOpenChange, analistas, onImported,
}: ImportRegistroDiarioDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [qaId, setQaId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isParsing, setIsParsing] = useState(false)

  async function handleFile(file: File) {
    setIsParsing(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      // cellDates:true convierte celdas con formato de fecha a objetos Date
      // de JS en vez de números de serie de Excel (ej. 46136).
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

      // Si el archivo tiene una pestaña llamada "Data", esa es la fuente
      // de verdad. Si no existe, se usa la primera hoja del archivo.
      const dataSheetName = workbook.SheetNames.find((n) => n.trim().toLowerCase() === 'data')
      const sheetName = dataSheetName ?? workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      const mapped: ImportRow[] = raw.map((row) => {
        const out: ImportRow = {}
        for (const [header, value] of Object.entries(row)) {
          const key = HEADER_MAP[normalizeHeader(header)]
          if (!key) continue

          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            // Fecha real → YYYY-MM-DD, sin desfase de zona horaria.
            const y = value.getFullYear()
            const m = String(value.getMonth() + 1).padStart(2, '0')
            const d = String(value.getDate()).padStart(2, '0')
            ;(out as Record<string, unknown>)[key] = `${y}-${m}-${d}`
          } else {
            (out as Record<string, unknown>)[key] = String(value).trim()
          }
        }
        return out
      }).filter((r) => r.periodo)

      setRows(mapped)
      setFileName(file.name)
      if (mapped.length === 0) {
        toast.error('No se encontraron filas con columna "Período" reconocible.')
      }
    } catch {
      toast.error('No se pudo leer el archivo. Verifica que sea un .xlsx, .xls o .csv válido.')
    } finally {
      setIsParsing(false)
    }
  }

  function handleImport() {
    if (!qaId) { toast.error('Selecciona el analista destino.'); return }
    if (rows.length === 0) { toast.error('Carga primero un archivo con filas válidas.'); return }

    startTransition(async () => {
      const result = await bulkImportRegistroDiarioAction(rows, qaId)
      if (result.success) {
        toast.success(result.message)
        onImported()
        reset()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function reset() {
    setRows([])
    setFileName('')
    setQaId('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Genera y descarga la plantilla (.xlsx) con la hoja "Data", las cabeceras
  // que reconoce el importador y una fila de ejemplo para guiar el llenado.
  //
  // Usa xlsx-js-style (no 'xlsx') porque SheetJS Community Edition descarta
  // los estilos de celda al escribir — el fondo, color de fuente y alineación
  // solo existen en su versión Pro. La API es la misma; el fork sí los emite.
  async function handleDownloadTemplate() {
    try {
      const XLSX = await import('xlsx-js-style')
      const headers = [
        'Período', 'Iteración', 'Aplicación', 'Código App', 'Tipo de Solicitud',
        'Tipo de Tarea', 'Horas Ejecutadas', 'Perfil', 'Nro de Ticket', 'Fecha de Reporte', 'Observaciones',
      ]
      // La iteración va atada al período (ver PERIODOS en lib/constants):
      // Julio 2025 → iteración 6.
      const ejemplo = [
        'Julio 2025', 6, 'SFC', 'SFC', '[PRY] Requerimientos',
        '[GSTI] Ejecución de Pruebas', 8, 'EP11', '19535', '2025-07-15', 'Fila de ejemplo — reemplázala',
      ]
      const ws = XLSX.utils.aoa_to_sheet([headers, ejemplo])

      const headerStyle = {
        fill: { patternType: 'solid', fgColor: { rgb: '1F3864' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: { bottom: { style: 'thin', color: { rgb: '1F3864' } } },
      }
      const bodyStyle = { alignment: { horizontal: 'center', vertical: 'center' } }

      // Cabecera con fondo azul y letra blanca; todos los campos centrados.
      const range = XLSX.utils.decode_range(ws['!ref']!)
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
          if (cell) cell.s = R === 0 ? headerStyle : bodyStyle
        }
      }

      ws['!cols'] = headers.map(() => ({ wch: 20 }))
      ws['!rows'] = [{ hpt: 24 }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')
      XLSX.writeFile(wb, 'matriz_carga_registro_horas.xlsx')
    } catch {
      toast.error('No se pudo generar la plantilla.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl min-w-0">
        <DialogHeader>
          <DialogTitle>Importar Actividades desde Excel</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Columnas esperadas: Período, Iteración, Aplicación, Código App, Tipo de Solicitud, Tipo de Tarea, Horas Ejecutadas, Perfil, Nro de Ticket, Fecha de Reporte, Observaciones.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#0184EF] transition-colors hover:bg-blue-50"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar formato (matriz de carga)
          </button>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div>
            <Label>Analista destino *</Label>
            <div className="mt-1.5">
              <Select value={qaId} onChange={(e) => setQaId(e.target.value)}>
                <option value="">Seleccionar analista…</option>
                {analistas.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </Select>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Todas las filas importadas se asignarán a este analista.
            </p>
          </div>

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
                {isParsing ? 'Leyendo archivo…' : 'Click para seleccionar archivo'}
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
          </div>

          {rows.length > 0 && (
            <div className="max-h-56 w-full min-w-0 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[900px] text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Período</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Iter.</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Aplicación</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Código App</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Tipo Solicitud</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Tipo Tarea</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Horas</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Perfil</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Ticket</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Fecha Reporte</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 whitespace-nowrap">{r.periodo}</td>
                      <td className="px-2 py-1.5">{r.iteracion || '—'}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{r.aplicativo || '—'}</td>
                      <td className="px-2 py-1.5">{r.codigo_app || '—'}</td>
                      <td className="px-2 py-1.5">{r.tipo_solicitud || '—'}</td>
                      <td className="px-2 py-1.5">{r.tipo_tarea || '—'}</td>
                      <td className="px-2 py-1.5">{r.horas_ejecutadas || '—'}</td>
                      <td className="px-2 py-1.5">{r.perfil || '—'}</td>
                      <td className="px-2 py-1.5">{r.nro_ticket || '—'}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{r.fecha_reporte || '—'}</td>
                      <td className="px-2 py-1.5 max-w-[160px] truncate">{r.observaciones || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isPending || rows.length === 0}>
            {isPending ? 'Importando…' : `Importar ${rows.length || ''} actividades`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
