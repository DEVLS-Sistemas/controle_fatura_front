import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import {
    Badge, Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container,
    Input, Label, Row, Spinner, Table
} from 'reactstrap'
import { toast } from 'react-toastify'
import {
    formatCurrency, formatDateBr, faturaStatusColor,
    tipoTransacaoColor, tipoTransacaoLabel,
    FATURA_FILE_ACCEPT, isValidFaturaFile,
} from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { FaturasView } from 'interfaces/Faturas/FaturasInterface'
import { TransacoesList } from 'interfaces/Transacoes/TransacoesInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    processada: 'Processada',
    erro: 'Erro',
}

const getArquivoExtensao = (path?: string | null) => {
    if (!path) return ''
    const clean = path.split('?')[0]
    const parts = clean.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

const FaturasViewPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { voltarParaRotaAnterior } = useNavegacao()
    const faturasService = useRef(new FaturasService()).current
    const transacoesService = useRef(new TransacoesService()).current
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fatura, setFatura] = useState<FaturasView | null>(null)
    const [transacoes, setTransacoes] = useState<TransacoesList[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [processarAuto, setProcessarAuto] = useState(true)
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([])
    const [savingIds, setSavingIds] = useState<Record<number, boolean>>({})
    const [valorDrafts, setValorDrafts] = useState<Record<number, string>>({})
    const [exporting, setExporting] = useState(false)

    const formatPeriodo = (mes?: number, ano?: number) => {
        if (!mes || !ano) return '-'
        return `${String(mes).padStart(2, '0')}/${ano}`
    }

    const isPdfArquivo = (view: FaturasView) => getArquivoExtensao(view.arquivo_pdf) === 'pdf'

    const loadPdf = useCallback(async (faturaId: string) => {
        try {
            const raw = sessionStorage.getItem('authUser')
            const token = raw ? JSON.parse(raw).token : null
            const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api/v1/'
            const res = await fetch(`${base}faturas/pdf/${faturaId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) return

            const contentType = (res.headers.get('content-type') || '').toLowerCase()
            if (!contentType.includes('pdf')) {
                setPdfBlobUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return null
                })
                return
            }

            const blob = await res.blob()
            setPdfBlobUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(blob)
            })
        } catch (error) {
            console.error('Erro ao carregar PDF:', error)
        }
    }, [])

    const loadTransacoes = useCallback(async (faturaId: string) => {
        try {
            const response = await transacoesService.listTransacoesPaginate({
                fatura_id: faturaId,
                perPage: 200,
                page: 1,
            } as any)
            const rows = response?.data ?? []
            setTransacoes(rows)
            const drafts: Record<number, string> = {}
            rows.forEach((tx) => {
                if (tx.id != null && tx.valor != null) {
                    drafts[tx.id] = Number(tx.valor).toFixed(2)
                }
            })
            setValorDrafts(drafts)
        } catch (error) {
            console.error('Erro ao carregar transações:', error)
        }
    }, [transacoesService])

    const loadLookups = useCallback(async () => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (lookups?.categorias) {
                setCategoriasOptions(
                    lookups.categorias.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `#${c.id}`,
                    }))
                )
            }
            if (lookups?.responsaveis) {
                setResponsaveisOptions(
                    lookups.responsaveis.map((r) => ({
                        value: r.id!,
                        label: r.nome ?? `#${r.id}`,
                    }))
                )
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }, [transacoesService])

    const loadFatura = useCallback(async (opts?: { silent?: boolean }) => {
        if (!id) return
        if (!opts?.silent) setLoading(true)
        try {
            const view = await faturasService.getViewFaturas({ id })
            if (view) {
                setFatura(view)
                if ((view.tem_pdf || view.pdf_url || view.arquivo_pdf) && isPdfArquivo(view)) {
                    await loadPdf(id)
                } else {
                    setPdfBlobUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev)
                        return null
                    })
                }
                await loadTransacoes(id)
            }
        } catch (error) {
            console.error('Erro ao carregar fatura:', error)
            if (!opts?.silent) toast.error('Erro ao carregar fatura')
        } finally {
            if (!opts?.silent) setLoading(false)
        }
    }, [id, faturasService, loadPdf, loadTransacoes])

    const handleReprocessar = async () => {
        if (!id) return
        try {
            await faturasService.processarPdf(Number(id))
            toast.success('Reprocessamento iniciado')
            await loadFatura({ silent: true })
        } catch (error) {
            toast.error('Erro ao reprocessar fatura')
        }
    }

    const handleUploadPdf = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file || !id) {
            toast.warning('Selecione um arquivo PDF, CSV ou XML')
            return
        }
        if (!isValidFaturaFile(file)) {
            toast.error('Formato inválido. Envie PDF, CSV ou XML.')
            return
        }
        try {
            await faturasService.uploadPdf({
                id: Number(id),
                arquivo_pdf: file,
                processar_automatico: processarAuto,
            })
            toast.success('Arquivo enviado com sucesso')
            if (fileInputRef.current) fileInputRef.current.value = ''
            await loadFatura({ silent: true })
        } catch (error) {
            toast.error('Erro ao enviar arquivo')
        }
    }

    const handleExportCsv = async () => {
        if (!id) return
        setExporting(true)
        try {
            const blob = await transacoesService.exportCsv({ fatura_id: id })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fatura_${id}_transacoes_${Date.now()}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Exportação concluída')
        } catch (error) {
            console.error('Erro ao exportar:', error)
            toast.error('Erro ao exportar transações')
        } finally {
            setExporting(false)
        }
    }

    const saveTransacao = async (
        tx: TransacoesList,
        patch: Partial<Pick<TransacoesList, 'categoria_id' | 'responsavel_id' | 'valor'>>
    ) => {
        if (!tx.id) return
        setSavingIds((prev) => ({ ...prev, [tx.id!]: true }))
        try {
            const valor = patch.valor !== undefined ? patch.valor : tx.valor
            await transacoesService.editTransacoes({
                id: tx.id,
                transacao_id: tx.id,
                fatura_id: tx.fatura_id ?? Number(id),
                estabelecimento: tx.estabelecimento ?? null,
                valor: valor ?? null,
                valor_parcela: valor ?? null,
                data: tx.data ?? null,
                tipo: tx.tipo ?? null,
                categoria_id: patch.categoria_id !== undefined ? patch.categoria_id : (tx.categoria_id ?? null),
                responsavel_id: patch.responsavel_id !== undefined ? patch.responsavel_id : (tx.responsavel_id ?? null),
                observacoes: tx.observacoes ?? null,
            })
            setTransacoes((prev) =>
                prev.map((item) => {
                    if (item.id !== tx.id) return item
                    const next = { ...item, ...patch }
                    if (patch.categoria_id !== undefined) {
                        const categoria = categoriasOptions.find((o) => Number(o.value) === patch.categoria_id)
                        next.categoria_nome = categoria?.label
                    }
                    if (patch.responsavel_id !== undefined) {
                        const responsavel = responsaveisOptions.find((o) => Number(o.value) === patch.responsavel_id)
                        next.responsavel_nome = responsavel?.label
                    }
                    return next
                })
            )
            if (patch.valor !== undefined && tx.id) {
                setValorDrafts((prev) => ({
                    ...prev,
                    [tx.id!]: Number(patch.valor).toFixed(2),
                }))
            }
        } catch (error) {
            toast.error('Erro ao atualizar transação')
            await loadTransacoes(id!)
        } finally {
            setSavingIds((prev) => {
                const next = { ...prev }
                delete next[tx.id!]
                return next
            })
        }
    }

    const handleUpdateSelect = async (
        tx: TransacoesList,
        field: 'categoria_id' | 'responsavel_id',
        value: string
    ) => {
        const parsed = value === '' ? null : Number(value)
        setTransacoes((prev) =>
            prev.map((item) =>
                item.id === tx.id ? { ...item, [field]: parsed } : item
            )
        )
        await saveTransacao(tx, { [field]: parsed })
    }

    const handleValorBlur = async (tx: TransacoesList) => {
        if (!tx.id) return
        const raw = (valorDrafts[tx.id] ?? '').replace(',', '.').trim()
        const parsed = Number(raw)
        if (raw === '' || Number.isNaN(parsed)) {
            toast.warning('Informe um valor válido')
            setValorDrafts((prev) => ({
                ...prev,
                [tx.id!]: Number(tx.valor ?? 0).toFixed(2),
            }))
            return
        }
        const normalized = Number(parsed.toFixed(2))
        if (Number(tx.valor) === normalized) {
            setValorDrafts((prev) => ({ ...prev, [tx.id!]: normalized.toFixed(2) }))
            return
        }
        await saveTransacao(tx, { valor: normalized })
    }

    useEffect(() => {
        setActiveMenu('/faturas')
        loadLookups()
    }, [loadLookups])

    useEffect(() => {
        loadFatura()
    }, [loadFatura])

    useEffect(() => {
        const status = fatura?.status
        const shouldPoll = status === 'pendente' || status === 'processando'
        if (!shouldPoll || !id) return

        const timer = setInterval(() => {
            loadFatura({ silent: true })
        }, 2500)

        return () => clearInterval(timer)
    }, [fatura?.status, id, loadFatura])

    useEffect(() => {
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
        }
    }, [pdfBlobUrl])

    if (loading) {
        return (
            <div className="page-content text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        )
    }

    if (!fatura) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="alert alert-danger">Fatura não encontrada.</div>
                    <button type="button" className="btn btn-soft-success" onClick={() => navigate('/faturas')}>Voltar</button>
                </Container>
            </div>
        )
    }

    const isProcessing = fatura.status === 'pendente' || fatura.status === 'processando'
    const arquivoExt = getArquivoExtensao(fatura.arquivo_pdf)
    const temArquivo = Boolean(fatura.tem_pdf || fatura.pdf_url || fatura.arquivo_pdf)

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <Link to="/faturas" className="me-2">
                                        <i className="bx bx-arrow-back bx-sm"></i>
                                    </Link>
                                    <h4 className="mb-0">Transações da Fatura</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/faturas">Faturas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Transações</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>

                    <Card className="mb-4">
                        <CardBody>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <h5 className="mb-2">
                                        {fatura.cartao_nome}
                                        {fatura.cartao_ultimos_digitos && (
                                            <small className="text-muted ms-2">•••• {fatura.cartao_ultimos_digitos}</small>
                                        )}
                                    </h5>
                                    <div className="d-flex flex-wrap gap-3 text-muted mb-3">
                                        <span><strong>Período:</strong> {formatPeriodo(fatura.mes, fatura.ano)}</span>
                                        <span>
                                            <strong>Status:</strong>{' '}
                                            <Badge color={faturaStatusColor[fatura.status ?? ''] ?? 'secondary'}>
                                                {statusLabel[fatura.status ?? ''] ?? fatura.status}
                                            </Badge>
                                        </span>
                                        <span><strong>Transações:</strong> {fatura.total_transacoes ?? transacoes.length}</span>
                                        {fatura.processado_em && (
                                            <span><strong>Processado em:</strong> {formatDateBr(fatura.processado_em)}</span>
                                        )}
                                    </div>
                                    <div className="d-inline-flex flex-column bg-light rounded px-3 py-2">
                                        <small className="text-muted text-uppercase">Total da fatura</small>
                                        <span className="fs-3 fw-semibold text-primary">
                                            {formatCurrency(fatura.valor_total)}
                                        </span>
                                    </div>
                                    {fatura.erro_mensagem && (
                                        <div className="alert alert-danger mt-3 mb-0">{fatura.erro_mensagem}</div>
                                    )}
                                    {isProcessing && (
                                        <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2">
                                            <Spinner size="sm" />
                                            Processando fatura… as transações aparecerão automaticamente.
                                        </div>
                                    )}
                                </Col>
                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                            Voltar
                                        </button>
                                        <Link to={`/faturas/edit/${id}`} className="btn btn-soft-primary">
                                            Editar
                                        </Link>
                                        <button type="button" className="btn btn-warning" onClick={handleReprocessar}>
                                            Reprocessar
                                        </button>
                                    </div>
                                </Col>
                            </Row>

                            <Row className="mt-3 align-items-end">
                                <Col md={4}>
                                    <Label htmlFor="upload_pdf" className="form-label">Upload (PDF / CSV / XML)</Label>
                                    <Input innerRef={fileInputRef} type="file" accept={FATURA_FILE_ACCEPT} />
                                    <small className="text-muted">PDF, CSV ou XML</small>
                                </Col>
                                <Col md={3}>
                                    <div className="form-check form-switch mt-4">
                                        <Input
                                            type="checkbox"
                                            role="switch"
                                            id="processar_auto"
                                            checked={processarAuto}
                                            onChange={(e) => setProcessarAuto(e.target.checked)}
                                        />
                                        <Label className="ms-2" htmlFor="processar_auto">Processar automaticamente</Label>
                                    </div>
                                </Col>
                                <Col md={2}>
                                    <button type="button" className="btn btn-primary mt-2" onClick={handleUploadPdf}>
                                        Enviar arquivo
                                    </button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h5 className="card-title mb-1">Transações</h5>
                                    <small className="text-muted">
                                        Ajuste valor, categoria e responsável diretamente em cada linha.
                                    </small>
                                </div>
                                <Button
                                    type="button"
                                    color="secondary"
                                    outline
                                    onClick={handleExportCsv}
                                    disabled={exporting || transacoes.length === 0}
                                >
                                    <i className="ri-file-download-line align-middle me-1"></i>
                                    {exporting ? 'Exportando...' : 'Exportar CSV/Excel'}
                                </Button>
                            </div>
                            {transacoes.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    {isProcessing
                                        ? 'Aguardando processamento das transações…'
                                        : 'Nenhuma transação encontrada.'}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Data</th>
                                                <th>Estabelecimento</th>
                                                <th style={{ minWidth: 130 }}>Valor</th>
                                                <th>Tipo</th>
                                                <th style={{ minWidth: 180 }}>Categoria</th>
                                                <th style={{ minWidth: 180 }}>Responsável</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transacoes.map((tx, idx) => (
                                                <tr key={tx.id ?? idx}>
                                                    <td>{formatDateBr(tx.data)}</td>
                                                    <td>{tx.estabelecimento ?? '-'}</td>
                                                    <td>
                                                        <Input
                                                            type="number"
                                                            bsSize="sm"
                                                            step="0.01"
                                                            min="0"
                                                            value={tx.id != null ? (valorDrafts[tx.id] ?? '') : ''}
                                                            disabled={!!savingIds[tx.id!]}
                                                            onChange={(e) => {
                                                                if (!tx.id) return
                                                                setValorDrafts((prev) => ({
                                                                    ...prev,
                                                                    [tx.id!]: e.target.value,
                                                                }))
                                                            }}
                                                            onBlur={() => handleValorBlur(tx)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur()
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Badge color={tipoTransacaoColor[tx.tipo ?? ''] ?? 'secondary'}>
                                                            {tipoTransacaoLabel[tx.tipo ?? ''] ?? tx.tipo}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="select"
                                                            bsSize="sm"
                                                            value={tx.categoria_id ?? ''}
                                                            disabled={!!savingIds[tx.id!]}
                                                            onChange={(e) => handleUpdateSelect(tx, 'categoria_id', e.target.value)}
                                                        >
                                                            <option value="">Sem categoria</option>
                                                            {categoriasOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="select"
                                                            bsSize="sm"
                                                            value={tx.responsavel_id ?? ''}
                                                            disabled={!!savingIds[tx.id!]}
                                                            onChange={(e) => handleUpdateSelect(tx, 'responsavel_id', e.target.value)}
                                                        >
                                                            <option value="">Sem responsável</option>
                                                            {responsaveisOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <h5 className="card-title mb-3">Visualização do arquivo</h5>
                            {pdfBlobUrl ? (
                                <iframe
                                    src={pdfBlobUrl}
                                    title="PDF da Fatura"
                                    style={{ width: '100%', height: '600px', border: '1px solid #dee2e6' }}
                                />
                            ) : temArquivo && arquivoExt && arquivoExt !== 'pdf' ? (
                                <div className="text-center text-muted py-5">
                                    Arquivo <strong>.{arquivoExt}</strong> anexado. A pré-visualização está disponível apenas para PDF.
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    Nenhum PDF disponível para visualização.
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default FaturasViewPage
