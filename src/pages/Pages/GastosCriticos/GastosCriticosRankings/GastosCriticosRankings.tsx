import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, Progress } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  formatVariacao,
  rankingItensDiagnostico,
  RANKING_DIMENSOES,
  subtituloRanking,
  tituloRanking,
} from 'helpers/gastos_criticos_helpers'
import { corCategoria, corSubcategoria } from 'helpers/cores_tema_helpers'
import {
  GastosCriticosDimensao,
  GastosCriticosRankingCriterio,
  GastosCriticosRankingItem,
  GastosCriticosView,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosRankingsProps {
  data?: GastosCriticosView
  criterio: GastosCriticosRankingCriterio
  dimensao: GastosCriticosDimensao
  onCriterioChange: (criterio: GastosCriticosRankingCriterio) => void
  onDimensaoChange: (dimensao: GastosCriticosDimensao) => void
}

const RankingLinha = ({
  item,
  criterio,
  dimensao,
  posicao,
}: {
  item: GastosCriticosRankingItem
  criterio: GastosCriticosRankingCriterio
  dimensao: GastosCriticosDimensao
  posicao: number
}) => {
  const navigate = useNavigate()
  const path = atalhoToPath(item.atalho)
  const titulo = tituloRanking(item)
  const percentual =
    criterio === 'gasto' ? Number(item.percentual_gasto ?? 0) : Number(item.percentual_compras ?? 0)
  const barra = Math.min(100, Math.max(0, percentual))
  const variacao = formatVariacao(item.variacao_valor_percentual)
  const isSubcategoria = dimensao === 'subcategorias' || item.tipo === 'subcategoria' || Boolean(item.subcategoria_nome)
  const isEstabelecimento = dimensao === 'estabelecimentos' || item.tipo === 'estabelecimento'
  const isCategoria = dimensao === 'categorias' || item.tipo === 'categoria'
  const subtitulo = isEstabelecimento
    ? (item.nome && item.nome !== titulo ? item.nome : null)
    : subtituloRanking(item)
  const cor = isSubcategoria
    ? corSubcategoria({ cor: item.cor, categoria_cor: item.categoria_cor })
    : isCategoria
      ? corCategoria({ cor: item.categoria_cor, categoria_id: item.categoria_id })
      : null

  return (
    <div
      className={`border rounded p-3 mb-2 ${path ? 'card-animate' : ''}`}
      role={path ? 'button' : undefined}
      tabIndex={path ? 0 : undefined}
      title={path ? 'Ver detalhes' : undefined}
      onClick={() => {
        if (!path) return
        navigate(path, { state: atalhoToPeriodoState(item.atalho) })
      }}
      onKeyDown={(e) => {
        if (path && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          navigate(path, { state: atalhoToPeriodoState(item.atalho) })
        }
      }}
      style={path ? { cursor: 'pointer' } : undefined}
    >
      <div className="d-flex gap-3">
        <div className="flex-shrink-0">
          <div className="avatar-sm">
            <span
              className={`avatar-title rounded-circle fs-16 fw-semibold ${
                posicao === 1 ? 'bg-primary text-white' : 'bg-primary-subtle text-primary'
              }`}
            >
              {posicao}º
            </span>
          </div>
        </div>

        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-1">
            <div style={{ minWidth: 0 }}>
              <h6 className="mb-0 text-truncate d-flex align-items-center gap-2">
                {cor ? (
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: cor,
                    }}
                  />
                ) : null}
                {titulo}
              </h6>
              {isSubcategoria && item.categoria_nome ? (
                <p className="text-muted mb-0 fs-13">({item.categoria_nome})</p>
              ) : subtitulo ? (
                <p className="text-muted mb-0 fs-13">{subtitulo}</p>
              ) : null}
            </div>
            {variacao.novo ? (
              <Badge color="info" pill>
                Novo
              </Badge>
            ) : (
              <Badge color={variacao.color} pill>
                {variacao.label}
              </Badge>
            )}
          </div>

          <Progress
            value={barra}
            className="mb-2"
            style={{ height: 6 }}
            color={cor ? undefined : 'primary'}
            barStyle={cor ? { backgroundColor: cor } : undefined}
          />

          <div className="d-flex flex-wrap gap-3 text-muted fs-13">
            <CurrencyValue value={item.valor_total} />
            <span>
              {item.compras ?? 0} {Number(item.compras) === 1 ? 'compra' : 'compras'}
            </span>
            {item.frequencia?.label ? <span>{item.frequencia.label}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const GastosCriticosRankings = ({
  data,
  criterio,
  dimensao,
  onCriterioChange,
  onDimensaoChange,
}: GastosCriticosRankingsProps) => {
  const rankings = criterio === 'gasto' ? data?.maiores_gastos : data?.mais_comprados
  const itens = rankingItensDiagnostico(rankings, dimensao)

  return (
    <Card className="mb-3">
      <CardBody>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h5 className="card-title mb-0">Rankings</h5>
          <div className="btn-group" role="group" aria-label="Critério do ranking">
            <button
              type="button"
              className={`btn btn-sm ${criterio === 'gasto' ? 'btn-danger' : 'btn-soft-danger'}`}
              onClick={() => onCriterioChange('gasto')}
            >
              Mais gasta
            </button>
            <button
              type="button"
              className={`btn btn-sm ${criterio === 'compras' ? 'btn-info' : 'btn-soft-info'}`}
              onClick={() => onCriterioChange('compras')}
            >
              Mais compra
            </button>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-1 mb-3" role="tablist" aria-label="Dimensão do ranking">
          {RANKING_DIMENSOES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`btn btn-sm ${dimensao === item.value ? 'btn-primary' : 'btn-soft-primary'}`}
              onClick={() => onDimensaoChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {itens.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">Nada neste recorte no período.</p>
          </div>
        ) : (
          itens.map((item, index) => (
            <RankingLinha
              key={item.chave || `${item.tipo}-${item.id}-${item.posicao}-${index}`}
              item={item}
              criterio={criterio}
              dimensao={dimensao}
              posicao={index + 1}
            />
          ))
        )}
      </CardBody>
    </Card>
  )
}

export default GastosCriticosRankings
