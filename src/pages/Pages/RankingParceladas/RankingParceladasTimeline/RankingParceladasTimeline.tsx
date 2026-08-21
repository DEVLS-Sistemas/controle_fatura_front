import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CardBody, CardHeader } from 'reactstrap'
import { CartaoChip } from 'helpers/cartao_helpers'
import { formatCurrency } from 'helpers/fatura_helpers'
import {
  RankingParceladaItem,
  RankingParceladasView,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'
import {
  barraTimelineStyle,
  compraDestinoRanking,
  estaQuitada,
  MESES_JANELA,
  ordenarPorMenorPercentual,
} from 'helpers/ranking_parceladas_helpers'
import RankingParceladasResumo from '../RankingParceladasResumo'

interface RankingParceladasTimelineProps {
  data?: RankingParceladasView
  loading?: boolean
  onShiftCompetencia: (delta: number) => void
  onGoToday: () => void
}

const formatPercentual = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(Number(pct))) return '0%'
  return `${Number(pct).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`
}

const RankingParceladasTimeline = ({
  data,
  loading,
  onShiftCompetencia,
  onGoToday,
}: RankingParceladasTimelineProps) => {
  const navigate = useNavigate()
  const colunas = data?.colunas ?? []
  const itens = ordenarPorMenorPercentual(data?.itens ?? [])
  const centro = colunas.find((col) => col.centro)

  const handleOpenItem = (item: RankingParceladaItem) => {
    const to = compraDestinoRanking(
      item,
      data?.referencia?.mes,
      data?.referencia?.ano
    )
    if (to) {
      navigate(to, {
        state: {
          fromRanking: true,
          from: `/parceladas?mes=${data?.referencia?.mes}&ano=${data?.referencia?.ano}`,
        },
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="placeholder-glow py-4">
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-10 mb-2"></span>
            <span className="placeholder col-8"></span>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <React.Fragment>
      <RankingParceladasResumo totais={data?.totais} />

      {itens.length === 0 ? (
        <Card>
          <CardBody className="text-center py-5">
            <h5 className="mb-1">Nenhuma compra parcelada ativa nesta competência.</h5>
            <p className="text-muted mb-3">
              A última parcela deste mês ainda entra no ranking. Se a compra já acabou no mês anterior, ela some da lista.
            </p>
            <Link to="/faturas" className="btn btn-soft-primary btn-sm">
              Ver faturas
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-0">
          <CardHeader>
            <div className="ranking-timeline__nav">
              <div className="d-flex align-items-center gap-2">
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShiftCompetencia(-1)
                  }}
                  title="Mês anterior"
                >
                  <i className="ri-arrow-left-s-line align-middle"></i>
                  Anterior
                </Button>
                <Button
                  type="button"
                  color="light"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShiftCompetencia(1)
                  }}
                  title="Próximo mês"
                >
                  Próximo
                  <i className="ri-arrow-right-s-line align-middle"></i>
                </Button>
                <Button
                  type="button"
                  color="soft-primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onGoToday()
                  }}
                >
                  Hoje
                </Button>
              </div>
              <div className="text-muted fs-13">
                Centro: <strong>{centro?.label ?? '—'}</strong>
                {' · '}
                {MESES_JANELA} competências · cinza = início→fim · azul = progresso
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="ranking-timeline">
              <div className="ranking-timeline__head ranking-timeline__row">
                <div className="ranking-timeline__info">
                  <span className="text-muted fs-12 text-uppercase fw-semibold">Compra</span>
                </div>
                <div className="ranking-timeline__months">
                  {colunas.map((col) => (
                    <div
                      key={col.chave}
                      className={`ranking-timeline__col ${col.centro ? 'ranking-timeline__col--centro' : ''}`}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>

              {itens.map((item, index) => {
                const destino = compraDestinoRanking(
                  item,
                  data?.referencia?.mes,
                  data?.referencia?.ano
                )
                const quitada = estaQuitada(item)
                const timeline = item.timeline
                const fora = Boolean(timeline?.fora_da_janela)
                const inicio = Number(timeline?.indice_inicio ?? 0)
                const fim = Number(timeline?.indice_fim ?? 0)
                const progresso = Number(
                  timeline?.indice_progresso ?? timeline?.indice_inicio ?? 0
                )
                const gray = barraTimelineStyle(inicio, fim)
                const blue = barraTimelineStyle(inicio, Math.min(Math.max(progresso, inicio), fim))
                const tituloEstabelecimento =
                  item.titulo_origem === 'observacoes' ? item.estabelecimento_nome : null

                return (
                  <div
                    key={item.compra_grupo_id || index}
                    className={`ranking-timeline__row ${destino ? 'is-clickable' : ''}`}
                    role={destino ? 'button' : undefined}
                    tabIndex={destino ? 0 : undefined}
                    title={destino ? 'Ver detalhes da compra' : undefined}
                    onClick={() => handleOpenItem(item)}
                    onKeyDown={(e) => {
                      if (destino && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        handleOpenItem(item)
                      }
                    }}
                  >
                    <div className="ranking-timeline__info">
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary-subtle text-primary">{index + 1}º</span>
                        <div style={{ minWidth: 0 }} className="flex-grow-1">
                          <div className="fw-semibold text-truncate">{item.titulo}</div>
                          {tituloEstabelecimento ? (
                            <div className="text-muted fs-12 text-truncate">{tituloEstabelecimento}</div>
                          ) : null}
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            <Badge color="primary" pill>
                              {item.parcela_atual}/{item.parcelas_total}
                            </Badge>
                            {quitada ? (
                              <Badge color="success" pill>
                                100%
                              </Badge>
                            ) : (
                              <Badge color="light" className="text-body" pill>
                                {formatPercentual(item.percentual_pago)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted fs-12 mt-1">
                            {item.estimativa_termino
                              ? `Termina em ${item.estimativa_termino}`
                              : 'Sem estimativa'}
                            {' · '}
                            {formatCurrency(item.valor_aberto)} em aberto
                          </div>
                          {item.cartao_nome ? (
                            <div className="mt-1">
                              <CartaoChip
                                cor_fundo={item.cartao_cor_fundo}
                                cor_texto={item.cartao_cor_texto}
                                label={item.cartao_nome}
                              />
                            </div>
                          ) : null}
                        </div>
                        {destino ? (
                          <i className="ri-arrow-right-s-line text-muted fs-18 flex-shrink-0 mt-1" aria-hidden="true"></i>
                        ) : null}
                      </div>
                    </div>
                    <div className="ranking-timeline__months">
                      {colunas.map((col) => (
                        <div
                          key={`${item.compra_grupo_id}-${col.chave}`}
                          className={`ranking-timeline__col ${col.centro ? 'ranking-timeline__col--centro' : ''}`}
                        />
                      ))}
                      <div className="ranking-timeline__track-wrap">
                        {fora ? (
                          <span className="text-muted fs-12 px-2">
                            Fora da janela
                            {item.estimativa_termino ? ` · Termina em ${item.estimativa_termino}` : ''}
                          </span>
                        ) : (
                          <div
                            className="ranking-timeline__track"
                            title={`${item.estimativa_termino || ''} · ${formatPercentual(item.percentual_pago)}`}
                          >
                            <div
                              className="ranking-timeline__span ranking-timeline__span--full"
                              style={gray}
                            />
                            <div
                              className="ranking-timeline__span ranking-timeline__span--progress"
                              style={blue}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </React.Fragment>
  )
}

export default RankingParceladasTimeline
