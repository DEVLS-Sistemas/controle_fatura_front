import UiContent from "Components/Common/UiContent"
import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import {
    Breadcrumb, BreadcrumbItem, Button, Card, CardHeader, Col, Collapse,
    Input, Label, Modal, ModalBody, ModalHeader, Row, Spinner
} from "reactstrap"
import { toast } from "react-toastify"
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled"
import { EstabelecimentosSearch } from "interfaces/Estabelecimentos/EstabelecimentosInterface"
import { EstabelecimentosService } from "services/Estabelecimentos/EstabelecimentosService"
import { ValidationError } from "libs/api/exceptions/ValidationError"

export interface EstabelecimentosFilterProps {
    getRemoteEstabelecimentosList: (data: any) => void
}

const isDev = process.env.NODE_ENV === 'development'

const extractErrorMessage = (error: unknown): string => {
    if (error instanceof ValidationError) {
        const body = error.errors as any
        if (typeof body?.message === 'string') return body.message
        if (typeof body?.estabelecimento?.message === 'string') return body.estabelecimento.message
        if (typeof body === 'string') return body
    }
    if (error instanceof Error && error.message) return error.message
    return 'Erro ao excluir estabelecimentos e categorias'
}

const EstabelecimentosFilter = ({ getRemoteEstabelecimentosList }: EstabelecimentosFilterProps) => {
    const { handleSubmit, control, register } = useForm<EstabelecimentosSearch>({ defaultValues: {} })
    const [showFilter, setShowFilter] = useState<boolean>(false)
    const [limparModalOpen, setLimparModalOpen] = useState(false)
    const [confirmado, setConfirmado] = useState(false)
    const [excluindoTodos, setExcluindoTodos] = useState(false)
    const estabelecimentosService = new EstabelecimentosService()

    const toggleLimparModal = () => {
        if (excluindoTodos) return
        setLimparModalOpen((open) => !open)
        setConfirmado(false)
    }

    const handleExcluirTodos = async () => {
        if (!confirmado) return
        setExcluindoTodos(true)
        try {
            const result = await estabelecimentosService.deleteAllEstabelecimentos()
            const data = result?.estabelecimento?.data
            const estabelecimentos = data?.estabelecimentos_excluidos ?? 0
            const categorias = data?.categorias_excluidas ?? 0
            const subcategorias = data?.subcategorias_excluidas ?? 0
            const lojas = data?.lojas_excluidas
            const contagens = [
                `${estabelecimentos} estabelecimento(s)`,
                `${categorias} categoria(s)`,
                `${subcategorias} subcategoria(s)`,
            ]
            if (lojas != null) contagens.push(`${lojas} loja(s)`)
            toast.success(
                `${result?.estabelecimento?.message ?? 'Limpeza concluída.'} (${contagens.join(', ')})`
            )
            setLimparModalOpen(false)
            setConfirmado(false)
            await getRemoteEstabelecimentosList({})
        } catch (error: unknown) {
            console.error('Erro ao excluir todos os estabelecimentos:', error)
            toast.error(extractErrorMessage(error))
        } finally {
            setExcluindoTodos(false)
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
                            <h4 className="mb-0">Estabelecimentos</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                            <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                            <BreadcrumbItem active>Estabelecimentos</BreadcrumbItem>
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
                                title="Ferramenta de testes: zera estabelecimentos, categorias e subcategorias"
                            >
                                <i className="ri-delete-bin-2-line align-middle me-1"></i>
                                Limpar estabelecimentos
                            </Button>
                        )}
                        <Link to="/estabelecimentos/add" className="btn btn-primary">
                            <i className="ri-add-circle-line align-middle me-1"></i> Add
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
                                            <form onSubmit={handleSubmit(getRemoteEstabelecimentosList)}>
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
                                            onSubmit={handleSubmit(getRemoteEstabelecimentosList)}
                                        >
                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="nome" className="form-label">Nome</Label>
                                                        <InputTextControlled<EstabelecimentosSearch>
                                                            field={"nome"}
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="ativo" className="form-label">Ativo</Label>
                                                        <select {...register("ativo")} className="form-select">
                                                            <option value="">Todos</option>
                                                            <option value="true">Ativo</option>
                                                            <option value="false">Inativo</option>
                                                        </select>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row className="mt-5">
                                                <div className="d-flex flex-row justify-content-end align-items-center">
                                                    <Col md={6}>
                                                        <InputTextControlled<EstabelecimentosSearch>
                                                            field={"palavra_chave"}
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
                    <ModalHeader toggle={toggleLimparModal}>Excluir todos os estabelecimentos?</ModalHeader>
                    <ModalBody>
                        <div className="text-center mb-3">
                            <i className="ri-error-warning-line display-5 text-danger"></i>
                        </div>
                        <p className="mb-2">
                            Isso remove <strong>todos os estabelecimentos, categorias e subcategorias</strong>.
                            Faturas/transações e cartões permanecem. Se ainda houver compras, limpe as faturas
                            antes. Esta ação é para testes e não pode ser desfeita pela UI.
                        </p>
                        <div className="form-check mb-4">
                            <Input
                                className="form-check-input"
                                type="checkbox"
                                id="confirmar-excluir-todos-estabelecimentos"
                                checked={confirmado}
                                onChange={(e) => setConfirmado(e.target.checked)}
                                disabled={excluindoTodos}
                            />
                            <Label className="form-check-label" htmlFor="confirmar-excluir-todos-estabelecimentos">
                                Entendi e quero excluir tudo
                            </Label>
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button color="light" onClick={toggleLimparModal} disabled={excluindoTodos}>
                                Cancelar
                            </Button>
                            <Button
                                color="danger"
                                onClick={handleExcluirTodos}
                                disabled={!confirmado || excluindoTodos}
                            >
                                {excluindoTodos ? (
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

export default EstabelecimentosFilter
