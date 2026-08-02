import React from 'react'
import { Card, CardBody, Col, Progress, Row, UncontrolledTooltip } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import {
  ProjecaoColuna,
  ProjecaoValor,
  ProjecaoFaturasView,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'

const stickyColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  backgroundColor: 'var(--vz-secondary-bg, #fff)',
  minWidth: 200,
  maxWidth: 260,
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

const stickySecondColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 200,
  zIndex: 2,
  backgroundColor: 'var(--vz-secondary-bg, #fff)',
  minWidth: 140,
  maxWidth: 200,
}

const stickySecondHeadStyle: React.CSSProperties = {
  ...stickySecondColStyle,
  zIndex: 3,
  backgroundColor: 'var(--vz-light, #f3f6f9)',
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
  if (pct == null || Number.isNaN(Number(pct))) return ''
  return `${Math.round(Number(pct))}%`
}

const hasLimite = (limite: number | null | undefined): boolean =>
  limite != null && !Number.isNaN(Number(limite)) && Number(limite) > 0

export interface ProjecaoFaturasTableProps {
  data: ProjecaoFaturasView | undefined
}

type LinhaTabela = {
  id: number | string
  label: string
  sublabel?: string
  cor_fundo?: string | null
  cor_texto?: string | null
  limite_credito?: number | null
  valores: ProjecaoValor[]
  total: number
}

type LinhaCruzamento = {
  cartaoId: number
  cartaoLabel: string
  cartaoSublabel?: string
  cartaoCorFundo?: string | null
  cartaoCorTexto?: string | null
  limite_credito?: number | null
  valorReferencia?: ProjecaoValor
  responsavelId: number
  responsavelLabel: string
  responsavelSublabel?: string
  valores: ProjecaoValor[]
  total: number
  isFirstOfCartao: boolean
  cartaoRowSpan: number
}

const cellClassName = (valor: ProjecaoValor | undefined, isReferencia: boolean): string => {
  const classes = [VALOR_TEXT_CLASS, 'text-end']
  if (isReferencia) classes.push('table-primary')
  if (valor && Number(valor.projetado) > 0) classes.push('text-info')
  if (valor?.fonte === 'vazio') classes.push('text-muted')
  return classes.join(' ')
}

const LimiteUsoResumo = ({
  limite,
  valorReferencia,
  idPrefix,
}: {
  limite?: number | null
  valorReferencia?: ProjecaoValor
  idPrefix: string
}) => {
  if (!hasLimite(limite)) return null

  const pct = valorReferencia?.percentual_utilizado
  const pctNum = pct != null ? Number(pct) : 0
  const tone = percentualTone(pctNum)
  const barId = `${idPrefix}-limite-bar`

  return (
    <div className="mt-1" style={{ maxWidth: 180 }}>
      <span className="d-block text-muted fs-11">
        Limite {formatCurrency(limite)}
      </span>
      <div id={barId} className="d-flex align-items-center gap-1">
        <Progress
          value={Math.min(100, Math.max(0, pctNum))}
          color={tone}
          className="flex-grow-1 mb-0"
          style={{ height: 6 }}
        />
        <span className={`fs-11 fw-semibold text-${tone}`}>
          {formatPercentual(pctNum)}
        </span>
      </div>
      {valorReferencia && (
        <UncontrolledTooltip placement="top" target={barId}>
          Realizado: {formatCurrency(valorReferencia.realizado)}
          {' | '}
          Projetado: {formatCurrency(valorReferencia.projetado)}
          {' | '}
          Limite: {formatCurrency(limite)}
          {' | '}
          Disponível: {formatCurrency(valorReferencia.disponivel)}
          {' '}({formatPercentual(pctNum)})
        </UncontrolledTooltip>
      )}
    </div>
  )
}

const ProjecaoCelula = ({
  valor,
  coluna,
  cellId,
  showUsoLimite,
  limiteCredito,
}: {
  valor: ProjecaoValor | undefined
  coluna: ProjecaoColuna
  cellId: string
  showUsoLimite?: boolean
  limiteCredito?: number | null
}) => {
  if (!valor || valor.fonte === 'vazio' || Number(valor.total) === 0) {
    return (
      <td className={cellClassName(valor, coluna.referencia)}>
        <span className="text-muted">-</span>
      </td>
    )
  }

  const temProjecao = Number(valor.projetado) > 0
  const pct = valor.percentual_utilizado
  const showPct = showUsoLimite && hasLimite(limiteCredito) && pct != null
  const tone = showPct ? percentualTone(Number(pct)) : null

  return (
    <td className={cellClassName(valor, coluna.referencia)}>
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
            {formatPercentual(pct)}
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
            Disponível: {formatCurrency(valor.disponivel)}
            {' '}({formatPercentual(pct)})
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
}: {
  titulo: string
  colunas: ProjecaoColuna[]
  linhas: LinhaTabela[]
  totais: Array<{ realizado: number; projetado: number; total: number }>
  prefix: string
  showUsoLimite?: boolean
}) => {
  const idxReferencia = colunas.findIndex((c) => c.referencia)

  return (
    <Card>
      <CardBody>
        <h5 className="card-title mb-3">{titulo}</h5>
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
                    <tr key={linha.id}>
                      <td className="text-start" style={stickyColStyle}>
                        <span className="d-flex align-items-center gap-2 fw-medium">
                          {linha.cor_fundo && (
                            <CartaoChip
                              cor_fundo={linha.cor_fundo}
                              cor_texto={linha.cor_texto}
                              label={String(linha.label).slice(0, 1)}
                            />
                          )}
                          <span>{linha.label}</span>
                        </span>
                        {linha.sublabel && (
                          <span className="d-block text-muted fs-12">{linha.sublabel}</span>
                        )}
                        {showUsoLimite && (
                          <LimiteUsoResumo
                            limite={linha.limite_credito}
                            valorReferencia={valorRef}
                            idPrefix={`${prefix}-${linha.id}`}
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
                          limiteCredito={linha.limite_credito}
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
  linhas,
  prefix,
}: {
  titulo: string
  colunas: ProjecaoColuna[]
  linhas: LinhaCruzamento[]
  prefix: string
}) => (
  <Card>
    <CardBody>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h5 className="card-title mb-0">{titulo}</h5>
        <span className="text-muted fs-13">
          Quanto cada responsável gerou em cada cartão
        </span>
      </div>
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
                  Cartão
                </th>
                <th scope="col" className="text-start" style={stickySecondHeadStyle}>
                  Responsável
                </th>
                <CabecalhoMeses colunas={colunas} />
                <th scope="col" className="text-end" style={{ minWidth: 90 }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={`${linha.cartaoId}-${linha.responsavelId}`}>
                  {linha.isFirstOfCartao && (
                    <td className="text-start align-middle" style={stickyColStyle} rowSpan={linha.cartaoRowSpan}>
                      <span className="d-flex align-items-center gap-2 fw-medium">
                        {linha.cartaoCorFundo && (
                          <CartaoChip
                            cor_fundo={linha.cartaoCorFundo}
                            cor_texto={linha.cartaoCorTexto}
                            label={String(linha.cartaoLabel).slice(0, 1)}
                          />
                        )}
                        <span>{linha.cartaoLabel}</span>
                      </span>
                      {linha.cartaoSublabel && (
                        <span className="d-block text-muted fs-12">{linha.cartaoSublabel}</span>
                      )}
                      <LimiteUsoResumo
                        limite={linha.limite_credito}
                        valorReferencia={linha.valorReferencia}
                        idPrefix={`${prefix}-${linha.cartaoId}`}
                      />
                    </td>
                  )}
                  <td className="text-start" style={stickySecondColStyle}>
                    <span className="fw-medium">{linha.responsavelLabel}</span>
                    {linha.responsavelSublabel && (
                      <span className="d-block text-muted fs-12">{linha.responsavelSublabel}</span>
                    )}
                  </td>
                  {colunas.map((col, idx) => (
                    <ProjecaoCelula
                      key={`${linha.cartaoId}-${linha.responsavelId}-${col.chave}`}
                      valor={linha.valores[idx]}
                      coluna={col}
                      cellId={`${prefix}-${linha.cartaoId}-${linha.responsavelId}-${col.chave}`}
                    />
                  ))}
                  <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
                    <CurrencyValue value={linha.total} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardBody>
  </Card>
)

export const ProjecaoFaturasTable = ({ data }: ProjecaoFaturasTableProps) => {
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

  const linhasCartoes: LinhaTabela[] = (data.por_cartao || []).map((c) => ({
    id: c.cartao_id,
    label: c.nome,
    sublabel: [c.bandeira, c.ultimos_digitos ? `•••• ${c.ultimos_digitos}` : null]
      .filter(Boolean)
      .join(' · '),
    cor_fundo: c.cor_fundo,
    cor_texto: c.cor_texto,
    limite_credito: c.limite_credito,
    valores: c.valores || [],
    total: c.total,
  }))

  const linhasResponsaveis: LinhaTabela[] = (data.por_responsavel || []).map((r) => ({
    id: r.responsavel_id,
    label: r.nome,
    sublabel: r.tipo ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : undefined,
    valores: r.valores || [],
    total: r.total,
  }))

  const linhasCruzamento: LinhaCruzamento[] = []
  ;(data.por_cartao_responsavel || []).forEach((cartao) => {
    const responsaveis = cartao.por_responsavel || []
    const cartaoSublabel = [cartao.bandeira, cartao.ultimos_digitos ? `•••• ${cartao.ultimos_digitos}` : null]
      .filter(Boolean)
      .join(' · ')
    const valorReferencia =
      idxReferencia >= 0 ? (cartao.valores || [])[idxReferencia] : undefined

    responsaveis.forEach((resp, idx) => {
      linhasCruzamento.push({
        cartaoId: cartao.cartao_id,
        cartaoLabel: cartao.nome,
        cartaoSublabel: cartaoSublabel || undefined,
        cartaoCorFundo: cartao.cor_fundo,
        cartaoCorTexto: cartao.cor_texto,
        limite_credito: cartao.limite_credito,
        valorReferencia,
        responsavelId: resp.responsavel_id,
        responsavelLabel: resp.nome,
        responsavelSublabel: resp.tipo
          ? resp.tipo.charAt(0).toUpperCase() + resp.tipo.slice(1)
          : undefined,
        valores: resp.valores || [],
        total: resp.total,
        isFirstOfCartao: idx === 0,
        cartaoRowSpan: responsaveis.length,
      })
    })
  })

  const totaisCartoes = (data.totais_por_coluna || []).map((t) => t.cartoes)
  const totaisResponsaveis = (data.totais_por_coluna || []).map((t) => t.responsaveis)

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <ProjecaoMatriz
            titulo="Por cartão"
            colunas={colunas}
            linhas={linhasCartoes}
            totais={totaisCartoes}
            prefix="proj-cartao"
            showUsoLimite
          />
        </Col>
      </Row>
      <Row>
        <Col xl={12}>
          <ProjecaoMatriz
            titulo="Por responsável"
            colunas={colunas}
            linhas={linhasResponsaveis}
            totais={totaisResponsaveis}
            prefix="proj-resp"
          />
        </Col>
      </Row>
      <Row>
        <Col xl={12}>
          <ProjecaoMatrizCruzamento
            titulo="Por cartão × responsável"
            colunas={colunas}
            linhas={linhasCruzamento}
            prefix="proj-cruz"
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
          </div>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default ProjecaoFaturasTable
