import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { formatVariacao } from 'helpers/gastos_criticos_helpers'
import { GastosCriticosEvolucaoMes } from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosEvolucaoProps {
  meses?: GastosCriticosEvolucaoMes[] | null
}

const GastosCriticosEvolucao = ({ meses }: GastosCriticosEvolucaoProps) => {
  const serie = Array.isArray(meses) ? meses : []
  if (serie.length === 0) return null

  const labels = serie.map((item) => {
    const base = item.label || item.chave || ''
    return item.parcial ? `${base}*` : base
  })
  const valores = serie.map((item) => Number(item.valor_total ?? 0))
  const compras = serie.map((item) => Number(item.compras ?? 0))
  const temParcial = serie.some((item) => item.parcial)

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">Evolução</h5>
          {temParcial ? (
            <span className="badge bg-secondary-subtle text-secondary">
              * Mês em andamento
            </span>
          ) : null}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(480, serie.length * 88) }}>
            <ReactApexChart
              type="line"
              height={320}
              series={[
                { name: 'Valor', type: 'column', data: valores },
                { name: 'Compras', type: 'line', data: compras },
              ]}
              options={{
                chart: {
                  toolbar: { show: false },
                  stacked: false,
                },
                stroke: { width: [0, 3], curve: 'smooth' },
                dataLabels: { enabled: false },
                xaxis: { categories: labels },
                yaxis: [
                  {
                    title: { text: 'Valor' },
                    labels: {
                      formatter: (val: number) => formatCurrency(val),
                    },
                  },
                  {
                    opposite: true,
                    title: { text: 'Compras' },
                    labels: {
                      formatter: (val: number) => String(Math.round(val)),
                    },
                  },
                ],
                colors: ['#405189', '#0ab39c'],
                plotOptions: {
                  bar: { columnWidth: '45%' },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: {
                    formatter: (val: number, opts: { seriesIndex: number; dataPointIndex: number }) => {
                      if (opts.seriesIndex === 1) return `${val} compras`
                      const item = serie[opts.dataPointIndex]
                      const variacao = formatVariacao(item?.variacao_percentual)
                      const variacaoTexto = item?.variacao_percentual == null ? 'Novo' : variacao.label
                      const parcial = item?.parcial ? ' · mês em andamento' : ''
                      return `${formatCurrency(val)} · ${variacaoTexto}${parcial}`
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

export default GastosCriticosEvolucao
