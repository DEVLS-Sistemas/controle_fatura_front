import React from 'react'
import { Card, CardBody, Col, Progress, Row } from 'reactstrap'
import { formatPercentual } from 'helpers/compra_visualizacao_helpers'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'

interface CompraVisualizacaoResumoProps {
  compra: CompraVisualizacaoView
}

const CompraVisualizacaoResumo = ({ compra }: CompraVisualizacaoResumoProps) => {
  const pct = Math.min(100, Math.max(0, Number(compra.percentual_pago ?? 0)))
  const pagas = Number(compra.parcelas_pagas ?? 0)
  const restantes = Number(compra.parcelas_restantes ?? 0)

  return (
    <React.Fragment>
      <Row className="g-3 mb-3">
        <Col xl={3} md={6}>
          <Card className="card-animate mb-0">
            <CardBody>
              <p className="text-uppercase fw-medium text-muted mb-1">Total</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-0 ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(compra.valor_total)}
              </h4>
              {compra.valor_parcela != null && !compra.avista ? (
                <p className={`text-muted mb-0 mt-1 fs-13 ${VALOR_TEXT_CLASS}`}>
                  Parcela {formatCurrency(compra.valor_parcela)}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="card-animate mb-0">
            <CardBody>
              <p className="text-uppercase fw-medium text-muted mb-1">Pago</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-0 text-success ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(compra.valor_pago)}
              </h4>
              <p className="text-muted mb-0 mt-1 fs-13">
                {pagas === 1 ? '1 parcela' : `${pagas} parcelas`}
              </p>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="card-animate mb-0">
            <CardBody>
              <p className="text-uppercase fw-medium text-muted mb-1">Em aberto</p>
              <h4 className={`fs-22 fw-semibold ff-secondary mb-0 text-warning ${VALOR_TEXT_CLASS}`}>
                {formatCurrency(compra.valor_aberto)}
              </h4>
              <p className="text-muted mb-0 mt-1 fs-13">
                {restantes === 1 ? '1 restante' : `${restantes} restantes`}
              </p>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="card-animate mb-0">
            <CardBody>
              <p className="text-uppercase fw-medium text-muted mb-1">Progresso</p>
              <div className="d-flex align-items-center gap-2">
                <Progress
                  value={pct}
                  color="primary"
                  className="flex-grow-1 mb-0"
                  style={{ height: 8 }}
                  barAriaValueText={formatPercentual(compra.percentual_pago)}
                />
                <span className="fw-semibold fs-14">{formatPercentual(compra.percentual_pago)}</span>
              </div>
              {!compra.avista && compra.estimativa_termino ? (
                <p className="text-muted mb-0 mt-2 fs-13">
                  Termina em {compra.estimativa_termino}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default CompraVisualizacaoResumo
