import React, { useEffect, useState } from 'react'
import { Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { toast } from 'react-toastify'
import { SubcategoriaRapidoResult } from 'interfaces/Subcategorias/SubcategoriasInterface'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

export interface SubcategoriaRapidoConfirm extends SubcategoriaRapidoResult {
    propagar_grupo?: boolean
}

export interface SubcategoriaRapidoModalProps {
    isOpen: boolean
    toggle: () => void
    categoriaId: number | null | undefined
    categoriaNome?: string | null
    categoriaCor?: string | null
    onConfirm: (result: SubcategoriaRapidoConfirm) => void | Promise<void>
    showPropagarGrupo?: boolean
}

const extractErrorMessage = (error: unknown): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.subcategoria?.message === 'string') return body.subcategoria.message
        if (Array.isArray(body?.nome) && body.nome[0]) return String(body.nome[0])
        if (Array.isArray(body?.categoria_id) && body.categoria_id[0]) return String(body.categoria_id[0])
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return 'Erro ao cadastrar subcategoria'
}

const SubcategoriaRapidoModal = ({
    isOpen,
    toggle,
    categoriaId,
    categoriaNome,
    categoriaCor,
    onConfirm,
    showPropagarGrupo = false,
}: SubcategoriaRapidoModalProps) => {
    const [nome, setNome] = useState('')
    const [propagarGrupo, setPropagarGrupo] = useState(false)
    const [saving, setSaving] = useState(false)
    const subcategoriasService = new SubcategoriasService()

    useEffect(() => {
        if (!isOpen) return
        setNome('')
        setPropagarGrupo(false)
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoriaId) {
            toast.error('Selecione uma categoria antes')
            return
        }
        const trimmed = nome.trim().replace(/\s+/g, ' ')
        if (!trimmed) {
            toast.error('O nome da subcategoria é obrigatório')
            return
        }

        setSaving(true)
        try {
            const result = await subcategoriasService.createSubcategoriasRapido({
                nome: trimmed,
                categoria_id: Number(categoriaId),
            })
            toast.success(result.message || (result.criado ? 'Subcategoria cadastrada' : 'Subcategoria reutilizada'))
            await onConfirm({
                ...result,
                propagar_grupo: showPropagarGrupo ? propagarGrupo : undefined,
            })
            toggle()
        } catch (error) {
            console.error('Erro ao cadastrar subcategoria rápida:', error)
            toast.error(extractErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Nova subcategoria</ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <Row>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label text-muted">Categoria</Label>
                                <div className="d-flex align-items-center gap-2">
                                    {categoriaCor && (
                                        <span
                                            className="rounded border"
                                            style={{
                                                width: 16,
                                                height: 16,
                                                backgroundColor: categoriaCor,
                                                display: 'inline-block',
                                            }}
                                        />
                                    )}
                                    <span className="fw-medium">
                                        {categoriaNome || (categoriaId ? `#${categoriaId}` : '—')}
                                    </span>
                                </div>
                            </div>
                        </Col>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label">Nome</Label>
                                <Input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex.: Feira do Mês"
                                    autoFocus
                                    disabled={saving || !categoriaId}
                                />
                            </div>
                        </Col>
                        {showPropagarGrupo && (
                            <Col md={12}>
                                <FormGroup check className="mb-0">
                                    <Input
                                        type="checkbox"
                                        id="propagar_grupo_subcategoria"
                                        checked={propagarGrupo}
                                        onChange={(e) => setPropagarGrupo(e.target.checked)}
                                        disabled={saving}
                                    />
                                    <Label check htmlFor="propagar_grupo_subcategoria">
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
                    <Button type="submit" color="primary" disabled={saving || !categoriaId}>
                        {saving ? 'Salvando...' : 'Cadastrar e selecionar'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    )
}

export default SubcategoriaRapidoModal
