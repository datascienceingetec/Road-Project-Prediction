"use client"

import { useState } from "react"
import { api } from "@/lib/api"

export default function PrediccionPage() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    num_ufs: "",
    longitud: "",
    anio_inicio: "",
    duracion: "",
    fase: "Fase I - Prefactibilidad",
    ubicacion: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePredict = async () => {
    setLoading(true)

    const predictionData = await api.predictCosto({
      longitud: Number.parseFloat(formData.longitud),
      num_ufs: Number.parseInt(formData.num_ufs),
      duracion: Number.parseInt(formData.duracion),
      fase: formData.fase,
      ubicacion: formData.ubicacion,
    })

    setPrediction(predictionData)
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const isFormValid = () => {
    return (
      formData.nombre &&
      formData.codigo &&
      formData.num_ufs &&
      formData.longitud &&
      formData.anio_inicio &&
      formData.duracion &&
      formData.fase &&
      formData.ubicacion
    )
  }

  return (
    <main className="flex flex-1 justify-center p-5 sm:p-10">
      <div className="flex flex-col w-full max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-[#071d49] text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
            Predicción de Costos
          </h1>
        </div>

        {/* Layout de Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-4">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Acordeón 1: Información General */}
            <details className="flex flex-col rounded-xl border border-[#dee2e6] bg-white group" open>
              <summary className="flex cursor-pointer items-center justify-between gap-6 p-4">
                <p className="text-[#071d49] text-base font-bold leading-normal">Información General</p>
                <span className="material-symbols-outlined text-[#111418] transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="border-t border-[#dee2e6] p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col col-span-2">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Nombre del Proyecto</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. Autopista del Sol"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Código del Proyecto</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. PRY-2024-001"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange("codigo", e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Ubicación</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. Bogotá, Colombia"
                    value={formData.ubicacion}
                    onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Fase del Proyecto</p>
                  <select
                    className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 px-4 text-sm font-normal"
                    value={formData.fase}
                    onChange={(e) => handleInputChange("fase", e.target.value)}
                  >
                    <option value="Fase I - Prefactibilidad">Fase I - Prefactibilidad</option>
                    <option value="Fase II - Factibilidad">Fase II - Factibilidad</option>
                    <option value="Fase III - Diseños a Detalle">Fase III - Diseños a Detalle</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Año de Inicio</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. 2024"
                    type="number"
                    value={formData.anio_inicio}
                    onChange={(e) => handleInputChange("anio_inicio", e.target.value)}
                  />
                </label>
              </div>
            </details>

            {/* Acordeón 2: Especificaciones Técnicas */}
            <details className="flex flex-col rounded-xl border border-[#dee2e6] bg-white group">
              <summary className="flex cursor-pointer items-center justify-between gap-6 p-4">
                <p className="text-[#071d49] text-base font-bold leading-normal">Especificaciones Técnicas</p>
                <span className="material-symbols-outlined text-[#111418] transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="border-t border-[#dee2e6] p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Longitud (km)</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. 50.5"
                    type="number"
                    step="0.1"
                    value={formData.longitud}
                    onChange={(e) => handleInputChange("longitud", e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">
                    Número de Unidades Funcionales
                  </p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. 5"
                    type="number"
                    value={formData.num_ufs}
                    onChange={(e) => handleInputChange("num_ufs", e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Duración (años)</p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                    placeholder="ej. 3"
                    type="number"
                    value={formData.duracion}
                    onChange={(e) => handleInputChange("duracion", e.target.value)}
                  />
                </label>
              </div>
            </details>

            {/* Acciones del Formulario */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                onClick={() =>
                  setFormData({
                    nombre: "",
                    codigo: "",
                    num_ufs: "",
                    longitud: "",
                    anio_inicio: "",
                    duracion: "",
                    fase: "Fase I - Prefactibilidad",
                    ubicacion: "",
                  })
                }
                className="px-6 py-3 rounded-lg text-sm font-semibold text-[#111418] bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Limpiar Formulario
              </button>
              <button
                onClick={handlePredict}
                className="px-8 py-3 rounded-lg text-sm font-semibold text-white bg-[#e4002b] hover:bg-[#e4002b]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Calculando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">calculate</span>
                    Calcular Costo Estimado
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Columna Derecha: Resultados */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 bg-white rounded-xl border border-[#dee2e6] p-6 flex flex-col gap-6">
              <h2 className="text-[#071d49] text-lg font-bold">Resultados de Predicción</h2>

              {/* Costo Total Estimado */}
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <p className="text-sm font-medium text-primary uppercase tracking-wider">Costo Total Estimado</p>
                <p className="text-4xl font-extrabold text-primary mt-2">
                  {prediction ? formatCurrency(prediction.costo_estimado) : "$0"}
                </p>
                <p className="text-sm font-medium text-primary/70 mt-2">
                  {prediction ? `${prediction.confianza}% Nivel de Confianza` : ""}
                </p>
              </div>

              {/* Desglose de Costos */}
              {prediction && (
                <div>
                  <h3 className="text-base font-bold text-[#111418] mb-4">Desglose de Costos</h3>

                  {/* Gráfico de Dona */}
                  <div className="flex justify-center items-center my-4 relative">
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" fill="none" r="54" stroke="#e6e6e6" strokeWidth="12" />
                      <circle
                        className="opacity-70"
                        cx="60"
                        cy="60"
                        fill="none"
                        r="54"
                        stroke="#E4002B"
                        strokeDasharray="204"
                        strokeDashoffset="61.2"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="54"
                        stroke="#1D428A"
                        strokeDasharray="204"
                        strokeDashoffset="132.6"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="54"
                        stroke="#6C757D"
                        strokeDasharray="204"
                        strokeDashoffset="173.4"
                        strokeWidth="12"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#071d49]">100%</span>
                      <span className="text-xs text-[#6c757d]">Total</span>
                    </div>
                  </div>

                  {/* Leyenda */}
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-primary" />
                        <span className="font-medium text-[#111418]">Materiales</span>
                      </div>
                      <span className="font-semibold text-[#111418]">
                        {formatCurrency(prediction.costo_estimado * 0.45)} (45%)
                      </span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-[#e4002b] opacity-70" />
                        <span className="font-medium text-[#111418]">Mano de Obra</span>
                      </div>
                      <span className="font-semibold text-[#111418]">
                        {formatCurrency(prediction.costo_estimado * 0.35)} (35%)
                      </span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-[#6c757d]" />
                        <span className="font-medium text-[#111418]">Equipos y Otros</span>
                      </div>
                      <span className="font-semibold text-[#111418]">
                        {formatCurrency(prediction.costo_estimado * 0.2)} (20%)
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Acciones de Resultados */}
              {prediction && (
                <div className="flex items-center gap-4 border-t border-[#dee2e6] pt-6 mt-2">
                  <button className="w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined !text-base">save</span>
                    Guardar Predicción
                  </button>
                  <button className="w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined !text-base">picture_as_pdf</span>
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
