import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Card,
  CardBody,
  Col,
  Modal,
  ModalBody,
  ModalHeader,
  Progress,
  Row,
  UncontrolledTooltip,
} from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { buildResponsavelVisualizarPath } from 'helpers/responsavel_visualizar_helpers'
import {
  agruparCartoesPorNome,
  agruparCruzamentoPorNome,
  chaveTitular,
  idGrupoCartao,
  resumosEuOutrosPorTitular,
  separarResponsaveisPorTitular,
  sublabelCartao,
} from 'helpers/projecao_group_helpers'
import {
  ProjecaoColuna,
  ProjecaoResumoEuOutros,
  ProjecaoSplitParte,
  ProjecaoUsoLimite,
  ProjecaoValor,
  ProjecaoFaturasView,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { FaturaResponsavelLocationState } from '../FaturaResponsavelView/FaturaResponsavelView'

const stickyColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  backgroundColor: 'var(--vz-secondary-bg, #fff)',
  minWidth: 200,
  maxWidth: 280,
}

const stickyHeadStyle: React.CSSProperties = {
  ...stickyColStyle,
  zIndex: 3,
  backgroundColor: 'var(--vz-light, #f3f6f9)',
}

const stickyFootStyle: React.CSSProperties = {
  ...stickyColStyle,
  zIndex: 3,
  backgroundColor: 'var(--vz-light, #f3f6f9)',
  fontWeight: 600,
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const labelMesAno = (col: ProjecaoColuna) => ({
  mes: MESES_ABREV[(col.mes || 1) - 1] || String(col.mes),
  ano: String(col.ano),
})

/** Cor do % de uso do limite: verde &lt;50%, âmbar 50–80%, vermelho &gt;80% */
const percentualTone = (pct: number): 'success' | 'warning' | 'danger' => {
  if (pct > 80) return 'danger'
  if (pct >= 50) return 'warning'
  return 'success'
}

const formatPercentual = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(Number(pct))) return '—'
  return `${Math.round(Number(pct))}%`
}

const hasLimite = (limite: number | null | undefined): boolean =>
  limite != null && !Number.isNaN(Number(limite)) && Number(limite) > 0

const splitLabel = (
  parte: ProjecaoSplitParte | undefined,
  { comLimite = false }: { comLimite?: boolean } = {}
): string => {
  if (!parte) return '—'
  const pctGasto = formatPercentual(parte.percentual)
  if (comLimite && parte.percentual_do_limite != null) {
    return `${formatCurrency(parte.total)} (${pctGasto} do uso · ${formatPercentual(parte.percentual_do_limite)} do limite)`
  }
  return `${formatCurrency(parte.total)} (${pctGasto})`
}

export interface ProjecaoFaturasTableProps {
  data: ProjecaoFaturasView | undefined
  separarTitular?: boolean
}

type LinhaTabela = {
  id: number | string
  label: string
  sublabel?: string
  cor_fundo?: string | null
  cor_texto?: string | null
  limite_credito?: number | null
  uso_limite?: ProjecaoUsoLimite | null
  eh_eu?: boolean
  valores: ProjecaoValor[]
  total: number
  responsavelId?: number
  cartaoIds?: number[]
  tipo?: string
}

type ResponsavelCruzamento = {
  responsavelId: number
  responsavelLabel: string
  responsavelSublabel?: string
  eh_eu?: boolean
  valores: ProjecaoValor[]
  total: number
}

type CartaoCruzamento = {
  cartaoId: number | string
  cartaoLabel: string
  cartaoSublabel?: string
  cartaoCorFundo?: string | null
  cartaoCorTexto?: string | null
  limite_credito?: number | null
  uso_limite?: ProjecaoUsoLimite | null
  resumoEuOutrosRef?: ProjecaoResumoEuOutros
  valorReferencia?: ProjecaoValor
  valores: ProjecaoValor[]
  total: number
  agrupado?: boolean
  responsaveis: ResponsavelCruzamento[]
}

const cellClassName = (valor: ProjecaoValor | undefined, isReferencia: boolean, ehEu?: boolean): string => {
  const classes = [VALOR_TEXT_CLASS, 'text-end']
  if (isReferencia) classes.push('table-primary')
  if (valor && Number(valor.projetado) > 0) classes.push('text-info')
  if (valor?.fonte === 'vazio') classes.push('text-muted')
  if (ehEu) classes.push('fw-semibold')
  return classes.join(' ')
}

/** Limite · Em uso · Livre (valor + %) — preferir uso_limite do mês de referência */
const LimiteUsoResumo = ({
  usoLimite,
  limite,
  valorReferencia,
  idPrefix,
  showEuOutros = false,
}: {
  usoLimite?: ProjecaoUsoLimite | null
  limite?: number | null
  valorReferencia?: ProjecaoValor
  idPrefix: string
  showEuOutros?: boolean
}) => {
  const limiteVal = usoLimite?.limite ?? limite
  if (!hasLimite(limiteVal)) return null

  const emUso = usoLimite?.em_uso ?? valorReferencia?.em_uso ?? valorReferencia?.total ?? 0
  const pctUso =
    usoLimite?.percentual_em_uso ??
    valorReferencia?.percentual_utilizado ??
    null
  const livre =
    usoLimite?.livre ??
    valorReferencia?.livre ??
    valorReferencia?.disponivel ??
    (Number(limiteVal) - Number(emUso))
  const pctLivre =
    usoLimite?.percentual_livre ??
    valorReferencia?.percentual_livre ??
    (pctUso != null ? Math.max(0, 100 - Number(pctUso)) : null)

  const pctNum = pctUso != null ? Number(pctUso) : 0
  const tone = percentualTone(pctNum)
  const barId = `${idPrefix}-limite-bar`
  const meu = usoLimite?.meu ?? valorReferencia?.meu
  const outros = usoLimite?.outros ?? valorReferencia?.outros

  return (
    <div className="mt-1" style={{ maxWidth: 220 }}>
      <div className="d-flex flex-column gap-0">
        <span className="text-muted fs-11">
          Limite <span className="fw-medium text-body">{formatCurrency(limiteVal)}</span>
        </span>
        <span className={`fs-11 text-${tone}`}>
          Em uso{' '}
          <span className="fw-semibold">
            {formatCurrency(emUso)} ({formatPercentual(pctUso)})
          </span>
        </span>
        <span className="text-muted fs-11">
          Livre{' '}
          <span className="fw-medium text-body">
            {formatCurrency(livre)} ({formatPercentual(pctLivre)})
          </span>
        </span>
      </div>
      <div id={barId} className="d-flex align-items-center gap-1 mt-1">
        <Progress
          value={Math.min(100, Math.max(0, pctNum))}
          color={tone}
          className="flex-grow-1 mb-0"
          style={{ height: 6 }}
        />
        <span className={`fs-11 fw-semibold text-${tone}`}>{formatPercentual(pctUso)}</span>
      </div>
      {showEuOutros && (meu || outros) && (
        <div className="d-flex flex-wrap gap-1 mt-1">
          <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.65rem' }}>
            Eu {formatCurrency(meu?.total ?? 0)}
            {meu?.percentual != null ? ` · ${formatPercentual(meu.percentual)}` : ''}
          </span>
          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>
            Outros {formatCurrency(outros?.total ?? 0)}
            {outros?.percentual != null ? ` · ${formatPercentual(outros.percentual)}` : ''}
          </span>
        </div>
      )}
      <UncontrolledTooltip placement="top" target={barId}>
        Limite: {formatCurrency(limiteVal)}
        {' | '}
        Em uso: {formatCurrency(emUso)} ({formatPercentual(pctUso)})
        {' | '}
        Livre: {formatCurrency(livre)} ({formatPercentual(pctLivre)})
        {meu && (
          <>
            {' | '}
            Eu: {splitLabel(meu, { comLimite: true })}
          </>
        )}
        {outros && (
          <>
            {' | '}
            Outros: {splitLabel(outros, { comLimite: true })}
          </>
        )}
      </UncontrolledTooltip>
    </div>
  )
}

/** Card/resumo Eu vs Outros (mês de referência ou lista por coluna) */
const EuOutrosResumoCard = ({
  resumo,
  labelColuna,
  titulo,
}: {
  resumo?: ProjecaoResumoEuOutros | null
  labelColuna?: string
  titulo?: string
}) => {
  if (!resumo) return null

  const meu = resumo.meu
  const outros = resumo.outros
  const total = Number(resumo.total || 0)
  const sufixo = [titulo, labelColuna].filter(Boolean).join(' · ')

  return (
    <div className="d-flex flex-wrap gap-3 align-items-stretch mb-3">
      <div className="border rounded p-3 flex-grow-1" style={{ minWidth: 180 }}>
        <span className="text-muted fs-12 d-block">
          Eu{sufixo ? ` · ${sufixo}` : ''}
        </span>
        <span className={`fs-5 fw-semibold text-primary ${VALOR_TEXT_CLASS}`}>
          <CurrencyValue value={meu?.total ?? 0} />
        </span>
        <span className="d-block fs-12 text-muted">
          {formatPercentual(meu?.percentual)} do total
          {meu && Number(meu.projetado) > 0 && (
            <> · proj. {formatCurrency(meu.projetado)}</>
          )}
        </span>
      </div>
      <div className="border rounded p-3 flex-grow-1" style={{ minWidth: 180 }}>
        <span className="text-muted fs-12 d-block">
          Outros{sufixo ? ` · ${sufixo}` : ''}
        </span>
        <span className={`fs-5 fw-semibold text-secondary ${VALOR_TEXT_CLASS}`}>
          <CurrencyValue value={outros?.total ?? 0} />
        </span>
        <span className="d-block fs-12 text-muted">
          {formatPercentual(outros?.percentual)} do total
          {outros && Number(outros.projetado) > 0 && (
            <> · proj. {formatCurrency(outros.projetado)}</>
          )}
        </span>
      </div>
      {total > 0 && (
        <div className="border rounded p-3 flex-grow-1" style={{ minWidth: 140 }}>
          <span className="text-muted fs-12 d-block">Total do mês</span>
          <span className={`fs-5 fw-semibold ${VALOR_TEXT_CLASS}`}>
            <CurrencyValue value={total} />
          </span>
        </div>
      )}
    </div>
  )
}

const buildFaturaResponsavelPath = (
  responsavelId: number | string,
  mes: number,
  ano: number,
  cartaoId?: number | null
) => {
  const qs = new URLSearchParams({
    mes: String(mes),
    ano: String(ano),
  })
  if (cartaoId != null) qs.set('cartao_id', String(cartaoId))
  return `/projecao-faturas/responsaveis/${responsavelId}/fatura?${qs.toString()}`
}

const buildRepassesResponsavelPath = (
  responsavelId: number | string,
  mes: number,
  ano: number
) => {
  const qs = new URLSearchParams({
    mes: String(mes),
    ano: String(ano),
  })
  return `/projecao-faturas/responsaveis/${responsavelId}/repasses?${qs.toString()}`
}

const ProjecaoCelula = ({
  valor,
  coluna,
  cellId,
  showUsoLimite,
  showParticipacao,
  showEuOutrosSplit,
  limiteCredito,
  onClick,
  clickTitle,
}: {
  valor: ProjecaoValor | undefined
  coluna: ProjecaoColuna
  cellId: string
  showUsoLimite?: boolean
  showParticipacao?: boolean
  showEuOutrosSplit?: boolean
  limiteCredito?: number | null
  onClick?: () => void
  clickTitle?: string
}) => {
  const clickable = typeof onClick === 'function'
  const empty = !valor || valor.fonte === 'vazio' || Number(valor.total) === 0

  if (empty) {
    return (
      <td
        className={`${cellClassName(valor, coluna.referencia)}${clickable ? ' cursor-pointer' : ''}`}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title={clickable ? (clickTitle || 'Ver fatura do responsável') : undefined}
        onClick={clickable ? onClick : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClick?.()
                }
              }
            : undefined
        }
        style={clickable ? { cursor: 'pointer' } : undefined}
      >
        <span className="text-muted">-</span>
      </td>
    )
  }

  const temProjecao = Number(valor.projetado) > 0
  const pct = valor.percentual_utilizado
  const showPct = showUsoLimite && hasLimite(limiteCredito) && pct != null
  const tone = showPct ? percentualTone(Number(pct)) : null
  const pctPart = valor.percentual_participacao
  const showPart = showParticipacao && pctPart != null
  const livre = valor.livre ?? valor.disponivel
  const meu = valor.meu
  const outros = valor.outros

  return (
    <td
      className={`${cellClassName(valor, coluna.referencia)}${clickable ? ' cursor-pointer' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={clickable ? (clickTitle || 'Ver fatura do responsável') : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <span id={cellId} className="d-inline-flex flex-column align-items-end gap-1">
        <span className="d-inline-flex align-items-center gap-1">
          <CurrencyValue value={valor.total} />
          {temProjecao && (
            <span className="badge bg-info-subtle text-info" style={{ fontSize: '0.65rem' }}>
              proj.
            </span>
          )}
        </span>
        {showPct && tone && (
          <span className={`badge bg-${tone}-subtle text-${tone}`} style={{ fontSize: '0.65rem' }}>
            {formatPercentual(pct)} uso
          </span>
        )}
        {showPart && (
          <span className="badge bg-light text-muted" style={{ fontSize: '0.65rem' }}>
            {formatPercentual(pctPart)}
          </span>
        )}
        {showEuOutrosSplit && (meu || outros) && Number(valor.total) > 0 && (
          <span className="d-inline-flex gap-1" style={{ fontSize: '0.62rem' }}>
            <span className="badge bg-primary-subtle text-primary">
              Eu {formatPercentual(meu?.percentual)}
            </span>
            <span className="badge bg-secondary-subtle text-secondary">
              Out. {formatPercentual(outros?.percentual)}
            </span>
          </span>
        )}
      </span>
      <UncontrolledTooltip placement="top" target={cellId}>
        Realizado: {formatCurrency(valor.realizado)}
        {' | '}
        Projetado: {formatCurrency(valor.projetado)}
        {showPct && (
          <>
            {' | '}
            Limite: {formatCurrency(limiteCredito)}
            {' | '}
            Em uso: {formatCurrency(valor.em_uso ?? valor.total)} ({formatPercentual(pct)})
            {' | '}
            Livre: {formatCurrency(livre)} ({formatPercentual(valor.percentual_livre)})
          </>
        )}
        {showPart && (
          <>
            {' | '}
            Participação: {formatPercentual(pctPart)}
          </>
        )}
        {meu && (
          <>
            {' | '}
            Eu: {splitLabel(meu, { comLimite: showPct })}
          </>
        )}
        {outros && (
          <>
            {' | '}
            Outros: {splitLabel(outros, { comLimite: showPct })}
          </>
        )}
        {clickable && (
          <>
            {' | '}
            Clique para ver a fatura do responsável
          </>
        )}
      </UncontrolledTooltip>
    </td>
  )
}

const CabecalhoMeses = ({ colunas }: { colunas: ProjecaoColuna[] }) => (
  <>
    {colunas.map((col) => {
      const { mes, ano } = labelMesAno(col)
      return (
        <th
          key={col.chave}
          scope="col"
          className={`text-center ${col.referencia ? 'table-primary' : ''}`}
          style={{ minWidth: 72, width: 72, lineHeight: 1.2, whiteSpace: 'normal' }}
          title={col.label}
        >
          <span className="d-block fw-semibold">{mes}</span>
          <span className="d-block fs-11 fw-normal text-muted">{ano}</span>
          {col.referencia && <span className="d-block fs-10 fw-normal text-primary">ref.</span>}
        </th>
      )
    })}
  </>
)

const RodapeTotais = ({
  colunas,
  totais,
  prefix,
  colSpanLabel = 1,
}: {
  colunas: ProjecaoColuna[]
  totais: Array<{ realizado: number; projetado: number; total: number }>
  prefix: string
  colSpanLabel?: number
}) => (
  <tfoot className="table-light">
    <tr>
      <td className="text-start" style={stickyFootStyle} colSpan={colSpanLabel}>
        Totais
      </td>
      {colunas.map((col, idx) => {
        const tot = totais[idx]
        const cellId = `${prefix}-total-${col.chave}`
        return (
          <td
            key={col.chave}
            className={`text-end fw-semibold ${col.referencia ? 'table-primary' : ''} ${VALOR_TEXT_CLASS}`}
          >
            {tot && Number(tot.total) > 0 ? (
              <>
                <span id={cellId}>
                  <CurrencyValue value={tot.total} />
                  {Number(tot.projetado) > 0 && (
                    <span
                      className="badge bg-info-subtle text-info ms-1"
                      style={{ fontSize: '0.65rem' }}
                    >
                      proj.
                    </span>
                  )}
                </span>
                <UncontrolledTooltip placement="top" target={cellId}>
                  Realizado: {formatCurrency(tot.realizado)} | Projetado:{' '}
                  {formatCurrency(tot.projetado)}
                </UncontrolledTooltip>
              </>
            ) : (
              <span className="text-muted">-</span>
            )}
          </td>
        )
      })}
      <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
        <CurrencyValue value={totais.reduce((acc, t) => acc + Number(t?.total || 0), 0)} />
      </td>
    </tr>
  </tfoot>
)

const ProjecaoMatriz = ({
  titulo,
  colunas,
  linhas,
  totais,
  prefix,
  showUsoLimite = false,
  showParticipacao = false,
  showEuOutrosSplit = false,
  resumoEuOutros,
  resumosEuOutros,
  acoes,
  onCelulaClick,
  onLinhaLabelClick,
  onRepassesClick,
}: {
  titulo: string
  colunas: ProjecaoColuna[]
  linhas: LinhaTabela[]
  totais: Array<{ realizado: number; projetado: number; total: number }>
  prefix: string
  showUsoLimite?: boolean
  showParticipacao?: boolean
  showEuOutrosSplit?: boolean
  resumoEuOutros?: ProjecaoResumoEuOutros | null
  resumosEuOutros?: Array<{ titulo?: string; resumo: ProjecaoResumoEuOutros }>
  acoes?: React.ReactNode
  onCelulaClick?: (linha: LinhaTabela, coluna: ProjecaoColuna, valor: ProjecaoValor | undefined) => void
  onLinhaLabelClick?: (linha: LinhaTabela) => void
  onRepassesClick?: (linha: LinhaTabela) => void
}) => {
  const idxReferencia = colunas.findIndex((c) => c.referencia)
  const labelClickable = typeof onLinhaLabelClick === 'function'
  const repassesClickable = typeof onRepassesClick === 'function'
  const labelColunaRef =
    idxReferencia >= 0 ? colunas[idxReferencia]?.label : undefined

  return (
    <Card>
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">{titulo}</h5>
          {acoes}
        </div>
        {(resumosEuOutros?.length
          ? resumosEuOutros
          : resumoEuOutros
            ? [{ resumo: resumoEuOutros }]
            : []
        ).map((item, idx) => (
          <EuOutrosResumoCard
            key={`resumo-eu-${item.titulo || idx}`}
            resumo={item.resumo}
            labelColuna={labelColunaRef}
            titulo={item.titulo}
          />
        ))}
        {linhas.length === 0 ? (
          <div className="bg-primary text-white border-0 alert alert-primary fade show text-center mb-0">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-nowrap table-striped-columns mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="text-start" style={stickyHeadStyle}>
                    Nome
                  </th>
                  <CabecalhoMeses colunas={colunas} />
                  <th scope="col" className="text-end" style={{ minWidth: 90 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => {
                  const valorRef =
                    idxReferencia >= 0 ? linha.valores[idxReferencia] : undefined
                  return (
                    <tr key={linha.id} className={linha.eh_eu ? 'table-info' : undefined}>
                      <td
                        className="text-start"
                        style={{
                          ...stickyColStyle,
                          ...(labelClickable ? { cursor: 'pointer' } : {}),
                          ...(linha.eh_eu
                            ? { backgroundColor: 'rgba(var(--vz-info-rgb, 41, 156, 219), 0.08)' }
                            : {}),
                        }}
                        role={labelClickable ? 'button' : undefined}
                        tabIndex={labelClickable ? 0 : undefined}
                        title={
                          labelClickable ? 'Ver resumo do responsável' : undefined
                        }
                        onClick={labelClickable ? () => onLinhaLabelClick?.(linha) : undefined}
                        onKeyDown={
                          labelClickable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  onLinhaLabelClick?.(linha)
                                }
                              }
                            : undefined
                        }
                      >
                        <span className="d-flex align-items-center gap-2 fw-medium">
                          {linha.cor_fundo && (
                            <CartaoChip
                              cor_fundo={linha.cor_fundo}
                              cor_texto={linha.cor_texto}
                              label={String(linha.label).slice(0, 1)}
                            />
                          )}
                          <span
                            className={
                              labelClickable ? 'text-primary text-decoration-underline-hover' : undefined
                            }
                          >
                            {linha.label}
                            {linha.eh_eu && (
                              <Badge color="primary" className="ms-1" style={{ fontSize: '0.65rem' }}>
                                você
                              </Badge>
                            )}
                          </span>
                          {repassesClickable && !linha.eh_eu && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              title="Marcar o que este responsável já te pagou"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRepassesClick?.(linha)
                              }}
                            >
                              <i className="ri-money-dollar-circle-line me-1"></i>
                              Pagou?
                            </button>
                          )}
                        </span>
                        {linha.sublabel && (
                          <span className="d-block text-muted fs-12">{linha.sublabel}</span>
                        )}
                        {showUsoLimite && (
                          <LimiteUsoResumo
                            usoLimite={linha.uso_limite}
                            limite={linha.limite_credito}
                            valorReferencia={valorRef}
                            idPrefix={`${prefix}-${linha.id}`}
                            showEuOutros
                          />
                        )}
                      </td>
                      {colunas.map((col, idx) => (
                        <ProjecaoCelula
                          key={`${linha.id}-${col.chave}`}
                          valor={linha.valores[idx]}
                          coluna={col}
                          cellId={`${prefix}-${linha.id}-${col.chave}`}
                          showUsoLimite={showUsoLimite}
                          showParticipacao={showParticipacao}
                          showEuOutrosSplit={showEuOutrosSplit}
                          limiteCredito={linha.limite_credito}
                          onClick={
                            onCelulaClick
                              ? () => onCelulaClick(linha, col, linha.valores[idx])
                              : undefined
                          }
                        />
                      ))}
                      <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
                        <CurrencyValue value={linha.total} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <RodapeTotais colunas={colunas} totais={totais} prefix={prefix} />
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

const ProjecaoMatrizCruzamento = ({
  titulo,
  colunas,
  cartoes,
  prefix,
  acoes,
  onCelulaClick,
  onResponsavelLabelClick,
}: {
  titulo: string
  colunas: ProjecaoColuna[]
  cartoes: CartaoCruzamento[]
  prefix: string
  acoes?: React.ReactNode
  onCelulaClick?: (
    cartao: CartaoCruzamento,
    resp: ResponsavelCruzamento,
    coluna: ProjecaoColuna,
    valor: ProjecaoValor | undefined
  ) => void
  onResponsavelLabelClick?: (resp: ResponsavelCruzamento) => void
}) => {
  const [selecionado, setSelecionado] = useState<CartaoCruzamento | null>(null)
  const modalOpen = selecionado != null
  const idxReferencia = colunas.findIndex((c) => c.referencia)
  const labelColunaRef =
    idxReferencia >= 0 ? colunas[idxReferencia]?.label : undefined

  const closeModal = () => setSelecionado(null)

  return (
    <Card>
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">{titulo}</h5>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="text-muted fs-13">
              Clique no cartão para ver responsáveis e totais Eu vs Outros
            </span>
            {acoes}
          </div>
        </div>
        {cartoes.length === 0 ? (
          <div className="bg-primary text-white border-0 alert alert-primary fade show text-center mb-0">
            Nenhum dado encontrado para o período selecionado.
          </div>
        ) : (
          <Row className="g-3">
            {cartoes.map((cartao) => {
              const qtdResp = cartao.responsaveis.length
              return (
                <Col key={cartao.cartaoId} xs={12} sm={6} lg={4} xl={3}>
                  <Card
                    className="card-animate h-100 mb-0 border shadow-none"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelecionado(cartao)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelecionado(cartao)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CardBody className="d-flex flex-column gap-2 p-3">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <span className="d-flex align-items-center gap-2 fw-medium min-w-0">
                          {cartao.cartaoCorFundo && (
                            <CartaoChip
                              cor_fundo={cartao.cartaoCorFundo}
                              cor_texto={cartao.cartaoCorTexto}
                              label={String(cartao.cartaoLabel).slice(0, 1)}
                            />
                          )}
                          <span className="text-truncate">{cartao.cartaoLabel}</span>
                        </span>
                        <i className="ri-arrow-right-s-line fs-18 text-muted flex-shrink-0" />
                      </div>
                      {cartao.cartaoSublabel && (
                        <span className="text-muted fs-12">{cartao.cartaoSublabel}</span>
                      )}
                      <LimiteUsoResumo
                        usoLimite={cartao.uso_limite}
                        limite={cartao.limite_credito}
                        valorReferencia={cartao.valorReferencia}
                        idPrefix={`${prefix}-card-${cartao.cartaoId}`}
                        showEuOutros
                      />
                      <div className="mt-auto pt-2 d-flex align-items-end justify-content-between gap-2 border-top">
                        <Badge color="light" className="text-muted fw-normal">
                          {qtdResp} {qtdResp === 1 ? 'responsável' : 'responsáveis'}
                        </Badge>
                        <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>
                          <CurrencyValue value={cartao.total} />
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}

        <Modal isOpen={modalOpen} toggle={closeModal} size="xl" centered scrollable>
          {selecionado && (
            <>
              <ModalHeader toggle={closeModal}>
                <span className="d-flex align-items-center gap-2">
                  {selecionado.cartaoCorFundo && (
                    <CartaoChip
                      cor_fundo={selecionado.cartaoCorFundo}
                      cor_texto={selecionado.cartaoCorTexto}
                      label={String(selecionado.cartaoLabel).slice(0, 1)}
                    />
                  )}
                  <span>
                    {selecionado.cartaoLabel}
                    {selecionado.cartaoSublabel && (
                      <span className="d-block text-muted fs-12 fw-normal">
                        {selecionado.cartaoSublabel}
                      </span>
                    )}
                  </span>
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    <span className="text-muted fs-13 d-block">Total do cartão no período</span>
                    <span className={`fs-5 fw-semibold ${VALOR_TEXT_CLASS}`}>
                      <CurrencyValue value={selecionado.total} />
                    </span>
                  </div>
                  <LimiteUsoResumo
                    usoLimite={selecionado.uso_limite}
                    limite={selecionado.limite_credito}
                    valorReferencia={selecionado.valorReferencia}
                    idPrefix={`${prefix}-modal-${selecionado.cartaoId}`}
                    showEuOutros
                  />
                </div>

                <EuOutrosResumoCard
                  resumo={
                    selecionado.resumoEuOutrosRef ||
                    (selecionado.uso_limite?.meu && selecionado.uso_limite?.outros
                      ? {
                          meu: selecionado.uso_limite.meu,
                          outros: selecionado.uso_limite.outros,
                          total:
                            Number(selecionado.uso_limite.meu.total || 0) +
                            Number(selecionado.uso_limite.outros.total || 0),
                        }
                      : null)
                  }
                  labelColuna={labelColunaRef}
                />

                {selecionado.responsaveis.length === 0 ? (
                  <div className="bg-primary text-white border-0 alert alert-primary fade show text-center mb-0">
                    Nenhum responsável encontrado para este cartão.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-nowrap table-striped-columns mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="text-start" style={stickyHeadStyle}>
                            Responsável
                          </th>
                          <CabecalhoMeses colunas={colunas} />
                          <th scope="col" className="text-end" style={{ minWidth: 90 }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selecionado.responsaveis.map((resp) => (
                          <tr
                            key={resp.responsavelId}
                            className={resp.eh_eu ? 'table-info' : undefined}
                          >
                            <td
                              className="text-start"
                              style={{
                                ...stickyColStyle,
                                ...(onResponsavelLabelClick ? { cursor: 'pointer' } : {}),
                                ...(resp.eh_eu
                                  ? {
                                      backgroundColor:
                                        'rgba(var(--vz-info-rgb, 41, 156, 219), 0.08)',
                                    }
                                  : {}),
                              }}
                              role={onResponsavelLabelClick ? 'button' : undefined}
                              tabIndex={onResponsavelLabelClick ? 0 : undefined}
                              title={onResponsavelLabelClick ? 'Ver resumo do responsável' : undefined}
                              onClick={
                                onResponsavelLabelClick
                                  ? () => onResponsavelLabelClick(resp)
                                  : undefined
                              }
                              onKeyDown={
                                onResponsavelLabelClick
                                  ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        onResponsavelLabelClick(resp)
                                      }
                                    }
                                  : undefined
                              }
                            >
                              <span className={`fw-medium ${onResponsavelLabelClick ? 'text-primary' : ''}`}>
                                {resp.responsavelLabel}
                                {resp.eh_eu && (
                                  <Badge
                                    color="primary"
                                    className="ms-1"
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    você
                                  </Badge>
                                )}
                              </span>
                              {resp.responsavelSublabel && (
                                <span className="d-block text-muted fs-12">
                                  {resp.responsavelSublabel}
                                </span>
                              )}
                            </td>
                            {colunas.map((col, idx) => (
                              <ProjecaoCelula
                                key={`${selecionado.cartaoId}-${resp.responsavelId}-${col.chave}`}
                                valor={resp.valores[idx]}
                                coluna={col}
                                cellId={`${prefix}-${selecionado.cartaoId}-${resp.responsavelId}-${col.chave}`}
                                showParticipacao
                                onClick={
                                  onCelulaClick
                                    ? () =>
                                        onCelulaClick(
                                          selecionado,
                                          resp,
                                          col,
                                          resp.valores[idx]
                                        )
                                    : undefined
                                }
                              />
                            ))}
                            <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
                              <CurrencyValue value={resp.total} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td className="text-start" style={stickyFootStyle}>
                            Total
                          </td>
                          {colunas.map((col, idx) => {
                            const soma = selecionado.responsaveis.reduce(
                              (acc, r) => acc + Number(r.valores[idx]?.total || 0),
                              0
                            )
                            const projetado = selecionado.responsaveis.reduce(
                              (acc, r) => acc + Number(r.valores[idx]?.projetado || 0),
                              0
                            )
                            const realizado = selecionado.responsaveis.reduce(
                              (acc, r) => acc + Number(r.valores[idx]?.realizado || 0),
                              0
                            )
                            const cellId = `${prefix}-modal-total-${selecionado.cartaoId}-${col.chave}`
                            return (
                              <td
                                key={col.chave}
                                className={`text-end fw-semibold ${col.referencia ? 'table-primary' : ''} ${VALOR_TEXT_CLASS}`}
                              >
                                {soma > 0 ? (
                                  <>
                                    <span id={cellId}>
                                      <CurrencyValue value={soma} />
                                      {projetado > 0 && (
                                        <span
                                          className="badge bg-info-subtle text-info ms-1"
                                          style={{ fontSize: '0.65rem' }}
                                        >
                                          proj.
                                        </span>
                                      )}
                                    </span>
                                    <UncontrolledTooltip placement="top" target={cellId}>
                                      Realizado: {formatCurrency(realizado)} | Projetado:{' '}
                                      {formatCurrency(projetado)}
                                    </UncontrolledTooltip>
                                  </>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            )
                          })}
                          <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
                            <CurrencyValue value={selecionado.total} />
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </Modal>
      </CardBody>
    </Card>
  )
}

export const ProjecaoFaturasTable = ({ data, separarTitular = false }: ProjecaoFaturasTableProps) => {
  const navigate = useNavigate()

  const cartoesAgrupados = useMemo(
    () => agruparCartoesPorNome(data?.por_cartao || []),
    [data]
  )
  const cruzamentoAgrupado = useMemo(
    () => agruparCruzamentoPorNome(data?.por_cartao_responsavel || []),
    [data]
  )
  const responsaveisPorTitular = useMemo(
    () => separarResponsaveisPorTitular(data?.por_cartao_responsavel || []),
    [data]
  )

  if (!data) {
    return (
      <Row>
        <Col xl={12}>
          <div className="bg-danger text-white border-0 alert alert-danger fade show text-center">
            NENHUM RESULTADO ENCONTRADO!
          </div>
        </Col>
      </Row>
    )
  }

  const colunas = data.colunas || []
  const idxReferencia = colunas.findIndex((c) => c.referencia)
  const colunaReferencia = idxReferencia >= 0 ? colunas[idxReferencia] : colunas[0]
  const resumoEuOutrosRef =
    idxReferencia >= 0 ? (data.resumo_eu_outros || [])[idxReferencia] : undefined

  const goVisualizarResponsavel = (
    responsavelId: number | string,
    mes: number,
    ano: number
  ) => {
    navigate(buildResponsavelVisualizarPath(responsavelId, mes, ano))
  }

  const goFaturaResponsavel = (
    responsavelId: number | string,
    mes: number,
    ano: number,
    meta: FaturaResponsavelLocationState & { cartaoId?: number | null }
  ) => {
    const { cartaoId, ...state } = meta
    navigate(buildFaturaResponsavelPath(responsavelId, mes, ano, cartaoId), { state })
  }

  const goRepassesResponsavel = (
    responsavelId: number | string,
    mes: number,
    ano: number,
    meta: { nome?: string; tipo?: string }
  ) => {
    navigate(buildRepassesResponsavelPath(responsavelId, mes, ano), { state: meta })
  }

  const cartoesVisiveis = separarTitular
    ? (data.por_cartao || []).map((cartao) => ({
        ...cartao,
        qtd_cartoes: 1,
        cartao_ids: [cartao.cartao_id],
        agrupado: false,
      }))
    : cartoesAgrupados

  const cruzamentoVisivel = separarTitular
    ? (data.por_cartao_responsavel || []).map((cartao) => ({
        ...cartao,
        qtd_cartoes: 1,
        cartao_ids: [cartao.cartao_id],
        agrupado: false,
      }))
    : cruzamentoAgrupado

  const linhasCartoes: LinhaTabela[] = cartoesVisiveis.map((c) => ({
    id: c.agrupado ? idGrupoCartao(c.nome) : c.cartao_id,
    label: c.nome,
    sublabel: sublabelCartao(c, { separarTitular, qtdCartoes: c.qtd_cartoes }) || undefined,
    cor_fundo: c.cor_fundo,
    cor_texto: c.cor_texto,
    limite_credito: c.limite_credito,
    uso_limite: c.uso_limite,
    valores: c.valores || [],
    total: c.total,
  }))

  const usarResponsaveisPorTitular =
    separarTitular && (data.por_cartao_responsavel || []).length > 0

  const linhasResponsaveis: LinhaTabela[] = (usarResponsaveisPorTitular
    ? responsaveisPorTitular
    : (data.por_responsavel || []).map((r) => ({
        ...r,
        pessoa_id: null as number | null,
        pessoa_nome: null as string | null,
        cartao_ids: [] as number[],
      }))
  ).map((r) => ({
    id: usarResponsaveisPorTitular ? `${chaveTitular(r.pessoa_id, r.pessoa_nome)}-${r.responsavel_id}` : r.responsavel_id,
    label: r.nome,
    sublabel: [
      usarResponsaveisPorTitular ? r.pessoa_nome : null,
      r.tipo ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : null,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
    eh_eu: r.eh_eu === true,
    valores: r.valores || [],
    total: r.total,
    responsavelId: r.responsavel_id,
    cartaoIds: r.cartao_ids,
    tipo: r.tipo,
  }))

  const resumosResponsaveis = usarResponsaveisPorTitular
    ? resumosEuOutrosPorTitular(responsaveisPorTitular, idxReferencia >= 0 ? idxReferencia : 0)
    : undefined

  const cartoesCruzamento: CartaoCruzamento[] = cruzamentoVisivel.map((cartao) => {
    const valorReferencia =
      idxReferencia >= 0 ? (cartao.valores || [])[idxReferencia] : undefined
    const resumoEuOutrosRefCartao =
      idxReferencia >= 0 ? (cartao.resumo_eu_outros || [])[idxReferencia] : undefined

    return {
      cartaoId: cartao.agrupado ? idGrupoCartao(cartao.nome) : cartao.cartao_id,
      cartaoLabel: cartao.nome,
      cartaoSublabel: sublabelCartao(cartao, { separarTitular, qtdCartoes: cartao.qtd_cartoes }) || undefined,
      cartaoCorFundo: cartao.cor_fundo,
      cartaoCorTexto: cartao.cor_texto,
      limite_credito: cartao.limite_credito,
      uso_limite: cartao.uso_limite,
      resumoEuOutrosRef: resumoEuOutrosRefCartao,
      valorReferencia,
      valores: cartao.valores || [],
      total: cartao.total,
      agrupado: cartao.agrupado,
      responsaveis: (cartao.por_responsavel || [])
        .filter((resp) => Number(resp.total) > 0)
        .map((resp) => ({
        responsavelId: resp.responsavel_id,
        responsavelLabel: resp.nome,
        responsavelSublabel: resp.tipo
          ? resp.tipo.charAt(0).toUpperCase() + resp.tipo.slice(1)
          : undefined,
        eh_eu: resp.eh_eu === true && (!separarTitular || cartao.pessoa_eh_principal === true),
        valores: resp.valores || [],
        total: resp.total,
      })),
    }
  })

  const totaisCartoes = (data.totais_por_coluna || []).map((t) => t.cartoes)
  const totaisResponsaveis = (data.totais_por_coluna || []).map((t) => t.responsaveis)
  const idResponsavelLinha = (linha: LinhaTabela) => linha.responsavelId ?? linha.id
  const cartaoLinha = (linha: LinhaTabela) =>
    linha.cartaoIds?.length === 1 ? linha.cartaoIds[0] : null

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <ProjecaoMatriz
            titulo={separarTitular ? 'Por cartão · titular' : 'Por cartão'}
            colunas={colunas}
            linhas={linhasCartoes}
            totais={totaisCartoes}
            prefix="proj-cartao"
            showUsoLimite
            showEuOutrosSplit
          />
        </Col>
      </Row>
      <Row>
        <Col xl={12}>
          <ProjecaoMatriz
            titulo={separarTitular ? 'Por responsável · titular' : 'Por responsável'}
            colunas={colunas}
            linhas={linhasResponsaveis}
            totais={totaisResponsaveis}
            prefix="proj-resp"
            showParticipacao
            resumoEuOutros={usarResponsaveisPorTitular ? undefined : resumoEuOutrosRef}
            resumosEuOutros={resumosResponsaveis}
            onLinhaLabelClick={(linha) => {
              if (!colunaReferencia) return
              goVisualizarResponsavel(
                idResponsavelLinha(linha),
                colunaReferencia.mes,
                colunaReferencia.ano
              )
            }}
            onRepassesClick={(linha) => {
              if (!colunaReferencia) return
              goRepassesResponsavel(idResponsavelLinha(linha), colunaReferencia.mes, colunaReferencia.ano, {
                nome: linha.label,
                tipo: linha.tipo,
              })
            }}
            onCelulaClick={(linha, coluna, valor) => {
              goFaturaResponsavel(idResponsavelLinha(linha), coluna.mes, coluna.ano, {
                nome: linha.label,
                tipo: linha.tipo,
                realizado: valor?.realizado,
                projetado: valor?.projetado,
                total: valor?.total,
                cartaoId: cartaoLinha(linha),
              })
            }}
          />
        </Col>
      </Row>
      <Row>
        <Col xl={12}>
          <ProjecaoMatrizCruzamento
            titulo={separarTitular ? 'Por cartão × responsável · titular' : 'Por cartão × responsável'}
            colunas={colunas}
            cartoes={cartoesCruzamento}
            prefix="proj-cruz"
            onCelulaClick={(cartao, resp, coluna, valor) => {
              goFaturaResponsavel(resp.responsavelId, coluna.mes, coluna.ano, {
                nome: resp.responsavelLabel,
                tipo: resp.responsavelSublabel?.toLowerCase(),
                realizado: valor?.realizado,
                projetado: valor?.projetado,
                total: valor?.total,
                cartaoId: cartao.agrupado || typeof cartao.cartaoId !== 'number' ? null : cartao.cartaoId,
              })
            }}
            onResponsavelLabelClick={(resp) => {
              if (!colunaReferencia) return
              goVisualizarResponsavel(resp.responsavelId, colunaReferencia.mes, colunaReferencia.ano)
            }}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <div className="hstack gap-2 justify-content-end mb-3 flex-wrap">
            <span className="text-muted fs-13">
              <span className="badge bg-info-subtle text-info me-1">proj.</span>
              parcela projetada
            </span>
            <span className="text-muted fs-13">
              <span className="badge bg-success-subtle text-success me-1">&lt;50%</span>
              <span className="badge bg-warning-subtle text-warning me-1">50–80%</span>
              <span className="badge bg-danger-subtle text-danger me-1">&gt;80%</span>
              uso do limite
            </span>
            <span className="text-muted fs-13">
              <span className="badge bg-primary-subtle text-primary me-1">Eu</span>
              <span className="badge bg-secondary-subtle text-secondary me-1">Outros</span>
              split do consumo
            </span>
            <span className="text-muted fs-13">
              Clique no responsável para o resumo · na célula do mês para a fatura
            </span>
            <span className="text-muted fs-13">
              <span className="badge bg-success me-1">Pagou?</span>
              marcar o que o responsável já te devolveu
            </span>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default ProjecaoFaturasTable
