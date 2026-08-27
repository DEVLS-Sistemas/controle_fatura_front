import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Badge,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
    Table,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import { pathVisualizacaoCompra } from 'helpers/cadastro_manual_compra_helpers'
import {
    apoioMotivoRemoverAnexo,
    avisosImpactoRemoverAnexo,
    hintContinuarRemoverAnexo,
    labelStatusConciliacaoImpacto,
    motivosRemoverAnexo,
    podeContinuarRemoverAnexo,
    subtituloModalRemoverAnexo,
    tituloModalRemoverAnexo,
} from 'helpers/fatura_anexo_remover_helpers'
import {
    ImpactoRemoverAnexo,
    ImpactoRemoverAnexoCompra,
    MotivoRemoverAnexo,
    TipoRemoverAnexo,
} from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'

export type FaturaRemoverAnexoModalProps = {
    isOpen: boolean
    faturaId: number | string | null
    tipo?: TipoRemoverAnexo | null
    onClose: () => void
}

const badgeStatusColor = (status?: string | null): string => {
    switch (String(status ?? '').trim()) {
        case 'conciliada':
            return 'success'
        case 'nao_conciliada':
            return 'warning'
        case 'pendente':
            return 'info'
        default:
            return 'secondary'
    }
}

const CompraImpactoCard = ({ compra }: { compra: ImpactoRemoverAnexoCompra }) => {
    const parcelas = Number(compra.parcelas_total ?? 0) > 1
        ? `${compra.parcela_atual ?? 1}/${compra.parcelas_total}`
        : null
    const detalhe = [
        formatCurrency(compra.valor),
        formatDateBr(compra.data),
        parcelas,
    ].filter(Boolean).join(' · ')
    const path = compra.id != null ? pathVisualizacaoCompra(String(compra.id)) : null

    return (
        <div className="border rounded p-3">
            <div className="fw-semibold">
                {path ? (
                    <Link to={path} className="text-reset">
                        {compra.texto_compra}
                    </Link>
                ) : (
                    compra.texto_compra
                )}
            </div>
            <div className="small text-muted">{detalhe}</div>
            <div className="d-flex flex-wrap align-items-center gap-1 mt-2">
                <Badge color={badgeStatusColor(compra.status_conciliacao_atual)}>
                    {labelStatusConciliacaoImpacto(compra.status_conciliacao_atual)}
                </Badge>
                <span className="text-muted small">→</span>
                <Badge color={badgeStatusColor(compra.status_conciliacao_depois)}>
                    {labelStatusConciliacaoImpacto(compra.status_conciliacao_depois)}
                </Badge>
                <span className="small text-muted ms-1">volta a precisar de conciliação</span>
            </div>
        </div>
    )
}

const FaturaRemoverAnexoModal = ({
    isOpen,
    faturaId,
    tipo = null,
    onClose,
}: FaturaRemoverAnexoModalProps) => {
    const faturasService = useRef(new FaturasService()).current
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    const [loading, setLoading] = useState(false)
    const [impacto, setImpacto] = useState<ImpactoRemoverAnexo | null>(null)
    const [motivo, setMotivo] = useState<MotivoRemoverAnexo | string | null>(null)

    useEffect(() => {
        if (!isOpen || faturaId == null) {
            setImpacto(null)
            setMotivo(null)
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setMotivo(null)
        setImpacto(null)

        faturasService.getImpactoRemoverAnexo(faturaId)
            .then((data) => {
                if (cancelled) return
                setImpacto(data)
            })
            .catch((error: unknown) => {
                if (cancelled) return
                const message = error instanceof Error
                    ? error.message
                    : 'Não foi possível carregar o impacto da remoção'
                toast.error(message)
                onCloseRef.current()
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isOpen, faturaId, faturasService])

    const avisos = avisosImpactoRemoverAnexo(impacto)
    const motivos = motivosRemoverAnexo(impacto)
    const faturasAfetadas = impacto?.parcelas_geradas_outras_faturas?.faturas_afetadas ?? []
    const compras = impacto?.compras_que_voltam_a_conciliar ?? []
    const podeContinuar = podeContinuarRemoverAnexo(motivo)
    const continuarHint = hintContinuarRemoverAnexo(motivo)
    const subtitulo = subtituloModalRemoverAnexo(impacto)

    return (
        <Modal
            isOpen={isOpen}
            toggle={onClose}
            centered
            size="lg"
            scrollable
            fullscreen="sm"
        >
            <ModalHeader toggle={onClose}>
                {tituloModalRemoverAnexo(tipo, impacto)}
            </ModalHeader>
            <ModalBody>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                        <div className="text-muted mt-2">Calculando o impacto da remoção…</div>
                    </div>
                ) : impacto ? (
                    <>
                        {subtitulo && (
                            <p className="text-muted mb-3">{subtitulo}</p>
                        )}

                        <div className="d-flex flex-column gap-2 mb-4" role="radiogroup" aria-label="Motivo da remoção">
                            {motivos.map((item) => {
                                const selected = motivo === item.value
                                const apoio = apoioMotivoRemoverAnexo(item.value)
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-pressed={selected}
                                        className={`w-100 text-start border rounded p-3 ${
                                            selected ? 'border-primary bg-primary-subtle' : 'bg-transparent'
                                        }`}
                                        onClick={() => setMotivo(item.value)}
                                    >
                                        <span className="d-flex align-items-start gap-2">
                                            <span
                                                className={`d-inline-flex align-items-center justify-content-center rounded-circle border flex-shrink-0 mt-1 ${
                                                    selected ? 'border-primary' : 'border-secondary'
                                                }`}
                                                style={{ width: 16, height: 16 }}
                                                aria-hidden
                                            >
                                                {selected ? (
                                                    <span
                                                        className="rounded-circle bg-primary"
                                                        style={{ width: 8, height: 8 }}
                                                    />
                                                ) : null}
                                            </span>
                                            <span>
                                                <span className="fw-semibold d-block">{item.label}</span>
                                                {apoio && (
                                                    <span className="small text-muted d-block mt-1">{apoio}</span>
                                                )}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {avisos.length > 0 && (
                            <div className="alert alert-warning" role="alert">
                                <ul className="mb-0 ps-3">
                                    {avisos.map((aviso) => (
                                        <li key={aviso}>{aviso}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {faturasAfetadas.length > 0 && (
                            <div className="mb-4">
                                <h6 className="mb-2">Faturas vizinhas afetadas</h6>
                                <div className="table-responsive">
                                    <Table size="sm" bordered className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Competência</th>
                                                <th>Parcelas</th>
                                                <th>Valor</th>
                                                <th>Depois</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {faturasAfetadas.map((fatura) => (
                                                <tr key={fatura.id}>
                                                    <td>
                                                        <Link
                                                            to={`/faturas/view/${fatura.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {fatura.competencia}
                                                        </Link>
                                                    </td>
                                                    <td>{fatura.quantidade}</td>
                                                    <td>{formatCurrency(fatura.valor_total)}</td>
                                                    <td>
                                                        {fatura.ficara_vazia ? (
                                                            <Badge color="danger">Será removida</Badge>
                                                        ) : (
                                                            <span className="text-muted">Permanece</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <div>
                            <h6 className="mb-2">Estas compras voltam ao que eram</h6>
                            {compras.length === 0 ? (
                                <p className="text-muted mb-0">
                                    Nenhuma compra manual estava conciliada com este PDF.
                                </p>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {compras.map((compra) => (
                                        <CompraImpactoCard key={compra.id} compra={compra} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
                <Button type="button" color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <div className="d-flex flex-column align-items-end">
                    <Button
                        type="button"
                        color="primary"
                        disabled={!podeContinuar || loading}
                        title={continuarHint || undefined}
                    >
                        Continuar
                    </Button>
                    {continuarHint && (
                        <small className="text-muted mt-1">{continuarHint}</small>
                    )}
                </div>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaRemoverAnexoModal
