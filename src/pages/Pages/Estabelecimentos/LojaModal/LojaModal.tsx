import React, { useEffect, useRef, useState } from 'react'
import {
    Button, Col, Input, Label, ListGroup, ListGroupItem, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner
} from 'reactstrap'
import { toast } from 'react-toastify'
import { LojaLookup } from 'interfaces/Lojas/LojasInterface'
import { LojasService } from 'services/Lojas/LojasService'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

export interface LojaModalResult {
    id: number | null
    nome: string | null
}

export interface LojaModalProps {
    isOpen: boolean
    toggle: () => void
    /** Se informado, vincula/desvincula via API ao confirmar */
    estabelecimentoId?: number | null
    currentLojaId?: number | string | null
    currentLojaNome?: string | null
    onConfirm: (loja: LojaModalResult) => void | Promise<void>
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.loja?.message === 'string') return body.loja.message
        if (typeof body?.estabelecimento?.message === 'string') return body.estabelecimento.message
        if (Array.isArray(body?.nome) && body.nome[0]) return String(body.nome[0])
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return fallback
}

const LojaModal = ({
    isOpen,
    toggle,
    estabelecimentoId,
    currentLojaId,
    currentLojaNome,
    onConfirm,
}: LojaModalProps) => {
    const [busca, setBusca] = useState('')
    const [resultados, setResultados] = useState<LojaLookup[]>([])
    const [loadingBusca, setLoadingBusca] = useState(false)
    const [novoNome, setNovoNome] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [saving, setSaving] = useState(false)
    const lojasService = useRef(new LojasService()).current
    const estabelecimentosService = useRef(new EstabelecimentosService()).current
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const buscaSeq = useRef(0)

    const hasVinculo = currentLojaId != null && currentLojaId !== ''

    const buscarLojas = async (palavra: string) => {
        const seq = ++buscaSeq.current
        setLoadingBusca(true)
        try {
            const list = await lojasService.AsyncListLojas({
                palavra_chave: palavra.trim() || undefined,
            })
            if (seq !== buscaSeq.current) return
            setResultados(
                (list ?? [])
                    .filter((l) => l.id != null)
                    .map((l) => ({ id: Number(l.id), nome: l.nome ?? `#${l.id}` }))
            )
        } catch (error) {
            if (seq !== buscaSeq.current) return
            console.error('Erro ao buscar lojas:', error)
            toast.error('Erro ao buscar lojas')
            setResultados([])
        } finally {
            if (seq === buscaSeq.current) setLoadingBusca(false)
        }
    }

    useEffect(() => {
        if (!isOpen) return
        setBusca('')
        setNovoNome('')
        setShowCreate(false)
        setResultados([])
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            buscarLojas(busca)
        }, busca ? 350 : 0)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [busca, isOpen])

    const finishWith = async (loja: LojaModalResult) => {
        await onConfirm(loja)
        toggle()
    }

    const handleSelect = async (item: LojaLookup) => {
        if (item.id == null) return
        setSaving(true)
        try {
            if (estabelecimentoId) {
                const result = await lojasService.createLojasRapido({
                    nome: item.nome?.trim() || String(item.id),
                    estabelecimento_id: Number(estabelecimentoId),
                })
                toast.success(
                    result.message || (result.criado ? 'Loja cadastrada e vinculada' : 'Loja vinculada')
                )
                await finishWith({ id: result.data.id, nome: result.data.nome })
            } else {
                await finishWith({ id: Number(item.id), nome: item.nome ?? null })
            }
        } catch (error) {
            console.error('Erro ao vincular loja:', error)
            toast.error(extractErrorMessage(error, 'Erro ao vincular loja'))
        } finally {
            setSaving(false)
        }
    }

    const handleCreate = async () => {
        const nome = novoNome.trim().replace(/\s+/g, ' ')
        if (!nome) {
            toast.error('Informe o nome da loja')
            return
        }
        setSaving(true)
        try {
            const result = await lojasService.createLojasRapido({
                nome,
                estabelecimento_id: estabelecimentoId ? Number(estabelecimentoId) : undefined,
            })
            toast.success(
                result.message || (result.criado ? 'Loja cadastrada com sucesso!' : 'Loja reutilizada')
            )
            await finishWith({ id: result.data.id, nome: result.data.nome })
        } catch (error) {
            console.error('Erro ao cadastrar loja:', error)
            toast.error(extractErrorMessage(error, 'Erro ao cadastrar loja'))
        } finally {
            setSaving(false)
        }
    }

    const handleUnlink = async () => {
        if (!hasVinculo) return
        setSaving(true)
        try {
            if (estabelecimentoId) {
                await estabelecimentosService.editEstabelecimentos({
                    id: Number(estabelecimentoId),
                    loja_id: null,
                })
                toast.success('Vínculo com a loja removido')
            }
            await finishWith({ id: null, nome: null })
        } catch (error) {
            console.error('Erro ao desvincular loja:', error)
            toast.error(extractErrorMessage(error, 'Erro ao remover vínculo'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Loja</ModalHeader>
            <ModalBody>
                {hasVinculo && (
                    <p className="text-muted small mb-3">
                        Atual: <strong>{currentLojaNome || `#${currentLojaId}`}</strong>
                    </p>
                )}

                <div className="mb-3">
                    <Label className="form-label">Buscar loja</Label>
                    <Input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Ex.: Atacadão"
                        autoFocus
                        disabled={saving}
                    />
                </div>

                <div className="mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {loadingBusca ? (
                        <div className="text-center py-3">
                            <Spinner size="sm" />
                        </div>
                    ) : resultados.length === 0 ? (
                        <p className="text-muted small mb-0">Nenhuma loja encontrada</p>
                    ) : (
                        <ListGroup flush>
                            {resultados.map((item) => {
                                const selected = Number(item.id) === Number(currentLojaId)
                                return (
                                    <ListGroupItem
                                        key={item.id}
                                        action
                                        tag="button"
                                        type="button"
                                        active={selected}
                                        disabled={saving}
                                        onClick={() => handleSelect(item)}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <span>{item.nome}</span>
                                        {selected && <i className="ri-check-line" />}
                                    </ListGroupItem>
                                )
                            })}
                        </ListGroup>
                    )}
                </div>

                {!showCreate ? (
                    <Button
                        type="button"
                        color="link"
                        className="px-0"
                        disabled={saving}
                        onClick={() => {
                            setShowCreate(true)
                            if (busca.trim()) setNovoNome(busca.trim())
                        }}
                    >
                        <i className="ri-store-2-line me-1"></i>
                        Cadastrar nova loja
                    </Button>
                ) : (
                    <div className="border rounded p-3">
                        <h6 className="mb-3">Nova loja</h6>
                        <Row>
                            <Col md={12}>
                                <div className="mb-3">
                                    <Label className="form-label">Nome fantasia</Label>
                                    <Input
                                        type="text"
                                        value={novoNome}
                                        onChange={(e) => setNovoNome(e.target.value)}
                                        placeholder="Ex.: Atacadão"
                                        disabled={saving}
                                    />
                                </div>
                            </Col>
                        </Row>
                        <div className="d-flex gap-2">
                            <Button type="button" color="primary" size="sm" onClick={handleCreate} disabled={saving}>
                                {saving ? 'Salvando...' : 'Cadastrar e vincular'}
                            </Button>
                            <Button type="button" color="light" size="sm" onClick={() => setShowCreate(false)} disabled={saving}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter className="justify-content-between">
                <div>
                    {hasVinculo && (
                        <Button type="button" color="link" className="text-danger px-0" onClick={handleUnlink} disabled={saving}>
                            Remover vínculo
                        </Button>
                    )}
                </div>
                <Button type="button" color="light" onClick={toggle} disabled={saving}>
                    Fechar
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default LojaModal
