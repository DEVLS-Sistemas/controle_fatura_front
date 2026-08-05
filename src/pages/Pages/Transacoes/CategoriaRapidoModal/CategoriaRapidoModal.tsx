import React, { useEffect, useState } from 'react'
import { Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { toast } from 'react-toastify'
import { CategoriaRapidoResult } from 'interfaces/Categorias/CategoriasInterface'
import { CategoriasService } from 'services/Categorias/CategoriasService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

export interface CategoriaRapidoConfirm extends CategoriaRapidoResult {
    propagar_grupo?: boolean
}

export interface CategoriaRapidoModalProps {
    isOpen: boolean
    toggle: () => void
    onConfirm: (result: CategoriaRapidoConfirm) => void | Promise<void>
    /** Exibe checkbox para aplicar em todas as parcelas (compra parcelada já salva) */
    showPropagarGrupo?: boolean
}

const CORES_FALLBACK = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#0f172a',
]

const extractErrorMessage = (error: unknown): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.categoria?.message === 'string') return body.categoria.message
        if (Array.isArray(body?.nome) && body.nome[0]) return String(body.nome[0])
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return 'Erro ao cadastrar categoria'
}

const CategoriaRapidoModal = ({
    isOpen,
    toggle,
    onConfirm,
    showPropagarGrupo = false,
}: CategoriaRapidoModalProps) => {
    const [nome, setNome] = useState('')
    const [cor, setCor] = useState('')
    const [cores, setCores] = useState<string[]>(CORES_FALLBACK)
    const [propagarGrupo, setPropagarGrupo] = useState(false)
    const [saving, setSaving] = useState(false)
    const categoriasService = new CategoriasService()

    useEffect(() => {
        if (!isOpen) return
        setNome('')
        setCor('')
        setPropagarGrupo(false)
        ;(async () => {
            try {
                const lookups = await categoriasService.getLookupsCategorias()
                if (lookups?.cores?.length) setCores(lookups.cores)
            } catch {
                // mantém fallback
            }
        })()
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = nome.trim().replace(/\s+/g, ' ')
        if (!trimmed) {
            toast.error('O nome da categoria é obrigatório')
            return
        }

        setSaving(true)
        try {
            const result = await categoriasService.createCategoriasRapido({
                nome: trimmed,
                cor: cor || undefined,
            })
            toast.success(result.message || (result.criado ? 'Categoria cadastrada' : 'Categoria reutilizada'))
            await onConfirm({
                ...result,
                propagar_grupo: showPropagarGrupo ? propagarGrupo : undefined,
            })
            toggle()
        } catch (error) {
            console.error('Erro ao cadastrar categoria rápida:', error)
            toast.error(extractErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Nova categoria</ModalHeader>
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
                                    placeholder="Ex.: Assinaturas"
                                    autoFocus
                                    disabled={saving}
                                />
                            </div>
                        </Col>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label">Cor <span className="text-muted">(opcional)</span></Label>
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <Input
                                        type="select"
                                        bsSize="sm"
                                        value={cor}
                                        onChange={(e) => setCor(e.target.value)}
                                        disabled={saving}
                                        style={{ maxWidth: 220 }}
                                    >
                                        <option value="">Sem cor</option>
                                        {cores.map((hex) => (
                                            <option key={hex} value={hex}>{hex}</option>
                                        ))}
                                    </Input>
                                    {cor && (
                                        <span
                                            className="rounded border"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                backgroundColor: cor,
                                                display: 'inline-block',
                                            }}
                                            title={cor}
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>
                        {showPropagarGrupo && (
                            <Col md={12}>
                                <FormGroup check className="mb-0">
                                    <Input
                                        type="checkbox"
                                        id="propagar_grupo_categoria"
                                        checked={propagarGrupo}
                                        onChange={(e) => setPropagarGrupo(e.target.checked)}
                                        disabled={saving}
                                    />
                                    <Label check htmlFor="propagar_grupo_categoria">
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

export default CategoriaRapidoModal
