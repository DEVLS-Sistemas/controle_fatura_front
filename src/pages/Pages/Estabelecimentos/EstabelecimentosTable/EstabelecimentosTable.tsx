import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from 'react-toastify'
import {
    Button, Card, CardBody, Col, DropdownItem, Label, Row
} from "reactstrap"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import TableActionsDropdown from "Components/Common/TableActionsDropdown"
import { formatCurrency, VALOR_TEXT_CLASS } from "helpers/fatura_helpers"
import { corCategoria, corSubcategoria } from "helpers/cores_tema_helpers"
import { extraEstatisticasLinha, frequenciaLabel } from "helpers/estatisticas_helpers"
import { pickEstatisticas, pickPeriodoFiltro } from "interfaces/Estatisticas/EstatisticasCompraInterface"
import { EstabelecimentosList, EstabelecimentosSearch } from "interfaces/Estabelecimentos/EstabelecimentosInterface"
import { EstabelecimentosService } from "services/Estabelecimentos/EstabelecimentosService"
import LojaModal, { LojaModalResult } from "../LojaModal/LojaModal"

export interface EstabelecimentosTableProps {
    data: PaginateInterface<EstabelecimentosList> | undefined
    getData: (data: PaginateSearch & EstabelecimentosSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: EstabelecimentosSearch
}

export const EstabelecimentosTable = ({ data, getData, setPerPage, perPage, filters }: EstabelecimentosTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const estabelecimentosService = new EstabelecimentosService()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [lojaModalOpen, setLojaModalOpen] = useState(false)
    const [lojaTarget, setLojaTarget] = useState<EstabelecimentosList | null>(null)
    const [rows, setRows] = useState<EstabelecimentosList[]>(data?.data ?? [])

    useEffect(() => {
        setRows(data?.data ?? [])
    }, [data])

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const openLojaModal = (row: EstabelecimentosList) => {
        setLojaTarget(row)
        setLojaModalOpen(true)
    }

    const handleLojaConfirm = async (loja: LojaModalResult) => {
        if (!lojaTarget?.id) return
        const updated = { ...lojaTarget, loja_id: loja.id, loja_nome: loja.nome }
        setLojaTarget(updated)
        setRows((prev) =>
            prev.map((row) => (row.id === lojaTarget.id ? updated : row))
        )
    }

    const handleRemoteDelete = async (id: number) => {
        try {
            await estabelecimentosService.deleteEstabelecimentos(id)
            toast.success('Estabelecimento excluído com sucesso!')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            toast.error('Erro ao excluir estabelecimento.')
        }
    }

    const handleThisRoute = async (url: string | null) => {
        if (!url) return
        try {
            const new_url = new URL(url)
            await getData({
                page: Number(new_url.searchParams.get('page')),
                palavra_chave: new_url.searchParams.get('palavra_chave') ?? filters.palavra_chave,
                nome: new_url.searchParams.get('nome') ?? filters.nome,
                ativo: new_url.searchParams.get('ativo') ?? filters.ativo,
                ...pickPeriodoFiltro(filters),
            })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (data) handleThisRoute(data.first_page_url)
    }, [perPage])

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
                                                                <th scope="col" className="text-start">Nome</th>
                                                                <th scope="col" className="text-start">Loja</th>
                                                                <th scope="col">Compras</th>
                                                                <th scope="col">Gasto</th>
                                                                <th scope="col" className="text-start">Frequência</th>
                                                                <th scope="col">Categoria padrão</th>
                                                                <th scope="col">Subcategoria padrão</th>
                                                                <th scope="col">Ativo</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rows.map((row, index) => {
                                                                const stats = pickEstatisticas(row)
                                                                const extra = extraEstatisticasLinha(row)
                                                                const periodo = pickPeriodoFiltro(filters)
                                                                return (
                                                                <tr key={row.id ?? index}>
                                                                    <td className="text-start">
                                                                        <div>{row.nome}</div>
                                                                    </td>
                                                                    <td className="text-start">
                                                                        <Button
                                                                            type="button"
                                                                            color="light"
                                                                            size="sm"
                                                                            className="border"
                                                                            title={row.loja_nome ? `Loja: ${row.loja_nome}` : 'Definir loja'}
                                                                            onClick={() => openLojaModal(row)}
                                                                        >
                                                                            <i className="ri-store-2-line me-1"></i>
                                                                            {row.loja_nome ? (
                                                                                <span className="small">{row.loja_nome}</span>
                                                                            ) : (
                                                                                <span className="small text-muted">Definir loja</span>
                                                                            )}
                                                                        </Button>
                                                                    </td>
                                                                    <td title={extra || undefined}>
                                                                        <div>{stats.compras ?? 0}</div>
                                                                        {extra && <div className="text-muted small">{extra}</div>}
                                                                    </td>
                                                                    <td className={VALOR_TEXT_CLASS}>{formatCurrency(stats.valor_total)}</td>
                                                                    <td className="text-start fw-medium">{frequenciaLabel(stats)}</td>
                                                                    <td>
                                                                        {row.categoria_padrao_nome ? (
                                                                            <span className="d-inline-flex align-items-center gap-1">
                                                                                <span
                                                                                    className="d-inline-block rounded-circle"
                                                                                    title={corCategoria({
                                                                                        cor: row.categoria_padrao_cor,
                                                                                        categoria_id: row.categoria_padrao_id,
                                                                                    })}
                                                                                    style={{
                                                                                        width: 10,
                                                                                        height: 10,
                                                                                        backgroundColor: corCategoria({
                                                                                            cor: row.categoria_padrao_cor,
                                                                                            categoria_id: row.categoria_padrao_id,
                                                                                        }),
                                                                                    }}
                                                                                />
                                                                                {row.categoria_padrao_nome}
                                                                            </span>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td>
                                                                        {row.subcategoria_padrao_nome ? (
                                                                            <span className="d-inline-flex align-items-center gap-1">
                                                                                <span
                                                                                    className="d-inline-block rounded-circle"
                                                                                    title={corSubcategoria({
                                                                                        cor: row.subcategoria_padrao_cor,
                                                                                        categoria_cor: row.categoria_padrao_cor,
                                                                                    })}
                                                                                    style={{
                                                                                        width: 10,
                                                                                        height: 10,
                                                                                        backgroundColor: corSubcategoria({
                                                                                            cor: row.subcategoria_padrao_cor,
                                                                                            categoria_cor: row.categoria_padrao_cor,
                                                                                        }),
                                                                                    }}
                                                                                />
                                                                                {row.subcategoria_padrao_nome}
                                                                            </span>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge bg-${row.ativo ? 'success' : 'danger'}`}>
                                                                            {row.ativo ? 'Ativo' : 'Inativo'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <TableActionsDropdown>
                                                                            <Link
                                                                                to={`/estabelecimentos/view/${row.id}`}
                                                                                state={{ source: row, periodo }}
                                                                            >
                                                                                <DropdownItem>Visualizar</DropdownItem>
                                                                            </Link>
                                                                            <Link to={`/estabelecimentos/edit/${row.id}`} state={{ source: row }}>
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
                                                                        </TableActionsDropdown>
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
                body="Deseja realmente excluir este estabelecimento?"
                onConfirmDelete={() => selectedId && handleRemoteDelete(selectedId)}
            />
            <LojaModal
                isOpen={lojaModalOpen}
                toggle={() => setLojaModalOpen(false)}
                estabelecimentoId={lojaTarget?.id}
                currentLojaId={lojaTarget?.loja_id}
                currentLojaNome={lojaTarget?.loja_nome}
                onConfirm={handleLojaConfirm}
            />
            <Row>
                <Col md={12}>
                    <div className="hstack gap-2 justify-content-end">
                        <Link to="/dashboard" className="btn btn-soft-success">Voltar</Link>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default EstabelecimentosTable
