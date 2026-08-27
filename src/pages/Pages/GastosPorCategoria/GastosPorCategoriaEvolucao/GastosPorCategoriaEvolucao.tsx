import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { corCategoria } from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaEvolucaoMes,
  GastosPorCategoriaEvolucaoSerie,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaEvolucaoProps {
  meses?: GastosPorCategoriaEvolucaoMes[] | null
  porCategoria?: GastosPorCategoriaEvolucaoSerie[] | null
}

const GastosPorCategoriaEvolucao = ({ meses, porCategoria }: GastosPorCategoriaEvolucaoProps) => {
  const serieMeses = Array.isArray(meses) ? meses : []
  if (serieMeses.length === 0) return null

  const labels = serieMeses.map((item) => {
    const base = item.label || item.chave || ''
    return item.parcial ? `${base}*` : base
  })
  const chaves = serieMeses.map((item) => item.chave || item.label || '')
  const valores = serieMeses.map((item) => Number(item.valor_total ?? 0))
  const temParcial = serieMeses.some((item) => item.parcial)
  const categorias = Array.isArray(porCategoria) ? porCategoria : []

  const series: { name: string; type: 'column' | 'line'; data: number[] }[] = [
    { name: 'Total', type: 'column', data: valores },
    ...categorias.map((cat) => {
      const mapa = new Map(
        (cat.serie ?? []).map((ponto) => [ponto.chave, Number(ponto.valor_total ?? 0)])
      )
      return {
        name: cat.nome || 'Categoria',
        type: 'line' as const,
        data: chaves.map((chave) => mapa.get(chave) ?? 0),
      }
    }),
  ]

  const colors = ['#405189', ...categorias.map((cat) => corCategoria(cat.cor))]

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">Evolução</h5>
          {temParcial ? (
            <span className="badge bg-secondary-subtle text-secondary">* Mês em andamento</span>
          ) : null}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(480, serieMeses.length * 88) }}>
            <ReactApexChart
              type="line"
              height={320}
              series={series}
              options={{
                chart: {
                  toolbar: { show: false },
                  stacked: false,
                },
                stroke: {
                  width: [0, ...categorias.map(() => 3)],
                  curve: 'smooth',
                },
                dataLabels: { enabled: false },
                xaxis: { categories: labels },
                yaxis: {
                  labels: {
                    formatter: (val: number) => formatCurrency(val),
                  },
                },
                colors,
                plotOptions: {
                  bar: { columnWidth: '45%' },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: {
                    formatter: (val: number, opts: { dataPointIndex: number }) => {
                      const item = serieMeses[opts.dataPointIndex]
                      const parcial = item?.parcial ? ' · mês em andamento' : ''
                      return `${formatCurrency(val)}${parcial}`
                    },
                  },
                },
                legend: { position: 'bottom' },
              }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default GastosPorCategoriaEvolucao
