import React, { useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Badge,
    Button,
    Col,
    FormFeedback,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner,
} from 'reactstrap'
import { SelectList } from 'Components/ComponentController/Selects/Select/SelectList'
import { AnosSelect } from 'helpers/functions_helpers'
import { mesesOptions } from 'helpers/fatura_helpers'
import { toBandeiraSelectOption } from 'helpers/cartao_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'
import {
    FaturaCartaoTitularError,
    FaturaCartaoTitularRetryPayload,
} from 'libs/api/exceptions/FaturaCartaoTitularError'

const CRIAR_PREFIX = 'criar:'

const toBandeiraSelectValue = (opt: FaturaSelecaoBandeiraOption): string => {
    if (opt.criar || opt.value == null || opt.value === '') {
        return `${CRIAR_PREFIX}${opt.label}`
    }
    return String(opt.value)
}

export type FaturaCartaoTitularModalProps = {
    isOpen: boolean
    error?: FaturaCartaoTitularError | null
    loading?: boolean
    onClose: () => void
    onCadastrarCartao: (payload: FaturaCartaoTitularRetryPayload) => void | Promise<void>
    onSubstituir?: () => void | Promise<void>
}

const FaturaCartaoTitularModal = ({
    isOpen,
    error = null,
    loading = false,
    onClose,
    onCadastrarCartao,
    onSubstituir,
}: FaturaCartaoTitularModalProps) => {
    const [cartaoNome, setCartaoNome] = useState('')
    const [mes, setMes] = useState<string | number | null>(null)
    const [ano, setAno] = useState<string | number | null>(null)
    const [bandeiraValue, setBandeiraValue] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const anosOptions = useMemo(() => AnosSelect(), [])
    const bandeiras = error?.bandeiras ?? []
    const bandeiraOptions: SelectOptions[] = useMemo(
        () => bandeiras.map((b) => toBandeiraSelectOption(toBandeiraSelectValue(b), b.label, b)),
        [bandeiras]
    )

    useEffect(() => {
        if (!isOpen || !error) return
        setFormError(null)
        const s = error.sugestao
        setCartaoNome(
            (s.cartao_nome_sugerido || s.cartao_nome || error.cartao_existente_nome || '').trim()
        )
        setMes(s.mes ?? null)
        setAno(s.ano ?? null)
        const sugerida = s.bandeira_sugerida
        if (sugerida) {
            const match = bandeiras.find(
                (b) => b.label.toLowerCase() === sugerida.toLowerCase()
            )
            setBandeiraValue(match ? toBandeiraSelectValue(match) : `${CRIAR_PREFIX}${sugerida}`)
        } else {
            setBandeiraValue(null)
        }
    }, [isOpen, error, bandeiras])

    const competencia = useMemo(() => {
        if (mes == null || ano == null) return null
        return `${String(mes).padStart(2, '0')}/${ano}`
    }, [mes, ano])

    const handleCadastrar = async () => {
        const nome = cartaoNome.trim()
        if (!nome) {
            setFormError('Informe o nome do cartão desta pessoa')
            return
        }
        if (mes == null || mes === '' || ano == null || ano === '') {
            setFormError('Informe mês e ano')
            return
        }
        const payload: FaturaCartaoTitularRetryPayload = {
            cadastrar_cartao: true,
            cartao_nome: nome,
            mes,
            ano,
            pessoa_id: error?.sugestao.pessoa_id ?? null,
        }
        if (bandeiraValue) {
            if (String(bandeiraValue).startsWith(CRIAR_PREFIX)) {
                payload.bandeira = String(bandeiraValue).slice(CRIAR_PREFIX.length)
            } else {
                payload.cartao_bandeira_id = bandeiraValue
            }
        }
        await onCadastrarCartao(payload)
    }

    return (
        <Modal isOpen={isOpen} toggle={loading ? undefined : onClose} centered backdrop="static" size="lg">
            <ModalHeader toggle={loading ? undefined : onClose}>
                Fatura deste mês já existe neste cartão
            </ModalHeader>
            <ModalBody>
                <Alert color="warning" className="mb-3">
                    <strong>As duas faturas precisam coexistir — em cartões separados.</strong>
                    <div className="small mt-1">
                        {error?.orientacao
                            || 'Já existe fatura deste mês neste cartão. Se o PDF for de outra pessoa, cadastre o cartão dela aqui. Não vamos substituir a fatura que já está lançada.'}
                    </div>
                </Alert>

                <div className="mb-3 small">
                    {error?.cartao_existente_nome && (
                        <div>
                            Cartão atual: <strong>{error.cartao_existente_nome}</strong>
                        </div>
                    )}
                    {error?.pessoa_existente_nome && (
                        <div>
                            Titular já lançado: <strong>{error.pessoa_existente_nome}</strong>
                        </div>
                    )}
                    {competencia && (
                        <div>
                            Competência: <strong>{competencia}</strong>
                        </div>
                    )}
                </div>

                {error && error.titulares_detectados.length > 0 && (
                    <div className="mb-3">
                        <div className="text-muted text-uppercase small fw-semibold mb-2">
                            Nome no novo arquivo
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {error.titulares_detectados.map((nome) => (
                                <Badge key={nome} color="light" className="text-dark border fs-6 fw-normal">
                                    {nome}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <p className="mb-3">
                    Cadastre o <strong>cartão desta pessoa</strong> nesta tela. A fatura nova entra nesse cartão
                    e a anterior permanece.
                </p>

                <Row>
                    <Col md={3}>
                        <div className="mb-3">
                            <Label className="form-label">Mês</Label>
                            <SelectList
                                name="cartao_titular_mes"
                                options={mesesOptions}
                                value={mes}
                                onChange={(value) => setMes(value ?? null)}
                                isDisabled={loading}
                            />
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="mb-3">
                            <Label className="form-label">Ano</Label>
                            <SelectList
                                name="cartao_titular_ano"
                                options={anosOptions}
                                value={ano}
                                onChange={(value) => setAno(value ?? null)}
                                isDisabled={loading}
                            />
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="mb-3">
                            <Label className="form-label" htmlFor="cartao_titular_nome">
                                Nome do cartão
                            </Label>
                            <Input
                                id="cartao_titular_nome"
                                value={cartaoNome}
                                placeholder="Ex.: Nubank Maysa"
                                disabled={loading}
                                onChange={(e) => setCartaoNome(e.target.value)}
                            />
                            <small className="text-muted">
                                Use um nome que diferencie o titular (ex.: Nubank Leonardo / Nubank Maysa).
                            </small>
                        </div>
                    </Col>
                    {bandeiraOptions.length > 0 && (
                        <Col md={6}>
                            <div className="mb-3">
                                <Label className="form-label">Bandeira</Label>
                                <SelectList
                                    name="cartao_titular_bandeira"
                                    options={bandeiraOptions}
                                    value={bandeiraValue}
                                    onChange={(value) => setBandeiraValue(value != null ? String(value) : null)}
                                    isDisabled={loading}
                                />
                            </div>
                        </Col>
                    )}
                </Row>

                {formError && <FormFeedback className="d-block">{formError}</FormFeedback>}
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
                <Button color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                {error?.permitir_substituir && onSubstituir && (
                    <Button color="soft-danger" onClick={onSubstituir} disabled={loading}>
                        Substituir a fatura existente
                    </Button>
                )}
                <Button color="primary" onClick={handleCadastrar} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-1" />}
                    Cadastrar cartão e fatura
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaCartaoTitularModal
