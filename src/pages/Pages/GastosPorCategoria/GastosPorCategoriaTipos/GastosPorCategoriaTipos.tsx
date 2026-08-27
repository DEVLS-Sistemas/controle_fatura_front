import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPercentualApi } from 'helpers/gastos_criticos_helpers'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  origemCor,
} from 'helpers/gastos_por_categoria_helpers'
import { GastosPorCategoriaOrigemItem } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaTiposProps {
  itens?: GastosPorCategoriaOrigemItem[] | null
  origemAtiva?: string | null
  onFiltrar: (origem: string | null) => void
}

const GastosPorCategoriaTipos = ({ itens, origemAtiva, onFiltrar }: GastosPorCategoriaTiposProps) => {
  const navigate = useNavigate()
  const lista = Array.isArray(itens) ? itens : []
  if (lista.length === 0) return null

  const total = lista.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h5 className="card-title mb-0">Como você compra</h5>
            <p className="text-muted mb-0 fs-13">Online, presencial, serviços e pagamento de fatura</p>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${!origemAtiva ? 'btn-primary' : 'btn-soft-secondary'}`}
            onClick={() => onFiltrar(null)}
          >
            Todos
          </button>
        </div>

        <div className="progress mb-3" style={{ height: 12 }}>
          {lista.map((item, idx) => {
            const pct = total > 0 ? (Number(item.valor_total ?? 0) / total) * 100 : 0
            if (pct <= 0) return null
            return (
              <div
                key={item.origem_compra ?? `sem-origem-${idx}`}
                className="progress-bar"
                title={item.frase || item.label || ''}
                style={{
                  width: `${pct}%`,
                  backgroundColor: origemCor(item.origem_compra),
                }}
              />
            )
          })}
        </div>

        <Row className="g-3">
          {lista.map((item, idx) => {
            const origem = item.origem_compra ?? null
            const ativa = origemAtiva ? origemAtiva === origem : false
            const semOrigem = origem == null
            const percentual = formatPercentualApi(item.percentual_gasto)
            const path = atalhoToPath(item.atalho)

            return (
              <Col xs={12} sm={6} xl={3} key={origem ?? `sem-origem-${idx}`}>
                <div
                  className={`border rounded p-3 h-100 ${ativa ? 'border-primary' : ''} ${
                    semOrigem ? 'bg-light' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  title={item.frase || undefined}
                  onClick={() => {
                    if (semOrigem) {
                      if (path) navigate(path, { state: atalhoToPeriodoState(item.atalho) })
                      return
                    }
                    onFiltrar(ativa ? null : origem)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (semOrigem) {
                        if (path) navigate(path, { state: atalhoToPeriodoState(item.atalho) })
                        return
                      }
                      onFiltrar(ativa ? null : origem)
                    }
                  }}
                  style={{ cursor: 'pointer', opacity: semOrigem ? 0.85 : 1 }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span
                      className="rounded-circle d-inline-block flex-shrink-0"
                      style={{ width: 10, height: 10, backgroundColor: origemCor(origem) }}
                    />
                    <h6 className="mb-0">{item.label || 'Sem origem'}</h6>
                  </div>
                  <h4 className={`fs-18 fw-semibold ff-secondary mb-1 ${VALOR_TEXT_CLASS}`}>
                    {formatCurrency(item.valor_total)}
                  </h4>
                  {percentual ? <p className="text-muted mb-2 fs-13">{percentual} do total</p> : null}
                  {path ? (
                    <button
                      type="button"
                      className="btn btn-soft-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(path, { state: atalhoToPeriodoState(item.atalho) })
                      }}
                    >
                      Ver compras
                    </button>
                  ) : null}
                </div>
              </Col>
            )
          })}
        </Row>
      </CardBody>
    </Card>
  )
}

export default GastosPorCategoriaTipos
