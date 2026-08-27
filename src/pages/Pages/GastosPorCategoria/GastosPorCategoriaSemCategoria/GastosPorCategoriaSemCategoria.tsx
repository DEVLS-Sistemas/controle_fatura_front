import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardBody } from 'reactstrap'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { formatPercentualApi } from 'helpers/gastos_criticos_helpers'
import {
  atalhoSemCategoria,
  atalhoToPath,
  atalhoToPeriodoState,
  deveAvisarSemCategoria,
} from 'helpers/gastos_por_categoria_helpers'
import { GastosPorCategoriaView } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaSemCategoriaProps {
  data?: GastosPorCategoriaView
}

const GastosPorCategoriaSemCategoria = ({ data }: GastosPorCategoriaSemCategoriaProps) => {
  const navigate = useNavigate()
  const sem = data?.totais?.sem_categoria
  if (!deveAvisarSemCategoria(sem?.percentual_gasto)) return null

  const atalho = atalhoSemCategoria(data)
  const path = atalhoToPath(atalho)
  const percentual = formatPercentualApi(sem?.percentual_gasto)

  return (
    <Card className="mb-3 border-secondary border-opacity-25">
      <CardBody>
        <p className="text-uppercase fw-medium text-muted mb-1 fs-12">Classificação</p>
        <h5 className="card-title mb-2">Há compras sem categoria — classifique na listagem</h5>
        <div className="d-flex flex-wrap gap-3 text-muted fs-13 mb-3">
          {sem?.compras != null ? (
            <span>
              {sem.compras} {Number(sem.compras) === 1 ? 'compra' : 'compras'}
            </span>
          ) : null}
          {sem?.valor_total != null ? <CurrencyValue value={sem.valor_total} /> : null}
          {percentual ? <span>{percentual} do total</span> : null}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {path ? (
            <button
              type="button"
              className="btn btn-soft-primary btn-sm"
              onClick={() => navigate(path, { state: atalhoToPeriodoState(atalho) })}
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

export default GastosPorCategoriaSemCategoria
