"use client"

import { useState } from "react"
import { Upload, FileUp, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"

interface GeometryUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectCode: string
  onUploadSuccess?: () => void
}

interface UploadResult {
  status: "success" | "error" | "partial_success"
  message: string
  dry_run?: boolean
  created?: number
  updated?: number
  skipped?: number
  total_features?: number
  errors?: Array<{feature: number, error: string}>
  warnings?: Array<{feature: number, warning: string}>
  preview?: Array<{
    numero: number
    action: string
    geom_type: string
    longitud_km: number
    area_km2?: number
    alcance?: string
    zona?: string
    tipo_terreno?: string
  }>
}

export function GeometryUploadModal({
  open,
  onOpenChange,
  projectCode,
  onUploadSuccess,
}: GeometryUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const acceptedFormats = ".kml,.geojson,.json,.zip,.shp"
  const maxSizeMB = 50

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    // Validate file size
    const sizeMB = selectedFile.size / 1024 / 1024
    if (sizeMB > maxSizeMB) {
      setResult({
        status: "error",
        message: `El archivo excede el tamaño máximo de ${maxSizeMB}MB`,
      })
      return
    }

    // Validate file extension
    const ext = selectedFile.name.toLowerCase().split(".").pop()
    const validExts = ["kml", "geojson", "json", "zip", "shp"]
    if (!ext || !validExts.includes(ext)) {
      setResult({
        status: "error",
        message: "Formato de archivo no válido. Use KML, GeoJSON, SHP (ZIP), o JSON",
      })
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setResult(null)
    setShowPreview(false)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const data = await api.uploadProjectGeometries(projectCode, file, true)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setResult(data)
      setShowPreview(true)
    } catch (error) {
      setResult({
        status: "error",
        message: error instanceof Error ? error.message : "Error de conexión con el servidor",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setResult(null)
    setShowPreview(false)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const data = await api.uploadProjectGeometries(projectCode, file, false)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setResult(data)
      
      // Call success callback after a short delay
      setTimeout(() => {
        onUploadSuccess?.()
      }, 1500)
    } catch (error) {
      setResult({
        status: "error",
        message: error instanceof Error ? error.message : "Error de conexión con el servidor",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setUploadProgress(0)
    onOpenChange(false)
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop()
    switch (ext) {
      case "kml":
        return "🗺️"
      case "geojson":
      case "json":
        return "📍"
      case "zip":
      case "shp":
        return "📦"
      default:
        return "📄"
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Geometría de Unidades Funcionales
          </DialogTitle>
          <DialogDescription>
            Sube un archivo KML, Shapefile (ZIP), o GeoJSON con las geometrías de las unidades funcionales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium mb-2">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Formatos: KML, GeoJSON, Shapefile (ZIP) • Máx: {maxSizeMB}MB
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={acceptedFormats}
                onChange={handleFileInputChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Seleccionar Archivo
              </Button>
            </div>
          )}

          {/* Selected File */}
          {file && !result && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cargando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Alert
                variant={result.status === "error" ? "destructive" : "default"}
              >
                {result.status === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <AlertDescription>
                  <p className="font-medium">{result.message}</p>
                  <div className="mt-2 text-sm space-y-1">
                    {result.total_features !== undefined && (
                      <p>📊 Total de geometrías: {result.total_features}</p>
                    )}
                    {result.created !== undefined && result.created > 0 && (
                      <p>✓ Creadas: {result.created} unidades funcionales</p>
                    )}
                    {result.updated !== undefined && result.updated > 0 && (
                      <p>✓ Actualizadas: {result.updated} unidades funcionales</p>
                    )}
                    {result.skipped !== undefined && result.skipped > 0 && (
                      <p>⚠️ Omitidas: {result.skipped} unidades funcionales</p>
                    )}
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-red-600">Errores:</p>
                      <ul className="list-disc list-inside">
                        {result.errors.slice(0, 5).map((error, idx) => (
                          <li key={idx} className="text-xs">
                            Feature {error.feature}: {error.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-yellow-600">Advertencias:</p>
                      <ul className="list-disc list-inside">
                        {result.warnings.slice(0, 5).map((warning, idx) => (
                          <li key={idx} className="text-xs">
                            Feature {warning.feature}: {warning.warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Preview Table */}
              {showPreview && result.preview && result.preview.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-sm">
                    Previsualización de cambios
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">UF</th>
                          <th className="px-2 py-1 text-left">Acción</th>
                          <th className="px-2 py-1 text-left">Tipo</th>
                          <th className="px-2 py-1 text-right">Longitud (km)</th>
                          <th className="px-2 py-1 text-left">Alcance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-1">{item.numero}</td>
                            <td className="px-2 py-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.action === 'create' ? 'Crear' : 'Actualizar'}
                              </span>
                            </td>
                            <td className="px-2 py-1">{item.geom_type}</td>
                            <td className="px-2 py-1 text-right">{item.longitud_km.toFixed(2)}</td>
                            <td className="px-2 py-1">{item.alcance || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-900 mb-1">💡 Recomendaciones:</p>
            <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
              <li>El archivo debe contener una geometría por unidad funcional</li>
              <li>Incluye atributos: numero, alcance, tipo_terreno, zona</li>
              <li>Las geometrías deben estar en coordenadas WGS84 (EPSG:4326)</li>
              <li>Para Shapefiles, comprime todos los archivos (.shp, .shx, .dbf, .prj) en un ZIP</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {result?.status === "success" && !result.dry_run ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && file && (
            <>
              <Button variant="outline" onClick={handlePreview} disabled={uploading}>
                {uploading ? "Analizando..." : "Previsualizar"}
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Cargando..." : "Aplicar Directamente"}
              </Button>
            </>
          )}
          {showPreview && result?.dry_run && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Aplicando..." : "Aplicar Cambios"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}