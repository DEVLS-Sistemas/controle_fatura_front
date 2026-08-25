import React from 'react'
import { DropdownItem, Spinner } from 'reactstrap'
import TableActionsDropdown from 'Components/Common/TableActionsDropdown'
import { AssinaturaAcao, AssinaturaItem } from 'interfaces/Assinaturas/AssinaturasInterface'
import { acoesAssinatura, podeConfirmarAssinatura } from 'helpers/assinaturas_helpers'

interface AssinaturasAcoesProps {
  item: AssinaturaItem
  acting?: boolean
  onAcao: (identificador: string, acao: AssinaturaAcao) => void
}

const stop = (event: React.MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
}

const AssinaturasAcoes = ({ item, acting, onAcao }: AssinaturasAcoesProps) => {
  const identificador = item.identificador
  const acoes = acoesAssinatura(item)
  const confirmar = podeConfirmarAssinatura(item) && acoes.includes('confirmar')
  const ignorar = acoes.includes('ignorar')
  const restaurar = acoes.includes('restaurar')
  const desfazer = acoes.includes('desfazer_confirmacao')

  const handleAcao = (event: React.MouseEvent, acao: AssinaturaAcao) => {
    stop(event)
    if (acting) return
    onAcao(identificador, acao)
  }

  if (!confirmar && !ignorar && !restaurar && !desfazer) return null

  return (
    <div className="d-flex flex-wrap align-items-center gap-2" onClick={stop}>
      {confirmar ? (
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'confirmar')}
        >
          {acting ? <Spinner size="sm" className="me-1" /> : <i className="ri-check-line align-middle me-1"></i>}
          Confirmar
        </button>
      ) : null}
      {ignorar ? (
        <button
          type="button"
          className="btn btn-sm btn-soft-secondary"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'ignorar')}
        >
          Não é assinatura
        </button>
      ) : null}
      {restaurar ? (
        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={acting}
          onClick={(e) => handleAcao(e, 'restaurar')}
        >
          {acting ? <Spinner size="sm" className="me-1" /> : <i className="ri-arrow-go-back-line align-middle me-1"></i>}
          Restaurar
        </button>
      ) : null}
      {desfazer ? (
        <TableActionsDropdown toggleClassName="btn btn-sm btn-soft-secondary">
          <DropdownItem
            disabled={acting}
            onClick={(e) => handleAcao(e, 'desfazer_confirmacao')}
          >
            Desfazer confirmação
          </DropdownItem>
        </TableActionsDropdown>
      ) : null}
    </div>
  )
}

export default AssinaturasAcoes
