import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from 'react-toastify'
import {
    Card, CardBody, Col, DropdownItem, Label, Row
} from "reactstrap"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import TableActionsDropdown from "Components/Common/TableActionsDropdown"
import TablePagination from "Components/Common/TablePagination"
import { formatCurrency, VALOR_TEXT_CLASS } from "helpers/fatura_helpers"
import { frequenciaLabel } from "helpers/estatisticas_helpers"
import { pickEstatisticas, pickPeriodoFiltro } from "interfaces/Estatisticas/EstatisticasCompraInterface"
import { LojasList, LojasSearch } from "interfaces/Lojas/LojasInterface"
import { LojasService } from "services/Lojas/LojasService"

export interface LojasTableProps {
    data: PaginateInterface<LojasList> | undefined
    getData: (data: PaginateSearch & LojasSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: LojasSearch
}

export const LojasTable = ({ data, getData, setPerPage, perPage, filters }: LojasTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const lojasService = new LojasService()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const handleRemoteDelete = async (id: number) => {
        try {
            await lojasService.deleteLojas(id)
            toast.success('Loja excluída com sucesso!')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            toast.error('Erro ao excluir loja.')
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
                                                                <th scope="col">Estabelecimentos</th>
                                                                <th scope="col">Compras</th>
                                                                <th scope="col">Gasto</th>
                                                                <th scope="col" className="text-start">Frequência</th>
                                                                <th scope="col">Ativo</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.data.map((row, index) => {
                                                                const stats = pickEstatisticas(row)
                                                                const periodo = pickPeriodoFiltro(filters)
                                                                return (
                                                                <tr key={row.id ?? index}>
                                                                    <td className="text-start">{row.nome}</td>
                                                                    <td>{row.estabelecimentos_count ?? 0}</td>
                                                                    <td>{stats.compras ?? 0}</td>
                                                                    <td className={VALOR_TEXT_CLASS}>{formatCurrency(stats.valor_total)}</td>
                                                                    <td className="text-start fw-medium">{frequenciaLabel(stats)}</td>
                                                                    <td>
                                                                        <span className={`badge bg-${row.ativo ? 'success' : 'danger'}`}>
                                                                            {row.ativo ? 'Ativo' : 'Inativo'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <TableActionsDropdown>
                                                                            <Link
                                                                                to={`/lojas/view/${row.id}`}
                                                                                state={{ source: row, periodo }}
                                                                            >
                                                                                <DropdownItem>Visualizar</DropdownItem>
                                                                            </Link>
                                                                            <Link to={`/lojas/edit/${row.id}`} state={{ source: row }}>
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

                                        <TablePagination
                                            currentPage={data.current_page}
                                            lastPage={data.last_page}
                                            links={data.links}
                                            onNavigate={handleThisRoute}
                                            summary={
                                                <>
                                                    Exibindo <span className="fw-semibold ms-1">{data.per_page}</span> de
                                                    <span className="fw-semibold"> {data.total}</span> Resultados
                                                </>
                                            }
                                        />
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
                body="Deseja realmente excluir esta loja? Os estabelecimentos vinculados serão desvinculados."
                onConfirmDelete={() => selectedId && handleRemoteDelete(selectedId)}
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

export default LojasTable
