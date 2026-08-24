import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { SimuladorImpacto } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

const percentualTone = (pct: number | null): 'success' | 'warning' | 'danger' | 'secondary' => {
  if (pct == null) return 'secondary'
  if (pct > 80) return 'danger'
  if (pct >= 50) return 'warning'
  return 'success'
}

const DeltaLinha = ({
  label,
  antes,
  depois,
  simulado,
  muted,
}: {
  label: string
  antes: number
  depois: number
  simulado: number
  muted?: boolean
}) => (
  <div className={`d-flex justify-content-between align-items-baseline gap-2 ${muted ? 'text-muted' : ''}`}>
    <span className="fs-13">{label}</span>
    <span className={`text-end ${VALOR_TEXT_CLASS}`}>
      {formatCurrency(antes)}
      <span className="mx-1">→</span>
      <strong>{formatCurrency(depois)}</strong>
      {simulado > 0 && (
        <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '0.65rem' }}>
          +{formatCurrency(simulado)}
        </span>
      )}
      {simulado === 0 && muted && (
        <span className="badge bg-light text-muted ms-1" style={{ fontSize: '0.65rem' }}>
          inalterado
        </span>
      )}
    </span>
  </div>
)

type Props = {
  impacto: SimuladorImpacto | null
  temOverlay: boolean
  responsavelNome: string
  ehEu: boolean
  cartaoNome: string
  qtdParcelasJanela: number
  faturaPath?: string
  visualizarPath?: string
}

const SimuladorCompraImpacto = ({
  impacto,
  temOverlay,
  responsavelNome,
  ehEu,
  cartaoNome,
  qtdParcelasJanela,
  faturaPath,
  visualizarPath,
}: Props) => {
  const labelMes = impacto?.competencia?.label || '—'
  const nome = ehEu ? 'você' : responsavelNome || 'o responsável'
  const tomLimite = percentualTone(impacto?.fatura_cartao.percentual_em_uso_depois ?? null)
  const alertaLimite = temOverlay && Number(impacto?.fatura_cartao.percentual_em_uso_depois) > 80

  return (
    <Row className="g-3 mb-3">
      <Col md={4}>
        <Card className="h-100 mb-0">
          <CardBody>
            <span className="text-muted fs-12 text-uppercase">Neste cartão</span>
            <h5 className="mt-1 mb-1">{cartaoNome || 'Cartão'}</h5>
            <p className="text-muted fs-12 mb-3">
              O que {nome} já deve neste cartão + esta compra
              {impacto?.competencia ? ` · ${labelMes}` : ''}
            </p>
            {temOverlay && impacto ? (
              <>
                <div className={`fs-4 fw-semibold ${VALOR_TEXT_CLASS}`}>
                  <CurrencyValue value={impacto.neste_cartao.depois} />
                </div>
                <DeltaLinha
                  label="Antes → depois"
                  antes={impacto.neste_cartao.antes}
                  depois={impacto.neste_cartao.depois}
                  simulado={impacto.neste_cartao.simulado}
                />
                <span className="text-muted fs-12">
                  {qtdParcelasJanela} parcela{qtdParcelasJanela === 1 ? '' : 's'} na janela
                </span>
              </>
            ) : (
              <p className="text-muted mb-0">
                {impacto ? formatCurrency(impacto.neste_cartao.antes) : '—'}
              </p>
            )}
          </CardBody>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100 mb-0 border-primary">
          <CardBody>
            <span className="text-muted fs-12 text-uppercase">
              {ehEu ? 'Meu total' : 'Geral · todos os cartões'}
            </span>
            <h5 className="mt-1 mb-1">{ehEu ? 'Meu comprometimento' : `Fatura de ${responsavelNome || '—'}`}</h5>
            <p className="text-muted fs-12 mb-3">
              {ehEu
                ? 'Quanto você compromete no mês — inclui outros cartões'
                : 'Fatura virtual dele no mês — inclui outros cartões'}
              {impacto?.competencia ? ` · ${labelMes}` : ''}
            </p>
            {temOverlay && impacto ? (
              <>
                <DeltaLinha
                  label="Neste cartão"
                  antes={impacto.neste_cartao.antes}
                  depois={impacto.neste_cartao.depois}
                  simulado={impacto.neste_cartao.simulado}
                />
                <DeltaLinha
                  label="Outros cartões"
                  antes={impacto.outros_cartoes.antes}
                  depois={impacto.outros_cartoes.depois}
                  simulado={0}
                  muted
                />
                <hr className="my-2" />
                <DeltaLinha
                  label={ehEu ? 'Total' : `Total d${responsavelNome ? 'e ' + responsavelNome.split(' ')[0] : 'ele'}`}
                  antes={impacto.geral_responsavel.antes}
                  depois={impacto.geral_responsavel.depois}
                  simulado={impacto.geral_responsavel.simulado}
                />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {faturaPath && (
                    <Link to={faturaPath} className="fs-12">
                      Fatura do responsável
                    </Link>
                  )}
                  {visualizarPath && (
                    <Link to={visualizarPath} className="fs-12">
                      Ver responsável
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted mb-0">
                {impacto ? formatCurrency(impacto.geral_responsavel.antes) : '—'}
              </p>
            )}
          </CardBody>
        </Card>
      </Col>
      <Col md={4}>
        <Card className={`h-100 mb-0 ${alertaLimite ? 'border-danger' : ''}`}>
          <CardBody>
            <span className="text-muted fs-12 text-uppercase">Fatura do cartão</span>
            <h5 className="mt-1 mb-1">Todo mundo neste cartão</h5>
            <p className="text-muted fs-12 mb-3">
              Limite · em uso · livre depois da simulação
              {impacto?.competencia ? ` · ${labelMes}` : ''}
            </p>
            {temOverlay && impacto ? (
              <>
                <DeltaLinha
                  label="Fatura"
                  antes={impacto.fatura_cartao.antes}
                  depois={impacto.fatura_cartao.depois}
                  simulado={impacto.fatura_cartao.simulado}
                />
                {impacto.fatura_cartao.limite != null && Number(impacto.fatura_cartao.limite) > 0 ? (
                  <div className="mt-2 fs-13">
                    <div>
                      Limite <strong>{formatCurrency(impacto.fatura_cartao.limite)}</strong>
                    </div>
                    <div className={`text-${tomLimite}`}>
                      Em uso{' '}
                      <strong>
                        {impacto.fatura_cartao.percentual_em_uso_depois != null
                          ? `${Math.round(impacto.fatura_cartao.percentual_em_uso_depois)}%`
                          : '—'}
                      </strong>
                    </div>
                    <div className="text-muted">
                      Livre{' '}
                      {formatCurrency(impacto.fatura_cartao.livre_depois)}{' '}
                      {impacto.fatura_cartao.percentual_livre_depois != null
                        ? `(${Math.round(impacto.fatura_cartao.percentual_livre_depois)}%)`
                        : ''}
                    </div>
                    {alertaLimite && (
                      <div className="text-danger fs-12 mt-1">Uso do limite acima de 80% depois desta compra.</div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted fs-12">Sem limite cadastrado neste cartão.</span>
                )}
              </>
            ) : (
              <p className="text-muted mb-0">
                {impacto ? formatCurrency(impacto.fatura_cartao.antes) : '—'}
              </p>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default SimuladorCompraImpacto
