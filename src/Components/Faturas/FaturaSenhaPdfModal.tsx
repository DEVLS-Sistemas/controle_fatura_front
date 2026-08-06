import React, { useEffect, useState } from 'react'
import {
    Alert,
    Button,
    FormFeedback,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap'
import { toast } from 'react-toastify'
import PasswordRevealInput from 'Components/Common/PasswordRevealInput'
import { SenhaPdfMeta } from 'interfaces/Faturas/FaturasInterface'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'
import { FaturasService } from 'services/Faturas/FaturasService'

export type FaturaSenhaPdfModalProps = {
    isOpen: boolean
    faturaId: number | string | null
    senhaMeta?: SenhaPdfMeta | null
    onClose: () => void
    /** Chamado após desbloqueio/processamento com sucesso */
    onSuccess?: () => void | Promise<void>
}

const textoExplicativo = (meta?: SenhaPdfMeta | null): string => {
    if (meta?.motivo === 'incorreta') {
        let text = 'A senha usada não desbloqueou o PDF. Verifique e tente novamente.'
        if (meta.tem_senha_cadastrada) {
            text += ' A senha salva neste cartão pode estar desatualizada.'
        }
        return text
    }
    return 'Esta fatura está em um PDF com senha. Informe a senha para importar os lançamentos.'
}

const FaturaSenhaPdfModal = ({
    isOpen,
    faturaId,
    senhaMeta,
    onClose,
    onSuccess,
}: FaturaSenhaPdfModalProps) => {
    const [senha, setSenha] = useState('')
    const [salvarSenha, setSalvarSenha] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [meta, setMeta] = useState<SenhaPdfMeta | null | undefined>(senhaMeta)
    const faturasService = React.useMemo(() => new FaturasService(), [])

    useEffect(() => {
        if (!isOpen) return
        setSenha('')
        setError(null)
        setMeta(senhaMeta)
        setSalvarSenha(!(senhaMeta?.tem_senha_cadastrada === true && senhaMeta?.motivo === 'incorreta'))
    }, [isOpen, senhaMeta])

    const handleSubmit = async () => {
        if (!faturaId) return
        if (!senha.trim()) {
            setError('Informe a senha do PDF')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await faturasService.processarPdf(Number(faturaId), {
                senha_pdf: senha.trim(),
                salvar_senha_pdf: salvarSenha,
            })
            toast.success('PDF desbloqueado e fatura processada')
            onClose()
            await onSuccess?.()
        } catch (err) {
            if (err instanceof PdfSenhaError) {
                setError(err.message)
                if (err.senha_pdf) setMeta(err.senha_pdf)
                setSenha('')
            } else {
                const message = (err as Error)?.message || 'Erro ao desbloquear o PDF'
                setError(message)
                toast.error(message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered>
            <ModalHeader toggle={onClose}>PDF protegido por senha</ModalHeader>
            <ModalBody>
                <p className="mb-3">{textoExplicativo(meta)}</p>

                {(meta?.orientacao || meta?.label_regra) && (
                    <Alert color="info" className="mb-3">
                        <i className="ri-information-line me-1 align-middle"></i>
                        {meta.orientacao || meta.label_regra}
                    </Alert>
                )}

                <div className="mb-3">
                    <Label htmlFor="senha_pdf_modal" className="form-label">
                        Senha do PDF
                    </Label>
                    <PasswordRevealInput
                        id="senha_pdf_modal"
                        value={senha}
                        invalid={Boolean(error)}
                        placeholder="Digite a senha"
                        onChange={(e) => {
                            setSenha(e.target.value)
                            if (error) setError(null)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                void handleSubmit()
                            }
                        }}
                    />
                    {error && <FormFeedback className="d-block">{error}</FormFeedback>}
                </div>

                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="salvar_senha_pdf_modal"
                        checked={salvarSenha}
                        onChange={(e) => setSalvarSenha(e.target.checked)}
                    />
                    <Label className="form-check-label" htmlFor="salvar_senha_pdf_modal">
                        Salvar senha neste cartão para próximas faturas
                    </Label>
                    <small className="text-muted d-block mt-1">
                        {meta?.tem_senha_cadastrada
                            ? 'Se marcado, a senha salva no cartão será atualizada.'
                            : 'Assim você não precisará digitar de novo nas próximas importações.'}
                    </small>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button type="button" color="light" onClick={onClose} disabled={loading}>
                    Agora não
                </Button>
                <Button type="button" color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    Desbloquear e processar
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaSenhaPdfModal
