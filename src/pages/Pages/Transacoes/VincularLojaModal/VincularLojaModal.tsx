import React, { useEffect, useRef, useState } from 'react'
import {
    Button, Col, FormGroup, Input, Label, ListGroup, ListGroupItem,
    Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner
} from 'reactstrap'
import { toast } from 'react-toastify'
import { EstabelecimentoDoFiltro, TransacoesSearch } from 'interfaces/Transacoes/TransacoesInterface'
import { LojaLookup } from 'interfaces/Lojas/LojasInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { LojasService } from 'services/Lojas/LojasService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

export interface VincularLojaModalProps {
    isOpen: boolean
    toggle: () => void
    filters: TransacoesSearch
    onLinked?: () => void | Promise<void>
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.loja?.message === 'string') return body.loja.message
        if (Array.isArray(body?.nome) && body.nome[0]) return String(body.nome[0])
        if (Array.isArray(body?.estabelecimento_ids) && body.estabelecimento_ids[0]) {
            return String(body.estabelecimento_ids[0])
        }
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return fallback
}

const VincularLojaModal = ({ isOpen, toggle, filters, onLinked }: VincularLojaModalProps) => {
    const [itens, setItens] = useState<EstabelecimentoDoFiltro[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [apenasSemLoja, setApenasSemLoja] = useState(true)
    const [loadingLista, setLoadingLista] = useState(false)
    const [saving, setSaving] = useState(false)

    const [buscaLoja, setBuscaLoja] = useState('')
    const [lojasResultados, setLojasResultados] = useState<LojaLookup[]>([])
    const [loadingLojas, setLoadingLojas] = useState(false)
    const [lojaSelecionada, setLojaSelecionada] = useState<LojaLookup | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [novoNome, setNovoNome] = useState('')

    const transacoesService = useRef(new TransacoesService()).current
    const lojasService = useRef(new LojasService()).current
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const buscaSeq = useRef(0)
    const listaSeq = useRef(0)

    const loadEstabelecimentos = async (semLoja: boolean) => {
        const seq = ++listaSeq.current
        setLoadingLista(true)
        try {
            const list = await transacoesService.listEstabelecimentosDoFiltro({
                ...filters,
                apenas_sem_loja: semLoja ? 1 : undefined,
            })
            if (seq !== listaSeq.current) return
            setItens(list)
            setSelectedIds(new Set())
            if (list.length === 0) {
                toast.info(
                    semLoja
                        ? 'Nenhum estabelecimento sem loja no filtro atual'
                        : 'Nenhum estabelecimento no filtro atual'
                )
            }
        } catch (error) {
            if (seq !== listaSeq.current) return
            console.error('Erro ao listar estabelecimentos do filtro:', error)
            toast.error(extractErrorMessage(error, 'Erro ao carregar estabelecimentos do filtro'))
            setItens([])
            setSelectedIds(new Set())
        } finally {
            if (seq === listaSeq.current) setLoadingLista(false)
        }
    }

    const buscarLojas = async (palavra: string) => {
        const seq = ++buscaSeq.current
        setLoadingLojas(true)
        try {
            const list = await lojasService.AsyncListLojas({
                palavra_chave: palavra.trim() || undefined,
            })
            if (seq !== buscaSeq.current) return
            setLojasResultados(
                (list ?? [])
                    .filter((l) => l.id != null)
                    .map((l) => ({ id: Number(l.id), nome: l.nome ?? `#${l.id}` }))
            )
        } catch (error) {
            if (seq !== buscaSeq.current) return
            console.error('Erro ao buscar lojas:', error)
            toast.error('Erro ao buscar lojas')
            setLojasResultados([])
        } finally {
            if (seq === buscaSeq.current) setLoadingLojas(false)
        }
    }

    useEffect(() => {
        if (!isOpen) return
        setApenasSemLoja(true)
        setSelectedIds(new Set())
        setLojaSelecionada(null)
        setBuscaLoja('')
        setNovoNome('')
        setShowCreate(false)
        setLojasResultados([])
        setItens([])
        loadEstabelecimentos(true)
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            buscarLojas(buscaLoja)
        }, buscaLoja ? 350 : 0)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [buscaLoja, isOpen])

    const allSelected = itens.length > 0 && selectedIds.size === itens.length

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
            return
        }
        setSelectedIds(new Set(itens.map((i) => i.id)))
    }

    const toggleOne = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const canSubmit =
        selectedIds.size > 0
        && (lojaSelecionada?.id != null || (showCreate && novoNome.trim().length > 0))
        && !saving
        && !loadingLista

    const handleVincular = async () => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) {
            toast.error('Selecione ao menos um estabelecimento')
            return
        }

        const nomeNova = novoNome.trim().replace(/\s+/g, ' ')
        if (!lojaSelecionada?.id && !nomeNova) {
            toast.error('Selecione ou cadastre uma loja')
            return
        }

        setSaving(true)
        try {
            const result = await lojasService.vincularEstabelecimentos(
                lojaSelecionada?.id
                    ? { loja_id: Number(lojaSelecionada.id), estabelecimento_ids: ids }
                    : { nome: nomeNova, estabelecimento_ids: ids }
            )
            const vinculados = result.vinculados ?? ids.length
            toast.success(
                result.message
                || `${vinculados} estabelecimento(s) vinculado(s)${result.criado ? ' (loja criada)' : ''}`
            )
            await onLinked?.()
            toggle()
        } catch (error) {
            console.error('Erro ao vincular estabelecimentos:', error)
            toast.error(extractErrorMessage(error, 'Erro ao vincular estabelecimentos'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>Vincular com loja</ModalHeader>
            <ModalBody>
                <p className="text-muted small mb-3">
                    Estabelecimentos distintos do filtro atual. Marque os que devem receber a mesma loja.
                </p>

                <FormGroup check className="mb-3">
                    <Input
                        type="checkbox"
                        id="apenas_sem_loja"
                        checked={apenasSemLoja}
                        disabled={loadingLista || saving}
                        onChange={(e) => {
                            const checked = e.target.checked
                            setApenasSemLoja(checked)
                            loadEstabelecimentos(checked)
                        }}
                    />
                    <Label check htmlFor="apenas_sem_loja">
                        Mostrar apenas estabelecimentos sem loja
                    </Label>
                </FormGroup>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <FormGroup check className="mb-0">
                        <Input
                            type="checkbox"
                            id="selecionar_todos_est"
                            checked={allSelected}
                            disabled={loadingLista || saving || itens.length === 0}
                            onChange={toggleAll}
                        />
                        <Label check htmlFor="selecionar_todos_est">
                            Selecionar todos ({selectedIds.size}/{itens.length})
                        </Label>
                    </FormGroup>
                </div>

                <div className="border rounded mb-4" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {loadingLista ? (
                        <div className="text-center py-4">
                            <Spinner size="sm" />
                        </div>
                    ) : itens.length === 0 ? (
                        <p className="text-muted small text-center py-4 mb-0">
                            Nenhum estabelecimento encontrado no filtro
                        </p>
                    ) : (
                        <table className="table table-sm align-middle mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th style={{ width: 40 }}></th>
                                    <th>Estabelecimento</th>
                                    <th>Loja atual</th>
                                    <th className="text-end">No filtro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map((item) => {
                                    const checked = selectedIds.has(item.id)
                                    const checkId = `est-filtro-${item.id}`
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <Input
                                                    type="checkbox"
                                                    id={checkId}
                                                    checked={checked}
                                                    disabled={saving}
                                                    onChange={() => toggleOne(item.id)}
                                                />
                                            </td>
                                            <td>
                                                <Label htmlFor={checkId} className="mb-0">
                                                    {item.nome}
                                                </Label>
                                            </td>
                                            <td className="text-muted small">
                                                {item.loja_nome || '—'}
                                            </td>
                                            <td className="text-end small text-muted">
                                                {item.transacoes_count ?? 0}{' '}
                                                {(item.transacoes_count ?? 0) === 1 ? 'transação' : 'transações'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <h6 className="mb-2">Selecionar loja</h6>
                {lojaSelecionada && (
                    <p className="small mb-2">
                        Selecionada: <strong>{lojaSelecionada.nome}</strong>{' '}
                        <Button
                            type="button"
                            color="link"
                            size="sm"
                            className="px-1"
                            disabled={saving}
                            onClick={() => setLojaSelecionada(null)}
                        >
                            limpar
                        </Button>
                    </p>
                )}

                <div className="mb-2">
                    <Input
                        type="text"
                        value={buscaLoja}
                        onChange={(e) => setBuscaLoja(e.target.value)}
                        placeholder="Buscar loja..."
                        disabled={saving}
                    />
                </div>

                <div className="mb-3" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {loadingLojas ? (
                        <div className="text-center py-2">
                            <Spinner size="sm" />
                        </div>
                    ) : lojasResultados.length === 0 ? (
                        <p className="text-muted small mb-0">Nenhuma loja encontrada</p>
                    ) : (
                        <ListGroup flush>
                            {lojasResultados.map((loja) => {
                                const selected = Number(loja.id) === Number(lojaSelecionada?.id)
                                return (
                                    <ListGroupItem
                                        key={loja.id}
                                        action
                                        tag="button"
                                        type="button"
                                        active={selected}
                                        disabled={saving}
                                        onClick={() => {
                                            setLojaSelecionada(loja)
                                            setShowCreate(false)
                                            setNovoNome('')
                                        }}
                                        className="d-flex justify-content-between align-items-center py-2"
                                    >
                                        <span>{loja.nome}</span>
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
                            setLojaSelecionada(null)
                            if (buscaLoja.trim()) setNovoNome(buscaLoja.trim())
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
                        <Button type="button" color="light" size="sm" onClick={() => setShowCreate(false)} disabled={saving}>
                            Cancelar
                        </Button>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" color="light" onClick={toggle} disabled={saving}>
                    Fechar
                </Button>
                <Button type="button" color="primary" onClick={handleVincular} disabled={!canSubmit}>
                    {saving ? 'Vinculando...' : `Vincular (${selectedIds.size})`}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default VincularLojaModal
