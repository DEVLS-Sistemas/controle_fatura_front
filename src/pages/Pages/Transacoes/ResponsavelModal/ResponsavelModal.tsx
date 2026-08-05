import React, { useEffect, useState } from 'react'
import { Button, Col, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { ResponsavelLookup } from 'interfaces/Transacoes/TransacoesInterface'
import { ResponsaveisDefaultValues, ResponsaveisModel } from 'interfaces/Responsaveis/ResponsaveisInterface'
import { ResponsaveisService } from 'services/Responsaveis/ResponsaveisService'

export interface ResponsavelModalProps {
    isOpen: boolean
    toggle: () => void
    responsaveis: ResponsavelLookup[]
    currentResponsavelId?: number | string | null
    onConfirm: (responsavel: ResponsavelLookup) => void | Promise<void>
    onResponsaveisChange?: (list: ResponsavelLookup[]) => void
}

const optTipo: SelectOptions[] = [
    { value: 'pessoal', label: 'Pessoal' },
    { value: 'empresa', label: 'Empresa' },
]

type ModalForm = {
    responsavel_id: number | string | null
    novo_nome: string | null
    novo_tipo: string | null
}

const ResponsavelModal = ({
    isOpen,
    toggle,
    responsaveis,
    currentResponsavelId,
    onConfirm,
    onResponsaveisChange,
}: ResponsavelModalProps) => {
    const [saving, setSaving] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [localResponsaveis, setLocalResponsaveis] = useState<ResponsavelLookup[]>(responsaveis)
    const responsaveisService = new ResponsaveisService()

    const { control, handleSubmit, reset, setValue, watch } = useForm<ModalForm>({
        defaultValues: {
            responsavel_id: currentResponsavelId ?? null,
            novo_nome: null,
            novo_tipo: 'pessoal',
        },
    })

    const selectedId = watch('responsavel_id')

    const toValidId = (value: unknown): number | null => {
        if (value == null || value === '') return null
        const n = Number(value)
        return Number.isFinite(n) ? n : null
    }

    const extractCreatedId = (created: any): number | null => {
        const candidates = [
            created?.responsavel?.data?.id,
            created?.responsavel?.id,
            created?.data?.id,
            created?.id,
            created?.responsavel_id,
        ]
        for (const candidate of candidates) {
            const id = toValidId(candidate)
            if (id != null) return id
        }
        return null
    }

    const options: SelectOptions[] = localResponsaveis
        .filter((r) => toValidId(r.id) != null)
        .map((r) => ({
            value: toValidId(r.id)!,
            label: r.nome ?? `#${r.id}`,
        }))

    useEffect(() => {
        setLocalResponsaveis(
            (responsaveis ?? []).filter((r) => toValidId(r.id) != null)
        )
    }, [responsaveis])

    useEffect(() => {
        if (isOpen) {
            reset({
                responsavel_id: toValidId(currentResponsavelId),
                novo_nome: null,
                novo_tipo: 'pessoal',
            })
            setShowCreate(false)
        }
    }, [isOpen, currentResponsavelId, reset])

    const handleCreate = async () => {
        const nome = watch('novo_nome')
        const tipo = watch('novo_tipo') || 'pessoal'
        if (!nome?.trim()) {
            toast.error('Informe o nome do responsável')
            return
        }

        setSaving(true)
        try {
            const payload: ResponsaveisModel = {
                ...ResponsaveisDefaultValues,
                nome: nome.trim(),
                tipo,
                ativo: true,
            }
            const created = await responsaveisService.createResponsaveis(payload)
            const newId = extractCreatedId(created)
            if (newId == null) {
                toast.error('Responsável cadastrado, mas o ID não foi retornado')
                return
            }
            const createdData = created?.responsavel?.data ?? created?.responsavel ?? created?.data ?? created
            const novo: ResponsavelLookup = {
                id: newId,
                nome: createdData?.nome?.trim?.() || nome.trim(),
                tipo: String(createdData?.tipo ?? tipo),
            }
            const updated = [
                ...localResponsaveis.filter((r) => toValidId(r.id) != null && Number(r.id) !== newId),
                novo,
            ]
            setLocalResponsaveis(updated)
            onResponsaveisChange?.(updated)
            setValue('responsavel_id', novo.id!, { shouldValidate: true, shouldDirty: true })
            setShowCreate(false)
            toast.success('Responsável cadastrado')
        } catch (error) {
            console.error('Erro ao cadastrar responsável:', error)
            toast.error('Erro ao cadastrar responsável')
        } finally {
            setSaving(false)
        }
    }

    const onSubmit = async (data: ModalForm) => {
        const selected = toValidId(data.responsavel_id)
        if (selected == null) {
            toast.error('Selecione um responsável')
            return
        }
        const found = localResponsaveis.find((r) => Number(r.id) === selected)
        if (!found) {
            toast.error('Responsável inválido')
            return
        }
        setSaving(true)
        try {
            await onConfirm(found)
            toggle()
        } catch (error) {
            console.error('Erro ao vincular responsável:', error)
            toast.error('Erro ao atualizar responsável')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Responsável</ModalHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalBody>
                    <Row>
                        <Col md={12}>
                            <div className="mb-3">
                                <Label className="form-label">Selecionar responsável</Label>
                                <SelectListControlled<ModalForm>
                                    options={options}
                                    field="responsavel_id"
                                    control={control}
                                    required={required}
                                />
                            </div>
                        </Col>
                    </Row>

                    {!showCreate ? (
                        <Button
                            type="button"
                            color="link"
                            className="px-0"
                            onClick={() => setShowCreate(true)}
                        >
                            <i className="ri-user-add-line me-1"></i>
                            Cadastrar novo responsável
                        </Button>
                    ) : (
                        <div className="border rounded p-3 mt-2">
                            <h6 className="mb-3">Novo responsável</h6>
                            <Row>
                                <Col md={7}>
                                    <div className="mb-3">
                                        <Label className="form-label">Nome</Label>
                                        <InputTextControlled<ModalForm>
                                            field="novo_nome"
                                            control={control}
                                            placeholder="Nome"
                                        />
                                    </div>
                                </Col>
                                <Col md={5}>
                                    <div className="mb-3">
                                        <Label className="form-label">Tipo</Label>
                                        <SelectListControlled<ModalForm>
                                            options={optTipo}
                                            field="novo_tipo"
                                            control={control}
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <div className="d-flex gap-2">
                                <Button type="button" color="primary" size="sm" onClick={handleCreate} disabled={saving}>
                                    Cadastrar e selecionar
                                </Button>
                                <Button type="button" color="light" size="sm" onClick={() => setShowCreate(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {toValidId(selectedId) != null && (
                        <p className="text-muted mt-3 mb-0 small">
                            Selecionado: {localResponsaveis.find((r) => Number(r.id) === Number(selectedId))?.nome}
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" color="light" onClick={toggle} disabled={saving}>
                        Fechar
                    </Button>
                    <Button type="submit" color="primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Confirmar'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    )
}

export default ResponsavelModal
