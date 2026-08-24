import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatPercentual } from 'helpers/compra_visualizacao_helpers'
import { formatCurrency, formatDateBr, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import {
    buildComprasAtalhoPath,
    buildFaturaResponsavelAtalhoPath,
    buildRankingAtalhoPath,
    buildRepassesAtalhoPath,
} from 'helpers/responsavel_visualizar_helpers'
import { ResponsavelVisualizarView } from 'interfaces/Responsaveis/ResponsaveisInterface'

interface ResponsaveisVisualizarContadoresProps {
    data: ResponsavelVisualizarView
}

const CounterCard = ({
    to,
    disabled,
    title,
    qty,
    value,
    valueClassName,
    subtitle,
    icon,
}: {
    to?: string | null
    disabled?: boolean
    title: string
    qty: React.ReactNode
    value: number | string | null | undefined
    valueClassName?: string
    subtitle?: React.ReactNode
    icon: string
}) => {
    const inner = (
        <Card className={`card-animate h-100 mb-0 ${disabled ? 'opacity-75' : ''}`} style={to && !disabled ? { cursor: 'pointer' } : undefined}>
            <CardBody>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <p className="text-uppercase fw-medium text-muted mb-0">{title}</p>
                    <span className="avatar-xs">
                        <span className="avatar-title bg-light text-primary rounded-circle fs-16">
                            <i className={icon}></i>
                        </span>
                    </span>
                </div>
                <h4 className="fs-20 fw-semibold mb-1">{qty}</h4>
                <h5 className={`fs-18 fw-semibold ff-secondary mb-0 ${VALOR_TEXT_CLASS} ${valueClassName || ''}`}>
                    {formatCurrency(value)}
                </h5>
                {subtitle ? <p className="text-muted mb-0 mt-2 fs-13">{subtitle}</p> : null}
            </CardBody>
        </Card>
    )

    if (!to || disabled) return inner

    return (
        <Link to={to} className="text-reset text-decoration-none d-block h-100">
            {inner}
        </Link>
    )
}

const ResponsaveisVisualizarContadores = ({ data }: ResponsaveisVisualizarContadoresProps) => {
    const totais = data.totais ?? { compras: 0, valor_total: 0 }
    const emAberto = data.em_aberto ?? { compras: 0, valor_aberto: 0 }
    const repasse = data.repasse ?? { compras_abertas: 0, valor_aberto: 0 }
    const competencia = data.competencia ?? {
        mes: data.referencia?.mes ?? new Date().getMonth() + 1,
        ano: data.referencia?.ano ?? new Date().getFullYear(),
        label: data.referencia?.label ?? '',
        compras: 0,
        valor_total: 0,
    }
    const atalhos = data.atalhos
    const fallback = { id: data.id, mes: data.referencia?.mes ?? competencia?.mes, ano: data.referencia?.ano ?? competencia?.ano }

    const comprasPath = buildComprasAtalhoPath(atalhos?.compras, data.id)
    const rankingPath = buildRankingAtalhoPath(atalhos?.ranking_parceladas, fallback)
    const repassesPath = buildRepassesAtalhoPath(atalhos?.repasses, fallback)
    const faturaPath = buildFaturaResponsavelAtalhoPath(atalhos?.fatura_responsavel, fallback)

    const ticket = totais.ticket_medio != null ? formatCurrency(totais.ticket_medio) : null
    const primeira = totais.primeira_compra ? formatDateBr(totais.primeira_compra.slice(0, 10)) : null
    const ultima = totais.ultima_compra ? formatDateBr(totais.ultima_compra.slice(0, 10)) : null

    return (
        <Row className="g-3 mb-3">
            <Col xl={3} md={6}>
                <CounterCard
                    to={comprasPath}
                    icon="ri-shopping-bag-3-line"
                    title="Compras"
                    qty={totais.compras === 1 ? '1 compra' : `${totais.compras} compras`}
                    value={totais.valor_total}
                    subtitle={
                        <>
                            {totais.avista ?? 0} à vista · {totais.parceladas ?? 0} parceladas
                            {ticket ? ` · ticket ${ticket}` : ''}
                            {primeira || ultima ? (
                                <span className="d-block mt-1">
                                    {primeira ? `Desde ${primeira}` : ''}
                                    {primeira && ultima ? ' · ' : ''}
                                    {ultima ? `última ${ultima}` : ''}
                                </span>
                            ) : null}
                        </>
                    }
                />
            </Col>
            <Col xl={3} md={6}>
                <CounterCard
                    to={rankingPath}
                    icon="ri-time-line"
                    title="Em aberto"
                    qty={
                        <>
                            {emAberto.compras === 1 ? '1 compra' : `${emAberto.compras} compras`}
                            {emAberto.parcelas_restantes != null ? (
                                <span className="d-block fs-13 fw-normal text-muted">
                                    {emAberto.parcelas_restantes === 1
                                        ? '1 parcela restante'
                                        : `${emAberto.parcelas_restantes} parcelas restantes`}
                                </span>
                            ) : null}
                        </>
                    }
                    value={emAberto.valor_aberto}
                    valueClassName="text-warning"
                    subtitle={`${formatPercentual(emAberto.percentual_pago)} já caiu na fatura`}
                />
            </Col>
            <Col xl={3} md={6}>
                <CounterCard
                    to={data.eh_eu ? null : repassesPath}
                    disabled={Boolean(data.eh_eu)}
                    icon="ri-hand-coin-line"
                    title="A receber"
                    qty={
                        data.eh_eu
                            ? 'Não se aplica'
                            : (repasse.compras_abertas === 1
                                ? '1 compra aberta'
                                : `${repasse.compras_abertas} compras abertas`)
                    }
                    value={repasse.valor_aberto}
                    valueClassName={data.eh_eu ? 'text-muted' : 'text-danger'}
                    subtitle={
                        data.eh_eu
                            ? 'Você não se paga — o card de em aberto cobre parcelas futuras.'
                            : (
                                <>
                                    <CurrencyValue value={repasse.valor_aberto_na_referencia} className="text-muted" />
                                    {' nesta competência'}
                                </>
                            )
                    }
                />
            </Col>
            <Col xl={3} md={6}>
                <CounterCard
                    to={faturaPath}
                    icon="ri-file-list-3-line"
                    title="Neste mês"
                    qty={competencia.compras === 1 ? '1 compra' : `${competencia.compras} compras`}
                    value={competencia.valor_total}
                    valueClassName="text-primary"
                    subtitle={
                        <>
                            {competencia.label}
                            {competencia.ocorrencias != null
                                ? ` · ${competencia.ocorrencias} ${competencia.ocorrencias === 1 ? 'lançamento' : 'lançamentos'}`
                                : ''}
                        </>
                    }
                />
            </Col>
        </Row>
    )
}

export default ResponsaveisVisualizarContadores
