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
import {
    faturaAnexoDownloadMetaFrom,
    faturaStatusColor,
    formatDateBr,
    openFaturaAnexoInNewTab,
    rotulosFaturaAnexoNomes,
} from 'helpers/fatura_helpers'
import {
    faturaExistenteEmProcessamento,
    rotuloCartaoBandeira,
    rotuloCicloFatura,
    rotuloCompetenciaFatura,
    rotuloValorTransacoes,
    statusFaturaLabel,
} from 'helpers/fatura_anexo_duplicado_helpers'
import {
    COPY_AGUARDE_PROCESSANDO_SUBSTITUIR,
    COPY_CANCELAR_MANTEM_ANEXO,
    COPY_SUBSTITUIR_FATURA,
    LABEL_SUBSTITUIR_FATURA,
    TITULO_MODAL_FATURA_JA_ANEXADA,
    podeSubstituirFaturaExistente,
} from 'helpers/fatura_substituir_existente_helpers'
import { FaturaJaAnexadaError } from 'libs/api/exceptions/FaturaJaAnexadaError'

export type FaturaJaAnexadaModalProps = {
    isOpen: boolean
    error?: FaturaJaAnexadaError | null
    loading?: boolean
    onClose: () => void
    onSubstituir: () => void | Promise<void>
}

const FaturaJaAnexadaModal = ({
    isOpen,
    error = null,
    loading = false,
    onClose,
    onSubstituir,
}: FaturaJaAnexadaModalProps) => {
    const fatura = error?.fatura_existente
    const processando = faturaExistenteEmProcessamento(fatura)
    const podeSubstituir = podeSubstituirFaturaExistente(fatura)
    const cartaoBandeira = rotuloCartaoBandeira(fatura)
    const competencia = rotuloCompetenciaFatura(fatura)
    const ciclo = rotuloCicloFatura(fatura)
    const texto = error?.orientacao || error?.message
    const nomesAnexo = rotulosFaturaAnexoNomes(fatura)

    const handleVerAnexo = async () => {
        if (fatura?.id == null) return
        const tipo = fatura.tem_csv && !fatura.tem_pdf ? 'csv' : 'pdf'
        try {
            await openFaturaAnexoInNewTab(
                fatura.id,
                tipo,
                faturaAnexoDownloadMetaFrom(fatura, competencia),
            )
        } catch (err) {
            toast.error((err as Error)?.message || 'Anexo não disponível')
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={loading ? undefined : onClose} centered backdrop="static" size="lg">
            <ModalHeader toggle={loading ? undefined : onClose}>
                {TITULO_MODAL_FATURA_JA_ANEXADA}
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
                            {(fatura.tem_pdf || fatura.tem_csv || fatura.pdf_url || fatura.tem_anexo) && (
                                <Button
                                    color="link"
                                    className="p-0"
                                    type="button"
                                    onClick={() => { void handleVerAnexo() }}
                                >
                                    Ver anexo atual{nomesAnexo.length ? ` (${nomesAnexo.join(', ')})` : ''}
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
                        {COPY_AGUARDE_PROCESSANDO_SUBSTITUIR}
                    </Alert>
                )}

                <div className="small text-muted">
                    <div className="mb-1">{COPY_SUBSTITUIR_FATURA}</div>
                    <div>{COPY_CANCELAR_MANTEM_ANEXO}</div>
                </div>
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
                <Button color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    color="primary"
                    onClick={onSubstituir}
                    disabled={loading || !podeSubstituir}
                    title={!podeSubstituir ? COPY_AGUARDE_PROCESSANDO_SUBSTITUIR : undefined}
                >
                    {loading && <Spinner size="sm" className="me-1" />}
                    {LABEL_SUBSTITUIR_FATURA}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaJaAnexadaModal
