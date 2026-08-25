import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardBody } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import {
  atalhoToPath,
  atalhoToPeriodoState,
  extrairSemCategoria,
  formatPercentualApi,
} from 'helpers/gastos_criticos_helpers'
import { GastosCriticosView } from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosSemCategoriaProps {
  data?: GastosCriticosView
}

const GastosCriticosSemCategoria = ({ data }: GastosCriticosSemCategoriaProps) => {
  const navigate = useNavigate()
  const item = extrairSemCategoria(data)
  if (!item) return null

  const path = atalhoToPath(item.atalho)
  const compras = item.compras
  const percentual = formatPercentualApi(item.percentual_gasto)
  const frequencia = item.frequencia?.label

  return (
    <Card className="mb-3 border-secondary border-opacity-25">
      <CardBody>
        <p className="text-uppercase fw-medium text-muted mb-1 fs-12">Não é ponto crítico</p>
        <h5 className="card-title mb-2">Compras sem categoria</h5>
        <p className="mb-3">
          A maioria das compras ainda não tem categoria. Isso não significa que você está
          gastando demais em um lugar — só que o recorte por categoria fica incompleto até
          classificar.
        </p>

        <div className="d-flex flex-wrap gap-3 text-muted fs-13 mb-3">
          {compras != null ? (
            <span>
              {compras} {Number(compras) === 1 ? 'compra' : 'compras'}
            </span>
          ) : null}
          {item.valor_total != null ? <CurrencyValue value={item.valor_total} /> : null}
          {percentual ? <span>{percentual} do total</span> : null}
          {frequencia ? <span>{frequencia}</span> : null}
        </div>

        <div className="d-flex flex-wrap gap-2">
          {path ? (
            <button
              type="button"
              className="btn btn-soft-primary btn-sm"
              onClick={() => navigate(path, { state: atalhoToPeriodoState(item.atalho) })}
            >
              Ver compras do período
            </button>
          ) : (
            <Link to="/transacoes" className="btn btn-soft-primary btn-sm">
              Ver compras
            </Link>
          )}
          <Link to="/categorias" className="btn btn-soft-secondary btn-sm">
            Ver categorias
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}

export default GastosCriticosSemCategoria
