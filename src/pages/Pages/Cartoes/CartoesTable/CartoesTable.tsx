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
import { CartoesList, CartoesSearch } from "interfaces/Cartoes/CartoesInterface"
import { CartoesService } from "services/Cartoes/CartoesService"
import { CartaoChip, BandeiraChip, extractCartaoErrorMessage, resolveCartaoCores } from "helpers/cartao_helpers"
import { formatCurrency, VALOR_TEXT_CLASS } from "helpers/fatura_helpers"

export interface CartoesTableProps {
    data: PaginateInterface<CartoesList> | undefined
    getData: (data: PaginateSearch & CartoesSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: CartoesSearch
}

const formatLimitesResumo = (row: CartoesList) => {
    const bandeiras = [...(row.bandeiras ?? [])]
    if (bandeiras.length === 0) return null

    bandeiras.sort((a, b) => {
        const limiteA = a.limite_credito != null ? Number(a.limite_credito) : 0
        const limiteB = b.limite_credito != null ? Number(b.limite_credito) : 0
        return limiteB - limiteA
    })

    return (
        <div className="d-flex flex-column gap-1">
            {bandeiras.map((b) => {
                const key = b.id ?? b.bandeira
                const limite = b.limite_credito != null ? Number(b.limite_credito) : 0

                return (
                    <div key={key} className="d-flex justify-content-between gap-3">
                        <BandeiraChip
                            cor_principal={b.cor_principal}
                            cor_secundaria={b.cor_secundaria}
                            bandeira={b.bandeira}
                            label={b.bandeira}
                        />
                        <span className={VALOR_TEXT_CLASS}>{formatCurrency(limite)}</span>
                    </div>
                )
            })}
        </div>
    )
}

export const CartoesTable = ({ data, getData, setPerPage, perPage, filters }: CartoesTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const cartoesService = new CartoesService()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const handleRemoteDelete = async (id: number) => {
        try {
            await cartoesService.deleteCartoes(id)
            toast.success('Cartão excluído com sucesso!')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            const message = extractCartaoErrorMessage(error, 'Erro ao excluir cartão.')
            const orienteFaturas = /fatura/i.test(message)
            toast.error(
                orienteFaturas
                    ? `${message.replace(/\.*\s*$/, '')}. Exclua as faturas vinculadas antes de remover o cartão.`
                    : message
            )
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
                bandeira: new_url.searchParams.get('bandeira') ?? filters.bandeira,
                banco: new_url.searchParams.get('banco') ?? filters.banco,
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
                                                                <th scope="col">Banco</th>
                                                                <th scope="col">Resumo</th>
                                                                <th scope="col" className="text-start">Limites</th>
                                                                <th scope="col">Ciclo</th>
                                                                <th scope="col">Ativo</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.data.map((row, index) => {
                                                                const qtdBandeiras = row.qtd_bandeiras
                                                                    ?? row.bandeiras?.length
                                                                    ?? 0
                                                                const qtdNumeros = row.qtd_numeros
                                                                    ?? row.bandeiras?.reduce(
                                                                        (acc, b) => acc + (b.numeros?.length ?? 0),
                                                                        0
                                                                    )
                                                                    ?? 0
                                                                const limites = formatLimitesResumo(row)
                                                                const cores = resolveCartaoCores(row)

                                                                return (
                                                                    <tr key={row.id ?? index}>
                                                                        <td className="text-start">
                                                                            <CartaoChip
                                                                                cor_fundo={cores.cor_fundo}
                                                                                cor_texto={cores.cor_texto}
                                                                                label={row.nome || 'Cartão'}
                                                                            />
                                                                        </td>
                                                                        <td>{row.banco || '-'}</td>
                                                                        <td>
                                                                            <span className="text-muted small">
                                                                                {qtdBandeiras} bandeira{qtdBandeiras === 1 ? '' : 's'}
                                                                                {' · '}
                                                                                {qtdNumeros} {qtdNumeros === 1 ? 'cartão' : 'cartões'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-start small">
                                                                            {limites || <span className="text-muted">-</span>}
                                                                        </td>
                                                                        <td>
                                                                            <span className="text-muted small">
                                                                                Fecha dia {row.dia_limite_fatura ?? '-'}
                                                                                {' · '}
                                                                                Vence dia {row.dia_vencimento_fatura ?? '-'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge bg-${row.ativo ? 'success' : 'danger'}`}>
                                                                                {row.ativo ? 'Ativo' : 'Inativo'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <TableActionsDropdown>
                                                                                <Link to={`/cartoes/view/${row.id}`} state={{ source: row }}>
                                                                                    <DropdownItem>Visualizar</DropdownItem>
                                                                                </Link>
                                                                                <Link to={`/cartoes/edit/${row.id}`} state={{ source: row }}>
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
                                            <Col xs="12" className="d-block d-sm-none">
                                                <ul className="pagination pagination-md justify-content-center mb-2">
                                                    <li className={data.current_page === 1 ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[0].url)}>Anterior</Link>
                                                    </li>
                                                </ul>
                                                <ul className="pagination pagination-md justify-content-center mb-2 flex-wrap">
                                                    {data.links.map((item, key) => {
                                                        if (key === 0 || key === data.links.length - 1) return null
                                                        return (
                                                            <li key={item.label} className={`page-item ${item.active ? 'active' : ''}`}>
                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>{item.label}</Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <ul className="pagination pagination-md justify-content-center mb-0">
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
                body="Deseja realmente excluir este cartão? Cartões com fatura anexada vinculada não podem ser excluídos — remova as faturas antes."
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

export default CartoesTable
