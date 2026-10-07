import React from 'react'
import { Button } from 'reactstrap'
import { formatCurrency, toCentavos } from 'helpers/fatura_helpers'
import { textoTotalLista } from 'helpers/simulador_lote_helpers'
import { SimulacaoLoteItem } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'

type Props = {
  itens: SimulacaoLoteItem[]
  indiceInvalido: number | null
  mensagemInvalida?: string | null
  onEditar: (indice: number) => void
  onRemover: (indice: number) => void
}

const rotuloCartao = (item: SimulacaoLoteItem): string => {
  const cartao = item.cartao_nome || `Cartão ${item.cartao_id}`
  const bandeira = String(item.bandeira_nome || '').trim()
  return bandeira ? `${cartao} · ${bandeira}` : cartao
}

const SimuladorListaSomadas = ({
  itens,
  indiceInvalido,
  mensagemInvalida,
  onEditar,
  onRemover,
}: Props) => {
  if (!itens.length) return null

  return (
    <div className="mt-2 mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
        <h5 className="mb-0">Simulações</h5>
        <span className="text-muted fs-13">{textoTotalLista(itens)}</span>
      </div>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Parcelas</th>
              <th>Cartão</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {itens.map((item, indice) => {
              const invalido = indiceInvalido === indice
              const parcelas = item.parcelas_total > 1 ? `${item.parcelas_total}x` : 'à vista'
              return (
                <tr key={`${item.observacoes}-${indice}`} className={invalido ? 'table-danger' : undefined}>
                  <td>{item.observacoes || '—'}</td>
                  <td>{formatCurrency(toCentavos(item.valor_compra) / 100)}</td>
                  <td>{parcelas}</td>
                  <td>
                    {rotuloCartao(item)}
                    {invalido && mensagemInvalida ? (
                      <div className="text-danger fs-13">{mensagemInvalida}</div>
                    ) : null}
                  </td>
                  <td className="text-end text-nowrap">
                    <Button type="button" color="light" size="sm" className="border me-1" onClick={() => onEditar(indice)}>
                      Editar
                    </Button>
                    <Button type="button" color="link" size="sm" className="text-muted px-2" onClick={() => onRemover(indice)}>
                      Remover
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SimuladorListaSomadas
