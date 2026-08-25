import React from 'react'
import { Card, CardBody, Col, Row, Spinner } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { AssinaturasTotais } from 'interfaces/Assinaturas/AssinaturasInterface'

interface AssinaturasHeroProps {
  totais?: AssinaturasTotais
  loading?: boolean
  onRevisar?: () => void
}

const AssinaturasHero = ({ totais, loading, onRevisar }: AssinaturasHeroProps) => {
  const pendentes = Number(totais?.pendentes_confirmacao ?? totais?.candidatas ?? 0)
  const assinaturas = Number(totais?.assinaturas ?? totais?.confirmadas ?? 0)

  if (loading && !totais) {
    return (
      <Row className="g-3 mb-3">
        {[1, 2, 3].map((i) => (
          <Col xl={4} md={4} key={i}>
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
  }

  if (!totais) return null

  return (
    <Row className="g-3 mb-3">
      <Col xl={4} md={4}>
        <Card className="card-animate mb-0 border-primary border-opacity-25">
          <CardBody>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <p className="text-uppercase fw-medium text-muted mb-0">Por ano</p>
                <h4 className={`fs-22 fw-semibold ff-secondary mb-1 ${VALOR_TEXT_CLASS}`}>
                  {formatCurrency(totais?.estimativa_anual)}
                </h4>
                {totais?.gasto_12_meses != null ? (
                  <p className={`text-muted mb-0 fs-12 ${VALOR_TEXT_CLASS}`}>
                    Nos últimos 12 meses você já pagou {formatCurrency(totais.gasto_12_meses)}
                  </p>
                ) : null}
              </div>
              <div className="avatar-sm flex-shrink-0">
                <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                  <i className="ri-calendar-event-line"></i>
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col xl={4} md={4}>
        <Card className="card-animate mb-0">
          <CardBody>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <p className="text-uppercase fw-medium text-muted mb-0">Por mês</p>
                <h4 className={`fs-22 fw-semibold ff-secondary mb-0 ${VALOR_TEXT_CLASS}`}>
                  {formatCurrency(totais?.estimativa_mensal)}
                </h4>
              </div>
              <div className="avatar-sm flex-shrink-0">
                <span className="avatar-title bg-info-subtle text-info rounded fs-3">
                  <i className="ri-repeat-line"></i>
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
      <Col xl={4} md={4}>
        <Card className="card-animate mb-0">
          <CardBody>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <p className="text-uppercase fw-medium text-muted mb-0">Assinaturas</p>
                <h4 className="fs-22 fw-semibold ff-secondary mb-1">
                  {assinaturas}
                  {loading ? (
                    <Spinner size="sm" className="ms-2" color="secondary" />
                  ) : null}
                </h4>
                {pendentes > 0 && onRevisar ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-soft-warning mt-2"
                    onClick={onRevisar}
                  >
                    {pendentes} para confirmar
                  </button>
                ) : (
                  <p className="text-muted mb-0 fs-12">Lista oficial</p>
                )}
              </div>
              <div className="avatar-sm flex-shrink-0">
                <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                  <i className="ri-refresh-line"></i>
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default AssinaturasHero
