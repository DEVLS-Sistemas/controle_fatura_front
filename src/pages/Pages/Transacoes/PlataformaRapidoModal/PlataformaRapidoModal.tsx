import React, { useEffect, useRef, useState } from 'react'
import { Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { toast } from 'react-toastify'
import { CategoriaTemaLookup } from 'interfaces/Categorias/CategoriasInterface'
import { PlataformaRapidoResult } from 'interfaces/Plataformas/PlataformasInterface'
import { PlataformasService } from 'services/Plataformas/PlataformasService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import CorTemaSwatches from 'Components/CoresTema/CorTemaSwatches'
import {
    COR_TEMA_PADRAO,
    corTemaPadrao,
    normalizeHexTema,
    resolverTemasCategoria,
} from 'helpers/cores_tema_helpers'

export interface PlataformaRapidoConfirm extends PlataformaRapidoResult {
    propagar_grupo?: boolean
}

export interface PlataformaRapidoModalProps {
    isOpen: boolean
    toggle: () => void
    onConfirm: (result: PlataformaRapidoConfirm) => void | Promise<void>
    showPropagarGrupo?: boolean
}

const extractErrorMessage = (error: unknown): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.plataforma?.message === 'string') return body.plataforma.message
        if (Array.isArray(body?.nome) && body.nome[0]) return String(body.nome[0])
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return 'Erro ao cadastrar plataforma'
}

const PlataformaRapidoModal = ({
    isOpen,
    toggle,
    onConfirm,
    showPropagarGrupo = false,
}: PlataformaRapidoModalProps) => {
    const [nome, setNome] = useState('')
    const [cor, setCor] = useState(COR_TEMA_PADRAO)
    const [temas, setTemas] = useState<CategoriaTemaLookup[]>(resolverTemasCategoria())
    const [propagarGrupo, setPropagarGrupo] = useState(true)
    const [saving, setSaving] = useState(false)
    const corEscolhidaRef = useRef(false)
    const plataformasService = new PlataformasService()

    useEffect(() => {
        if (!isOpen) return
        setNome('')
        setCor(COR_TEMA_PADRAO)
        setPropagarGrupo(true)
        corEscolhidaRef.current = false
        ;(async () => {
            try {
                const lookups = await plataformasService.getLookupsPlataformas()
                setTemas(resolverTemasCategoria(lookups))
                if (!corEscolhidaRef.current) {
                    setCor(corTemaPadrao(lookups))
                }
            } catch {
                setTemas(resolverTemasCategoria())
            }
        })()
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = nome.trim().replace(/\s+/g, ' ')
        if (!trimmed) {
            toast.error('O nome da plataforma é obrigatório')
            return
        }

        setSaving(true)
        try {
            const result = await plataformasService.createPlataformasRapido({
                nome: trimmed,
                cor: normalizeHexTema(cor) || COR_TEMA_PADRAO,
            })
            toast.success(result.message || (result.criado ? 'Plataforma cadastrada' : 'Plataforma reutilizada'))
            await onConfirm({
                ...result,
                propagar_grupo: showPropagarGrupo ? propagarGrupo : undefined,
            })
            toggle()
        } catch (error) {
            console.error('Erro ao cadastrar plataforma rápida:', error)
            toast.error(extractErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Nova plataforma</ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <Row>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label">Nome</Label>
                                <Input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex.: Rappi"
                                    autoFocus
                                    disabled={saving}
                                />
                            </div>
                        </Col>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label">Cor tema</Label>
                                <CorTemaSwatches
                                    temas={temas}
                                    value={cor}
                                    onChange={(hex) => {
                                        corEscolhidaRef.current = true
                                        setCor(hex)
                                    }}
                                    disabled={saving}
                                    idPrefix="cor-tema-plataforma-rapido"
                                    size={22}
                                />
                            </div>
                        </Col>
                        {showPropagarGrupo && (
                            <Col md={12}>
                                <FormGroup check className="mb-0">
                                    <Input
                                        type="checkbox"
                                        id="propagar_grupo_plataforma"
                                        checked={propagarGrupo}
                                        onChange={(e) => setPropagarGrupo(e.target.checked)}
                                        disabled={saving}
                                    />
                                    <Label check htmlFor="propagar_grupo_plataforma">
                                        Aplicar a todas as parcelas da compra
                                    </Label>
                                </FormGroup>
                            </Col>
                        )}
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

export default PlataformaRapidoModal
