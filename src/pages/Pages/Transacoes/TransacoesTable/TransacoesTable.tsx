import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    Badge, Button, Card, CardBody, Col, DropdownItem,
    Label, Modal, ModalBody, ModalHeader,
    Row, UncontrolledTooltip,
} from "reactstrap"
import { toast } from "react-toastify"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import TableActionsDropdown from "Components/Common/TableActionsDropdown"
import { useNavegacao } from "helpers/functions_helpers"
import {
    formatCurrency,
    formatDateBr,
    origemCompraColor,
    resolveOrigemCompraLabel,
    VALOR_TEXT_CLASS,
    isMeuResponsavelDisplay,
} from "helpers/fatura_helpers"
import { CartaoChip } from "helpers/cartao_helpers"
import { SelectOptions } from "interfaces/SystemInterfaces/SelectInterface"
import {
    ResponsavelLookup,
    TransacoesList,
    TransacoesSearch,
} from "interfaces/Transacoes/TransacoesInterface"
import { TransacoesService } from "services/Transacoes/TransacoesService"
import ResponsavelModal from "../ResponsavelModal/ResponsavelModal"

export interface TransacoesTableProps {
    data: PaginateInterface<TransacoesList> | undefined
    getData: (data: PaginateSearch & TransacoesSearch) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: TransacoesSearch
    responsaveisLookup: ResponsavelLookup[]
    defaultResponsavelId?: number | null
    onResponsaveisChange?: (list: ResponsavelLookup[]) => void
    onRowsChange?: (data: PaginateInterface<TransacoesList>) => void
    origensCompraOptions?: SelectOptions[]
}

const formatParcelas = (atual?: number, total?: number) => {
    if (!total || total <= 1) return '-'
    return `${atual ?? 1}/${total}`
}

const formatPeriodoFatura = (mes?: number, ano?: number) => {
    if (!mes || !ano) return '-'
    return `${String(mes).padStart(2, '0')}/${ano}`
}

const formatFinalCartao = (row: TransacoesList): string => {
    const digitos = String(row.ultimos_digitos ?? row.cartao_numero?.ultimos_digitos ?? '')
        .replace(/\D/g, '')
        .slice(-4)
    if (!digitos) return '-'
    const nomeNoCartao = row.cartao_numero_nome_no_cartao
        ?? row.cartao_numero?.nome_no_cartao
        ?? null
    if (nomeNoCartao?.trim()) return `•••• ${digitos} · ${nomeNoCartao.trim()}`
    const apelido = row.cartao_numero_apelido ?? row.cartao_numero?.apelido
    return apelido ? `•••• ${digitos} · ${apelido}` : `•••• ${digitos}`
}

const truncate = (text?: string, max = 40) => {
    if (!text) return '-'
    if (text.length <= max) return text
    return `${text.slice(0, max)}…`
}

export const TransacoesTable = ({
    data,
    getData,
    setPerPage,
    perPage,
    filters,
    responsaveisLookup,
    defaultResponsavelId = null,
    onResponsaveisChange,
    onRowsChange,
    origensCompraOptions = [],
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
    const [rowForDelete, setRowForDelete] = useState<TransacoesList | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [localRows, setLocalRows] = useState<TransacoesList[]>([])
    const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
    const [rowForResponsavel, setRowForResponsavel] = useState<TransacoesList | null>(null)
    const { voltarParaRotaAnterior } = useNavegacao()

    const toggleModal = () => {
        setModalIsOpen((open) => {
            if (open) setRowForDelete(null)
            return !open
        })
    }

    const openDeleteModal = (row: TransacoesList) => {
        setRowForDelete(row)
        setModalIsOpen(true)
    }

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

    const openResponsavelModal = (row: TransacoesList) => {
        setRowForResponsavel(row)
        setResponsavelModalOpen(true)
    }

    const handleConfirmResponsavel = async (responsavel: ResponsavelLookup) => {
        if (!rowForResponsavel?.id) return
        const previous = {
            responsavel_id: rowForResponsavel.responsavel_id,
            responsavel_nome: rowForResponsavel.responsavel_nome,
            responsavel_tipo: rowForResponsavel.responsavel_tipo,
        }

        updateLocalRow(rowForResponsavel.id, {
            responsavel_id: responsavel.id ?? null,
            responsavel_nome: responsavel.nome,
            responsavel_tipo: responsavel.tipo,
        })

        try {
            await transacoesService.editTransacoes({
                id: rowForResponsavel.id,
                responsavel_id: responsavel.id,
            } as Parameters<typeof transacoesService.editTransacoes>[0])
            toast.success('Responsável atualizado')
        } catch (error) {
            console.error('Erro ao atualizar responsável:', error)
            updateLocalRow(rowForResponsavel.id, previous)
            throw error
        }
    }

    const handleRemoteDelete = async (excluirGrupo = false) => {
        if (!rowForDelete?.id || deleting) return
        setDeleting(true)
        try {
            await transacoesService.deleteTransacoes(rowForDelete.id, { excluir_grupo: excluirGrupo })
            toast.success(
                excluirGrupo
                    ? 'Todas as parcelas da compra foram excluídas'
                    : 'Transação excluída com sucesso'
            )
            if (data) await handleThisRoute(data.first_page_url)
            setModalIsOpen(false)
            setRowForDelete(null)
        } catch (error) {
            console.error('Erro ao excluir:', error)
            toast.error('Erro ao excluir transação')
        } finally {
            setDeleting(false)
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
                subcategoria_id: new_url.searchParams.get('subcategoria_id') ?? filters.subcategoria_id,
                estabelecimento_id: new_url.searchParams.get('estabelecimento_id') ?? filters.estabelecimento_id,
                responsavel_id: new_url.searchParams.get('responsavel_id') ?? filters.responsavel_id,
                fatura_id: new_url.searchParams.get('fatura_id') ?? filters.fatura_id,
                tipo: new_url.searchParams.get('tipo') ?? filters.tipo,
                origem_compra: new_url.searchParams.get('origem_compra') ?? filters.origem_compra,
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

    const isMeuResponsavel = (responsavelId?: number | null, responsavelNome?: string | null) =>
        isMeuResponsavelDisplay({
            responsavelId,
            responsavelNome: (responsavelNome
                ?? responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))?.nome
                ?? '').trim(),
            defaultResponsavelId,
        })

    const origemLabel = (value?: string | null, apiLabel?: string | null) => {
        const fromLookup = origensCompraOptions.find((o) => o.value && o.value === value)?.label
        return resolveOrigemCompraLabel(value, apiLabel ?? fromLookup)
    }

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
                                                                <th scope="col" className={VALOR_TEXT_CLASS}>Valor</th>
                                                                <th scope="col">Origem</th>
                                                                <th scope="col">Categoria</th>
                                                                <th scope="col">Subcategoria</th>
                                                                <th scope="col" className="text-start">Observação</th>
                                                                <th scope="col" style={{ width: "100px" }} title="Responsável">Resp.</th>
                                                                <th scope="col">Fatura / Cartão</th>
                                                                <th scope="col">Final</th>
                                                                <th scope="col">Parcelas</th>
                                                                <th scope="col" style={{ width: "120px" }}>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rows.map((row, index) => {
                                                                const observacaoId = `obs-${row.id ?? index}`
                                                                const estabelecimentoNome =
                                                                    row.estabelecimento_nome ?? row.estabelecimento ?? '-'
                                                                const showResponsavelNome = !isMeuResponsavel(
                                                                    row.responsavel_id,
                                                                    row.responsavel_nome
                                                                )
                                                                return (
                                                                    <tr key={row.id ?? index}>
                                                                        <td>{formatDateBr(row.data)}</td>
                                                                        <td className="text-start">
                                                                            <div>{estabelecimentoNome}</div>
                                                                            {row.loja_nome && (
                                                                                <div className="small text-muted">{row.loja_nome}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className={VALOR_TEXT_CLASS}>{formatCurrency(row.valor)}</td>
                                                                        <td>
                                                                            {row.origem_compra ? (
                                                                                <Badge
                                                                                    color={origemCompraColor[row.origem_compra] ?? 'secondary'}
                                                                                    className="fw-normal"
                                                                                >
                                                                                    {origemLabel(row.origem_compra, row.origem_compra_label)}
                                                                                </Badge>
                                                                            ) : '-'}
                                                                        </td>
                                                                        <td>
                                                                            {row.categoria_nome ? (
                                                                                <span className="d-inline-flex align-items-center gap-1">
                                                                                    {row.categoria_cor && (
                                                                                        <span
                                                                                            className="d-inline-block rounded-circle"
                                                                                            style={{
                                                                                                width: 10,
                                                                                                height: 10,
                                                                                                backgroundColor: row.categoria_cor,
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                    {row.categoria_nome}
                                                                                </span>
                                                                            ) : '-'}
                                                                        </td>
                                                                        <td>{row.subcategoria_nome ?? '-'}</td>
                                                                        <td className="text-start">
                                                                            {row.observacoes ? (
                                                                                <>
                                                                                    <span id={observacaoId}>{truncate(row.observacoes)}</span>
                                                                                    {row.observacoes.length > 40 && (
                                                                                        <UncontrolledTooltip placement="top" target={observacaoId}>
                                                                                            {row.observacoes}
                                                                                        </UncontrolledTooltip>
                                                                                    )}
                                                                                </>
                                                                            ) : '-'}
                                                                        </td>
                                                                        <td>
                                                                            <Button
                                                                                type="button"
                                                                                color="light"
                                                                                size="sm"
                                                                                className="border"
                                                                                title={showResponsavelNome ? `Responsável: ${row.responsavel_nome}` : 'Definir responsável'}
                                                                                onClick={() => openResponsavelModal(row)}
                                                                            >
                                                                                <i className="ri-user-line me-1"></i>
                                                                                {showResponsavelNome ? (
                                                                                    <span className="small">{row.responsavel_nome}</span>
                                                                                ) : (
                                                                                    <span className="small text-muted">Eu</span>
                                                                                )}
                                                                            </Button>
                                                                        </td>
                                                                        <td>
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
                                                                            <small className="text-muted">
                                                                                {row.fatura_id ? (
                                                                                    <Link to={`/faturas/view/${row.fatura_id}`}>
                                                                                        {formatPeriodoFatura(row.fatura_mes, row.fatura_ano)}
                                                                                    </Link>
                                                                                ) : (
                                                                                    formatPeriodoFatura(row.fatura_mes, row.fatura_ano)
                                                                                )}
                                                                            </small>
                                                                        </td>
                                                                        <td className="text-nowrap">{formatFinalCartao(row)}</td>
                                                                        <td>{formatParcelas(row.parcela_atual, row.parcelas_total)}</td>
                                                                        <td>
                                                                            <TableActionsDropdown>
                                                                                <Link to={`/transacoes/edit/${row.id}`} state={{ source: row }}>
                                                                                    <DropdownItem>Editar</DropdownItem>
                                                                                </Link>
                                                                                <DropdownItem onClick={() => openDeleteModal(row)}>
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
            <Modal isOpen={modalIsOpen} toggle={toggleModal} centered>
                <ModalHeader toggle={toggleModal}>Confirmação de Exclusão</ModalHeader>
                <ModalBody className="text-center py-4">
                    <i className="ri-delete-bin-line display-5 text-danger"></i>
                    {rowForDelete?.compra_grupo_id ? (
                        <>
                            <p className="mt-3 mb-1">
                                Esta compra possui múltiplas parcelas
                                {rowForDelete.parcelas_total
                                    ? ` (${rowForDelete.parcela_atual ?? '?'}/${rowForDelete.parcelas_total})`
                                    : ''}
                                .
                            </p>
                            <p className="text-muted small mb-4">
                                Excluir só esta parcela ou todas as parcelas da compra?
                            </p>
                            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                                <Button color="light" onClick={toggleModal} disabled={deleting}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="warning"
                                    onClick={() => handleRemoteDelete(false)}
                                    disabled={deleting}
                                >
                                    Só esta parcela
                                </Button>
                                <Button
                                    color="danger"
                                    onClick={() => handleRemoteDelete(true)}
                                    disabled={deleting}
                                >
                                    Todas as parcelas
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 mb-4">Deseja realmente excluir esta transação?</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <Button color="light" onClick={toggleModal} disabled={deleting}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="danger"
                                    onClick={() => handleRemoteDelete(false)}
                                    disabled={deleting}
                                >
                                    Excluir
                                </Button>
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>
            <ResponsavelModal
                isOpen={responsavelModalOpen}
                toggle={() => {
                    setResponsavelModalOpen(false)
                    setRowForResponsavel(null)
                }}
                responsaveis={responsaveisLookup}
                currentResponsavelId={rowForResponsavel?.responsavel_id}
                onResponsaveisChange={onResponsaveisChange}
                onConfirm={handleConfirmResponsavel}
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
