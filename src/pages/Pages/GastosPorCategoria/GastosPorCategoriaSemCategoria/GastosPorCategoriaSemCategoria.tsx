import React from 'react'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { temGastoSemCategoria } from 'helpers/gastos_por_categoria_helpers'
import { GastosPorCategoriaView } from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'

interface GastosPorCategoriaSemCategoriaProps {
  data?: GastosPorCategoriaView
  aberto: boolean
  onToggle: () => void
}

const GastosPorCategoriaSemCategoria = ({
  data,
  aberto,
  onToggle,
}: GastosPorCategoriaSemCategoriaProps) => {
  const sem = data?.totais?.sem_categoria
  if (!temGastoSemCategoria(sem)) return null

  const compras = Number(sem?.compras ?? 0)

  return (
    <div className="mb-3">
      <button type="button" className="btn btn-link p-0" onClick={onToggle}>
        {aberto ? 'Ocultar sem categoria' : 'Exibir sem categoria'}
      </button>
      {aberto ? (
        <div className="d-flex flex-wrap gap-3 text-muted fs-13 mt-1">
          {sem?.valor_total != null ? <CurrencyValue value={sem.valor_total} /> : null}
          <span>
            {compras} {compras === 1 ? 'compra' : 'compras'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default GastosPorCategoriaSemCategoria
