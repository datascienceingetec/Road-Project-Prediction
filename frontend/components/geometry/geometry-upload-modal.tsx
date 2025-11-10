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
  status: "success" | "error"
  message: string
  created?: number
  updated?: number
  total_features?: number
  errors?: string[]
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

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const data = await api.uploadProjectGeometries(projectCode, file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setResult({
        status: "success",
        message: data.message || "Geometrías cargadas exitosamente",
        created: data.created,
        updated: data.updated,
        total_features: data.total_features,
        errors: data.errors,
      })
      
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
            <Alert
              variant={result.status === "success" ? "default" : "destructive"}
            >
              {result.status === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <p className="font-medium">{result.message}</p>
                {result.status === "success" && (
                  <div className="mt-2 text-sm space-y-1">
                    {result.created !== undefined && (
                      <p>✓ Creadas: {result.created} unidades funcionales</p>
                    )}
                    {result.updated !== undefined && (
                      <p>✓ Actualizadas: {result.updated} unidades funcionales</p>
                    )}
                    {result.total_features !== undefined && (
                      <p>📊 Total de geometrías: {result.total_features}</p>
                    )}
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Advertencias:</p>
                    <ul className="list-disc list-inside">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx} className="text-xs">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
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
            {result?.status === "success" ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Cargando..." : "Cargar Geometría"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
