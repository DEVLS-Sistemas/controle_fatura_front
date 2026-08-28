import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPercentualApi, formatVariacao } from 'helpers/gastos_criticos_helpers'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  corCategoria,
} from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaAtalho,
  GastosPorCategoriaSubDestaque,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaHeroProps {
  data?: GastosPorCategoriaView
  loading?: boolean
}

const abrirAtalho = (
  navigate: ReturnType<typeof useNavigate>,
  atalho?: GastosPorCategoriaAtalho | null
) => {
  const path = atalhoToPath(atalho)
  if (!path) return
  navigate(path, { state: atalhoToPeriodoState(atalho) })
}

const SubCard = ({ sub, cor }: { sub: GastosPorCategoriaSubDestaque; cor: string }) => {
  const navigate = useNavigate()
  const path = atalhoToPath(sub.atalho)
  const percentual = formatPercentualApi(sub.percentual_da_categoria)

  return (
    <Col xs={12} md={6}>
      <div
        className="border rounded p-3 h-100"
        role={path ? 'button' : undefined}
        tabIndex={path ? 0 : undefined}
        onClick={(e) => {
          e.stopPropagation()
          abrirAtalho(navigate, sub.atalho)
        }}
        onKeyDown={(e) => {
          if (path && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            e.stopPropagation()
            abrirAtalho(navigate, sub.atalho)
          }
        }}
        style={path ? { cursor: 'pointer' } : undefined}
      >
        <p className="text-uppercase fw-medium text-muted mb-1 fs-12">Subcategoria</p>
        <h5 className="mb-2">{sub.nome || '—'}</h5>
        <h4 className={`fs-20 fw-semibold ff-secondary mb-1 ${VALOR_TEXT_CLASS}`}>
          {formatCurrency(sub.valor_total)}
        </h4>
        {percentual ? (
          <p className="text-muted mb-2 fs-13">{percentual} da categoria</p>
        ) : null}
        <div className="progress" style={{ height: 6 }}>
          <div
            className="progress-bar"
            style={{
              width: `${Math.min(100, Math.max(0, Number(sub.percentual_da_categoria ?? 0)))}%`,
              backgroundColor: cor,
            }}
          />
        </div>
      </div>
    </Col>
  )
}

const GastosPorCategoriaHero = ({ data, loading }: GastosPorCategoriaHeroProps) => {
  const navigate = useNavigate()

  if (loading && !data) {
    return (
      <Card className="mb-3">
        <CardBody>
          <div className="placeholder-glow">
            <span className="placeholder col-3 mb-3"></span>
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-10 mb-3"></span>
            <span className="placeholder col-5 me-2"></span>
            <span className="placeholder col-5"></span>
          </div>
        </CardBody>
      </Card>
    )
  }

  const destaque = data?.destaque
  if (!destaque) return null

  const categoria = destaque.categoria
  const cor = corCategoria(categoria)
  const path = atalhoToPath(categoria?.atalho)
  const variacao = formatVariacao(categoria?.variacao_valor_percentual)
  const subs = Array.isArray(destaque.subcategorias) ? destaque.subcategorias.slice(0, 2) : []

  return (
    <Card
      className="mb-3 card-animate"
      role={path ? 'button' : undefined}
      tabIndex={path ? 0 : undefined}
      onClick={() => abrirAtalho(navigate, categoria?.atalho)}
      onKeyDown={(e) => {
        if (path && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          abrirAtalho(navigate, categoria?.atalho)
        }
      }}
      style={path ? { cursor: 'pointer' } : undefined}
    >
      <CardBody>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-block flex-shrink-0"
              style={{ width: 14, height: 14, backgroundColor: cor }}
            />
            <div>
              <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Categoria que mais come o orçamento</p>
              <h4 className="mb-0">{categoria?.nome || '—'}</h4>
            </div>
          </div>
          {categoria?.variacao_valor_percentual == null ? (
            <Badge color="info" pill>
              Novo
            </Badge>
          ) : (
            <Badge color={variacao.color} pill>
              {variacao.label}
            </Badge>
          )}
        </div>

        {destaque.frase ? <p className="fs-16 fw-medium mb-3">{destaque.frase}</p> : null}

        {subs.length > 0 ? (
          <Row className="g-3">
            {subs.map((sub, idx) => (
              <SubCard key={sub.subcategoria_id ?? idx} sub={sub} cor={cor} />
            ))}
          </Row>
        ) : null}
      </CardBody>
    </Card>
  )
}

export default GastosPorCategoriaHero
