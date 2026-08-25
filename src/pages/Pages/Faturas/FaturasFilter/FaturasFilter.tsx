import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import {
    Breadcrumb, BreadcrumbItem, Button, Card, CardHeader, Col, Collapse,
    Input, Label, Modal, ModalBody, ModalHeader, Row, Spinner
} from "reactstrap"
import { toast } from "react-toastify"
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled"
import { SelectListControlled } from "Components/ComponentController/Selects/Select/SelectListControlled"
import { SelectOptions } from "interfaces/SystemInterfaces/SelectInterface"
import { mesesOptions } from "helpers/fatura_helpers"
import { AnosSelect } from "helpers/functions_helpers"
import { FaturasSearch } from "interfaces/Faturas/FaturasInterface"
import { FaturasService } from "services/Faturas/FaturasService"
import { PessoasService } from "services/Pessoas/PessoasService"
import { toPessoaSelectOption } from "interfaces/Pessoas/PessoasInterface"

export interface FaturasFilterProps {
    getRemoteFaturasList: (data: any) => void
}

const isDev = process.env.NODE_ENV === 'development'

const optStatus: SelectOptions[] = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'processando', label: 'Processando' },
    { value: 'processada', label: 'Processada' },
    { value: 'erro', label: 'Erro' },
]

const FaturasFilter = ({ getRemoteFaturasList }: FaturasFilterProps) => {
    const [searchParams] = useSearchParams()
    const mesUrl = Number(searchParams.get('mes'))
    const anoUrl = Number(searchParams.get('ano'))
    const { handleSubmit, control, register } = useForm<FaturasSearch>({
        defaultValues: {
            mes: Number.isFinite(mesUrl) && mesUrl >= 1 && mesUrl <= 12 ? mesUrl : null,
            ano: Number.isFinite(anoUrl) && anoUrl > 2000 ? anoUrl : null,
        },
    })
    const [showFilter, setShowFilter] = useState<boolean>(false)
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [pessoasOptions, setPessoasOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todas' }])
    const [limparModalOpen, setLimparModalOpen] = useState(false)
    const [confirmado, setConfirmado] = useState(false)
    const [excluindoTodas, setExcluindoTodas] = useState(false)
    const faturasService = new FaturasService()
    const pessoasService = new PessoasService()

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const lookups = await faturasService.getLookupsFaturas()
                if (lookups?.cartoes) {
                    const opts: SelectOptions[] = [{ value: '', label: 'Todos' }]
                    lookups.cartoes.forEach((c) => {
                        opts.push({
                            value: c.id!,
                            label: c.nome ?? `Cartão ${c.id}`,
                            cor_fundo: c.cor_fundo ?? null,
                            cor_texto: c.cor_texto ?? null,
                        })
                    })
                    setCartoesOptions(opts)
                }
                const pessoas = await pessoasService.AsyncListPessoas()
                if (pessoas) {
                    setPessoasOptions([
                        { value: '', label: 'Todas' },
                        ...pessoas.map((p) => toPessoaSelectOption(p)),
                    ])
                }
            } catch (error) {
                console.error('Erro ao carregar lookups:', error)
            }
        }
        loadLookups()
    }, [])

    const optAnos = AnosSelect({ includeTodos: true })

    const optMeses: SelectOptions[] = [{ value: '', label: 'Todos' }, ...mesesOptions]

    const toggleLimparModal = () => {
        if (excluindoTodas) return
        setLimparModalOpen((open) => !open)
        setConfirmado(false)
    }

    const handleExcluirTodas = async () => {
        if (!confirmado) return
        setExcluindoTodas(true)
        try {
            const result = await faturasService.deleteAllFaturas()
            const data = result?.fatura?.data
            const faturas = data?.faturas_excluidas ?? 0
            const transacoes = data?.transacoes_excluidas ?? 0
            toast.success(
                `${result?.fatura?.message ?? 'Limpeza concluída.'} (${faturas} fatura(s), ${transacoes} transação(ões))`
            )
            setLimparModalOpen(false)
            setConfirmado(false)
            await getRemoteFaturasList({})
        } catch (error: any) {
            console.error('Erro ao excluir todas as faturas:', error)
            toast.error(error?.message || 'Erro ao excluir faturas e transações')
        } finally {
            setExcluindoTodas(false)
        }
    }

    return (
        <React.Fragment>
            <UiContent />

            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <Link to="/dashboard" className="me-2">
                                <i className="bx bx-arrow-back bx-sm"></i>
                            </Link>
                            <h4 className="mb-0">Faturas</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                            <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                            <BreadcrumbItem active>Faturas</BreadcrumbItem>
                        </Breadcrumb>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-row justify-content-end align-items-center gap-2 mb-4">
                        {isDev && (
                            <Button
                                color="soft-danger"
                                className="btn btn-soft-danger"
                                onClick={toggleLimparModal}
                                title="Ferramenta de testes: zera faturas e compras"
                            >
                                <i className="ri-delete-bin-2-line align-middle me-1"></i>
                                Limpar faturas
                            </Button>
                        )}
                        <Link to="/faturas/add" className="btn btn-primary">
                            <i className="ri-add-circle-line align-middle me-1"></i> Adicionar Fatura
                        </Link>
                    </div>
                </Col>
                <Col xl={12}>
                    <Card>
                        <CardHeader>
                            <div className="gap-2 flex-wrap">
                                <Row>
                                    <Col md={4}>
                                        <Button onClick={() => setShowFilter(!showFilter)} color="primary" className="mb-1">
                                            Filtros
                                        </Button>
                                    </Col>
                                    {!showFilter && (
                                        <Col md={8}>
                                            <form onSubmit={handleSubmit(getRemoteFaturasList)}>
                                                <div className="input-group">
                                                    <input
                                                        {...register("palavra_chave")}
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Buscar..."
                                                    />
                                                    <button className="btn btn-success" type="submit">
                                                        <i className="ri-search-line align-middle me-1"></i> Buscar
                                                    </button>
                                                </div>
                                            </form>
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            <Row>
                                <Col>
                                    <Collapse isOpen={showFilter} className="multi-collapse mt-3">
                                        <form
                                            className="px-0 my-0 m-2"
                                            id="form-search"
                                            onSubmit={handleSubmit(getRemoteFaturasList)}
                                        >
                                            <Row>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="pessoa_id" className="form-label">Titular</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={pessoasOptions}
                                                            field="pessoa_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={cartoesOptions}
                                                            field="cartao_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="mes" className="form-label">Mês</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optMeses}
                                                            field="mes"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="ano" className="form-label">Ano</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optAnos}
                                                            field="ano"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="status" className="form-label">Status</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optStatus}
                                                            field="status"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row className="mt-3">
                                                <div className="d-flex flex-row justify-content-end align-items-center">
                                                    <Col md={6}>
                                                        <InputTextControlled<FaturasSearch>
                                                            field="palavra_chave"
                                                            control={control}
                                                            placeholder="Buscar..."
                                                        />
                                                    </Col>
                                                    <Col md={2} className="me-3">
                                                        <button className="btn btn-success form-control ms-3" type="submit">
                                                            Buscar
                                                        </button>
                                                    </Col>
                                                </div>
                                            </Row>
                                        </form>
                                    </Collapse>
                                </Col>
                            </Row>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>

            {isDev && (
                <Modal isOpen={limparModalOpen} toggle={toggleLimparModal} centered backdrop="static">
                    <ModalHeader toggle={toggleLimparModal}>Excluir todas as faturas?</ModalHeader>
                    <ModalBody>
                        <div className="text-center mb-3">
                            <i className="ri-error-warning-line display-5 text-danger"></i>
                        </div>
                        <p className="mb-2">
                            Isso remove <strong>todas as faturas e transações</strong>. Cartões e cadastros
                            (estabelecimentos, categorias…) permanecem. Esta ação é para testes e não pode
                            ser desfeita pela UI.
                        </p>
                        <div className="form-check mb-4">
                            <Input
                                className="form-check-input"
                                type="checkbox"
                                id="confirmar-excluir-todas"
                                checked={confirmado}
                                onChange={(e) => setConfirmado(e.target.checked)}
                                disabled={excluindoTodas}
                            />
                            <Label className="form-check-label" htmlFor="confirmar-excluir-todas">
                                Entendi e quero excluir tudo
                            </Label>
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button color="light" onClick={toggleLimparModal} disabled={excluindoTodas}>
                                Cancelar
                            </Button>
                            <Button
                                color="danger"
                                onClick={handleExcluirTodas}
                                disabled={!confirmado || excluindoTodas}
                            >
                                {excluindoTodas ? (
                                    <>
                                        <Spinner size="sm" className="me-1" /> Excluindo…
                                    </>
                                ) : (
                                    'Excluir tudo'
                                )}
                            </Button>
                        </div>
                    </ModalBody>
                </Modal>
            )}
        </React.Fragment>
    )
}

export default FaturasFilter
