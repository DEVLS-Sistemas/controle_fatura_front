import React from 'react'
import { Card, CardBody, Col, Row, UncontrolledTooltip } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
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
  minWidth: 160,
  maxWidth: 220,
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

export interface ProjecaoFaturasTableProps {
  data: ProjecaoFaturasView | undefined
}

type LinhaTabela = {
  id: number | string
  label: string
  sublabel?: string
  valores: ProjecaoValor[]
  total: number
}

const cellClassName = (valor: ProjecaoValor | undefined, isReferencia: boolean): string => {
  const classes = [VALOR_TEXT_CLASS, 'text-end']
  if (isReferencia) classes.push('table-primary')
  if (valor && Number(valor.projetado) > 0) classes.push('text-info')
  if (valor?.fonte === 'vazio') classes.push('text-muted')
  return classes.join(' ')
}

const ProjecaoCelula = ({
  valor,
  coluna,
  cellId,
}: {
  valor: ProjecaoValor | undefined
  coluna: ProjecaoColuna
  cellId: string
}) => {
  if (!valor || valor.fonte === 'vazio' || Number(valor.total) === 0) {
    return (
      <td className={cellClassName(valor, coluna.referencia)}>
        <span className="text-muted">-</span>
      </td>
    )
  }

  const temProjecao = Number(valor.projetado) > 0

  return (
    <td className={cellClassName(valor, coluna.referencia)}>
      <span id={cellId} className="d-inline-flex align-items-center gap-1">
        <CurrencyValue value={valor.total} />
        {temProjecao && (
          <span className="badge bg-info-subtle text-info" style={{ fontSize: '0.65rem' }}>
            proj.
          </span>
        )}
      </span>
      <UncontrolledTooltip placement="top" target={cellId}>
        Realizado: {formatCurrency(valor.realizado)} | Projetado: {formatCurrency(valor.projetado)}
      </UncontrolledTooltip>
    </td>
  )
}

const ProjecaoMatriz = ({
  titulo,
  colunas,
  linhas,
  totais,
  prefix,
}: {
  titulo: string
  colunas: ProjecaoColuna[]
  linhas: LinhaTabela[]
  totais: Array<{ realizado: number; projetado: number; total: number }>
  prefix: string
}) => (
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
                      {col.referencia && (
                        <span className="d-block fs-10 fw-normal text-primary">ref.</span>
                      )}
                    </th>
                  )
                })}
                <th scope="col" className="text-end" style={{ minWidth: 90 }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.id}>
                  <td className="text-start" style={stickyColStyle}>
                    <span className="fw-medium">{linha.label}</span>
                    {linha.sublabel && (
                      <span className="d-block text-muted fs-12">{linha.sublabel}</span>
                    )}
                  </td>
                  {colunas.map((col, idx) => (
                    <ProjecaoCelula
                      key={`${linha.id}-${col.chave}`}
                      valor={linha.valores[idx]}
                      coluna={col}
                      cellId={`${prefix}-${linha.id}-${col.chave}`}
                    />
                  ))}
                  <td className={`text-end fw-semibold ${VALOR_TEXT_CLASS}`}>
                    <CurrencyValue value={linha.total} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td className="text-start" style={stickyFootStyle}>
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
                  <CurrencyValue
                    value={totais.reduce((acc, t) => acc + Number(t?.total || 0), 0)}
                  />
                </td>
              </tr>
            </tfoot>
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

  const linhasCartoes: LinhaTabela[] = (data.por_cartao || []).map((c) => ({
    id: c.cartao_id,
    label: c.nome,
    sublabel: [c.bandeira, c.ultimos_digitos ? `•••• ${c.ultimos_digitos}` : null]
      .filter(Boolean)
      .join(' · '),
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
        <Col md={12}>
          <div className="hstack gap-2 justify-content-end mb-3">
            <span className="text-muted fs-13">
              <span className="badge bg-info-subtle text-info me-1">proj.</span>
              indica valores com parcela projetada
            </span>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default ProjecaoFaturasTable
