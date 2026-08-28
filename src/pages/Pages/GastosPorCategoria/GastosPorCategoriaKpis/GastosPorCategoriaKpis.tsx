import React from 'react'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPercentualApi, formatVariacao } from 'helpers/gastos_criticos_helpers'
import { GastosPorCategoriaKpiView } from 'helpers/gastos_por_categoria_helpers'

interface GastosPorCategoriaKpisProps {
  kpis: GastosPorCategoriaKpiView
  loading?: boolean
  onVerCompras?: () => void
}

const KpiSkeleton = () => (
  <Row className="g-3 mb-3">
    {[0, 1, 2].map((idx) => (
      <Col md={4} key={idx}>
        <Card className="mb-0">
          <CardBody>
            <div className="placeholder-glow">
              <span className="placeholder col-6 mb-2"></span>
              <span className="placeholder col-8"></span>
            </div>
          </CardBody>
        </Card>
      </Col>
    ))}
  </Row>
)

const GastosPorCategoriaKpis = ({ kpis, loading, onVerCompras }: GastosPorCategoriaKpisProps) => {
  if (loading) return <KpiSkeleton />

  const variacao =
    kpis.variacao_valor_percentual == null ? null : formatVariacao(kpis.variacao_valor_percentual)
  const cards = [
    { title: 'Gasto', value: formatCurrency(kpis.valor_total), money: true },
    {
      title: 'Compras',
      value: `${kpis.compras ?? 0}`,
      money: false,
    },
    {
      title: 'Ticket médio',
      value: kpis.ticket_medio == null ? '—' : formatCurrency(kpis.ticket_medio),
      money: kpis.ticket_medio != null,
    },
  ]

  return (
    <Row className="g-3 mb-3">
      {cards.map((card) => (
        <Col md={4} key={card.title}>
          <Card className="mb-0 card-animate">
            <CardBody>
              <p className="text-uppercase fw-medium text-muted mb-1 fs-12">{card.title}</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-1 ${card.money ? VALOR_TEXT_CLASS : ''}`}>
                {card.value}
              </h4>
              <p className="text-muted mb-0 fs-13">{kpis.label}</p>
              {card.title === 'Gasto' && kpis.mostrarVariacao && variacao ? (
                <span className={`badge bg-${variacao.color}-subtle text-${variacao.color} mt-2`}>
                  {variacao.label}
                </span>
              ) : null}
              {card.title === 'Gasto' && kpis.mostrarVariacao && kpis.variacao_valor_percentual == null ? (
                <span className="badge bg-info-subtle text-info mt-2">Novo</span>
              ) : null}
            </CardBody>
          </Card>
        </Col>
      ))}
      {onVerCompras ? (
        <Col xs={12} className="pt-0">
          <button type="button" className="btn btn-soft-primary btn-sm" onClick={onVerCompras}>
            Ver compras
          </button>
        </Col>
      ) : null}
    </Row>
  )
}

export default GastosPorCategoriaKpis
