import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    Card, CardBody, Col, DropdownItem, Label, Row
} from "reactstrap"
import { toast } from "react-toastify"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import TableActionsDropdown from "Components/Common/TableActionsDropdown"
import TablePagination from "Components/Common/TablePagination"
import { formatCpfCnpj, useNavegacao } from "helpers/functions_helpers"
import {
    pessoaIdOf,
    pessoaNomeCompleto,
    PessoasList,
    PessoasSearch,
} from "interfaces/Pessoas/PessoasInterface"
import { PessoasService } from "services/Pessoas/PessoasService"

export interface PessoasTableProps {
    data: PaginateInterface<PessoasList> | undefined
    getData: (data: PaginateSearch & PessoasSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: any
}

export const PessoasTable = ({ data, getData, setPerPage, perPage, filters }: PessoasTableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const pessoasService = new PessoasService()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [selectedPrincipal, setSelectedPrincipal] = useState(false)
    const { voltarParaRotaAnterior } = useNavegacao()

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const handleRemoteDelete = async (id: number) => {
        try {
            await pessoasService.deletePessoas(id)
            toast.success('Pessoa excluída com sucesso')
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error: any) {
            console.error('Erro ao excluir:', error)
            toast.error(error?.message || 'Não foi possível excluir esta pessoa')
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
                                                                <th scope="col">CPF/CNPJ</th>
                                                                <th scope="col">Titular</th>
                                                                <th scope="col">Ativo</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.data.map((row, index) => {
                                                                const id = pessoaIdOf(row)
                                                                return (
                                                                <tr key={id ?? index}>
                                                                    <td className="text-start">{pessoaNomeCompleto(row) || row.nome}</td>
                                                                    <td>{row.cpf_cnpj ? formatCpfCnpj(row.cpf_cnpj) : '-'}</td>
                                                                    <td>
                                                                        {row.eh_principal ? (
                                                                            <span className="badge bg-info">Principal</span>
                                                                        ) : (
                                                                            <span className="badge bg-secondary">Adicional</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge bg-${row.ativo ? 'success' : 'danger'}`}>
                                                                            {row.ativo ? 'Sim' : 'Não'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <TableActionsDropdown>
                                                                            <Link to={`/pessoas/view/${id}`} state={{ source: row }}>
                                                                                <DropdownItem>Visualizar</DropdownItem>
                                                                            </Link>
                                                                            <Link to={`/pessoas/edit/${id}`} state={{ source: row }}>
                                                                                <DropdownItem>Editar</DropdownItem>
                                                                            </Link>
                                                                            <DropdownItem
                                                                                disabled={Boolean(row.eh_principal)}
                                                                                title={row.eh_principal ? 'A pessoa principal não pode ser excluída' : undefined}
                                                                                onClick={() => {
                                                                                    if (row.eh_principal) return
                                                                                    setSelectedId(id)
                                                                                    setSelectedPrincipal(Boolean(row.eh_principal))
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
                body={selectedPrincipal
                    ? "A pessoa principal da conta não pode ser excluída."
                    : "Só é possível excluir se não houver cartão ou fatura vinculada."}
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

export default PessoasTable
