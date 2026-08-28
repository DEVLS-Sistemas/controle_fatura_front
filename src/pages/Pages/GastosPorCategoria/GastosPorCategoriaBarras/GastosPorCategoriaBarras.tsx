import React, { useRef } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { formatPercentualApi } from 'helpers/gastos_criticos_helpers'
import {
  chaveCategoria,
  corBarraDim,
  corCategoria,
  percentualFatia,
} from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaDashboardBarra,
  GastosPorCategoriaSubcategoriaBarra,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

type BarraItem = GastosPorCategoriaDashboardBarra &
  Partial<GastosPorCategoriaSubcategoriaBarra>

interface BarraHorizontalProps {
  barras: BarraItem[]
  selecionada?: (item: BarraItem) => boolean
  dimNaoSelecionadas: boolean
  corDe: (item: BarraItem) => string
  percentualDe?: (item: BarraItem) => number | null
  tooltipExtra?: (item: BarraItem) => string
  onClique: (item: BarraItem) => void
  onDuploClique: (item: BarraItem) => void
  altura: number
}

const BarraHorizontalChart = ({
  barras,
  selecionada,
  dimNaoSelecionadas,
  corDe,
  percentualDe,
  tooltipExtra,
  onClique,
  onDuploClique,
  altura,
}: BarraHorizontalProps) => {
  const lastClickRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (barras.length === 0) return null

  const labels = barras.map((item) => item.nome || '—')
  const valores = barras.map((item) => Number(item.valor_total ?? 0))
  const cores = barras.map((item) => {
    const ativa = selecionada ? selecionada(item) : false
    const dim = dimNaoSelecionadas && !ativa
    return corBarraDim(corDe(item), dim)
  })

  const disparar = (index: number, duplo: boolean) => {
    const item = barras[index]
    if (!item) return
    if (duplo) onDuploClique(item)
    else onClique(item)
  }

  return (
    <div className="gastos-por-categoria-bar-chart">
      <ReactApexChart
        type="bar"
        height={altura}
        series={[{ name: 'Gasto', data: valores }]}
        options={{
          chart: {
            toolbar: { show: false },
            animations: { enabled: true, speed: 250 },
            events: {
              dataPointSelection: (_event, _ctx, config) => {
                const index = config.dataPointIndex
                if (index == null || index < 0) return
                const now = Date.now()
                if (now - lastClickRef.current < 350) {
                  if (timerRef.current) clearTimeout(timerRef.current)
                  lastClickRef.current = 0
                  disparar(index, true)
                  return
                }
                lastClickRef.current = now
                if (timerRef.current) clearTimeout(timerRef.current)
                timerRef.current = setTimeout(() => {
                  disparar(index, false)
                }, 280)
              },
            },
          },
          states: {
            active: { filter: { type: 'none' } },
            hover: { filter: { type: 'lighten', value: 0.04 } },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              distributed: true,
              borderRadius: 4,
              barHeight: '70%',
            },
          },
          colors: cores,
          dataLabels: {
            enabled: true,
            formatter: (val: number, opts: { dataPointIndex: number }) => {
              const item = barras[opts.dataPointIndex]
              const pct = formatPercentualApi(percentualDe ? percentualDe(item) : item?.percentual_gasto)
              return pct ? `${formatCurrency(val)}  ${pct}` : formatCurrency(val)
            },
            style: { fontSize: '11px', fontWeight: 500, colors: ['#1f2937'] },
            offsetX: 6,
          },
          xaxis: {
            labels: {
              formatter: (val: string) => formatCurrency(Number(val)),
            },
          },
          yaxis: {
            labels: {
              maxWidth: 160,
              style: { fontSize: '12px' },
            },
          },
          legend: { show: false },
          grid: { padding: { left: 8, right: 24 } },
          tooltip: {
            custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
              const item = barras[dataPointIndex]
              if (!item) return ''
              const pct = formatPercentualApi(percentualDe ? percentualDe(item) : item.percentual_gasto)
              const extra = tooltipExtra ? tooltipExtra(item) : ''
              return `<div class="px-2 py-2">
                <div class="fw-semibold mb-1">${item.nome || '—'}</div>
                <div>${formatCurrency(item.valor_total)}${pct ? ` · ${pct}` : ''}</div>
                ${extra}
                <div class="text-muted fs-11 mt-1">Clique filtra · duplo clique abre compras</div>
              </div>`
            },
          },
        }}
      />
      <style>{`
        .gastos-por-categoria-bar-chart .apexcharts-bar-area,
        .gastos-por-categoria-bar-chart .apexcharts-series path {
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

interface GastosPorCategoriaBarrasProps {
  categorias: GastosPorCategoriaDashboardBarra[]
  subcategorias: GastosPorCategoriaSubcategoriaBarra[]
  categoriaSelecionadaChave?: string | null
  subcategoriaSelecionadaId?: number | null
  tituloSubcategorias: string
  categoriaFiltrada?: boolean
  loading?: boolean
  onCliqueCategoria: (item: GastosPorCategoriaDashboardBarra) => void
  onCliqueSubcategoria: (item: GastosPorCategoriaSubcategoriaBarra) => void
  onDuploCliqueCategoria: (item: GastosPorCategoriaDashboardBarra) => void
  onDuploCliqueSubcategoria: (item: GastosPorCategoriaSubcategoriaBarra) => void
  onLimpar: () => void
}

const ChartSkeleton = () => (
  <div className="placeholder-glow py-4">
    <span className="placeholder col-10 mb-3"></span>
    <span className="placeholder col-8 mb-3"></span>
    <span className="placeholder col-9 mb-3"></span>
    <span className="placeholder col-6"></span>
  </div>
)

const GastosPorCategoriaBarras = ({
  categorias,
  subcategorias,
  categoriaSelecionadaChave,
  subcategoriaSelecionadaId,
  tituloSubcategorias,
  categoriaFiltrada,
  loading,
  onCliqueCategoria,
  onCliqueSubcategoria,
  onDuploCliqueCategoria,
  onDuploCliqueSubcategoria,
  onLimpar,
}: GastosPorCategoriaBarrasProps) => {
  const temSelecao = Boolean(categoriaSelecionadaChave) || subcategoriaSelecionadaId != null
  const altura = Math.max(280, Math.max(categorias.length, subcategorias.length, 4) * 38 + 48)

  return (
    <Row className="g-3 mb-3">
      <Col md={6}>
        <Card className="mb-0 h-100">
          <CardBody>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div>
                <h5 className="card-title mb-0">Categorias</h5>
                <p className="text-muted mb-0 fs-13">Top 10 em barras</p>
              </div>
              {temSelecao ? (
                <button type="button" className="btn btn-soft-secondary btn-sm" onClick={onLimpar}>
                  Limpar filtro
                </button>
              ) : null}
            </div>
            {loading ? (
              <ChartSkeleton />
            ) : categorias.length === 0 ? (
              <p className="text-muted mb-0">Sem categorias neste período.</p>
            ) : (
              <BarraHorizontalChart
                barras={categorias}
                selecionada={(item) =>
                  Boolean(categoriaSelecionadaChave) && chaveCategoria(item) === categoriaSelecionadaChave
                }
                dimNaoSelecionadas={Boolean(categoriaSelecionadaChave)}
                corDe={(item) => corCategoria(item)}
                onClique={onCliqueCategoria}
                onDuploClique={onDuploCliqueCategoria}
                altura={altura}
              />
            )}
          </CardBody>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="mb-0 h-100">
          <CardBody>
            <div className="mb-2">
              <h5 className="card-title mb-0">{tituloSubcategorias}</h5>
              <p className="text-muted mb-0 fs-13">Top 10 em barras</p>
            </div>
            {loading ? (
              <ChartSkeleton />
            ) : subcategorias.length === 0 ? (
              <p className="text-muted mb-0">
                {categoriaSelecionadaChave
                  ? 'Nenhuma subcategoria nesta categoria'
                  : 'Sem subcategorias neste período.'}
              </p>
            ) : (
              <BarraHorizontalChart
                barras={subcategorias}
                selecionada={(item) =>
                  subcategoriaSelecionadaId != null &&
                  Number(item.subcategoria_id) === Number(subcategoriaSelecionadaId)
                }
                dimNaoSelecionadas={subcategoriaSelecionadaId != null}
                corDe={(item) =>
                  corCategoria({
                    cor: item.categoria_cor || item.cor,
                    categoria_id: item.categoria_id,
                  })
                }
                percentualDe={(item) => percentualFatia(item, Boolean(categoriaFiltrada))}
                tooltipExtra={(item) => {
                  const daCat = formatPercentualApi(item.percentual_da_categoria)
                  const pai = item.categoria_nome
                  if (!pai && !daCat) return ''
                  return `<div class="text-muted fs-12 mt-1">${pai || ''}${
                    daCat ? ` · ${daCat} da categoria` : ''
                  }</div>`
                }}
                onClique={onCliqueSubcategoria}
                onDuploClique={onDuploCliqueSubcategoria}
                altura={altura}
              />
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default GastosPorCategoriaBarras
