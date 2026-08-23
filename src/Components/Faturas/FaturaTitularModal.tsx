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
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    pessoaNomeCompleto,
    splitNomePessoa,
    toPessoaSelectOption,
} from 'interfaces/Pessoas/PessoasInterface'
import {
    FaturaTitularPessoaOption,
    FaturaTitularRetryPayload,
    FaturaTitularSugestao,
} from 'libs/api/exceptions/FaturaTitularError'

export type FaturaTitularModalProps = {
    isOpen: boolean
    titulares?: string[]
    nomeNoCartao?: string | null
    pessoas?: FaturaTitularPessoaOption[]
    sugestao?: FaturaTitularSugestao | null
    perfilNome?: string | null
    orientacao?: string | null
    loading?: boolean
    onClose: () => void
    onConfirm: (payload: FaturaTitularRetryPayload) => void | Promise<void>
}

type TitularMode = 'existente' | 'nova' | 'confirmar'

const FaturaTitularModal = ({
    isOpen,
    titulares = [],
    nomeNoCartao = null,
    pessoas = [],
    sugestao = null,
    perfilNome = null,
    orientacao = null,
    loading = false,
    onClose,
    onConfirm,
}: FaturaTitularModalProps) => {
    const [mode, setMode] = useState<TitularMode>('nova')
    const [pessoaId, setPessoaId] = useState<string | number | null>(null)
    const [pessoaNome, setPessoaNome] = useState('')
    const [pessoaSobrenome, setPessoaSobrenome] = useState('')
    const [error, setError] = useState<string | null>(null)

    const nomesDetectados = useMemo(() => {
        const set = new Set() as Set<string>
        titulares.forEach((n) => n.trim() && set.add(n.trim()))
        if (nomeNoCartao?.trim()) set.add(nomeNoCartao.trim())
        if (sugestao?.nome_no_cartao?.trim()) set.add(sugestao.nome_no_cartao.trim())
        return Array.from(set)
    }, [titulares, nomeNoCartao, sugestao])

    const pessoaOptions: SelectOptions[] = useMemo(
        () => pessoas.map((p) => toPessoaSelectOption(p)),
        [pessoas]
    )

    useEffect(() => {
        if (!isOpen) return
        setError(null)

        const sugeridoCompleto =
            [sugestao?.pessoa_nome, sugestao?.pessoa_sobrenome].filter(Boolean).join(' ')
            || nomesDetectados[0]
            || ''
        const split = splitNomePessoa(
            sugestao?.pessoa_nome
                ? `${sugestao.pessoa_nome} ${sugestao.pessoa_sobrenome ?? ''}`.trim()
                : sugeridoCompleto
        )
        setPessoaNome(sugestao?.pessoa_nome?.trim() || split.nome)
        setPessoaSobrenome(sugestao?.pessoa_sobrenome?.trim() || split.sobrenome)

        if (sugestao?.pessoa_id != null) {
            setMode('existente')
            setPessoaId(sugestao.pessoa_id)
        } else if (pessoaOptions.length > 0) {
            setMode('nova')
            setPessoaId(null)
        } else {
            setMode('nova')
            setPessoaId(null)
        }
    }, [isOpen, sugestao, nomesDetectados, pessoaOptions.length])

    const buildPayload = (): FaturaTitularRetryPayload | null => {
        if (mode === 'existente') {
            if (pessoaId == null || pessoaId === '') {
                setError('Selecione a pessoa titular desta fatura')
                return null
            }
            return { pessoa_id: pessoaId }
        }
        if (mode === 'nova') {
            const nome = pessoaNome.trim()
            if (!nome) {
                setError('Informe o nome da pessoa para cadastrá-la')
                return null
            }
            return {
                cadastrar_pessoa: true,
                pessoa_nome: nome,
                pessoa_sobrenome: pessoaSobrenome.trim() || null,
            }
        }
        return { confirmar_titular: true }
    }

    const handleSubmit = async () => {
        setError(null)
        const payload = buildPayload()
        if (!payload) return
        await onConfirm(payload)
    }

    const tituloDetectado = nomesDetectados[0] || 'titular não cadastrado'

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered backdrop="static" size="lg">
            <ModalHeader toggle={loading ? undefined : onClose}>
                Confirmar titular da fatura
            </ModalHeader>
            <ModalBody>
                <Alert color="warning" className="mb-3">
                    <strong>
                        {tituloDetectado !== 'titular não cadastrado'
                            ? <>Detectamos o nome <span className="text-uppercase">{tituloDetectado}</span> no arquivo.</>
                            : 'O nome na fatura não bate com as pessoas desta conta.'}
                    </strong>
                    {perfilNome && (
                        <div className="mt-1">
                            Seu cadastro é <strong>{perfilNome}</strong>.
                        </div>
                    )}
                    <div className="small mt-1">
                        {orientacao
                            || 'A quem pertence esta fatura? Cadastre o titular ou vincule a uma pessoa existente — assim as faturas de cada pessoa convivem sem se misturar.'}
                    </div>
                </Alert>

                {nomesDetectados.length > 0 && (
                    <div className="mb-3">
                        <div className="text-muted text-uppercase small fw-semibold mb-2">
                            Nome na fatura
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {nomesDetectados.map((nome) => (
                                <Badge key={nome} color="light" className="text-dark border fs-6 fw-normal">
                                    {nome}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-3">
                    <Label className="form-label">O que deseja fazer?</Label>
                    <div className="d-flex flex-column gap-2">
                        <div className="form-check">
                            <Input
                                className="form-check-input"
                                type="radio"
                                id="titular-nova"
                                checked={mode === 'nova'}
                                onChange={() => { setMode('nova'); setError(null) }}
                                disabled={loading}
                            />
                            <Label className="form-check-label" htmlFor="titular-nova">
                                Cadastrar <strong>{tituloDetectado}</strong> como nova pessoa
                            </Label>
                        </div>
                        <div className="form-check">
                            <Input
                                className="form-check-input"
                                type="radio"
                                id="titular-existente"
                                checked={mode === 'existente'}
                                onChange={() => { setMode('existente'); setError(null) }}
                                disabled={loading || pessoaOptions.length === 0}
                            />
                            <Label className="form-check-label" htmlFor="titular-existente">
                                Vincular a uma pessoa já cadastrada
                            </Label>
                        </div>
                        <div className="form-check">
                            <Input
                                className="form-check-input"
                                type="radio"
                                id="titular-confirmar"
                                checked={mode === 'confirmar'}
                                onChange={() => { setMode('confirmar'); setError(null) }}
                                disabled={loading}
                            />
                            <Label className="form-check-label" htmlFor="titular-confirmar">
                                Importar mesmo assim
                                <span className="text-muted"> (usa a pessoa do cartão, se houver)</span>
                            </Label>
                        </div>
                    </div>
                </div>

                {mode === 'nova' && (
                    <Row>
                        <Col md={6}>
                            <div className="mb-3">
                                <Label htmlFor="titular-pessoa-nome" className="form-label">Nome</Label>
                                <Input
                                    id="titular-pessoa-nome"
                                    value={pessoaNome}
                                    invalid={Boolean(error) && !pessoaNome.trim()}
                                    onChange={(e) => setPessoaNome(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-3">
                                <Label htmlFor="titular-pessoa-sobrenome" className="form-label">Sobrenome</Label>
                                <Input
                                    id="titular-pessoa-sobrenome"
                                    value={pessoaSobrenome}
                                    onChange={(e) => setPessoaSobrenome(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </Col>
                    </Row>
                )}

                {mode === 'existente' && (
                    <div className="mb-3">
                        <Label className="form-label">Pessoa</Label>
                        <SelectList
                            name="fatura_titular_pessoa"
                            options={pessoaOptions}
                            value={pessoaId}
                            onChange={(v) => setPessoaId(v ?? null)}
                            placeholder="Selecione a pessoa"
                            isDisabled={loading}
                        />
                        {pessoaOptions.length === 0 && (
                            <small className="text-muted">Nenhuma pessoa cadastrada ainda.</small>
                        )}
                    </div>
                )}

                {mode === 'confirmar' && (
                    <Alert color="light" className="border mb-0">
                        A fatura será importada sem criar uma pessoa nova.
                        {pessoas[0] && (
                            <> Titular do cartão: <strong>{pessoaNomeCompleto(pessoas[0])}</strong>.</>
                        )}
                    </Alert>
                )}

                {error && <FormFeedback className="d-block">{error}</FormFeedback>}
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-1" />}
                    {mode === 'nova' && 'Cadastrar pessoa e fatura'}
                    {mode === 'existente' && 'Vincular e cadastrar fatura'}
                    {mode === 'confirmar' && 'Importar mesmo assim'}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaTitularModal
