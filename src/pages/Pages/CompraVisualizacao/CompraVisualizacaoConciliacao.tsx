import React, { useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import {
  badgeConciliacaoColor,
  badgeConciliacaoStyle,
  identificadorDaCompra,
} from 'helpers/cadastro_manual_compra_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import { CandidatoConciliacao } from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

interface CompraVisualizacaoConciliacaoProps {
  compra: CompraVisualizacaoView
  onChanged: () => void | Promise<void>
}

const labelCandidato = (item: CandidatoConciliacao): string => {
  const nome = item.descricao_fatura || item.descricao || item.estabelecimento_nome || `Lançamento #${item.id}`
  const valor = item.valor != null ? formatCurrency(item.valor) : null
  const data = item.data ? formatDateBr(item.data) : null
  return [nome, valor, data].filter(Boolean).join(' · ')
}

const CompraVisualizacaoConciliacao = ({ compra, onChanged }: CompraVisualizacaoConciliacaoProps) => {
  const conciliacao = compra.conciliacao
  const status = String(conciliacao?.status || '').trim()
  const [modalOpen, setModalOpen] = useState(false)
  const [candidatos, setCandidatos] = useState<CandidatoConciliacao[]>([])
  const [loadingCandidatos, setLoadingCandidatos] = useState(false)
  const [saving, setSaving] = useState(false)
  const transacoesService = new TransacoesService()
  const compraId = identificadorDaCompra(compra)

  const lancamento = conciliacao?.lancamento
  const descricaoFatura = conciliacao?.descricao_fatura
    || compra.descricao_fatura
    || lancamento?.descricao_fatura
    || lancamento?.descricao
    || lancamento?.estabelecimento_nome
  const mostrarLancamento = Boolean(descricaoFatura) && status !== 'nao_conciliada' && status !== 'rejeitada'

  const podeConciliar = Boolean(compraId) && status !== 'conciliada'
  const podeDesvincular = Boolean(compraId) && (status === 'conciliada' || status === 'pendente')
  const podeRejeitar = Boolean(compraId) && status === 'pendente'

  const abrirCandidatos = async () => {
    if (!compraId) return
    setModalOpen(true)
    setLoadingCandidatos(true)
    try {
      const list = await transacoesService.listCandidatosConciliacao(compraId)
      setCandidatos(
        [...list].sort((a, b) => {
          if (Boolean(b.sugestao) !== Boolean(a.sugestao)) return a.sugestao ? -1 : 1
          return Number(b.score ?? 0) - Number(a.score ?? 0)
        })
      )
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar lançamentos da fatura')
      setCandidatos([])
    } finally {
      setLoadingCandidatos(false)
    }
  }

  const conciliar = async (lancamentoId: number) => {
    if (!compraId || saving) return
    setSaving(true)
    try {
      await transacoesService.conciliarTransacao({ compra_id: compraId, lancamento_id: lancamentoId })
      toast.success('Compra conciliada com o lançamento da fatura')
      setModalOpen(false)
      await onChanged()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao conciliar')
    } finally {
      setSaving(false)
    }
  }

  const desvincular = async () => {
    if (!compraId || saving) return
    setSaving(true)
    try {
      await transacoesService.desvincularConciliacao({ compra_id: compraId })
      toast.success('Lançamento desvinculado')
      await onChanged()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao desvincular')
    } finally {
      setSaving(false)
    }
  }

  const rejeitar = async () => {
    if (!compraId || saving) return
    setSaving(true)
    try {
      await transacoesService.rejeitarConciliacao({ compra_id: compraId })
      toast.success('Sugestão rejeitada')
      await onChanged()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao rejeitar sugestão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-3">
      <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h5 className="card-title mb-0">Conciliação</h5>
        {status ? (
          <Badge
            color={badgeConciliacaoColor(status)}
            pill
            style={badgeConciliacaoStyle(status)}
          >
            {conciliacao?.status_label || status}
          </Badge>
        ) : (
          <Badge color="warning" pill style={badgeConciliacaoStyle('nao_conciliada')}>
            Não conciliada
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {conciliacao?.mensagem ? (
          <p className="text-muted mb-3">{conciliacao.mensagem}</p>
        ) : (
          <p className="text-muted mb-3">
            O lançamento real desta compra ainda não foi localizado na fatura.
          </p>
        )}

        {mostrarLancamento ? (
          <div className="border rounded p-3 mb-3 bg-light">
            <div className="text-muted text-uppercase fs-11 fw-semibold mb-1">Lançamento da fatura</div>
            <div className="fw-semibold">
              {[
                descricaoFatura,
                lancamento?.valor != null ? formatCurrency(lancamento.valor) : null,
                lancamento?.data ? formatDateBr(lancamento.data) : null,
              ].filter(Boolean).join(' · ')}
            </div>
            <small className="text-muted">Não substitui a descrição amigável da compra.</small>
          </div>
        ) : null}

        <div className="d-flex flex-wrap gap-2">
          {podeConciliar ? (
            <Button color="primary" outline size="sm" onClick={abrirCandidatos} disabled={saving}>
              <i className="ri-link me-1"></i>
              Conciliar com lançamento
            </Button>
          ) : null}
          {podeRejeitar ? (
            <Button color="secondary" outline size="sm" onClick={rejeitar} disabled={saving}>
              Rejeitar sugestão
            </Button>
          ) : null}
          {podeDesvincular ? (
            <Button color="danger" outline size="sm" onClick={desvincular} disabled={saving}>
              Desvincular
            </Button>
          ) : null}
        </div>
      </CardBody>

      <Modal isOpen={modalOpen} toggle={() => !saving && setModalOpen(false)} centered size="lg">
        <ModalHeader toggle={() => !saving && setModalOpen(false)}>
          Conciliar com lançamento da fatura
        </ModalHeader>
        <ModalBody>
          {loadingCandidatos ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
            </div>
          ) : candidatos.length === 0 ? (
            <p className="text-muted mb-0">
              Nenhum lançamento candidato nesta fatura. Importe o PDF da fatura e tente de novo.
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {candidatos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`btn text-start border ${item.sugestao ? 'btn-soft-success border-success' : 'btn-light'}`}
                  disabled={saving}
                  onClick={() => conciliar(Number(item.lancamento_id ?? item.id))}
                >
                  <div className="d-flex justify-content-between gap-2">
                    <span>{labelCandidato(item)}</span>
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
          <Button color="light" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

export default CompraVisualizacaoConciliacao
