import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardBody, Col, Container, Label, Row, Spinner } from 'reactstrap'
import ReactApexChart from 'react-apexcharts'
import { DashboardService, DashboardResumo } from 'services/Dashboard'
import { formatCurrency, tipoTransacaoLabel, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { AnosSelect, mesesSelect } from 'helpers/functions_helpers'
import {
  DASHBOARD_ANO_TODO,
  DashboardFiltro,
  MESES_ABREV_DASHBOARD,
  buildDashboardResumoParams,
  buildDashboardSearchParams,
  mesesDoFiltro,
  persistDashboardFiltro,
  resolveDashboardFiltro,
} from 'helpers/dashboard_resumo_helpers'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { toast } from 'react-toastify'

const optAnos = AnosSelect()
const optMesesDe: SelectOptions[] = [{ value: DASHBOARD_ANO_TODO, label: 'Ano todo' }, ...mesesSelect()]

const DashboardsHome = () => {
  const dashboardService = useRef(new DashboardService()).current
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const defaultValues = useRef(resolveDashboardFiltro(searchParams)).current
  const { control, watch, setValue } = useForm<DashboardFiltro>({ defaultValues })
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const lastKeyRef = useRef('')

  const anoWatch = watch('ano')
  const mesInicioWatch = watch('mes_inicio')
  const mesFimWatch = watch('mes_fim')
  const isAnoTodo = mesInicioWatch === DASHBOARD_ANO_TODO || mesInicioWatch == null
  const optMesesAte = useMemo(() => {
    const inicio = Number(mesInicioWatch)
    if (!Number.isInteger(inicio) || inicio < 1) return mesesSelect()
    return mesesSelect().filter((opt) => Number(opt.value) >= inicio)
  }, [mesInicioWatch])

  const loadResumo = useCallback(
    async (filtro: DashboardFiltro) => {
      const params = buildDashboardResumoParams(filtro)
      const key = JSON.stringify(params)
      if (lastKeyRef.current === key) return
      lastKeyRef.current = key
      persistDashboardFiltro(filtro)
      const next = buildDashboardSearchParams(filtro)
      const nextQs = next.toString()
      const currentQs = new URLSearchParams(window.location.search).toString()
      if (nextQs !== currentQs) {
        setSearchParams(next, { replace: true })
      }
      setLoading(true)
      try {
        const data = await dashboardService.getResumo(params)
        setResumo(data || null)
      } catch (e: any) {
        lastKeyRef.current = ''
        toast.error(e?.message || 'Erro ao carregar dashboard')
      } finally {
        setLoading(false)
      }
    },
    [dashboardService, setSearchParams]
  )

  useEffect(() => {
    const ano = Number(anoWatch) || new Date().getFullYear()
    if (isAnoTodo) {
      if (mesFimWatch != null) {
        setValue('mes_fim', null)
        return
      }
      loadResumo({ ano, mes_inicio: DASHBOARD_ANO_TODO, mes_fim: null })
      return
    }

    const inicio = Number(mesInicioWatch)
    if (!Number.isInteger(inicio) || inicio < 1) return

    if (mesFimWatch == null || Number(mesFimWatch) < inicio) {
      setValue('mes_fim', inicio)
      return
    }

    loadResumo({ ano, mes_inicio: inicio, mes_fim: Number(mesFimWatch) })
  }, [anoWatch, mesInicioWatch, mesFimWatch, isAnoTodo, loadResumo, setValue])

  const filtroAtual: DashboardFiltro = {
    ano: Number(anoWatch) || new Date().getFullYear(),
    mes_inicio: isAnoTodo ? DASHBOARD_ANO_TODO : Number(mesInicioWatch),
    mes_fim: isAnoTodo ? null : Number(mesFimWatch ?? mesInicioWatch),
  }
  const mesesDestacados = new Set(resumo?.periodo?.meses?.length ? resumo.periodo.meses : mesesDoFiltro(filtroAtual))
  const coresMensal = MESES_ABREV_DASHBOARD.map((_, i) =>
    mesesDestacados.has(i + 1) ? '#405189' : 'rgba(64, 81, 137, 0.28)'
  )
  const serieMensal = Array.from({ length: 12 }, (_, i) => {
    const found = resumo?.por_mes?.find((m) => m.mes === i + 1)
    return found ? Number(found.total) : 0
  })

  const categoriasLabels = resumo?.por_categoria?.map((c) => c.nome) || []
  const categoriasSeries = resumo?.por_categoria?.map((c) => Number(c.total)) || []
  const categoriasCores = resumo?.por_categoria?.map((c) => c.cor || '#6b7280') || []
  const semLancamentos = !loading && (resumo?.totais?.total_transacoes ?? 0) === 0

  const summaryCards = [
    { title: 'Líquido', value: resumo?.totais?.total_liquido, icon: 'ri-funds-line', color: 'primary', highlight: true },
    { title: 'Compras', value: resumo?.totais?.total_compras, icon: 'ri-shopping-bag-line', color: 'danger' },
    { title: 'Pagamentos', value: resumo?.totais?.total_pagamentos, icon: 'ri-bank-card-line', color: 'success' },
    { title: 'Estornos', value: resumo?.totais?.total_estornos, icon: 'ri-refund-2-line', color: 'warning' },
    { title: 'Antecipações', value: resumo?.totais?.total_antecipacoes, icon: 'ri-flashlight-line', color: 'secondary' },
    { title: 'Encargos', value: resumo?.totais?.total_encargos, icon: 'ri-percent-line', color: 'dark' },
    { title: 'Transações', value: resumo?.totais?.total_transacoes, icon: 'ri-list-check-2', color: 'info', isCount: true },
  ]

  const handleBarClick = (mes: number) => {
    if (mes < 1 || mes > 12) return
    setValue('mes_inicio', mes)
    setValue('mes_fim', mes)
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-lg-center flex-lg-row flex-column gap-3 mb-3">
                <div className="flex-grow-1">
                  <h4 className="fs-16 mb-1">Dashboard</h4>
                  <p className="text-muted mb-0">
                    {resumo?.periodo?.label || 'Resumo das faturas e gastos do período'}
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Link to="/raio-x" className="btn btn-soft-success mb-1">
                    <i className="ri-pulse-line align-middle me-1"></i>
                    Raio-X
                  </Link>
                  <Link to="/gastos-por-categoria" className="btn btn-soft-info mb-1">
                    <i className="ri-pie-chart-2-line align-middle me-1"></i>
                    Gastos por categoria
                  </Link>
                  <Link to="/gastos-criticos" className="btn btn-soft-danger mb-1">
                    <i className="ri-alarm-warning-line align-middle me-1"></i>
                    Onde estou gastando demais?
                  </Link>
                  <Link to="/parceladas" className="btn btn-soft-primary mb-1">
                    <i className="ri-list-ordered align-middle me-1"></i>
                    Parceladas
                  </Link>
                  <Link to="/assinaturas" className="btn btn-soft-warning mb-1">
                    <i className="ri-refresh-line align-middle me-1"></i>
                    Assinaturas
                  </Link>
                </div>
              </div>
              <Row className="g-2">
                <Col xs={12} sm={4} lg={2}>
                  <Label className="form-label mb-1">Ano</Label>
                  <SelectListControlled<DashboardFiltro> field="ano" control={control} options={optAnos} />
                </Col>
                <Col xs={12} sm={4} lg={2}>
                  <Label className="form-label mb-1">De</Label>
                  <SelectListControlled<DashboardFiltro> field="mes_inicio" control={control} options={optMesesDe} />
                </Col>
                {!isAnoTodo && (
                  <Col xs={12} sm={4} lg={2}>
                    <Label className="form-label mb-1">Até</Label>
                    <SelectListControlled<DashboardFiltro> field="mes_fim" control={control} options={optMesesAte} />
                  </Col>
                )}
              </Row>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              {semLancamentos && (
                <p className="text-muted">
                  Sem lançamentos neste período. Importe uma fatura ou altere o filtro.
                </p>
              )}
              <Row>
                {summaryCards.map((card) => (
                  <Col xl={3} md={6} key={card.title}>
                    <Card className={`card-animate ${card.highlight ? 'border-primary' : ''}`}>
                      <CardBody>
                        <div className="d-flex align-items-center">
                          <div className="flex-grow-1">
                            <p className="text-uppercase fw-medium text-muted mb-0">{card.title}</p>
                            <h4 className={`fs-22 fw-semibold ff-secondary mb-0 ${card.isCount ? '' : VALOR_TEXT_CLASS}`}>
                              {card.isCount ? (card.value ?? 0) : formatCurrency(card.value)}
                            </h4>
                          </div>
                          <div className="avatar-sm flex-shrink-0">
                            <span className={`avatar-title bg-${card.color}-subtle rounded fs-3`}>
                              <i className={`${card.icon} text-${card.color}`}></i>
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row>
                <Col xl={8}>
                  <Card>
                    <CardBody>
                      <h5 className="card-title mb-3">
                        Evolução mensal ({resumo?.periodo?.ano || filtroAtual.ano})
                      </h5>
                      <ReactApexChart
                        type="bar"
                        height={320}
                        series={[{ name: 'Total líquido', data: serieMensal }]}
                        options={{
                          chart: {
                            toolbar: { show: false },
                            events: {
                              dataPointSelection: (_event, _ctx, config) => {
                                handleBarClick(Number(config.dataPointIndex) + 1)
                              },
                            },
                          },
                          states: { active: { filter: { type: 'none' } } },
                          plotOptions: {
                            bar: { distributed: true, columnWidth: '55%', borderRadius: 4 },
                          },
                          dataLabels: { enabled: false },
                          legend: { show: false },
                          xaxis: { categories: MESES_ABREV_DASHBOARD },
                          yaxis: {
                            labels: {
                              formatter: (val: number) => formatCurrency(val),
                            },
                          },
                          tooltip: {
                            y: { formatter: (val: number) => formatCurrency(val) },
                          },
                          colors: coresMensal,
                        }}
                      />
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4}>
                  <Card>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">Por categoria</h5>
                        <Link to="/gastos-por-categoria" className="btn btn-sm btn-soft-primary">
                          Ver por categoria e subcategoria
                        </Link>
                      </div>
                      {categoriasSeries.length === 0 ? (
                        <p className="text-muted mb-0">Sem dados no período.</p>
                      ) : (
                        <ReactApexChart
                          type="donut"
                          height={320}
                          series={categoriasSeries}
                          options={{
                            labels: categoriasLabels,
                            colors: categoriasCores,
                            legend: { position: 'bottom' },
                            chart: {
                              events: {
                                dataPointSelection: (_event, _ctx, config) => {
                                  const item = resumo?.por_categoria?.[config.dataPointIndex]
                                  if (item?.categoria_id) {
                                    navigate(`/gastos-por-categoria?categoria_id=${item.categoria_id}`)
                                    return
                                  }
                                  navigate('/gastos-por-categoria')
                                },
                              },
                            },
                            tooltip: {
                              y: { formatter: (val: number) => formatCurrency(val) },
                            },
                          }}
                        />
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col xl={6}>
                  <Card>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">Por responsável</h5>
                        <Link to="/responsaveis" className="btn btn-sm btn-soft-primary">Gerenciar</Link>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Nome</th>
                              <th>Tipo</th>
                              <th className={VALOR_TEXT_CLASS}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(resumo?.por_responsavel || []).length === 0 ? (
                              <tr><td colSpan={3} className="text-muted text-center">Sem dados</td></tr>
                            ) : (
                              resumo?.por_responsavel.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.nome}</td>
                                  <td>
                                    <span className={`badge bg-${item.tipo === 'empresa' ? 'secondary' : 'primary'}-subtle text-${item.tipo === 'empresa' ? 'secondary' : 'primary'}`}>
                                      {item.tipo || '-'}
                                    </span>
                                  </td>
                                  <td className={VALOR_TEXT_CLASS}>{formatCurrency(item.total)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={6}>
                  <Card>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">Por cartão / tipo</h5>
                        <Link to="/transacoes" className="btn btn-sm btn-soft-primary">Ver transações</Link>
                      </div>
                      <Row>
                        <Col md={6}>
                          <h6 className="text-muted">Cartões</h6>
                          <ul className="list-unstyled mb-0">
                            {(resumo?.por_cartao || []).map((item, idx) => (
                              <li key={idx} className="d-flex justify-content-between py-1 border-bottom">
                                <span className="d-flex align-items-center gap-2">
                                  {item.cor_fundo && (
                                    <CartaoChip
                                      cor_fundo={item.cor_fundo}
                                      cor_texto={item.cor_texto}
                                      label={item.nome ? String(item.nome).slice(0, 1) : '•'}
                                    />
                                  )}
                                  {item.nome}
                                </span>
                                <strong className={VALOR_TEXT_CLASS}>{formatCurrency(item.total)}</strong>
                              </li>
                            ))}
                            {(resumo?.por_cartao || []).length === 0 && (
                              <li className="text-muted">Sem dados</li>
                            )}
                          </ul>
                        </Col>
                        <Col md={6}>
                          <h6 className="text-muted">Tipos</h6>
                          <ul className="list-unstyled mb-0">
                            {(resumo?.por_tipo || []).map((item, idx) => (
                              <li key={idx} className="d-flex justify-content-between py-1 border-bottom">
                                <span>{tipoTransacaoLabel[item.tipo] || item.tipo}</span>
                                <strong className={VALOR_TEXT_CLASS}>{formatCurrency(item.total)}</strong>
                              </li>
                            ))}
                            {(resumo?.por_tipo || []).length === 0 && (
                              <li className="text-muted">Sem dados</li>
                            )}
                          </ul>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default DashboardsHome
