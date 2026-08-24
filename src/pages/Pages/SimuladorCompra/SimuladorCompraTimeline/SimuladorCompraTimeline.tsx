import React from 'react'
import { Badge } from 'reactstrap'
import { formatCurrency } from 'helpers/fatura_helpers'
import { SimuladorParcela } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

type Props = {
  parcelas: SimuladorParcela[]
  onSelect: (parcela: SimuladorParcela) => void
}

const SimuladorCompraTimeline = ({ parcelas, onSelect }: Props) => {
  if (!parcelas.length) return null

  return (
    <div className="mb-3">
      <h6 className="mb-2">Parcelas simuladas</h6>
      <div className="d-flex flex-wrap gap-2">
        {parcelas.map((p) => (
          <button
            key={`${p.parcela}-${p.chave}`}
            type="button"
            className={`btn btn-sm ${p.na_janela ? 'btn-soft-primary' : 'btn-soft-secondary'}`}
            disabled={!p.na_janela}
            title={p.na_janela ? `Ir para ${p.label}` : 'Fora da janela de 13 meses'}
            onClick={() => p.na_janela && onSelect(p)}
          >
            {p.parcela}/{parcelas.length} {p.label} · {formatCurrency(p.valor)}
            {!p.na_janela && (
              <Badge color="light" className="text-muted ms-1">
                fora da projeção
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SimuladorCompraTimeline
