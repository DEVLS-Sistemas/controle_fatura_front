import React from 'react'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { extrairSemCategoria } from 'helpers/gastos_criticos_helpers'
import { GastosCriticosView } from 'interfaces/GastosCriticos/GastosCriticosInterface'

interface GastosCriticosSemCategoriaProps {
  data?: GastosCriticosView
  aberto: boolean
  onToggle: () => void
}

const GastosCriticosSemCategoria = ({ data, aberto, onToggle }: GastosCriticosSemCategoriaProps) => {
  const item = extrairSemCategoria(data)
  const valor = Number(item?.valor_total ?? 0)
  const compras = Number(item?.compras ?? 0)
  if (!item || (valor <= 0 && compras <= 0)) return null

  return (
    <div className="mb-3">
      <button type="button" className="btn btn-link p-0" onClick={onToggle}>
        {aberto ? 'Ocultar sem categoria' : 'Exibir sem categoria'}
      </button>
      {aberto ? (
        <div className="d-flex flex-wrap gap-3 text-muted fs-13 mt-1">
          {item.valor_total != null ? <CurrencyValue value={item.valor_total} /> : null}
          <span>
            {compras} {compras === 1 ? 'compra' : 'compras'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default GastosCriticosSemCategoria
