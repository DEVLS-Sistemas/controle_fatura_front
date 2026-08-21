import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, Col, Progress, Row } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { CartaoChip } from 'helpers/cartao_helpers'
import {
  formatCurrency,
  formatDateBr,
  origemCompraLabel,
} from 'helpers/fatura_helpers'
import {
  RankingParceladaItem,
  RankingParceladasView,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'
import {
  estaQuitada,
  faturaDestinoRanking,
  isUltimaParcelaNoMesAtual,
  ordenarPorMenorPercentual,
} from 'helpers/ranking_parceladas_helpers'
import RankingParceladasResumo from '../RankingParceladasResumo'

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const labelMesAno = (mes?: number | null, ano?: number | null): string => {
  if (!mes || !ano) return '—'
  const abrev = MESES_ABREV[(mes || 1) - 1] || String(mes)
  return `${abrev}/${ano}`
}

const formatPercentual = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(Number(pct))) return '0%'
  return `${Number(pct).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`
}

const parcelasRestantesLabel = (
  item: RankingParceladaItem,
  mesRef?: number,
  anoRef?: number
): string => {
  if (estaQuitada(item)) return 'Quitada · 100%'
  if (mesRef && anoRef && isUltimaParcelaNoMesAtual(item, mesRef, anoRef)) {
    return 'Última parcela neste mês'
  }
  const restantes = Number(item.parcelas_restantes ?? 0)
  if (restantes <= 0) return 'Quitada'
  if (restantes === 1) return 'Falta 1 parcela'
  return `Faltam ${restantes} parcelas`
}

interface RankingParceladasListProps {
  data?: RankingParceladasView
  loading?: boolean
}

const RankingParceladasSkeleton = () => (
  <>
    <Row className="g-3 mb-3">
      {[1, 2, 3, 4].map((i) => (
        <Col xl={3} md={6} key={i}>
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
    {[1, 2, 3].map((i) => (
      <Card key={i} className="mb-3">
        <CardBody>
          <div className="placeholder-glow">
            <span className="placeholder col-4 mb-2"></span>
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-10"></span>
          </div>
        </CardBody>
      </Card>
    ))}
  </>
)

const RankingParceladasList = ({ data, loading }: RankingParceladasListProps) => {
  const navigate = useNavigate()
  const totais = data?.totais
  const itens = ordenarPorMenorPercentual(data?.itens ?? [])
  const mesRef = data?.referencia?.mes
  const anoRef = data?.referencia?.ano

  if (loading) {
    return <RankingParceladasSkeleton />
  }

  const handleOpenItem = (item: RankingParceladaItem) => {
    const to = faturaDestinoRanking(item)
    if (to) navigate(to)
  }

  return (
    <React.Fragment>
      <RankingParceladasResumo totais={totais} />

      {itens.length === 0 ? (
        <Card>
          <CardBody className="text-center py-5">
            <div className="avatar-md mx-auto mb-3">
              <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                <i className="ri-inbox-line"></i>
              </span>
            </div>
            <h5 className="mb-1">Nenhuma compra parcelada ativa nesta competência.</h5>
            <p className="text-muted mb-3">
              A última parcela deste mês ainda entra no ranking. Se a compra já acabou no mês anterior, ela some da lista.
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link to="/faturas" className="btn btn-soft-primary btn-sm">
                Ver faturas
              </Link>
              <Link to="/transacoes" className="btn btn-soft-secondary btn-sm">
                Ver transações
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        itens.map((item, index) => {
          const posicao = index + 1
          const pct = Math.min(100, Math.max(0, Number(item.percentual_pago ?? 0)))
          const barColor = item.cartao_cor_fundo || undefined
          const destino = faturaDestinoRanking(item)
          const quitada = estaQuitada(item)
          const ultimaNesteMes =
            mesRef != null && anoRef != null && isUltimaParcelaNoMesAtual(item, mesRef, anoRef)
          const tituloEstabelecimento =
            item.titulo_origem === 'observacoes' ? item.estabelecimento_nome : null
          const origemLabel = item.origem_compra
            ? origemCompraLabel[item.origem_compra] ?? item.origem_compra
            : null

          return (
            <Card
              key={item.compra_grupo_id || index}
              className={`mb-3 ${destino ? 'card-animate' : ''}`}
              role={destino ? 'button' : undefined}
              tabIndex={destino ? 0 : undefined}
              onClick={() => handleOpenItem(item)}
              onKeyDown={(e) => {
                if (destino && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleOpenItem(item)
                }
              }}
              style={destino ? { cursor: 'pointer' } : undefined}
            >
              <CardBody>
                <div className="d-flex gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className="avatar-sm"
                      title={`${posicao}º no ranking`}
                    >
                      <span
                        className={`avatar-title rounded-circle fs-16 fw-semibold ${
                          posicao === 1
                            ? 'bg-primary text-white'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {posicao}º
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-1">
                      <div style={{ minWidth: 0 }}>
                        <h5 className="mb-1 text-truncate">{item.titulo || 'Compra parcelada'}</h5>
                        {tituloEstabelecimento ? (
                          <p className="text-muted mb-0 fs-13">{tituloEstabelecimento}</p>
                        ) : null}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <Badge color="primary" pill>
                          {item.parcela_atual}/{item.parcelas_total}
                        </Badge>
                        <Badge color={quitada ? 'success' : ultimaNesteMes ? 'info' : 'warning'} pill>
                          {parcelasRestantesLabel(item, mesRef, anoRef)}
                        </Badge>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 my-2">
                      <Progress
                        value={pct}
                        color={barColor ? undefined : 'primary'}
                        className="flex-grow-1 mb-0"
                        style={{ height: 8 }}
                        barStyle={barColor ? { backgroundColor: barColor } : undefined}
                        barAriaValueText={formatPercentual(item.percentual_pago)}
                      />
                      <span className="fw-semibold fs-13 text-nowrap">{formatPercentual(item.percentual_pago)}</span>
                    </div>

                    <Row className="g-2 mb-2">
                      <Col xs={6} md={4}>
                        <span className="text-muted fs-12 d-block">Pago</span>
                        <CurrencyValue value={item.valor_pago} className="fw-semibold text-success" />
                      </Col>
                      <Col xs={6} md={4}>
                        <span className="text-muted fs-12 d-block">Em aberto</span>
                        <CurrencyValue value={item.valor_aberto} className="fw-semibold text-warning" />
                      </Col>
                      <Col xs={12} md={4}>
                        <span className="text-muted fs-12 d-block">Total</span>
                        <CurrencyValue value={item.valor_total} className="text-muted" />
                      </Col>
                    </Row>

                    <div className="d-flex flex-wrap align-items-center gap-2 fs-12 text-muted">
                      {item.responsavel_nome ? <span>{item.responsavel_nome}</span> : null}
                      {item.cartao_nome ? (
                        <CartaoChip
                          cor_fundo={item.cartao_cor_fundo}
                          cor_texto={item.cartao_cor_texto}
                          label={
                            item.bandeira_nome
                              ? `${item.cartao_nome} · ${item.bandeira_nome}`
                              : item.cartao_nome
                          }
                        />
                      ) : null}
                      {item.categoria_nome ? (
                        <Badge color="light" className="text-body">
                          {item.categoria_nome}
                          {item.subcategoria_nome ? ` · ${item.subcategoria_nome}` : ''}
                        </Badge>
                      ) : null}
                      {origemLabel ? <span>{origemLabel}</span> : null}
                      {item.data_compra ? <span>Compra {formatDateBr(item.data_compra)}</span> : null}
                      {item.estimativa_termino ? (
                        <span>Termina em {item.estimativa_termino}</span>
                      ) : null}
                      {item.proxima_parcela ? (
                        <span>
                          Próxima: {labelMesAno(item.proxima_parcela.mes, item.proxima_parcela.ano)}
                          {' · '}
                          {formatCurrency(item.proxima_parcela.valor)}
                        </span>
                      ) : item.ultima_parcela ? (
                        <span>
                          {ultimaNesteMes ? 'Parcela final neste mês: ' : 'Última parcela: '}
                          {labelMesAno(item.ultima_parcela.mes, item.ultima_parcela.ano)}
                          {' · '}
                          {formatCurrency(item.ultima_parcela.valor)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })
      )}
    </React.Fragment>
  )
}

export default RankingParceladasList
