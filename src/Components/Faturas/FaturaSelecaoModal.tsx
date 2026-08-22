import React, { useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Button,
    FormFeedback,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
} from 'reactstrap'
import { SelectList } from 'Components/ComponentController/Selects/Select/SelectList'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { BandeiraChip, toBandeiraSelectOption } from 'helpers/cartao_helpers'
import {
    FaturaSelecaoBandeiraOption,
    FaturaSelecaoNumeroOption,
    FaturaSelecaoRetryPayload,
} from 'libs/api/exceptions/FaturaSelecaoError'

export type FaturaSelecaoStep = 'bandeira' | 'final'

export type FaturaSelecaoModalProps = {
    isOpen: boolean
    step: FaturaSelecaoStep
    bandeiras?: FaturaSelecaoBandeiraOption[]
    numeros?: FaturaSelecaoNumeroOption[]
    /** Mantém a bandeira já escolhida ao avançar para o step de final (CSV) */
    cartaoBandeiraId?: number | null
    bandeiraNome?: string | null
    loading?: boolean
    onClose: () => void
    onConfirm: (payload: FaturaSelecaoRetryPayload) => void | Promise<void>
}

const CRIAR_PREFIX = 'criar:'

const toBandeiraSelectValue = (opt: FaturaSelecaoBandeiraOption): string => {
    if (opt.criar || opt.value == null || opt.value === '') {
        return `${CRIAR_PREFIX}${opt.label}`
    }
    return String(opt.value)
}

const FaturaSelecaoModal = ({
    isOpen,
    step,
    bandeiras = [],
    numeros = [],
    cartaoBandeiraId = null,
    bandeiraNome = null,
    loading = false,
    onClose,
    onConfirm,
}: FaturaSelecaoModalProps) => {
    const [bandeiraValue, setBandeiraValue] = useState<string | null>(null)
    const [numeroValue, setNumeroValue] = useState<string | number | null>(null)
    const [ultimosDigitos, setUltimosDigitos] = useState('')
    const [error, setError] = useState<string | null>(null)

    const bandeiraOptions: SelectOptions[] = useMemo(
        () =>
            bandeiras.map((b) =>
                toBandeiraSelectOption(toBandeiraSelectValue(b), b.label, b)
            ),
        [bandeiras]
    )

    const numeroOptions: SelectOptions[] = useMemo(
        () =>
            numeros.map((n) => ({
                value: n.value,
                label: n.label,
            })),
        [numeros]
    )

    const usarInputFinal = step === 'final' && numeros.length === 0

    useEffect(() => {
        if (!isOpen) return
        setError(null)
        setUltimosDigitos('')
        setNumeroValue(null)

        if (step === 'bandeira') {
            if (bandeiraOptions.length === 1) {
                setBandeiraValue(String(bandeiraOptions[0].value))
            } else {
                setBandeiraValue(null)
            }
        }
    }, [isOpen, step, bandeiraOptions])

    const buildBandeiraPayload = (): FaturaSelecaoRetryPayload | null => {
        if (!bandeiraValue) {
            setError('Selecione a bandeira da fatura')
            return null
        }
        if (String(bandeiraValue).startsWith(CRIAR_PREFIX)) {
            return { bandeira: String(bandeiraValue).slice(CRIAR_PREFIX.length) }
        }
        return { cartao_bandeira_id: bandeiraValue }
    }

    const buildFinalPayload = (): FaturaSelecaoRetryPayload | null => {
        const base: FaturaSelecaoRetryPayload = {}
        if (cartaoBandeiraId != null) {
            base.cartao_bandeira_id = cartaoBandeiraId
        }
        if (bandeiraNome) {
            base.bandeira = bandeiraNome
        }

        if (usarInputFinal) {
            const digitos = ultimosDigitos.replace(/\D/g, '').slice(0, 4)
            if (digitos.length !== 4) {
                setError('Informe os 4 últimos dígitos do cartão')
                return null
            }
            return { ...base, ultimos_digitos: digitos }
        }

        if (numeroValue == null || numeroValue === '') {
            setError('Selecione o final do cartão')
            return null
        }
        return { ...base, cartao_numero_id: numeroValue }
    }

    const handleSubmit = async () => {
        setError(null)
        const payload = step === 'bandeira' ? buildBandeiraPayload() : buildFinalPayload()
        if (!payload) return
        await onConfirm(payload)
    }

    const titulo =
        step === 'final' ? 'Final do cartão' : 'Bandeira da fatura'

    const explicacao =
        step === 'final'
            ? 'Este cartão ainda não tem finais cadastrados. Informe o final para vincular os lançamentos do CSV.'
            : 'Este cartão ainda não tem finais cadastrados. Selecione a bandeira da fatura para continuar a importação.'

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered>
            <ModalHeader toggle={onClose}>{titulo}</ModalHeader>
            <ModalBody>
                <p className="mb-3">{explicacao}</p>

                {step === 'final' && (bandeiraNome || cartaoBandeiraId) && (
                    <Alert color="info" className="mb-3">
                        <i className="ri-information-line me-1 align-middle"></i>
                        Bandeira:{' '}
                        {bandeiraNome ? (
                            <BandeiraChip bandeira={bandeiraNome} label={bandeiraNome} />
                        ) : (
                            `ID ${cartaoBandeiraId}`
                        )}
                    </Alert>
                )}

                {step === 'bandeira' && (
                    <div className="mb-3">
                        <Label htmlFor="fatura_selecao_bandeira" className="form-label">
                            Bandeira
                        </Label>
                        <SelectList
                            name="fatura_selecao_bandeira"
                            options={bandeiraOptions}
                            value={bandeiraValue}
                            onChange={(value) => {
                                setBandeiraValue(value != null && value !== '' ? String(value) : null)
                                if (error) setError(null)
                            }}
                            isDisabled={loading}
                        />
                        {error && <FormFeedback className="d-block">{error}</FormFeedback>}
                    </div>
                )}

                {step === 'final' && !usarInputFinal && (
                    <div className="mb-3">
                        <Label htmlFor="fatura_selecao_final" className="form-label">
                            Final do cartão
                        </Label>
                        <SelectList
                            name="fatura_selecao_final"
                            options={numeroOptions}
                            value={numeroValue}
                            onChange={(value) => {
                                setNumeroValue(value ?? null)
                                if (error) setError(null)
                            }}
                            isDisabled={loading}
                        />
                        {error && <FormFeedback className="d-block">{error}</FormFeedback>}
                    </div>
                )}

                {step === 'final' && usarInputFinal && (
                    <div className="mb-3">
                        <Label htmlFor="fatura_selecao_ultimos_digitos" className="form-label">
                            Últimos 4 dígitos
                        </Label>
                        <Input
                            id="fatura_selecao_ultimos_digitos"
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Ex.: 1234"
                            value={ultimosDigitos}
                            invalid={Boolean(error)}
                            disabled={loading}
                            onChange={(e) => {
                                setUltimosDigitos(e.target.value.replace(/\D/g, '').slice(0, 4))
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
                        <small className="text-muted d-block mt-1">
                            O final será cadastrado na bandeira selecionada.
                        </small>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="button" color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    Continuar
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaSelecaoModal
