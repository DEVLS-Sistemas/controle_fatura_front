import React from 'react'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { TotaisConciliacaoFatura } from 'helpers/cadastro_manual_compra_helpers'

interface FaturaTotalizadorPendenciasProps {
  totais: TotaisConciliacaoFatura
}

const FaturaTotalizadorPendencias = ({ totais }: FaturaTotalizadorPendenciasProps) => {
  if (!totais.temComprasNaoConciliadas) return null

  return (
    <div
      className="mt-3 p-3 rounded text-start"
      style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #f59e0b',
      }}
    >
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <div className="d-flex align-items-start gap-2" style={{ minWidth: 0 }}>
          <i className="ri-alert-line fs-18 mt-1" style={{ color: '#d97706' }}></i>
          <div>
            <div className="fw-semibold">{totais.labelNaoConciliadas}</div>
            <div className="small mb-0">
              Extrato da fatura: {formatCurrency(totais.valorExtrato)}
            </div>
            <div className="small text-muted mb-0">
              O total da tela está acima do PDF enquanto houver compra lançada à mão.
              Esse extra some ao conciliar com o lançamento da fatura.
            </div>
          </div>
        </div>
        <span
          className={`fw-semibold ${VALOR_TEXT_CLASS}`}
          style={{ color: '#d97706', fontSize: '1.25rem', lineHeight: 1.2 }}
        >
          {formatCurrency(totais.valorNaoConciliado)}
        </span>
      </div>
    </div>
  )
}

export default FaturaTotalizadorPendencias
