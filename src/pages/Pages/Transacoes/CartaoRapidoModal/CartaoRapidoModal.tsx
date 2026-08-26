import React, { useEffect, useState } from 'react'
import { Button, Col, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { toast } from 'react-toastify'
import { buildBandeiraSelectOptions, extractCartaoErrorMessage } from 'helpers/cartao_helpers'
import {
    buildDiasOptions,
    CartaoRapidoPayload,
    CartaoRapidoResult,
    TIPOS_NUMERO_PADRAO,
} from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'

export interface CartaoRapidoConfirm extends CartaoRapidoResult {
    propagar_grupo?: boolean
}

export type CartaoRapidoModo = 'cartao' | 'final'

export interface CartaoRapidoModalProps {
    isOpen: boolean
    toggle: () => void
    onConfirm: (result: CartaoRapidoConfirm) => void | Promise<void>
    modo?: CartaoRapidoModo
    /** Quando modo = final: inclui bandeira/final neste cartão */
    cartaoId?: number | string | null
    cartaoNome?: string | null
    showPropagarGrupo?: boolean
}

const DIAS_FALLBACK = buildDiasOptions()

const CartaoRapidoModal = ({
    isOpen,
    toggle,
    onConfirm,
    modo = 'cartao',
    cartaoId,
    cartaoNome,
    showPropagarGrupo = false,
}: CartaoRapidoModalProps) => {
    const incluirFinal = modo === 'final' && cartaoId != null
    const [nome, setNome] = useState('')
    const [bandeira, setBandeira] = useState('')
    const [ultimosDigitos, setUltimosDigitos] = useState('')
    const [diaLimite, setDiaLimite] = useState('')
    const [diaVencimento, setDiaVencimento] = useState('')
    const [tipo, setTipo] = useState('fisico')
    const [propagarGrupo, setPropagarGrupo] = useState(false)
    const [saving, setSaving] = useState(false)
    const [bandeirasOptions, setBandeirasOptions] = useState<SelectOptions[]>(buildBandeiraSelectOptions())
    const [diasOptions, setDiasOptions] = useState(DIAS_FALLBACK)
    const [tiposOptions, setTiposOptions] = useState(TIPOS_NUMERO_PADRAO)
    const cartoesService = new CartoesService()

    useEffect(() => {
        if (!isOpen) return
        setNome('')
        setBandeira('')
        setUltimosDigitos('')
        setDiaLimite('')
        setDiaVencimento('')
        setTipo('fisico')
        setPropagarGrupo(false)
        ;(async () => {
            try {
                const lookups = await cartoesService.getLookupsCartoes()
                setBandeirasOptions(buildBandeiraSelectOptions(lookups?.bandeiras))
                if (lookups?.dias?.length) setDiasOptions(lookups.dias)
                if (lookups?.tipos_numero?.length) setTiposOptions(lookups.tipos_numero)
            } catch {
                // fallbacks já preenchidos
            }
        })()
    }, [isOpen])

    const handleDigitos = (raw: string) => {
        setUltimosDigitos(raw.replace(/\D/g, '').slice(0, 4))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedNome = nome.trim().replace(/\s+/g, ' ')
        if (!incluirFinal && !trimmedNome) {
            toast.error('O nome do cartão é obrigatório')
            return
        }
        if (!bandeira) {
            toast.error('Bandeira é obrigatória')
            return
        }
        if (ultimosDigitos.length !== 4) {
            toast.error('Últimos dígitos devem conter 4 números')
            return
        }
        if (!incluirFinal) {
            if (!diaLimite) {
                toast.error('Dia limite da fatura é obrigatório')
                return
            }
            if (!diaVencimento) {
                toast.error('Dia de vencimento é obrigatório')
                return
            }
        }

        const payload: CartaoRapidoPayload = {
            bandeira,
            ultimos_digitos: ultimosDigitos,
            tipo: tipo || 'fisico',
        }
        if (incluirFinal) {
            payload.cartao_id = Number(cartaoId)
        } else {
            payload.nome = trimmedNome
            payload.dia_limite_fatura = Number(diaLimite)
            payload.dia_vencimento_fatura = Number(diaVencimento)
        }

        setSaving(true)
        try {
            const result = await cartoesService.createCartoesRapido(payload)
            toast.success(
                result.message
                || (result.criado ? 'Cartão cadastrado com sucesso!' : 'Cartão reutilizado')
            )
            await onConfirm({
                ...result,
                propagar_grupo: showPropagarGrupo ? propagarGrupo : undefined,
            })
            toggle()
        } catch (error) {
            console.error('Erro ao cadastrar cartão rápido:', error)
            toast.error(extractCartaoErrorMessage(error, 'Erro ao cadastrar cartão'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>
                {incluirFinal ? 'Novo final do cartão' : 'Novo cartão'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <Row>
                        {incluirFinal ? (
                            <Col md={12}>
                                <div className="mb-3">
                                    <Label className="form-label">Cartão</Label>
                                    <div className="form-control-plaintext py-0">
                                        {cartaoNome || `Cartão #${cartaoId}`}
                                    </div>
                                </div>
                            </Col>
                        ) : (
                            <Col md={12}>
                                <div className="mb-3">
                                    <Label className="form-label">Nome</Label>
                                    <Input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Ex.: Nubank"
                                        autoFocus
                                        disabled={saving}
                                    />
                                </div>
                            </Col>
                        )}
                        <Col md={6}>
                            <div className="mb-3">
                                <Label className="form-label">Bandeira</Label>
                                <Input
                                    type="select"
                                    value={bandeira}
                                    onChange={(e) => setBandeira(e.target.value)}
                                    disabled={saving}
                                    autoFocus={incluirFinal}
                                >
                                    <option value="">Selecione</option>
                                    {bandeirasOptions.map((opt) => (
                                        <option key={String(opt.value)} value={String(opt.value)}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Input>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-3">
                                <Label className="form-label">Final</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={ultimosDigitos}
                                    onChange={(e) => handleDigitos(e.target.value)}
                                    placeholder="1234"
                                    maxLength={4}
                                    disabled={saving}
                                />
                                <small className="text-muted">4 últimos dígitos</small>
                            </div>
                        </Col>
                        {!incluirFinal ? (
                            <>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <Label className="form-label">Dia limite da fatura</Label>
                                        <Input
                                            type="select"
                                            value={diaLimite}
                                            onChange={(e) => setDiaLimite(e.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="">Selecione</option>
                                            {diasOptions.map((d) => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </Input>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <Label className="form-label">Dia de vencimento</Label>
                                        <Input
                                            type="select"
                                            value={diaVencimento}
                                            onChange={(e) => setDiaVencimento(e.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="">Selecione</option>
                                            {diasOptions.map((d) => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </Input>
                                    </div>
                                </Col>
                            </>
                        ) : null}
                        <Col md={12}>
                            <div className="mb-0">
                                <Label className="form-label">
                                    Tipo <span className="text-muted">(opcional)</span>
                                </Label>
                                <Input
                                    type="select"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    disabled={saving}
                                >
                                    {tiposOptions.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </Input>
                            </div>
                        </Col>
                        {showPropagarGrupo ? (
                            <Col md={12}>
                                <div className="form-check mt-3 mb-0">
                                    <Input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="propagar_grupo_cartao"
                                        checked={propagarGrupo}
                                        onChange={(e) => setPropagarGrupo(e.target.checked)}
                                        disabled={saving}
                                    />
                                    <Label check htmlFor="propagar_grupo_cartao">
                                        Aplicar a todas as parcelas da compra
                                    </Label>
                                </div>
                            </Col>
                        ) : null}
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button type="button" color="light" onClick={toggle} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" color="primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Cadastrar e selecionar'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    )
}

export default CartaoRapidoModal
