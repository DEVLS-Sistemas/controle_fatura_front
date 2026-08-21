import React from 'react'
import { Card, CardBody, Col, Progress, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { RankingParceladasTotais } from 'interfaces/RankingParceladas/RankingParceladasInterface'

const formatPercentual = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(Number(pct))) return '0%'
  return `${Number(pct).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`
}

interface RankingParceladasResumoProps {
  totais?: RankingParceladasTotais
}

const RankingParceladasResumo = ({ totais }: RankingParceladasResumoProps) => (
  <Row className="g-3 mb-3">
    <Col xl={3} md={6}>
      <Card className="card-animate mb-0">
        <CardBody>
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <p className="text-uppercase fw-medium text-muted mb-0">Compras</p>
              <h4 className="fs-22 fw-semibold ff-secondary mb-0">{totais?.compras ?? 0}</h4>
            </div>
            <div className="avatar-sm flex-shrink-0">
              <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                <i className="ri-shopping-bag-3-line"></i>
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
    <Col xl={3} md={6}>
      <Card className="card-animate mb-0">
        <CardBody>
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <p className="text-uppercase fw-medium text-muted mb-0">Pago</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-0 ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(totais?.valor_pago)}
              </h4>
            </div>
            <div className="avatar-sm flex-shrink-0">
              <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                <i className="ri-checkbox-circle-line"></i>
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
    <Col xl={3} md={6}>
      <Card className="card-animate mb-0">
        <CardBody>
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <p className="text-uppercase fw-medium text-muted mb-0">Em aberto</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-0 ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(totais?.valor_aberto)}
              </h4>
            </div>
            <div className="avatar-sm flex-shrink-0">
              <span className="avatar-title bg-warning-subtle text-warning rounded fs-3">
                <i className="ri-time-line"></i>
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
    <Col xl={3} md={6}>
      <Card className="card-animate mb-0">
        <CardBody>
          <p className="text-uppercase fw-medium text-muted mb-1">% quitado</p>
          <div className="d-flex align-items-center gap-2">
            <Progress
              value={Math.min(100, Math.max(0, Number(totais?.percentual_pago ?? 0)))}
              color="primary"
              className="flex-grow-1 mb-0"
              style={{ height: 8 }}
              barAriaValueText={formatPercentual(totais?.percentual_pago)}
            />
            <span className="fw-semibold fs-14">{formatPercentual(totais?.percentual_pago)}</span>
          </div>
          <p className={`text-muted mb-0 mt-2 fs-13 ${VALOR_TEXT_CLASS}`}>
            Total {formatCurrency(totais?.valor_total)}
          </p>
        </CardBody>
      </Card>
    </Col>
  </Row>
)

export default RankingParceladasResumo
