import React from 'react'
import { DropdownItem, Spinner } from 'reactstrap'
import TableActionsDropdown from 'Components/Common/TableActionsDropdown'
import { AssinaturaAcao, AssinaturaItem } from 'interfaces/Assinaturas/AssinaturasInterface'

interface AssinaturasAcoesProps {
  item: AssinaturaItem
  acting?: boolean
  onAcao: (identificador: string, acao: AssinaturaAcao) => void
  onVerCobrancas?: (identificador: string) => void
}

const stop = (event: React.MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
}

const AssinaturasAcoes = ({ item, acting, onAcao, onVerCobrancas }: AssinaturasAcoesProps) => {
  const identificador = item.identificador
  const status = item.status

  const handleAcao = (event: React.MouseEvent, acao: AssinaturaAcao) => {
    stop(event)
    if (acting) return
    onAcao(identificador, acao)
  }

  const handleVer = (event: React.MouseEvent) => {
    stop(event)
    onVerCobrancas?.(identificador)
  }

  if (status === 'candidata') {
    return (
      <div className="d-flex flex-wrap gap-2" onClick={stop}>
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'confirmar')}
        >
          {acting ? <Spinner size="sm" className="me-1" /> : <i className="ri-check-line align-middle me-1"></i>}
          Confirmar
        </button>
        <button
          type="button"
          className="btn btn-sm btn-soft-secondary"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'ignorar')}
        >
          Ignorar
        </button>
        {onVerCobrancas ? (
          <button type="button" className="btn btn-sm btn-soft-primary" onClick={handleVer}>
            Ver cobranças
          </button>
        ) : null}
      </div>
    )
  }

  if (status === 'confirmada') {
    return (
      <div className="d-flex flex-wrap align-items-center gap-2" onClick={stop}>
        {onVerCobrancas ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={handleVer}>
            Ver cobranças
          </button>
        ) : null}
        <TableActionsDropdown toggleClassName="btn btn-sm btn-soft-secondary">
          <DropdownItem
            disabled={acting}
            onClick={(e) => handleAcao(e, 'desfazer_confirmacao')}
          >
            Desfazer confirmação
          </DropdownItem>
        </TableActionsDropdown>
      </div>
    )
  }

  if (status === 'ignorada') {
    return (
      <div className="d-flex flex-wrap gap-2" onClick={stop}>
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'restaurar')}
        >
          {acting ? <Spinner size="sm" className="me-1" /> : <i className="ri-arrow-go-back-line align-middle me-1"></i>}
          Restaurar
        </button>
      </div>
    )
  }

  return null
}

export default AssinaturasAcoes
