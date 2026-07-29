import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    Badge, ButtonGroup, Card, CardBody, Col, DropdownItem,
    DropdownMenu, DropdownToggle, Label, Row, UncontrolledDropdown
} from "reactstrap"
import { toast } from "react-toastify"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import { useNavegacao } from "helpers/functions_helpers"
import {
    formatCurrency,
    formatDateBr,
    responsavelTipoColor,
    tipoTransacaoColor,
    tipoTransacaoLabel,
} from "helpers/fatura_helpers"
import {
    CategoriaLookup,
    ResponsavelLookup,
    TransacoesList,
    TransacoesSearch,
} from "interfaces/Transacoes/TransacoesInterface"
import { TransacoesService } from "services/Transacoes/TransacoesService"

export interface TransacoesTableProps {
    data: PaginateInterface<TransacoesList> | undefined
    getData: (data: PaginateSearch & TransacoesSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: TransacoesSearch
    categoriasLookup: CategoriaLookup[]
    responsaveisLookup: ResponsavelLookup[]
    onRowsChange?: (data: PaginateInterface<TransacoesList>) => void
}

const responsavelTipoLabel: Record<string, string> = {
    pessoal: 'Pessoal',
    empresa: 'Empresa',
}

const formatParcelas = (atual?: number, total?: number) => {
    if (!total || total <= 1) return '-'
    return `${atual ?? 1}/${total}`
}

const formatPeriodoFatura = (mes?: number, ano?: number) => {
    if (!mes || !ano) return '-'
    return `${String(mes).padStart(2, '0')}/${ano}`
}

export const TransacoesTable = ({
    data,
    getData,
    setPerPage,
    perPage,
    filters,
    categoriasLookup,
    responsaveisLookup,
    onRowsChange,
}: TransacoesTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const transacoesService = new TransacoesService()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [localRows, setLocalRows] = useState<TransacoesList[]>([])
    const { voltarParaRotaAnterior } = useNavegacao()

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    useEffect(() => {
        if (data?.data) {
            setLocalRows(data.data)
        }
    }, [data])

    const updateLocalRow = (id: number, patch: Partial<TransacoesList>) => {
        setLocalRows((prev) => {
            const updated = prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
            if (data && onRowsChange) {
                onRowsChange({ ...data, data: updated })
            }
            return updated
        })
    }

    const getResponsavelTipo = (responsavelId: number | null | undefined): string | undefined => {
        if (!responsavelId) return undefined
        return responsaveisLookup.find((r) => r.id === responsavelId)?.tipo
    }

    const handleInlineCategoriaChange = async (row: TransacoesList, value: string) => {
        if (!row.id) return
        const categoriaId = value ? Number(value) : null
        const categoria = categoriasLookup.find((c) => c.id === categoriaId)
        const previous = { categoria_id: row.categoria_id, categoria_nome: row.categoria_nome, categoria_cor: row.categoria_cor }

        updateLocalRow(row.id, {
            categoria_id: categoriaId,
            categoria_nome: categoria?.nome,
            categoria_cor: categoria?.cor,
        })

        try {
            await transacoesService.editTransacoes({
                id: row.id,
                categoria_id: categoriaId,
            } as Parameters<typeof transacoesService.editTransacoes>[0])
            toast.success('Atualizado')
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error)
            updateLocalRow(row.id, previous)
            toast.error('Erro ao atualizar categoria')
        }
    }

    const handleInlineResponsavelChange = async (row: TransacoesList, value: string) => {
        if (!row.id) return
        const responsavelId = value ? Number(value) : null
        const responsavel = responsaveisLookup.find((r) => r.id === responsavelId)
        const previous = {
            responsavel_id: row.responsavel_id,
            responsavel_nome: row.responsavel_nome,
            responsavel_tipo: row.responsavel_tipo,
        }

        updateLocalRow(row.id, {
            responsavel_id: responsavelId,
            responsavel_nome: responsavel?.nome,
            responsavel_tipo: responsavel?.tipo,
        })

        try {
            await transacoesService.editTransacoes({
                id: row.id,
                responsavel_id: responsavelId,
            } as Parameters<typeof transacoesService.editTransacoes>[0])
            toast.success('Atualizado')
        } catch (error) {
            console.error('Erro ao atualizar responsável:', error)
            updateLocalRow(row.id, previous)
            toast.error('Erro ao atualizar responsável')
        }
    }

    const handleRemoteDelete = async (id: number) => {
        try {
            await transacoesService.deleteTransacoes(id)
            toast.success('Transação excluída com sucesso')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            toast.error('Erro ao excluir transação')
        }
    }

    const handleThisRoute = async (url: string | null) => {
        if (!url) return
        try {
            const new_url = new URL(url)
            await getData({
                page: Number(new_url.searchParams.get('page')),
                palavra_chave: new_url.searchParams.get('palavra_chave') ?? filters.palavra_chave,
                data_inicio: new_url.searchParams.get('data_inicio') ?? filters.data_inicio,
                data_fim: new_url.searchParams.get('data_fim') ?? filters.data_fim,
                cartao_id: new_url.searchParams.get('cartao_id') ?? filters.cartao_id,
                categoria_id: new_url.searchParams.get('categoria_id') ?? filters.categoria_id,
                responsavel_id: new_url.searchParams.get('responsavel_id') ?? filters.responsavel_id,
                fatura_id: new_url.searchParams.get('fatura_id') ?? filters.fatura_id,
                tipo: new_url.searchParams.get('tipo') ?? filters.tipo,
                mes: new_url.searchParams.get('mes') ?? filters.mes,
                ano: new_url.searchParams.get('ano') ?? filters.ano,
            })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (data) handleThisRoute(data.first_page_url)
    }, [perPage])

    const rows = localRows.length ? localRows : (data?.data ?? [])

    return (
        <React.Fragment>
            <UiContent />
            <Row>
                <Col xl={12}>
                    <Card>
                        <CardBody>
                            <div className="live-preview mt-1">
                                {data && data.total === 0 ? (
                                    <div className="bg-primary text-white border-0 alert alert-primary fade show text-center">
                                        INFORME OS FILTROS DESEJADOS E CLIQUE EM BUSCAR!
                                    </div>
                                ) : !data ? (
                                    <div className="bg-danger text-white border-0 alert alert-danger fade show text-center">
                                        NENHUM RESULTADO ENCONTRADO!
                                    </div>
                                ) : (
                                    <>
                                        <Row className="d-flex align-items-center g-3 text-center text-sm-start">
                                            <Col lg={12}>
                                                <Col lg={2}>
                                                    <div className="d-flex flex-row align-items-center">
                                                        <Label className="form-label me-3">Mostrar</Label>
                                                        <select
                                                            className="form-select d-flex ps-3 mb-3"
                                                            style={{ width: "100px" }}
                                                            value={perPage}
                                                            onChange={(e) => setPerPage(Number(e.target.value))}
                                                        >
                                                            {optPerPage.map((item) => (
                                                                <option key={item.value} value={item.value}>{item.label}</option>
                                                            ))}
                                                        </select>
                                                        <Label className="form-label ms-3">resultados</Label>
                                                    </div>
                                                </Col>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col xl={12}>
                                                <div className="table-responsive">
                                                    <table className="table align-middle table-nowrap table-striped-columns mb-0 text-center">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th scope="col">Data</th>
                                                                <th scope="col" className="text-start">Estabelecimento</th>
                                                                <th scope="col">Valor</th>
                                                                <th scope="col">Tipo</th>
                                                                <th scope="col">Categoria</th>
                                                                <th scope="col">Responsável</th>
                                                                <th scope="col">Cartão</th>
                                                                <th scope="col">Fatura</th>
                                                                <th scope="col">Parcelas</th>
                                                                <th scope="col" style={{ width: "120px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rows.map((row, index) => {
                                                                const responsavelTipo = row.responsavel_tipo
                                                                    ?? getResponsavelTipo(row.responsavel_id)
                                                                return (
                                                                    <tr key={row.id ?? index}>
                                                                        <td>{formatDateBr(row.data)}</td>
                                                                        <td className="text-start">{row.estabelecimento ?? '-'}</td>
                                                                        <td>{formatCurrency(row.valor)}</td>
                                                                        <td>
                                                                            <span className={`badge bg-${tipoTransacaoColor[row.tipo ?? ''] ?? 'secondary'}`}>
                                                                                {tipoTransacaoLabel[row.tipo ?? ''] ?? row.tipo ?? '-'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <select
                                                                                className="form-select form-select-sm"
                                                                                value={row.categoria_id ?? ''}
                                                                                onChange={(e) => handleInlineCategoriaChange(row, e.target.value)}
                                                                            >
                                                                                <option value="">—</option>
                                                                                {categoriasLookup.map((c) => (
                                                                                    <option key={c.id} value={c.id}>
                                                                                        {c.nome}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </td>
                                                                        <td>
                                                                            <div className="d-flex align-items-center gap-1 justify-content-center">
                                                                                <select
                                                                                    className="form-select form-select-sm"
                                                                                    value={row.responsavel_id ?? ''}
                                                                                    onChange={(e) => handleInlineResponsavelChange(row, e.target.value)}
                                                                                >
                                                                                    <option value="">—</option>
                                                                                    {responsaveisLookup.map((r) => (
                                                                                        <option key={r.id} value={r.id}>
                                                                                            {r.nome}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                {responsavelTipo && (
                                                                                    <Badge
                                                                                        color={responsavelTipoColor[responsavelTipo] ?? 'secondary'}
                                                                                        className="text-nowrap"
                                                                                    >
                                                                                        {responsavelTipoLabel[responsavelTipo] ?? responsavelTipo}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td>{row.cartao_nome ?? '-'}</td>
                                                                        <td>
                                                                            {row.fatura_id ? (
                                                                                <Link to={`/faturas/view/${row.fatura_id}`}>
                                                                                    {formatPeriodoFatura(row.fatura_mes, row.fatura_ano)}
                                                                                </Link>
                                                                            ) : (
                                                                                formatPeriodoFatura(row.fatura_mes, row.fatura_ano)
                                                                            )}
                                                                        </td>
                                                                        <td>{formatParcelas(row.parcela_atual, row.parcelas_total)}</td>
                                                                        <td>
                                                                            <ButtonGroup>
                                                                                <UncontrolledDropdown direction="down">
                                                                                    <DropdownToggle tag="button" className="btn">
                                                                                        <i className="ri-more-2-fill"></i>
                                                                                    </DropdownToggle>
                                                                                    <DropdownMenu style={{ zIndex: '999' }}>
                                                                                        <Link to={`/transacoes/edit/${row.id}`} state={{ source: row }}>
                                                                                            <DropdownItem>Editar</DropdownItem>
                                                                                        </Link>
                                                                                        <DropdownItem
                                                                                            onClick={() => {
                                                                                                setSelectedId(row.id!)
                                                                                                toggleModal()
                                                                                            }}
                                                                                        >
                                                                                            Excluir
                                                                                        </DropdownItem>
                                                                                    </DropdownMenu>
                                                                                </UncontrolledDropdown>
                                                                            </ButtonGroup>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                            <Col sm="12">
                                                <div className="text-muted">
                                                    Exibindo <span className="fw-semibold ms-1">{data.per_page}</span> de
                                                    <span className="fw-semibold"> {data.total}</span> Resultados
                                                </div>
                                            </Col>
                                            <Col sm="12" className="d-none d-sm-flex justify-content-end gap-2 flex-wrap">
                                                <ul className="pagination pagination-md mb-0">
                                                    <li className={data.current_page === 1 ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[0].url)}>Anterior</Link>
                                                    </li>
                                                </ul>
                                                <ul className="pagination pagination-md mb-0 flex-wrap">
                                                    {data.links.map((item, key) => {
                                                        if (key === 0 || key === data.links.length - 1) return null
                                                        return (
                                                            <li key={item.label} className={`page-item ${item.active ? 'active' : ''}`}>
                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>{item.label}</Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <ul className="pagination pagination-md mb-0">
                                                    <li className={data.current_page === data.last_page ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[data.links.length - 1].url)}>Próximo</Link>
                                                    </li>
                                                </ul>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <CustomModal
                isOpen={modalIsOpen}
                toggle={toggleModal}
                title="Confirmação de Exclusão"
                delete={true}
                body="Deseja realmente excluir esta transação?"
                onConfirmDelete={() => selectedId && handleRemoteDelete(selectedId)}
            />
            <Row>
                <Col md={12}>
                    <div className="hstack gap-2 justify-content-end">
                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default TransacoesTable
