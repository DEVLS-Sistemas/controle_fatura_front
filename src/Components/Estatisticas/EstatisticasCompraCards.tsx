import React from 'react'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, formatDateBr, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPeriodoAplicado, formatTaxa, frequenciaLabel } from 'helpers/estatisticas_helpers'
import { EstatisticasCompra } from 'interfaces/Estatisticas/EstatisticasCompraInterface'

export type EstatisticasCompraCardsProps = {
    estatisticas?: EstatisticasCompra
    tituloFrequencia?: string
    nomeLocal?: string
}

const EstatisticasCompraCards = ({
    estatisticas,
    tituloFrequencia,
    nomeLocal,
}: EstatisticasCompraCardsProps) => {
    const compras = estatisticas?.compras ?? 0
    const ocorrencias = estatisticas?.ocorrencias
    const valorTotal = estatisticas?.valor_total ?? 0
    const ticketMedio = estatisticas?.ticket_medio
    const frequencia = estatisticas?.frequencia
    const label = tituloFrequencia ?? frequenciaLabel(estatisticas)
    const periodoDias = frequencia?.periodo_dias ?? estatisticas?.periodo?.dias
    const periodoTexto = formatPeriodoAplicado(estatisticas?.periodo)
    const semCompras = compras === 0

    return (
        <div>
            {periodoTexto && (
                <p className="text-muted small mb-3">{periodoTexto}</p>
            )}

            <Row>
                <Col md={4} className="mb-3">
                    <Card className="border h-100 mb-0">
                        <CardBody>
                            <div className="text-muted text-uppercase small">Compras</div>
                            <div className="fs-3 fw-semibold">{compras}</div>
                            {ocorrencias != null && (
                                <div className="text-muted small">
                                    {ocorrencias} lançamento{ocorrencias === 1 ? '' : 's'}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="border h-100 mb-0">
                        <CardBody>
                            <div className="text-muted text-uppercase small">Total gasto</div>
                            <div className={`fs-3 fw-semibold ${VALOR_TEXT_CLASS}`}>{formatCurrency(valorTotal)}</div>
                            {ticketMedio != null && compras > 0 && (
                                <div className="text-muted small">
                                    ticket médio {formatCurrency(ticketMedio)}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="border h-100 mb-0">
                        <CardBody>
                            <div className="text-muted text-uppercase small">Frequência</div>
                            <div className="fs-5 fw-semibold">{label}</div>
                            {!semCompras && periodoDias != null && (
                                <div className="text-muted small">
                                    {compras} {compras === 1 ? 'compra' : 'compras'} em {periodoDias}{' '}
                                    {periodoDias === 1 ? 'dia' : 'dias'}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {semCompras ? (
                <p className="text-muted mb-0">Sem compras neste período</p>
            ) : (
                <>
                    {compras > 1 && frequencia?.label && (
                        <p className="mb-3">
                            No período você comprou <strong>{compras} vezes</strong>
                            {nomeLocal ? <> em <strong>{nomeLocal}</strong></> : null}
                            . Isso equivale a <strong>{frequencia.label}</strong>
                            {frequencia.por_mes != null && (
                                <> ({formatTaxa(frequencia.por_mes, 'mês')})</>
                            )}
                            .
                        </p>
                    )}

                    <Row className="text-center">
                        <Col xs={6} md={3} className="mb-3">
                            <div className="border rounded py-2 px-1 h-100">
                                <div className="fw-semibold">{formatTaxa(frequencia?.por_dia, 'dia')}</div>
                                <div className="text-muted small">por dia</div>
                            </div>
                        </Col>
                        <Col xs={6} md={3} className="mb-3">
                            <div className="border rounded py-2 px-1 h-100">
                                <div className="fw-semibold">{formatTaxa(frequencia?.por_semana, 'semana')}</div>
                                <div className="text-muted small">por semana</div>
                            </div>
                        </Col>
                        <Col xs={6} md={3} className="mb-3">
                            <div className="border rounded py-2 px-1 h-100">
                                <div className="fw-semibold">{formatTaxa(frequencia?.por_mes, 'mês')}</div>
                                <div className="text-muted small">por mês</div>
                            </div>
                        </Col>
                        <Col xs={6} md={3} className="mb-3">
                            <div className="border rounded py-2 px-1 h-100">
                                <div className="fw-semibold">{formatTaxa(frequencia?.por_ano, 'ano')}</div>
                                <div className="text-muted small">por ano</div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4} className="mb-2">
                            <div className="text-muted small">Primeira compra</div>
                            <div>{formatDateBr(estatisticas?.primeira_compra)}</div>
                        </Col>
                        <Col md={4} className="mb-2">
                            <div className="text-muted small">Última compra</div>
                            <div>{formatDateBr(estatisticas?.ultima_compra)}</div>
                        </Col>
                        <Col md={4} className="mb-2">
                            <div className="text-muted small">Desde a última</div>
                            <div>
                                {estatisticas?.dias_desde_ultima != null
                                    ? `há ${estatisticas.dias_desde_ultima} ${estatisticas.dias_desde_ultima === 1 ? 'dia' : 'dias'}`
                                    : '—'}
                            </div>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    )
}

export default EstatisticasCompraCards
