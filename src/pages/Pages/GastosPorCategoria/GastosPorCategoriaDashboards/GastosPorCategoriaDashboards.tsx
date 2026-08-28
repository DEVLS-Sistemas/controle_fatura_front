import React, { useRef } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPercentualApi } from 'helpers/gastos_criticos_helpers'
import {
  chaveCategoria,
  coresFatiasCategoria,
  coresFatiasSubcategoria,
  corCategoria,
  isFatiaOutros,
  percentualFatia,
} from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaDashboardBarra,
  GastosPorCategoriaSubcategoriaBarra,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

const escapeHtml = (value?: string | number | null): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

type FatiaPizza = GastosPorCategoriaDashboardBarra &
  Partial<GastosPorCategoriaSubcategoriaBarra>

interface PizzaProps {
  fatias: FatiaPizza[]
  cores: string[]
  selecionada: (item: FatiaPizza) => boolean
  percentualDe: (item: FatiaPizza) => number | null
  tooltipExtra?: (item: FatiaPizza) => string
  centroValor?: number | null
  centroLabel?: string
  onClique: (item: FatiaPizza) => void
  onDuploClique: (item: FatiaPizza) => void
}

const PizzaChart = ({
  fatias,
  cores,
  selecionada,
  percentualDe,
  tooltipExtra,
  centroValor,
  centroLabel,
  onClique,
  onDuploClique,
}: PizzaProps) => {
  const lastClickRef = useRef(0)
  const lastIndexRef = useRef(-1)
  const lastEventRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (fatias.length === 0) return null

  const labels = fatias.map((item) => item.nome || '—')
  const valores = fatias.map((item) => {
    const n = Number(item.valor_total ?? 0)
    return Number.isFinite(n) && n > 0 ? n : 0
  })

  const disparar = (index: number, duplo: boolean) => {
    const item = fatias[index]
    if (!item || isFatiaOutros(item)) return
    if (duplo) onDuploClique(item)
    else onClique(item)
  }

  const aoClicarFatia = (config?: { dataPointIndex?: number }) => {
    const index = Number(config?.dataPointIndex)
    if (!Number.isFinite(index) || index < 0) return
    const now = Date.now()
    if (now - lastEventRef.current < 80 && lastIndexRef.current === index) return
    lastEventRef.current = now

    if (now - lastClickRef.current < 350 && lastIndexRef.current === index) {
      if (timerRef.current) clearTimeout(timerRef.current)
      lastClickRef.current = 0
      lastIndexRef.current = -1
      disparar(index, true)
      return
    }

    lastClickRef.current = now
    lastIndexRef.current = index
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      disparar(index, false)
    }, 280)
  }

  return (
    <div className="d-flex flex-column flex-md-row align-items-center align-items-md-start gap-3">
      <div className="gastos-por-categoria-pizza flex-shrink-0" style={{ width: 280, minHeight: 280 }}>
        <ReactApexChart
          key={`${labels.join('|')}|${valores.join('|')}|${cores.join('|')}`}
          type="donut"
          height={280}
          width={280}
          series={valores}
          options={{
            chart: {
              type: 'donut',
              toolbar: { show: false },
              animations: { enabled: false },
              events: {
                dataPointSelection: (_event, _ctx, config) => aoClicarFatia(config),
              },
            },
            labels,
            colors: cores,
            stroke: { width: 2, colors: ['#fff'] },
            legend: { show: false },
            dataLabels: { enabled: false },
            states: {
              hover: { filter: { type: 'none' } },
              active: { filter: { type: 'none' } },
            },
            plotOptions: {
              pie: {
                expandOnClick: false,
                donut: {
                  size: '68%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '11px',
                      offsetY: 18,
                      color: '#74788d',
                    },
                    value: {
                      show: true,
                      fontSize: '15px',
                      fontWeight: 600,
                      offsetY: -12,
                      color: '#212529',
                      formatter: () => formatCurrency(centroValor),
                    },
                    total: {
                      show: true,
                      showAlways: true,
                      label: centroLabel || 'Total',
                      fontSize: '11px',
                      color: '#74788d',
                      formatter: () => formatCurrency(centroValor),
                    },
                  },
                },
              },
            },
            tooltip: {
              fillSeriesColor: false,
              custom: ({ seriesIndex }: { seriesIndex: number }) => {
                const item = fatias[seriesIndex]
                if (!item) return ''
                const pct = formatPercentualApi(percentualDe(item))
                const extra = tooltipExtra ? tooltipExtra(item) : ''
                const compras =
                  item.compras != null
                    ? `${item.compras} ${Number(item.compras) === 1 ? 'compra' : 'compras'}`
                    : ''
                return `<div class="px-2 py-2">
                  <div class="fw-semibold mb-1">${escapeHtml(item.nome || '—')}</div>
                  <div>${formatCurrency(item.valor_total)}${pct ? ` · ${pct}` : ''}</div>
                  ${compras ? `<div class="text-muted fs-12">${compras}</div>` : ''}
                  ${extra}
                  ${
                    isFatiaOutros(item)
                      ? ''
                      : '<div class="text-muted fs-11 mt-1">Clique filtra · duplo clique abre compras</div>'
                  }
                </div>`
              },
            },
          }}
        />
      </div>
      <ul className="list-unstyled mb-0 flex-grow-1 w-100">
        {fatias.map((item, idx) => {
          const pct = formatPercentualApi(percentualDe(item))
          const ativa = selecionada(item)
          const outros = isFatiaOutros(item)
          return (
            <li key={item.chave ?? `${item.nome}-${idx}`}>
              <button
                type="button"
                className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 py-1 px-1 ${
                  ativa ? 'fw-semibold' : ''
                }`}
                disabled={outros}
                onClick={() => {
                  if (!outros) onClique(item)
                }}
                onDoubleClick={() => {
                  if (!outros) onDuploClique(item)
                }}
                style={{ cursor: outros ? 'default' : 'pointer', opacity: outros ? 0.75 : 1 }}
              >
                <span
                  className="rounded-circle d-inline-block flex-shrink-0"
                  style={{ width: 10, height: 10, backgroundColor: cores[idx] }}
                />
                <span className="text-truncate flex-grow-1">{item.nome || '—'}</span>
                <span className="text-muted flex-shrink-0 fs-12">{pct || ''}</span>
                <span className={`flex-shrink-0 fs-12 ${VALOR_TEXT_CLASS}`}>
                  {formatCurrency(item.valor_total)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <style>{`
        .gastos-por-categoria-pizza .apexcharts-pie-area {
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

interface GastosPorCategoriaDashboardsProps {
  categorias: GastosPorCategoriaDashboardBarra[]
  subcategorias: GastosPorCategoriaSubcategoriaBarra[]
  categoriaSelecionadaChave?: string | null
  subcategoriaSelecionadaId?: number | null
  tituloSubcategorias: string
  centroValor?: number | null
  centroLabel?: string
  categoriaFiltrada?: boolean
  loading?: boolean
  onCliqueCategoria: (item: GastosPorCategoriaDashboardBarra) => void
  onCliqueSubcategoria: (item: GastosPorCategoriaSubcategoriaBarra) => void
  onDuploCliqueCategoria: (item: GastosPorCategoriaDashboardBarra) => void
  onDuploCliqueSubcategoria: (item: GastosPorCategoriaSubcategoriaBarra) => void
  onLimpar: () => void
}

const ChartSkeleton = () => (
  <div className="placeholder-glow py-4 text-center">
    <span className="placeholder rounded-circle d-inline-block mb-3" style={{ width: 160, height: 160 }}></span>
    <span className="placeholder col-8 d-block mx-auto"></span>
  </div>
)

const GastosPorCategoriaDashboards = ({
  categorias,
  subcategorias,
  categoriaSelecionadaChave,
  subcategoriaSelecionadaId,
  tituloSubcategorias,
  centroValor,
  centroLabel,
  categoriaFiltrada,
  loading,
  onCliqueCategoria,
  onCliqueSubcategoria,
  onDuploCliqueCategoria,
  onDuploCliqueSubcategoria,
  onLimpar,
}: GastosPorCategoriaDashboardsProps) => {
  const temSelecao = Boolean(categoriaSelecionadaChave) || subcategoriaSelecionadaId != null
  const coresCat = coresFatiasCategoria(categorias, categoriaSelecionadaChave)
  const coresSub = coresFatiasSubcategoria(subcategorias, subcategoriaSelecionadaId)

  return (
    <Row className="g-3 mb-3">
      <Col md={6}>
        <Card className="mb-0 h-100">
          <CardBody>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div>
                <h5 className="card-title mb-0">Categorias</h5>
                <p className="text-muted mb-0 fs-12">Clique numa fatia para filtrar as subcategorias</p>
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
              <PizzaChart
                fatias={categorias}
                cores={coresCat}
                selecionada={(item) =>
                  !isFatiaOutros(item) &&
                  Boolean(categoriaSelecionadaChave) &&
                  chaveCategoria(item) === categoriaSelecionadaChave
                }
                percentualDe={(item) => percentualFatia(item, false)}
                centroValor={centroValor}
                centroLabel={centroLabel}
                onClique={onCliqueCategoria}
                onDuploClique={onDuploCliqueCategoria}
              />
            )}
          </CardBody>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="mb-0 h-100">
          <CardBody>
            <h5 className="card-title mb-3">{tituloSubcategorias}</h5>
            {loading ? (
              <ChartSkeleton />
            ) : subcategorias.length === 0 ? (
              <p className="text-muted mb-0">
                {categoriaSelecionadaChave
                  ? 'Nenhuma subcategoria nesta categoria'
                  : 'Sem subcategorias neste período.'}
              </p>
            ) : (
              <PizzaChart
                fatias={subcategorias}
                cores={coresSub}
                selecionada={(item) =>
                  !isFatiaOutros(item) &&
                  subcategoriaSelecionadaId != null &&
                  Number(item.subcategoria_id) === Number(subcategoriaSelecionadaId)
                }
                percentualDe={(item) => percentualFatia(item, Boolean(categoriaFiltrada))}
                tooltipExtra={(item) => {
                  const daCat = formatPercentualApi(item.percentual_da_categoria)
                  const pai = item.categoria_nome
                  if (!pai && !daCat) return ''
                  const paiCor = item.categoria_cor
                    ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${escapeHtml(
                        corCategoria({
                          cor: item.categoria_cor,
                          categoria_id: item.categoria_id,
                        })
                      )};margin-right:4px;vertical-align:middle"></span>`
                    : ''
                  return `<div class="text-muted fs-12 mt-1">${paiCor}${escapeHtml(pai || '')}${
                    daCat ? ` · ${daCat} da categoria` : ''
                  }</div>`
                }}
                centroValor={centroValor}
                centroLabel={centroLabel}
                onClique={onCliqueSubcategoria}
                onDuploClique={onDuploCliqueSubcategoria}
              />
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default GastosPorCategoriaDashboards
