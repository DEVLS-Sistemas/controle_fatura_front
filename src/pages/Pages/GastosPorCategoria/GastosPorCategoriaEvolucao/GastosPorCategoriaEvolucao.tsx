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
  categoriaId?: number | null
  categoriaNome?: string | null
}

const formatEixo = (val: number): string => {
  if (!Number.isFinite(val)) return ''
  return Number(val).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

const GastosPorCategoriaEvolucao = ({
  meses,
  porCategoria,
  categoriaId,
  categoriaNome,
}: GastosPorCategoriaEvolucaoProps) => {
  const serieMeses = Array.isArray(meses) ? meses : []
  if (serieMeses.length === 0) return null

  const labels = serieMeses.map((item) => {
    const base = item.label || item.chave || ''
    return item.parcial ? `${base}*` : base
  })
  const chaves = serieMeses.map((item) => item.chave || item.label || '')
  const valores = serieMeses.map((item) => Number(item.valor_total ?? 0))
  const temParcial = serieMeses.some((item) => item.parcial)
  const todas = Array.isArray(porCategoria) ? porCategoria : []
  const selecionada =
    categoriaId != null
      ? todas.find((cat) => Number(cat.categoria_id) === Number(categoriaId))
      : null
  const visaoGeralComFiltro = categoriaId != null && !selecionada
  const categorias = selecionada ? [selecionada] : visaoGeralComFiltro ? [] : todas

  const serieDaCategoria = (cat: GastosPorCategoriaEvolucaoSerie) => {
    const mapa = new Map(
      (cat.serie ?? []).map((ponto) => [ponto.chave, Number(ponto.valor_total ?? 0)])
    )
    return chaves.map((chave) => mapa.get(chave) ?? 0)
  }

  const series: { name: string; type: 'column' | 'line'; data: number[] }[] = selecionada
    ? [{ name: selecionada.nome || 'Categoria', type: 'column', data: serieDaCategoria(selecionada) }]
    : [
        { name: 'Total', type: 'column', data: valores },
        ...categorias.map((cat) => ({
          name: cat.nome || 'Categoria',
          type: 'line' as const,
          data: serieDaCategoria(cat),
        })),
      ]

  const colors = selecionada
    ? [corCategoria(selecionada.cor)]
    : visaoGeralComFiltro
      ? ['rgba(64, 81, 137, 0.4)']
      : ['#405189', ...categorias.map((cat) => corCategoria(cat.cor))]

  const rotacionarLabels = serieMeses.length > 8

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">Evolução</h5>
          <div className="d-flex flex-wrap gap-2">
            {visaoGeralComFiltro ? (
              <span className="badge bg-secondary-subtle text-secondary">
                Visão geral do período{categoriaNome ? ` · ${categoriaNome}` : ''}
              </span>
            ) : null}
            {temParcial ? (
              <span className="badge bg-secondary-subtle text-secondary">* Mês em andamento</span>
            ) : null}
          </div>
        </div>
        <ReactApexChart
          type="line"
          height={320}
          series={series}
          options={{
            chart: {
              toolbar: { show: false },
              stacked: false,
              zoom: { enabled: false },
              parentHeightOffset: 0,
              animations: { enabled: false },
            },
            states: {
              hover: { filter: { type: 'none' } },
              active: { filter: { type: 'none' } },
            },
            stroke: {
              width: selecionada || visaoGeralComFiltro ? [0] : [0, ...categorias.map(() => 3)],
              curve: 'smooth',
            },
            dataLabels: { enabled: false },
            xaxis: {
              categories: labels,
              labels: {
                rotate: rotacionarLabels ? -45 : 0,
                rotateAlways: rotacionarLabels,
                hideOverlappingLabels: true,
                trim: true,
                style: { fontSize: '11px' },
              },
              tooltip: { enabled: false },
            },
            yaxis: {
              labels: {
                minWidth: 88,
                maxWidth: 88,
                formatter: formatEixo,
              },
            },
            colors,
            plotOptions: {
              bar: { columnWidth: serieMeses.length > 8 ? '55%' : '45%' },
            },
            grid: {
              padding: { left: 8, right: 12 },
            },
            tooltip: {
              shared: true,
              intersect: false,
              followCursor: false,
              fillSeriesColor: false,
              x: {
                formatter: (_val: string, opts?: { dataPointIndex?: number }) => {
                  const index = opts?.dataPointIndex ?? 0
                  const item = serieMeses[index]
                  const base = item?.label || labels[index] || ''
                  return item?.parcial ? `${base} · mês em andamento` : base
                },
              },
              y: {
                formatter: (val: number) => formatCurrency(val),
              },
            },
            legend: { position: 'bottom' },
          }}
        />
      </CardBody>
    </Card>
  )
}

export default GastosPorCategoriaEvolucao
