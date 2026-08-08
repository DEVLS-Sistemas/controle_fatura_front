import React, { useEffect, useMemo, useState } from 'react'
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
import { SelectList } from 'Components/ComponentController/Selects/Select/SelectList'
import {
    resolveSenhaPdfRegraDigitos,
    SenhaPdfRegraLookup,
} from 'interfaces/Cartoes/CartoesInterface'
import { SenhaPdfMeta } from 'interfaces/Faturas/FaturasInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { FaturasService } from 'services/Faturas/FaturasService'

export type FaturaSenhaUnlockPayload = {
    senha_pdf: string
    salvar_senha_pdf: boolean
    senha_pdf_regra?: string | null
}

export type FaturaSenhaPdfModalProps = {
    isOpen: boolean
    faturaId: number | string | null
    senhaMeta?: SenhaPdfMeta | null
    onClose: () => void
    /** Chamado após desbloqueio/processamento com sucesso */
    onSuccess?: () => void | Promise<void>
    /**
     * Fluxo de cadastro (ainda sem fatura_id): reenvia o multipart com a senha.
     * Quando informado, substitui a chamada a `processarPdf`.
     */
    onUnlock?: (payload: FaturaSenhaUnlockPayload) => void | Promise<void>
}

const MSG_SENHA_OU_REGRA_INCORRETA =
    'A senha ou a regra informadas estão incorretas. Verifique na fatura e tente novamente.'

const textoExplicativo = (meta?: SenhaPdfMeta | null): string => {
    if (meta?.motivo === 'incorreta') {
        let text =
            'A senha informada não desbloqueou o PDF. Ela pode não seguir o padrão da regra cadastrada ou estar incorreta.'
        if (meta.tem_senha_cadastrada) {
            text += ' A senha salva neste cartão pode estar desatualizada ou com a regra errada.'
        }
        text += ' Verifique na fatura qual a regra de senha e ajuste abaixo se necessário.'
        return text
    }
    return 'Esta fatura está em um PDF com senha. Informe a senha para importar os lançamentos. Se a orientação abaixo não bater com a fatura, selecione a regra correta.'
}

const onlyDigits = (value: string, max?: number | null): string => {
    const digits = value.replace(/\D/g, '')
    if (max != null && max > 0) return digits.slice(0, max)
    return digits
}

const FaturaSenhaPdfModal = ({
    isOpen,
    faturaId,
    senhaMeta,
    onClose,
    onSuccess,
    onUnlock,
}: FaturaSenhaPdfModalProps) => {
    const [senha, setSenha] = useState('')
    const [salvarSenha, setSalvarSenha] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [meta, setMeta] = useState<SenhaPdfMeta | null | undefined>(senhaMeta)
    const [regras, setRegras] = useState<SenhaPdfRegraLookup[]>([])
    const [regraSelecionada, setRegraSelecionada] = useState<string | null>(null)
    const [tentativaAposAjuste, setTentativaAposAjuste] = useState(false)
    const faturasService = React.useMemo(() => new FaturasService(), [])
    const cartoesService = React.useMemo(() => new CartoesService(), [])

    const regraOptions: SelectOptions[] = useMemo(
        () => regras.map((r) => ({ value: r.value, label: r.label })),
        [regras]
    )

    const regraAtual = useMemo(
        () => regras.find((r) => String(r.value) === String(regraSelecionada ?? '')) ?? null,
        [regras, regraSelecionada]
    )

    const digitosEsperados = useMemo(
        () => resolveSenhaPdfRegraDigitos(regraAtual ?? regraSelecionada, regras),
        [regraAtual, regraSelecionada, regras]
    )

    const orientacao =
        regraAtual?.orientacao
        || meta?.orientacao
        || meta?.label_regra
        || null

    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        ;(async () => {
            try {
                const lookups = await faturasService.getLookupsFaturas()
                if (!cancelled) setRegras(lookups?.senhas_pdf_regras ?? [])
            } catch {
                if (!cancelled) setRegras([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [isOpen, faturasService])

    useEffect(() => {
        if (!isOpen) return
        setSenha('')
        setError(null)
        setMeta(senhaMeta)
        setTentativaAposAjuste(false)
        setRegraSelecionada(senhaMeta?.regra ? String(senhaMeta.regra) : null)
        setSalvarSenha(!(senhaMeta?.tem_senha_cadastrada === true && senhaMeta?.motivo === 'incorreta'))
    }, [isOpen, senhaMeta])

    const handleRegraChange = (value: string | number | null | undefined) => {
        const next = value != null && value !== '' ? String(value) : null
        const max = resolveSenhaPdfRegraDigitos(next, regras)
        setRegraSelecionada(next)
        setSenha((prev) => onlyDigits(prev, max))
        setError(null)
        setTentativaAposAjuste(true)
    }

    const handleSubmit = async () => {
        if (!onUnlock && !faturaId) return
        const senhaLimpa = onlyDigits(senha, digitosEsperados)
        if (!senhaLimpa) {
            setError('Informe a senha do PDF')
            return
        }
        if (digitosEsperados != null && senhaLimpa.length !== digitosEsperados) {
            setError(`A senha deve ter exatamente ${digitosEsperados} dígitos (conforme a regra selecionada).`)
            return
        }

        setLoading(true)
        setError(null)
        try {
            if (onUnlock) {
                await onUnlock({
                    senha_pdf: senhaLimpa,
                    salvar_senha_pdf: salvarSenha,
                    senha_pdf_regra: regraSelecionada || undefined,
                })
                onClose()
                await onSuccess?.()
                return
            }

            await faturasService.processarPdf(Number(faturaId), {
                senha_pdf: senhaLimpa,
                salvar_senha_pdf: salvarSenha,
                senha_pdf_regra: regraSelecionada || undefined,
            })

            // O processar grava a senha, mas a regra pode não ser persistida no cartão.
            // Quando o usuário marca "salvar", sincronizamos a regra via edição do cartão.
            const cartaoId = meta?.cartao_id ?? null
            const regraParaSalvar = regraSelecionada?.trim() || null
            if (salvarSenha && cartaoId && regraParaSalvar) {
                try {
                    await cartoesService.atualizarSenhaPdfRegra(Number(cartaoId), regraParaSalvar)
                } catch (regraErr) {
                    console.error('Senha salva, mas falhou ao atualizar a regra no cartão:', regraErr)
                    toast.warning(
                        'Senha salva no cartão, mas a regra não foi atualizada. Ajuste a regra na edição do cartão.'
                    )
                }
            }

            toast.success('PDF desbloqueado e fatura processada')
            onClose()
            await onSuccess?.()
        } catch (err) {
            if (err instanceof PdfSenhaError) {
                const msg = tentativaAposAjuste
                    ? MSG_SENHA_OU_REGRA_INCORRETA
                    : (err.message || MSG_SENHA_OU_REGRA_INCORRETA)
                setError(msg)
                if (err.senha_pdf) {
                    setMeta(err.senha_pdf)
                    if (err.senha_pdf.regra && !tentativaAposAjuste) {
                        setRegraSelecionada(String(err.senha_pdf.regra))
                    }
                }
                setSenha('')
                setTentativaAposAjuste(true)
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

                {orientacao && (
                    <Alert color="info" className="mb-3">
                        <i className="ri-information-line me-1 align-middle"></i>
                        {orientacao}
                    </Alert>
                )}

                <div className="mb-3">
                    <Label htmlFor="senha_pdf_regra_modal" className="form-label">
                        Regra da senha do PDF
                    </Label>
                    <SelectList
                        name="senha_pdf_regra_modal"
                        options={regraOptions}
                        value={regraSelecionada}
                        onChange={handleRegraChange}
                        isDisabled={loading}
                    />
                    <small className="text-muted d-block mt-1">
                        Confira na fatura qual padrão o banco usa (ex.: C6 usa 6 primeiros dígitos do CPF/CNPJ).
                    </small>
                </div>

                <div className="mb-3">
                    <Label htmlFor="senha_pdf_modal" className="form-label">
                        Senha do PDF
                        {digitosEsperados != null ? (
                            <span className="text-muted fw-normal"> ({digitosEsperados} dígitos)</span>
                        ) : null}
                    </Label>
                    <PasswordRevealInput
                        id="senha_pdf_modal"
                        value={senha}
                        invalid={Boolean(error)}
                        placeholder={
                            digitosEsperados != null
                                ? `Informe ${digitosEsperados} dígitos`
                                : 'Digite a senha'
                        }
                        inputMode="numeric"
                        maxLength={digitosEsperados ?? undefined}
                        onChange={(e) => {
                            setSenha(onlyDigits(e.target.value, digitosEsperados))
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
                            ? 'Se marcado, a senha e a regra salvas no cartão serão atualizadas.'
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
                    {onUnlock ? 'Continuar cadastro' : 'Desbloquear e processar'}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaSenhaPdfModal
