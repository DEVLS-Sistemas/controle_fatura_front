import React from 'react'
import { Link } from 'react-router-dom'
import {
    Alert,
    Badge,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { faturaStatusColor, formatDateBr, openFaturaAnexoInNewTab } from 'helpers/fatura_helpers'
import {
    COPY_AGUARDE_PROCESSANDO,
    COPY_MANTER_ANEXO,
    TITULO_MODAL_ANEXO_DUPLICADO,
    copySubstituirAnexo,
    faturaExistenteEmProcessamento,
    podeSubstituirAnexoDuplicado,
    rotuloCartaoBandeira,
    rotuloCicloFatura,
    rotuloCompetenciaFatura,
    rotuloValorTransacoes,
    statusFaturaLabel,
} from 'helpers/fatura_anexo_duplicado_helpers'
import { FaturaAnexoDuplicadoError } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'

export type FaturaAnexoDuplicadoModalProps = {
    isOpen: boolean
    error?: FaturaAnexoDuplicadoError | null
    loading?: boolean
    onClose: () => void
    onSubstituir: () => void | Promise<void>
    onManter: () => void | Promise<void>
}

const FaturaAnexoDuplicadoModal = ({
    isOpen,
    error = null,
    loading = false,
    onClose,
    onSubstituir,
    onManter,
}: FaturaAnexoDuplicadoModalProps) => {
    const fatura = error?.fatura_existente
    const processando = faturaExistenteEmProcessamento(fatura)
    const podeSubstituir = podeSubstituirAnexoDuplicado(fatura)
    const cartaoBandeira = rotuloCartaoBandeira(fatura)
    const competencia = rotuloCompetenciaFatura(fatura)
    const ciclo = rotuloCicloFatura(fatura)
    const texto = error?.orientacao || error?.message

    const handleVerAnexo = async () => {
        if (fatura?.id == null) return
        const tipo = fatura.tem_csv && !fatura.tem_pdf ? 'csv' : 'pdf'
        try {
            await openFaturaAnexoInNewTab(fatura.id, tipo, {
                cartaoNome: fatura.cartao_nome,
                competencia: competencia ?? undefined,
                mes: fatura.mes,
                ano: fatura.ano,
            })
        } catch (err) {
            toast.error((err as Error)?.message || 'Anexo não disponível')
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={loading ? undefined : onClose} centered backdrop="static" size="lg">
            <ModalHeader toggle={loading ? undefined : onClose}>
                {TITULO_MODAL_ANEXO_DUPLICADO}
            </ModalHeader>
            <ModalBody>
                {texto && (
                    <Alert color="warning" className="mb-3">
                        {texto}
                    </Alert>
                )}

                {fatura && (
                    <div className="border rounded p-3 mb-3">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                            <div className="fw-semibold">
                                {cartaoBandeira || 'Fatura existente'}
                            </div>
                            {fatura.status && (
                                <Badge color={faturaStatusColor[fatura.status] ?? 'secondary'}>
                                    {statusFaturaLabel(fatura.status)}
                                </Badge>
                            )}
                        </div>
                        {fatura.pessoa_nome && (
                            <div className="small mb-1">
                                Titular: <strong>{fatura.pessoa_nome}</strong>
                            </div>
                        )}
                        <div className="small text-muted mb-1">
                            {[
                                competencia && `Competência ${competencia}`,
                                ciclo,
                                fatura.data_vencimento && `Venc. ${formatDateBr(fatura.data_vencimento)}`,
                            ].filter(Boolean).join(' · ')}
                        </div>
                        <div className="small mb-3">{rotuloValorTransacoes(fatura)}</div>
                        <div className="d-flex flex-wrap gap-3">
                            {(fatura.tem_pdf || fatura.tem_csv || fatura.pdf_url) && (
                                <Button
                                    color="link"
                                    className="p-0"
                                    type="button"
                                    onClick={() => { void handleVerAnexo() }}
                                >
                                    Ver anexo atual
                                </Button>
                            )}
                            <Link
                                to={`/faturas/view/${fatura.id}`}
                                className="btn btn-link p-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Abrir fatura
                            </Link>
                        </div>
                    </div>
                )}

                {processando && (
                    <Alert color="info" className="mb-3">
                        {COPY_AGUARDE_PROCESSANDO}
                    </Alert>
                )}

                <div className="small text-muted">
                    <div className="mb-1">{copySubstituirAnexo(fatura)}</div>
                    <div>{COPY_MANTER_ANEXO}</div>
                </div>
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
                <Button color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button color="secondary" outline onClick={onManter} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-1" />}
                    Salvar sem substituir
                </Button>
                <Button
                    color="primary"
                    onClick={onSubstituir}
                    disabled={loading || !podeSubstituir}
                    title={!podeSubstituir ? COPY_AGUARDE_PROCESSANDO : undefined}
                >
                    {loading && <Spinner size="sm" className="me-1" />}
                    Substituir anexo
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaAnexoDuplicadoModal
