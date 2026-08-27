import React, { useEffect, useRef, useState } from 'react'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import {
    idLancamentoCandidato,
    labelCandidatoConciliacao,
} from 'helpers/cadastro_manual_compra_helpers'
import { candidatoSugeridoReconcilia } from 'helpers/fatura_anexo_remover_helpers'
import { CompraParaReconcilia } from 'interfaces/Faturas/FaturasInterface'
import { CandidatoConciliacao } from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import ConciliacaoCandidatosModal from 'pages/Pages/Transacoes/ConciliacaoCandidatosModal/ConciliacaoCandidatosModal'

export type FaturaReconciliaComprasModalProps = {
    isOpen: boolean
    compras: CompraParaReconcilia[]
    onClose: () => void
}

type RowStatus = 'pending' | 'done' | 'skipped'

const detalheLinha = (valor?: number | string | null, data?: string | null): string =>
    [valor != null ? formatCurrency(valor) : null, data ? formatDateBr(data) : null]
        .filter(Boolean)
        .join(' · ')

const FaturaReconciliaComprasModal = ({
    isOpen,
    compras,
    onClose,
}: FaturaReconciliaComprasModalProps) => {
    const transacoesService = useRef(new TransacoesService()).current
    const [statusById, setStatusById] = useState<Record<number, RowStatus>>({})
    const [savingId, setSavingId] = useState<number | null>(null)
    const [escolherId, setEscolherId] = useState<number | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setStatusById({})
            setSavingId(null)
            setEscolherId(null)
        }
    }, [isOpen])

    const conciliar = async (compraId: number, candidato: CandidatoConciliacao) => {
        const lancamentoId = idLancamentoCandidato(candidato)
        if (!lancamentoId) {
            toast.error('Não foi possível identificar o lançamento da fatura')
            return
        }
        setSavingId(compraId)
        try {
            await transacoesService.conciliarTransacao({
                compra_id: compraId,
                lancamento_id: lancamentoId,
            })
            setStatusById((prev) => ({ ...prev, [compraId]: 'done' }))
            setEscolherId(null)
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao conciliar')
        } finally {
            setSavingId(null)
        }
    }

    return (
        <>
            <Modal
                isOpen={isOpen}
                toggle={() => savingId == null && onClose()}
                centered
                size="lg"
                scrollable
                fullscreen="sm"
            >
                <ModalHeader toggle={() => savingId == null && onClose()}>
                    Conciliar compras no PDF correto
                </ModalHeader>
                <ModalBody>
                    <p className="mb-3">
                        Estas compras estavam no PDF anterior. Confira se o lançamento do arquivo
                        novo é o mesmo e confirme.
                    </p>
                    <div className="d-flex flex-column gap-2">
                        {compras.map((compra) => {
                            const status = statusById[compra.id] ?? 'pending'
                            const sugerido = candidatoSugeridoReconcilia(compra.candidatos)
                            const saving = savingId === compra.id
                            const detalheCompra = detalheLinha(compra.valor, compra.data)
                            return (
                                <div key={compra.id} className="border rounded p-3">
                                    <div className="fw-semibold">
                                        {compra.texto_compra || `Compra #${compra.id}`}
                                        {detalheCompra ? ` · ${detalheCompra}` : ''}
                                    </div>
                                    {status === 'done' ? (
                                        <div className="mt-2">
                                            <Badge color="success" className="fw-normal">
                                                <i className="ri-check-line me-1"></i>
                                                Conciliada
                                            </Badge>
                                        </div>
                                    ) : status === 'skipped' ? (
                                        <div className="mt-2">
                                            <Badge
                                                color="warning"
                                                className="fw-normal"
                                                style={{
                                                    backgroundColor: '#f59e0b',
                                                    borderColor: '#f59e0b',
                                                    color: '#fff',
                                                }}
                                            >
                                                Deixada para depois
                                            </Badge>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="small text-muted mt-2">
                                                Candidato sugerido:
                                            </div>
                                            {sugerido ? (
                                                <div className="fw-medium">
                                                    {labelCandidatoConciliacao(sugerido)}
                                                    {detalheLinha(sugerido.valor, sugerido.data)
                                                        ? ` · ${detalheLinha(sugerido.valor, sugerido.data)}`
                                                        : ''}
                                                </div>
                                            ) : (
                                                <div className="text-muted">
                                                    Nenhum candidato sugerido neste extrato.
                                                </div>
                                            )}
                                            <div className="d-flex flex-wrap gap-2 mt-3">
                                                <Button
                                                    type="button"
                                                    color="success"
                                                    size="sm"
                                                    disabled={!sugerido || saving}
                                                    onClick={() => sugerido && conciliar(compra.id, sugerido)}
                                                >
                                                    {saving ? <Spinner size="sm" /> : 'Confirmar'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    color="light"
                                                    size="sm"
                                                    disabled={saving}
                                                    onClick={() => setEscolherId(compra.id)}
                                                >
                                                    Escolher outro
                                                </Button>
                                                <Button
                                                    type="button"
                                                    color="link"
                                                    size="sm"
                                                    className="text-muted"
                                                    disabled={saving}
                                                    onClick={() => setStatusById((prev) => ({
                                                        ...prev,
                                                        [compra.id]: 'skipped',
                                                    }))}
                                                >
                                                    Deixar para depois
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        type="button"
                        color="primary"
                        onClick={onClose}
                        disabled={savingId != null}
                    >
                        Concluir
                    </Button>
                </ModalFooter>
            </Modal>
            <ConciliacaoCandidatosModal
                isOpen={escolherId != null}
                identificador={escolherId}
                title="Qual lançamento da fatura é esta compra?"
                saving={escolherId != null && savingId === escolherId}
                onClose={() => savingId == null && setEscolherId(null)}
                onSelect={(item) => {
                    if (escolherId == null) return
                    void conciliar(escolherId, item)
                }}
            />
        </>
    )
}

export default FaturaReconciliaComprasModal
