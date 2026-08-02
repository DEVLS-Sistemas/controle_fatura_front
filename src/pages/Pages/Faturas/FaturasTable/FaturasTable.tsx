import UiContent from "Components/Common/UiContent"
import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    ButtonGroup, Card, CardBody, Col, DropdownItem,
    DropdownMenu, DropdownToggle, Label, Row, UncontrolledDropdown
} from "reactstrap"
import { toast } from "react-toastify"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import { useNavegacao } from "helpers/functions_helpers"
import { formatCurrency, formatDateBr, faturaStatusColor, VALOR_TEXT_CLASS } from "helpers/fatura_helpers"
import { CartaoChip } from "helpers/cartao_helpers"
import { FaturaResumo, FaturasCartaoGroup, FaturasSearch } from "interfaces/Faturas/FaturasInterface"
import { FaturasService } from "services/Faturas/FaturasService"
import { getApiBaseUrl } from "libs/api/ApiConfig"

export interface FaturasTableProps {
    data: PaginateInterface<FaturasCartaoGroup> | undefined
    getData: (data: PaginateSearch & FaturasSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: any
}

type FaturaRow = FaturaResumo & {
    cartao_id?: number
    cartao_nome?: string
    cartao_cor_fundo?: string | null
    cartao_cor_texto?: string | null
}

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    processada: 'Processada',
    erro: 'Erro',
}

const formatCompetencia = (fatura: FaturaResumo) => {
    if (fatura.competencia) return fatura.competencia
    if (!fatura.mes || !fatura.ano) return '-'
    return `${String(fatura.mes).padStart(2, '0')}/${fatura.ano}`
}

const formatPeriodoCiclo = (fatura: FaturaResumo) => {
    if (!fatura.periodo_inicio && !fatura.periodo_fim) return '-'
    return `${formatDateBr(fatura.periodo_inicio)} – ${formatDateBr(fatura.periodo_fim)}`
}

const flattenFaturas = (grupos: FaturasCartaoGroup[]): FaturaRow[] => {
    return grupos.flatMap((grupo) =>
        (grupo.faturas ?? []).map((fatura) => ({
            ...fatura,
            cartao_id: grupo.cartao_id,
            cartao_nome: grupo.nome,
            cartao_cor_fundo: grupo.cor_fundo,
            cartao_cor_texto: grupo.cor_texto,
        }))
    )
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

    const rows = useMemo(() => flattenFaturas(data?.data ?? []), [data?.data])
    const temFiltroPeriodo = Boolean(filters?.mes || filters?.ano)

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

    const handleVerPdf = async (id: number) => {
        try {
            const raw = sessionStorage.getItem('authUser')
            const token = raw ? JSON.parse(raw).token : null
            const base = getApiBaseUrl()
            const res = await fetch(`${base}faturas/pdf/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) {
                toast.error('PDF não disponível')
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
        } catch (error) {
            console.error('Erro ao abrir PDF:', error)
            toast.error('Erro ao abrir PDF')
        }
    }

    const handleThisRoute = async (url: string | null) => {
        if (!url) return
        try {
            const new_url = new URL(url)
            await getData({
                page: Number(new_url.searchParams.get('page')),
                palavra_chave: new_url.searchParams.get('palavra_chave') ?? filters.palavra_chave,
                cartao_id: new_url.searchParams.get('cartao_id') ?? filters.cartao_id,
                mes: new_url.searchParams.get('mes') ?? filters.mes,
                ano: new_url.searchParams.get('ano') ?? filters.ano,
                status: new_url.searchParams.get('status') ?? filters.status,
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
                                        {temFiltroPeriodo
                                            ? 'Nenhuma fatura neste período para os filtros informados.'
                                            : 'Nenhuma fatura encontrada. Cadastre uma compra ou importe um PDF.'}
                                    </div>
                                ) : !data ? (
                                    <div className="bg-danger text-white border-0 alert alert-danger fade show text-center">
                                        NENHUM RESULTADO ENCONTRADO!
                                    </div>
                                ) : (
                                    <>
                                        <Row className="d-flex align-items-center g-3 text-center text-sm-start">
                                            <Col lg={12}>
                                                <Col lg={3}>
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
                                                        <Label className="form-label ms-3">cartões</Label>
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
                                                                <th scope="col">Bandeira</th>
                                                                <th scope="col">Competência</th>
                                                                <th scope="col">Período</th>
                                                                <th scope="col">Vencimento</th>
                                                                <th scope="col" className={VALOR_TEXT_CLASS}>Valor</th>
                                                                <th scope="col">Status</th>
                                                                <th scope="col">Lançamentos</th>
                                                                <th scope="col" style={{ width: "220px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rows.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={9} className="text-muted py-4">
                                                                        Nenhuma fatura neste período
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                rows.map((row, index) => (
                                                                    <tr key={row.id ?? index}>
                                                                        <td className="text-start">
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                {row.cartao_cor_fundo && (
                                                                                    <CartaoChip
                                                                                        cor_fundo={row.cartao_cor_fundo}
                                                                                        cor_texto={row.cartao_cor_texto}
                                                                                        label={row.cartao_nome
                                                                                            ? String(row.cartao_nome).slice(0, 1)
                                                                                            : '•'}
                                                                                    />
                                                                                )}
                                                                                <span>{row.cartao_nome ?? '-'}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            {row.bandeira ? (
                                                                                <span className="badge bg-light text-dark">
                                                                                    {row.bandeira}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <Link
                                                                                to={`/faturas/view/${row.id}`}
                                                                                className="fw-medium"
                                                                            >
                                                                                {formatCompetencia(row)}
                                                                            </Link>
                                                                        </td>
                                                                        <td className="text-muted small">
                                                                            {formatPeriodoCiclo(row)}
                                                                        </td>
                                                                        <td>{formatDateBr(row.data_vencimento)}</td>
                                                                        <td className={VALOR_TEXT_CLASS}>
                                                                            {formatCurrency(row.valor_total)}
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge bg-${faturaStatusColor[row.status ?? ''] ?? 'secondary'}`}>
                                                                                {statusLabel[row.status ?? ''] ?? row.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="text-muted">
                                                                                {row.total_transacoes ?? 0}
                                                                            </span>
                                                                            {row.tem_pdf && (
                                                                                <i
                                                                                    className="ri-file-pdf-2-line text-danger ms-2"
                                                                                    title="Possui arquivo"
                                                                                />
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <div className="d-flex justify-content-center align-items-center gap-1">
                                                                                <Link
                                                                                    to={`/faturas/view/${row.id}`}
                                                                                    className="btn btn-sm btn-soft-primary"
                                                                                    title="Ver detalhe"
                                                                                >
                                                                                    <i className="ri-eye-line me-1"></i>
                                                                                    Detalhe
                                                                                </Link>
                                                                                <ButtonGroup>
                                                                                    <UncontrolledDropdown direction="down">
                                                                                        <DropdownToggle tag="button" className="btn btn-sm">
                                                                                            <i className="ri-more-2-fill"></i>
                                                                                        </DropdownToggle>
                                                                                        <DropdownMenu style={{ zIndex: '999' }}>
                                                                                            <Link to={`/faturas/view/${row.id}`}>
                                                                                                <DropdownItem>Ver detalhe</DropdownItem>
                                                                                            </Link>
                                                                                            <Link
                                                                                                to={`/faturas/edit/${row.id}`}
                                                                                                state={{
                                                                                                    source: {
                                                                                                        ...row,
                                                                                                        fatura_id: row.id,
                                                                                                        cartao_id: row.cartao_id,
                                                                                                        cartao_bandeira_id: row.cartao_bandeira_id,
                                                                                                    },
                                                                                                }}
                                                                                            >
                                                                                                <DropdownItem>Editar</DropdownItem>
                                                                                            </Link>
                                                                                            <DropdownItem onClick={() => navigate(`/faturas/view/${row.id}`)}>
                                                                                                Upload PDF
                                                                                            </DropdownItem>
                                                                                            {row.tem_pdf && row.id && (
                                                                                                <DropdownItem onClick={() => handleVerPdf(row.id!)}>
                                                                                                    Ver PDF
                                                                                                </DropdownItem>
                                                                                            )}
                                                                                            <DropdownItem onClick={() => row.id && handleReprocessar(row.id)}>
                                                                                                Reprocessar
                                                                                            </DropdownItem>
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
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                            <Col sm="12">
                                                <div className="text-muted">
                                                    Exibindo <span className="fw-semibold ms-1">{data.per_page}</span> de
                                                    <span className="fw-semibold"> {data.total}</span> cartões
                                                    {rows.length > 0 && (
                                                        <> · <span className="fw-semibold">{rows.length}</span> fatura(s) nesta página</>
                                                    )}
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
