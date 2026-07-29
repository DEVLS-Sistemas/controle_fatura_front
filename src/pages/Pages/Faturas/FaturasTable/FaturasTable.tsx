import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    ButtonGroup, Card, CardBody, Col, DropdownItem,
    DropdownMenu, DropdownToggle, Label, Row, UncontrolledDropdown
} from "reactstrap"
import { toast } from "react-toastify"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import { useNavegacao } from "helpers/functions_helpers"
import { formatCurrency, faturaStatusColor } from "helpers/fatura_helpers"
import { FaturasList, FaturasSearch } from "interfaces/Faturas/FaturasInterface"
import { FaturasService } from "services/Faturas/FaturasService"

export interface FaturasTableProps {
    data: PaginateInterface<FaturasList> | undefined
    getData: (data: PaginateSearch & FaturasSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: any
}

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    processada: 'Processada',
    erro: 'Erro',
}

const formatPeriodo = (mes?: number, ano?: number) => {
    if (!mes || !ano) return '-'
    return `${String(mes).padStart(2, '0')}/${ano}`
}

export const FaturasTable = ({ data, getData, setPerPage, perPage, filters }: FaturasTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const faturasService = new FaturasService()
    const navigate = useNavigate()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const { voltarParaRotaAnterior } = useNavegacao()

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const rowId = (row: FaturasList) => row.id

    const handleRemoteDelete = async (id: number) => {
        try {
            await faturasService.deleteFaturas(id)
            toast.success('Fatura excluída com sucesso')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            toast.error('Erro ao excluir fatura')
        }
    }

    const handleReprocessar = async (id: number) => {
        try {
            await faturasService.processarPdf(id)
            toast.success('Reprocessamento iniciado')
            if (data) await handleThisRoute(data.first_page_url)
        } catch (error) {
            console.error('Erro ao reprocessar:', error)
            toast.error('Erro ao reprocessar fatura')
        }
    }

    const handleThisRoute = async (url: string) => {
        try {
            const new_url = new URL(url)
            await getData({
                page: Number(new_url.searchParams.get('page')),
                palavra_chave: new_url.searchParams.get('palavra_chave'),
                cartao_id: new_url.searchParams.get('cartao_id'),
                mes: new_url.searchParams.get('mes'),
                ano: new_url.searchParams.get('ano'),
                status: new_url.searchParams.get('status'),
                ...filters,
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
                                                                <th scope="col" className="text-start">Cartão</th>
                                                                <th scope="col">Período</th>
                                                                <th scope="col">Valor Total</th>
                                                                <th scope="col">Status</th>
                                                                <th scope="col">Transações</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.data.map((row, index) => (
                                                                <tr key={rowId(row) ?? index}>
                                                                    <td className="text-start">{row.cartao_nome ?? '-'}</td>
                                                                    <td>{formatPeriodo(row.mes, row.ano)}</td>
                                                                    <td>{formatCurrency(row.valor_total)}</td>
                                                                    <td>
                                                                        <span className={`badge bg-${faturaStatusColor[row.status ?? ''] ?? 'secondary'}`}>
                                                                            {statusLabel[row.status ?? ''] ?? row.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>{row.total_transacoes ?? '-'}</td>
                                                                    <td>
                                                                        <ButtonGroup>
                                                                            <UncontrolledDropdown direction="down">
                                                                                <DropdownToggle tag="button" className="btn">
                                                                                    <i className="ri-more-2-fill"></i>
                                                                                </DropdownToggle>
                                                                                <DropdownMenu style={{ zIndex: '999' }}>
                                                                                    <Link to={`/faturas/view/${rowId(row)}`} state={{ source: row }}>
                                                                                        <DropdownItem>Visualizar</DropdownItem>
                                                                                    </Link>
                                                                                    <Link to={`/faturas/edit/${rowId(row)}`} state={{ source: row }}>
                                                                                        <DropdownItem>Editar</DropdownItem>
                                                                                    </Link>
                                                                                    <DropdownItem onClick={() => navigate(`/faturas/view/${rowId(row)}`)}>
                                                                                        Upload PDF
                                                                                    </DropdownItem>
                                                                                    <DropdownItem onClick={() => rowId(row) && handleReprocessar(rowId(row)!)}>
                                                                                        Reprocessar
                                                                                    </DropdownItem>
                                                                                    <DropdownItem
                                                                                        onClick={() => {
                                                                                            setSelectedId(rowId(row)!)
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
                                                            ))}
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
                body=""
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

export default FaturasTable
