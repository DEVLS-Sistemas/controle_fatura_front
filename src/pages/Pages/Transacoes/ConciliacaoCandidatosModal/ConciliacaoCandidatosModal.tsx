import React, { useEffect, useRef, useState } from 'react'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import { labelCandidatoConciliacao } from 'helpers/cadastro_manual_compra_helpers'
import { CandidatoConciliacao } from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

interface ConciliacaoCandidatosModalProps {
  isOpen: boolean
  identificador: string | number | null
  title?: string
  saving?: boolean
  onClose: () => void
  onSelect: (item: CandidatoConciliacao) => void
}

const detalheCandidato = (item: CandidatoConciliacao): string => {
  const nome = labelCandidatoConciliacao(item)
  const valor = item.valor != null ? formatCurrency(item.valor) : null
  const data = item.data ? formatDateBr(item.data) : null
  return [nome, valor, data].filter(Boolean).join(' · ')
}

const ConciliacaoCandidatosModal = ({
  isOpen,
  identificador,
  title = 'Conciliar com lançamento da fatura',
  saving = false,
  onClose,
  onSelect,
}: ConciliacaoCandidatosModalProps) => {
  const [candidatos, setCandidatos] = useState<CandidatoConciliacao[]>([])
  const [loading, setLoading] = useState(false)
  const transacoesService = useRef(new TransacoesService()).current

  useEffect(() => {
    if (!isOpen || identificador == null) {
      setCandidatos([])
      return
    }
    let cancelled = false
    setLoading(true)
    transacoesService.listCandidatosConciliacao(identificador)
      .then((list) => {
        if (cancelled) return
        setCandidatos(
          [...list].sort((a, b) => {
            if (Boolean(b.sugestao) !== Boolean(a.sugestao)) return a.sugestao ? -1 : 1
            return Number(b.score ?? 0) - Number(a.score ?? 0)
          })
        )
      })
      .catch((error: any) => {
        if (cancelled) return
        toast.error(error?.message || 'Erro ao carregar candidatos de conciliação')
        setCandidatos([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, identificador])

  return (
    <Modal isOpen={isOpen} toggle={() => !saving && onClose()} centered size="lg">
      <ModalHeader toggle={() => !saving && onClose()}>{title}</ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="text-center py-4">
            <Spinner color="primary" />
          </div>
        ) : candidatos.length === 0 ? (
          <p className="text-muted mb-0">
            Nenhum candidato nesta fatura. Importe o PDF e tente de novo.
          </p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {candidatos.map((item) => (
              <button
                key={String(item.id)}
                type="button"
                className={`btn text-start border ${item.sugestao ? 'btn-soft-success border-success' : 'btn-light'}`}
                disabled={saving}
                onClick={() => onSelect(item)}
              >
                <div className="d-flex justify-content-between gap-2">
                  <span>{detalheCandidato(item)}</span>
                  {item.sugestao ? (
                    <Badge color="success" pill>Sugestão</Badge>
                  ) : item.score != null ? (
                    <span className="text-muted fs-12">score {item.score}</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ConciliacaoCandidatosModal
