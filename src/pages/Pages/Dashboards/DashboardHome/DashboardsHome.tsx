import React, { useEffect, useState } from 'react'
import { Card, CardBody, Col, Container, Label, Row, Spinner } from 'reactstrap'
import ReactApexChart from 'react-apexcharts'
import { DashboardService, DashboardResumo } from 'services/Dashboard'
import { formatCurrency, tipoTransacaoLabel, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

const DashboardsHome = () => {
  const dashboardService = new DashboardService()
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState<number | ''>('')
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)

  const loadResumo = async () => {
    setLoading(true)
    try {
      const data = await dashboardService.getResumo({
        ano,
        mes: mes === '' ? null : Number(mes),
      })
      setResumo(data || null)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes])

  const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const serieMensal = Array.from({ length: 12 }, (_, i) => {
    const found = resumo?.por_mes?.find((m) => m.mes === i + 1)
    return found ? Number(found.total) : 0
  })

  const categoriasLabels = resumo?.por_categoria?.map((c) => c.nome) || []
  const categoriasSeries = resumo?.por_categoria?.map((c) => Number(c.total)) || []
  const categoriasCores = resumo?.por_categoria?.map((c) => c.cor || '#6b7280') || []

  const summaryCards = [
    { title: 'Compras', value: resumo?.totais?.total_compras, icon: 'ri-shopping-bag-line', color: 'danger' },
    { title: 'Pagamentos', value: resumo?.totais?.total_pagamentos, icon: 'ri-bank-card-line', color: 'success' },
    { title: 'Líquido', value: resumo?.totais?.total_liquido, icon: 'ri-funds-line', color: 'primary' },
    { title: 'Transações', value: resumo?.totais?.total_transacoes, icon: 'ri-list-check-2', color: 'info', isCount: true },
  ]

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-lg-center flex-lg-row flex-column gap-3">
                <div className="flex-grow-1">
                  <h4 className="fs-16 mb-1">Dashboard</h4>
                  <p className="text-muted mb-0">Resumo das faturas e gastos do período</p>
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-end">
                  <Link to="/raio-x" className="btn btn-soft-success mb-1">
                    <i className="ri-pulse-line align-middle me-1"></i>
                    Raio-X
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
                  <div>
                    <Label className="form-label mb-1">Ano</Label>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: 110 }}
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="form-label mb-1">Mês</Label>
                    <select
                      className="form-select"
                      style={{ width: 120 }}
                      value={mes}
                      onChange={(e) => setMes(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">Ano todo</option>
                      {mesesLabels.map((label, idx) => (
                        <option key={label} value={idx + 1}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <Row>
                {summaryCards.map((card) => (
                  <Col xl={3} md={6} key={card.title}>
                    <Card className="card-animate">
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
                      <h5 className="card-title mb-3">Evolução mensal ({ano})</h5>
                      <ReactApexChart
                        type="area"
                        height={320}
                        series={[{ name: 'Total líquido', data: serieMensal }]}
                        options={{
                          chart: { toolbar: { show: false } },
                          dataLabels: { enabled: false },
                          stroke: { curve: 'smooth', width: 2 },
                          xaxis: { categories: mesesLabels },
                          yaxis: {
                            labels: {
                              formatter: (val: number) => formatCurrency(val),
                            },
                          },
                          tooltip: {
                            y: { formatter: (val: number) => formatCurrency(val) },
                          },
                          colors: ['#405189'],
                        }}
                      />
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4}>
                  <Card>
                    <CardBody>
                      <h5 className="card-title mb-3">Por categoria</h5>
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
