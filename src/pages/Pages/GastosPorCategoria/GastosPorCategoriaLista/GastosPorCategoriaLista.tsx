import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, Col, Row } from 'reactstrap'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { formatPercentualApi, formatVariacao } from 'helpers/gastos_criticos_helpers'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  barraPercentual,
  corCategoria,
} from 'helpers/gastos_por_categoria_helpers'
import {
  GastosPorCategoriaItem,
  GastosPorCategoriaSubDestaque,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaListaProps {
  categorias?: GastosPorCategoriaItem[] | null
  loading?: boolean
}

const SubBarra = ({
  sub,
  cor,
  onOpen,
}: {
  sub: GastosPorCategoriaSubDestaque
  cor: string
  onOpen: () => void
}) => {
  const path = atalhoToPath(sub.atalho)
  const percentual = formatPercentualApi(sub.percentual_da_categoria)

  return (
    <Col xs={12} md={6}>
      <div
        role={path ? 'button' : undefined}
        tabIndex={path ? 0 : undefined}
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        onKeyDown={(e) => {
          if (path && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            e.stopPropagation()
            onOpen()
          }
        }}
        style={path ? { cursor: 'pointer' } : undefined}
      >
        <div className="d-flex justify-content-between gap-2 fs-13 mb-1">
          <span className="text-truncate">{sub.nome || '—'}</span>
          <span className="text-muted flex-shrink-0">{percentual || ''}</span>
        </div>
        <div className="progress" style={{ height: 6 }}>
          <div
            className="progress-bar"
            style={{
              width: `${barraPercentual(sub.percentual_da_categoria)}%`,
              backgroundColor: cor,
            }}
          />
        </div>
      </div>
    </Col>
  )
}

const CategoriaCard = ({ item }: { item: GastosPorCategoriaItem }) => {
  const navigate = useNavigate()
  const path = atalhoToPath(item.atalho)
  const cor = corCategoria(item.cor)
  const percentual = formatPercentualApi(item.percentual_gasto)
  const variacao = formatVariacao(item.variacao_valor_percentual)
  const subs = Array.isArray(item.top_subcategorias) ? item.top_subcategorias.slice(0, 2) : []
  const outras = item.outras_subcategorias
  const semSub = item.sem_subcategoria

  const abrir = (atalho = item.atalho) => {
    const destino = atalhoToPath(atalho)
    if (!destino) return
    navigate(destino, { state: atalhoToPeriodoState(atalho) })
  }

  return (
    <div
      className={`border rounded p-3 mb-2 ${path ? 'card-animate' : ''}`}
      role={path ? 'button' : undefined}
      tabIndex={path ? 0 : undefined}
      onClick={() => abrir()}
      onKeyDown={(e) => {
        if (path && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          abrir()
        }
      }}
      title={item.frase || (path ? 'Ver compras' : undefined)}
      style={path ? { cursor: 'pointer' } : undefined}
    >
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
          <span
            className="rounded-circle d-inline-block flex-shrink-0"
            style={{ width: 10, height: 10, backgroundColor: cor }}
          />
          <h6 className="mb-0 text-truncate">{item.nome || 'Sem categoria'}</h6>
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <strong className={VALOR_TEXT_CLASS}>{formatCurrency(item.valor_total)}</strong>
          {percentual ? <span className="text-muted fs-13">{percentual}</span> : null}
          {item.variacao_valor_percentual == null ? (
            <Badge color="info" pill>
              Novo
            </Badge>
          ) : (
            <Badge color={variacao.color} pill>
              {variacao.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="progress mb-3" style={{ height: 8 }}>
        <div
          className="progress-bar"
          style={{ width: `${barraPercentual(item.percentual_gasto)}%`, backgroundColor: cor }}
        />
      </div>

      {subs.length === 0 ? (
        <p className="text-muted mb-0 fs-13">Sem subcategorias neste período</p>
      ) : (
        <Row className="g-2">
          {subs.map((sub, idx) => (
            <SubBarra
              key={sub.subcategoria_id ?? idx}
              sub={sub}
              cor={cor}
              onOpen={() => abrir(sub.atalho)}
            />
          ))}
        </Row>
      )}

      <div className="d-flex flex-wrap gap-2 mt-2">
        {outras && Number(outras.quantidade) > 0 ? (
          <span className="text-muted fs-13">
            +{outras.quantidade} outras · {formatCurrency(outras.valor_total)}
          </span>
        ) : null}
        {semSub && Number(semSub.valor_total) > 0 ? (
          <Badge color="secondary" className="bg-secondary-subtle text-secondary" pill>
            Sem subcategoria {formatCurrency(semSub.valor_total)}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

const ListaSkeleton = () => (
  <Card className="mb-3">
    <CardBody>
      <div className="placeholder-glow">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="mb-3">
            <span className="placeholder col-4 mb-2"></span>
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-8"></span>
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
)

const GastosPorCategoriaLista = ({ categorias, loading }: GastosPorCategoriaListaProps) => {
  if (loading) return <ListaSkeleton />

  const lista = Array.isArray(categorias) ? categorias : []
  if (lista.length === 0) return null

  return (
    <Card className="mb-3">
      <CardBody>
        <h5 className="card-title mb-1">Categorias</h5>
        <p className="text-muted fs-13 mb-3">Cada categoria mostra as duas subcategorias que mais pesam.</p>
        {lista.map((item, idx) => (
          <CategoriaCard key={item.chave ?? item.categoria_id ?? idx} item={item} />
        ))}
      </CardBody>
    </Card>
  )
}

export default GastosPorCategoriaLista
