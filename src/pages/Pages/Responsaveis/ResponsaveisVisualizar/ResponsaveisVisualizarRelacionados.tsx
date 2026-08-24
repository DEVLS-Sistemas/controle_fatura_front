import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, CardHeader, Progress } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { CartaoChip } from 'helpers/cartao_helpers'
import { formatPercentual } from 'helpers/compra_visualizacao_helpers'
import {
    faturaStatusColor,
    formatCurrency,
    formatDateBr,
    getCategoriaFieldStyle,
    VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import {
    buildComprasAtalhoPath,
    buildCompraVisualizarPath,
    buildFaturaCartaoPath,
    buildFaturaResponsavelAtalhoPath,
    buildRankingAtalhoPath,
} from 'helpers/responsavel_visualizar_helpers'
import { ResponsavelVisualizarView } from 'interfaces/Responsaveis/ResponsaveisInterface'

interface ResponsaveisVisualizarRelacionadosProps {
    data: ResponsavelVisualizarView
}

const statusLabel = (status?: string | null) => {
    if (!status) return null
    return status.charAt(0).toUpperCase() + status.slice(1)
}

const ResponsaveisVisualizarRelacionados = ({ data }: ResponsaveisVisualizarRelacionadosProps) => {
    const navigate = useNavigate()
    const referencia = data.referencia
    const competencia = data.competencia
    const atalhos = data.atalhos
    const fallback = {
        id: data.id,
        mes: referencia?.mes ?? competencia?.mes,
        ano: referencia?.ano ?? competencia?.ano,
    }
    const faturaResponsavelPath = buildFaturaResponsavelAtalhoPath(atalhos?.fatura_responsavel, fallback)
    const rankingPath = buildRankingAtalhoPath(atalhos?.ranking_parceladas, fallback)
    const porCartao = data.por_cartao ?? []
    const porCategoria = data.por_categoria ?? []
    const parceladas = data.parceladas_abertas ?? []
    const recentes = data.compras_recentes ?? []
    const faturasPadrao = data.faturas_padrao ?? []
    const maxCategoria = Math.max(...porCategoria.map((c) => Number(c.valor_total || 0)), 1)

    return (
        <React.Fragment>
            <Card className="mb-3">
                <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h5 className="card-title mb-0">Por cartão · {competencia?.label || referencia?.label}</h5>
                    {faturaResponsavelPath ? (
                        <Link to={faturaResponsavelPath} className="btn btn-sm btn-soft-primary">
                            Fatura do responsável
                        </Link>
                    ) : null}
                </CardHeader>
                <CardBody>
                    {porCartao.length === 0 ? (
                        <div className="text-center py-3">
                            <p className="text-muted mb-2">
                                Nenhuma compra deste responsável em {competencia?.label || 'nesta competência'}.
                            </p>
                            {faturaResponsavelPath ? (
                                <Link to={faturaResponsavelPath} className="btn btn-soft-primary">
                                    Abrir fatura do responsável
                                </Link>
                            ) : null}
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {porCartao.map((cartao) => {
                                const faturas = cartao.faturas ?? []
                                const faturaPrincipal = buildFaturaCartaoPath(
                                    cartao.fatura_id ?? (faturas.length === 1 ? faturas[0].id : null)
                                )
                                const multiplas = faturas.length > 1
                                return (
                                    <div
                                        key={cartao.cartao_id}
                                        className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded px-3 py-2"
                                    >
                                        <div className="d-flex flex-wrap align-items-center gap-2 min-w-0">
                                            <CartaoChip
                                                cor_fundo={cartao.cor_fundo}
                                                cor_texto={cartao.cor_texto}
                                                label={cartao.cartao_nome}
                                            />
                                            <span className="text-muted fs-13">
                                                {cartao.compras === 1 ? '1 compra' : `${cartao.compras} compras`}
                                                {cartao.ocorrencias != null
                                                    ? ` · ${cartao.ocorrencias} ${cartao.ocorrencias === 1 ? 'lançamento' : 'lançamentos'}`
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <CurrencyValue value={cartao.valor_total} className="fw-semibold" />
                                            {multiplas ? (
                                                faturas.map((fatura) => {
                                                    const to = buildFaturaCartaoPath(fatura.id)
                                                    if (!to) return null
                                                    return (
                                                        <Link
                                                            key={fatura.id}
                                                            to={to}
                                                            className="btn btn-sm btn-soft-secondary"
                                                        >
                                                            {fatura.bandeira || 'Fatura'}
                                                        </Link>
                                                    )
                                                })
                                            ) : faturaPrincipal ? (
                                                <Link to={faturaPrincipal} className="btn btn-sm btn-soft-secondary">
                                                    Abrir fatura do cartão
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="card-title mb-0">Por categoria · histórico</h5>
                </CardHeader>
                <CardBody>
                    {porCategoria.length === 0 ? (
                        <p className="text-muted mb-0">Nenhuma categoria neste histórico.</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {porCategoria.map((categoria) => {
                                const pct = Math.round((Number(categoria.valor_total || 0) / maxCategoria) * 100)
                                const nome = categoria.nome || 'Sem categoria'
                                const style = getCategoriaFieldStyle(categoria.cor)
                                const comprasPath = buildComprasAtalhoPath(
                                    atalhos?.compras,
                                    data.id,
                                    { categoria_id: categoria.categoria_id ?? null }
                                )
                                const inner = (
                                    <div
                                        className="rounded px-3 py-2"
                                        style={style || { backgroundColor: 'var(--vz-light, #f3f6f9)' }}
                                    >
                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                {categoria.cor ? (
                                                    <span
                                                        className="rounded-circle flex-shrink-0"
                                                        style={{
                                                            width: 12,
                                                            height: 12,
                                                            backgroundColor: categoria.cor,
                                                        }}
                                                    />
                                                ) : null}
                                                <span className="fw-medium">{nome}</span>
                                                <span className="text-muted fs-13">
                                                    {categoria.compras === 1 ? '1 compra' : `${categoria.compras} compras`}
                                                </span>
                                            </div>
                                            <CurrencyValue value={categoria.valor_total} className="fw-semibold" />
                                        </div>
                                        <Progress value={pct} color="primary" style={{ height: 6 }} className="mb-0" />
                                    </div>
                                )
                                return comprasPath ? (
                                    <Link
                                        key={`${categoria.categoria_id ?? 'sem'}-${nome}`}
                                        to={comprasPath}
                                        className="text-reset text-decoration-none"
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={`${categoria.categoria_id ?? 'sem'}-${nome}`}>{inner}</div>
                                )
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h5 className="card-title mb-0">Parceladas em aberto</h5>
                    {rankingPath && (data.em_aberto?.compras ?? 0) > parceladas.length ? (
                        <Link to={rankingPath} className="btn btn-sm btn-soft-primary">
                            Ver todas
                        </Link>
                    ) : null}
                </CardHeader>
                <CardBody>
                    {parceladas.length === 0 ? (
                        <p className="text-muted mb-0">Nenhuma parcelada em aberto.</p>
                    ) : (
                        <div className="d-none d-md-block table-responsive">
                            <table className="table align-middle table-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Título</th>
                                        <th>Progresso</th>
                                        <th className="text-end">Aberto</th>
                                        <th>Termina</th>
                                        <th>Cartão</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parceladas.map((item, index) => {
                                        const identificador = item.identificador || item.compra_grupo_id
                                        const to = buildCompraVisualizarPath(
                                            identificador,
                                            fallback.mes,
                                            fallback.ano
                                        )
                                        const pct = Math.min(100, Math.max(0, Number(item.percentual_pago ?? 0)))
                                        return (
                                            <tr
                                                key={identificador || index}
                                                style={to ? { cursor: 'pointer' } : undefined}
                                                onClick={to ? () => navigate(to) : undefined}
                                            >
                                                <td className="fw-medium">{item.titulo || 'Compra parcelada'}</td>
                                                <td style={{ minWidth: 160 }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="fs-13 text-nowrap">
                                                            {item.parcela_atual ?? '-'}/{item.parcelas_total ?? '-'}
                                                        </span>
                                                        <Progress
                                                            value={pct}
                                                            color="primary"
                                                            className="flex-grow-1 mb-0"
                                                            style={{ height: 6 }}
                                                        />
                                                        <span className="fs-12 text-muted">
                                                            {formatPercentual(item.percentual_pago)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`text-end fw-semibold text-warning ${VALOR_TEXT_CLASS}`}>
                                                    {formatCurrency(item.valor_aberto)}
                                                </td>
                                                <td className="text-muted">{item.estimativa_termino || '—'}</td>
                                                <td>
                                                    {item.cartao_nome ? (
                                                        <CartaoChip
                                                            cor_fundo={item.cartao_cor_fundo}
                                                            cor_texto={item.cartao_cor_texto}
                                                            label={item.cartao_nome}
                                                        />
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {parceladas.length > 0 ? (
                        <div className="d-md-none d-flex flex-column gap-2">
                            {parceladas.map((item, index) => {
                                const identificador = item.identificador || item.compra_grupo_id
                                const to = buildCompraVisualizarPath(identificador, fallback.mes, fallback.ano)
                                const pct = Math.min(100, Math.max(0, Number(item.percentual_pago ?? 0)))
                                const inner = (
                                    <div className="border rounded p-3">
                                        <div className="fw-medium mb-1">{item.titulo || 'Compra parcelada'}</div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="fs-13">
                                                {item.parcela_atual ?? '-'}/{item.parcelas_total ?? '-'}
                                            </span>
                                            <Progress value={pct} color="primary" className="flex-grow-1 mb-0" style={{ height: 6 }} />
                                            <span className="fs-12 text-muted">{formatPercentual(item.percentual_pago)}</span>
                                        </div>
                                        <div className="d-flex flex-wrap justify-content-between gap-2">
                                            <CurrencyValue value={item.valor_aberto} className="fw-semibold text-warning" />
                                            {item.cartao_nome ? (
                                                <CartaoChip
                                                    cor_fundo={item.cartao_cor_fundo}
                                                    cor_texto={item.cartao_cor_texto}
                                                    label={item.cartao_nome}
                                                />
                                            ) : null}
                                        </div>
                                        {item.estimativa_termino ? (
                                            <div className="text-muted fs-12 mt-1">Termina {item.estimativa_termino}</div>
                                        ) : null}
                                    </div>
                                )
                                return to ? (
                                    <Link key={identificador || index} to={to} className="text-reset text-decoration-none">
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={identificador || index}>{inner}</div>
                                )
                            })}
                        </div>
                    ) : null}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="card-title mb-0">Compras recentes</h5>
                </CardHeader>
                <CardBody>
                    {recentes.length === 0 ? (
                        <p className="text-muted mb-0">Nenhuma compra recente.</p>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {recentes.map((compra) => {
                                const to = buildCompraVisualizarPath(
                                    compra.identificador,
                                    compra.fatura_mes ?? fallback.mes,
                                    compra.fatura_ano ?? fallback.ano
                                )
                                const faturaPath = buildFaturaCartaoPath(compra.fatura_id)
                                const valorLabel = compra.avista || !compra.parcelas_total || compra.parcelas_total <= 1
                                    ? formatCurrency(compra.valor)
                                    : `${formatCurrency(compra.valor)} · ${compra.parcelas_total}x`
                                return (
                                    <div
                                        key={compra.identificador}
                                        className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded px-3 py-2"
                                        style={to ? { cursor: 'pointer' } : undefined}
                                        onClick={to ? () => navigate(to) : undefined}
                                        role={to ? 'button' : undefined}
                                        tabIndex={to ? 0 : undefined}
                                        onKeyDown={to ? (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                navigate(to)
                                            }
                                        } : undefined}
                                    >
                                        <div className="min-w-0">
                                            <div className="fw-medium text-truncate">
                                                {compra.titulo || 'Compra'}
                                            </div>
                                            <div className="text-muted fs-13 d-flex flex-wrap align-items-center gap-2">
                                                <span>{formatDateBr(compra.data?.slice(0, 10))}</span>
                                                {compra.estabelecimento ? <span>{compra.estabelecimento}</span> : null}
                                                {compra.cartao_nome ? (
                                                    <CartaoChip
                                                        cor_fundo={compra.cartao_cor_fundo}
                                                        cor_texto={compra.cartao_cor_texto}
                                                        label={compra.cartao_nome}
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>{valorLabel}</span>
                                            {faturaPath ? (
                                                <Link
                                                    to={faturaPath}
                                                    className="btn btn-sm btn-soft-secondary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Fatura
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            {faturasPadrao.length > 0 ? (
                <Card className="mb-3">
                    <CardHeader>
                        <h5 className="card-title mb-0">Faturas em que é o padrão</h5>
                    </CardHeader>
                    <CardBody>
                        <p className="text-muted fs-13">
                            Este responsável é o <strong>padrão</strong> destas faturas (compras importadas já saem no nome dele).
                            Continua diferente da fatura virtual (todos os cartões).
                        </p>
                        <div className="d-flex flex-column gap-2">
                            {faturasPadrao.map((fatura) => {
                                const to = buildFaturaCartaoPath(fatura.id)
                                const inner = (
                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded px-3 py-2">
                                        <div className="d-flex flex-wrap align-items-center gap-2 min-w-0">
                                            {fatura.cartao_nome ? (
                                                <CartaoChip
                                                    cor_fundo={fatura.cartao_cor_fundo}
                                                    cor_texto={fatura.cartao_cor_texto}
                                                    label={fatura.cartao_nome}
                                                />
                                            ) : null}
                                            <span className="fw-medium">{fatura.label || fatura.competencia}</span>
                                            {fatura.pessoa_nome ? (
                                                <span className="text-muted fs-13">{fatura.pessoa_nome}</span>
                                            ) : null}
                                        </div>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <CurrencyValue value={fatura.valor_total} className="fw-semibold" />
                                            {fatura.status ? (
                                                <Badge color={faturaStatusColor[fatura.status] ?? 'secondary'}>
                                                    {statusLabel(fatura.status)}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                                return to ? (
                                    <Link key={fatura.id} to={to} className="text-reset text-decoration-none">
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={fatura.id}>{inner}</div>
                                )
                            })}
                        </div>
                    </CardBody>
                </Card>
            ) : null}
        </React.Fragment>
    )
}

export default ResponsaveisVisualizarRelacionados
