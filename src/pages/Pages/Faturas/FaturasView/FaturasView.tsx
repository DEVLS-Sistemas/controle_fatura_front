import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactApexChart from 'react-apexcharts'
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
    getCategoriaFieldStyle,
} from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { FaturasView } from 'interfaces/Faturas/FaturasInterface'
import { CategoriaLookup, ResponsavelLookup, TransacoesList } from 'interfaces/Transacoes/TransacoesInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import ResponsavelModal from 'pages/Pages/Transacoes/ResponsavelModal/ResponsavelModal'

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
    const subcategoriasService = useRef(new SubcategoriasService()).current
    const loadedSubcategoriasRef = useRef<Set<number>>(new Set())
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fatura, setFatura] = useState<FaturasView | null>(null)
    const [transacoes, setTransacoes] = useState<TransacoesList[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [processarAuto, setProcessarAuto] = useState(true)
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [subcategoriasByCategoria, setSubcategoriasByCategoria] = useState<Record<number, SelectOptions[]>>({})
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([])
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
    const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
    const [rowForResponsavel, setRowForResponsavel] = useState<TransacoesList | null>(null)
    const [savingIds, setSavingIds] = useState<Record<number, boolean>>({})
    const [valorDrafts, setValorDrafts] = useState<Record<number, string>>({})
    const [observacaoDrafts, setObservacaoDrafts] = useState<Record<number, string>>({})
    const [exporting, setExporting] = useState(false)

    const isMeuResponsavel = (responsavelId?: number | null) => {
        if (responsavelId == null) return true
        if (defaultResponsavelId != null) return Number(responsavelId) === Number(defaultResponsavelId)
        const nome = responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))?.nome
            ?? responsaveisOptions.find((o) => Number(o.value) === Number(responsavelId))?.label
        return (nome ?? '').trim().toLowerCase() === 'eu'
    }

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

    const loadSubcategoriasForCategoria = useCallback(async (categoriaId: number) => {
        if (!categoriaId || loadedSubcategoriasRef.current.has(categoriaId)) return
        loadedSubcategoriasRef.current.add(categoriaId)
        try {
            const list = await subcategoriasService.AsyncListSubcategorias({ categoria_id: categoriaId })
            const options = (list ?? []).map((s) => ({
                value: s.id!,
                label: s.nome ?? `#${s.id}`,
            }))
            setSubcategoriasByCategoria((prev) => ({ ...prev, [categoriaId]: options }))
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error)
            loadedSubcategoriasRef.current.delete(categoriaId)
            setSubcategoriasByCategoria((prev) => ({ ...prev, [categoriaId]: [] }))
        }
    }, [subcategoriasService])

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
            const obsDrafts: Record<number, string> = {}
            const categoriaIds = new Set<number>()
            rows.forEach((tx) => {
                if (tx.id != null && tx.valor != null) {
                    drafts[tx.id] = Number(tx.valor).toFixed(2)
                }
                if (tx.id != null) {
                    obsDrafts[tx.id] = tx.observacoes ?? ''
                }
                if (tx.categoria_id != null) {
                    categoriaIds.add(tx.categoria_id)
                }
            })
            setValorDrafts(drafts)
            setObservacaoDrafts(obsDrafts)
            await Promise.all(Array.from(categoriaIds).map((catId) => loadSubcategoriasForCategoria(catId)))
        } catch (error) {
            console.error('Erro ao carregar transações:', error)
        }
    }, [transacoesService, loadSubcategoriasForCategoria])

    const loadLookups = useCallback(async () => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (lookups?.categorias) {
                setCategoriasLookup(lookups.categorias)
                setCategoriasOptions(
                    lookups.categorias.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `#${c.id}`,
                    }))
                )
            }
            if (lookups?.responsaveis) {
                setResponsaveisLookup(lookups.responsaveis)
                setResponsaveisOptions(
                    lookups.responsaveis.map((r) => ({
                        value: r.id!,
                        label: r.nome ?? `#${r.id}`,
                    }))
                )
            }
            if (lookups?.default_responsavel_id != null) {
                setDefaultResponsavelId(lookups.default_responsavel_id)
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
        patch: Partial<Pick<TransacoesList, 'categoria_id' | 'subcategoria_id' | 'responsavel_id' | 'valor' | 'observacoes'>>
    ) => {
        if (!tx.id) return
        setSavingIds((prev) => ({ ...prev, [tx.id!]: true }))
        try {
            const valor = patch.valor !== undefined ? patch.valor : tx.valor
            const categoriaId = patch.categoria_id !== undefined ? patch.categoria_id : (tx.categoria_id ?? null)
            const subcategoriaId = patch.subcategoria_id !== undefined
                ? patch.subcategoria_id
                : (categoriaId ? (tx.subcategoria_id ?? null) : null)

            await transacoesService.editTransacoes({
                id: tx.id,
                transacao_id: tx.id,
                fatura_id: tx.fatura_id ?? Number(id),
                estabelecimento_id: tx.estabelecimento_id ?? null,
                estabelecimento: tx.estabelecimento_id ? undefined : (tx.estabelecimento ?? null),
                valor: valor ?? null,
                valor_parcela: valor ?? null,
                data: tx.data ?? null,
                tipo: tx.tipo ?? null,
                categoria_id: categoriaId,
                subcategoria_id: subcategoriaId,
                responsavel_id: patch.responsavel_id !== undefined ? patch.responsavel_id : (tx.responsavel_id ?? null),
                observacoes: patch.observacoes !== undefined ? patch.observacoes : (tx.observacoes ?? null),
            })
            setTransacoes((prev) =>
                prev.map((item) => {
                    if (item.id !== tx.id) return item
                    const next = { ...item, ...patch }
                    if (patch.categoria_id !== undefined) {
                        const categoria = categoriasLookup.find((o) => o.id === patch.categoria_id)
                        next.categoria_nome = categoria?.nome
                        next.categoria_cor = categoria?.cor
                        if (patch.subcategoria_id === undefined && patch.categoria_id !== tx.categoria_id) {
                            next.subcategoria_id = null
                            next.subcategoria_nome = undefined
                        }
                    }
                    if (patch.subcategoria_id !== undefined) {
                        const opts = categoriaId ? (subcategoriasByCategoria[categoriaId] ?? []) : []
                        next.subcategoria_nome = opts.find((o) => Number(o.value) === patch.subcategoria_id)?.label
                    }
                    if (patch.responsavel_id !== undefined) {
                        const responsavel =
                            responsaveisLookup.find((r) => Number(r.id) === Number(patch.responsavel_id))
                            ?? null
                        const fromOptions = responsaveisOptions.find((o) => Number(o.value) === patch.responsavel_id)
                        next.responsavel_nome = responsavel?.nome ?? fromOptions?.label
                        next.responsavel_tipo = responsavel?.tipo ?? next.responsavel_tipo
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
            if (patch.observacoes !== undefined && tx.id) {
                setObservacaoDrafts((prev) => ({
                    ...prev,
                    [tx.id!]: patch.observacoes ?? '',
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
        field: 'categoria_id' | 'subcategoria_id' | 'responsavel_id',
        value: string
    ) => {
        const parsed = value === '' ? null : Number(value)

        if (field === 'categoria_id') {
            if (parsed) await loadSubcategoriasForCategoria(parsed)
            setTransacoes((prev) =>
                prev.map((item) =>
                    item.id === tx.id
                        ? { ...item, categoria_id: parsed, subcategoria_id: null, subcategoria_nome: undefined }
                        : item
                )
            )
            await saveTransacao(tx, { categoria_id: parsed, subcategoria_id: null })
            return
        }

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

    const handleObservacaoBlur = async (tx: TransacoesList) => {
        if (!tx.id) return
        const next = observacaoDrafts[tx.id] ?? ''
        const current = tx.observacoes ?? ''
        if (next === current) return
        await saveTransacao(tx, { observacoes: next || null })
    }

    const openResponsavelModal = (tx: TransacoesList) => {
        setRowForResponsavel(tx)
        setResponsavelModalOpen(true)
    }

    const handleConfirmResponsavel = async (responsavel: ResponsavelLookup) => {
        if (!rowForResponsavel?.id) return
        setResponsaveisLookup((prev) => {
            if (prev.some((r) => Number(r.id) === Number(responsavel.id))) return prev
            return [...prev, responsavel]
        })
        setResponsaveisOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(responsavel.id))) return prev
            return [...prev, { value: responsavel.id!, label: responsavel.nome ?? `#${responsavel.id}` }]
        })
        await saveTransacao(rowForResponsavel, { responsavel_id: responsavel.id ?? null })
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

    const totalTransacoes = transacoes.length || fatura?.total_transacoes || 0
    const transacoesComCategoria = useMemo(
        () => transacoes.filter((tx) => tx.categoria_id != null).length,
        [transacoes]
    )
    const categoriasResumo = useMemo(() => {
        const map = new Map<number, { id: number; nome: string; cor?: string; count: number; total: number }>()
        transacoes.forEach((tx) => {
            if (tx.categoria_id == null) return
            const fromLookup = categoriasLookup.find((c) => c.id === tx.categoria_id)
            const current = map.get(tx.categoria_id)
            const valor = Number(tx.valor ?? 0)
            if (current) {
                current.count += 1
                current.total += valor
                return
            }
            map.set(tx.categoria_id, {
                id: tx.categoria_id,
                nome: tx.categoria_nome ?? fromLookup?.nome ?? `#${tx.categoria_id}`,
                cor: tx.categoria_cor ?? fromLookup?.cor,
                count: 1,
                total: valor,
            })
        })
        return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }, [transacoes, categoriasLookup])

    const categoriasChart = useMemo(() => {
        const withTotal = categoriasResumo.filter((c) => c.total > 0)
        return {
            labels: withTotal.map((c) => c.nome),
            series: withTotal.map((c) => Number(c.total.toFixed(2))),
            colors: withTotal.map((c) => c.cor || '#6b7280'),
        }
    }, [categoriasResumo])

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

                            <Row className="mt-4">
                                <Col md={12}>
                                    <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                                        <div className="bg-light rounded px-3 py-2">
                                            <small className="text-muted text-uppercase d-block">Categorias preenchidas</small>
                                            <span className="fs-5 fw-semibold">
                                                {transacoesComCategoria}/{totalTransacoes}
                                            </span>
                                            <small className="text-muted ms-2">
                                                {totalTransacoes === 0
                                                    ? 'sem transações'
                                                    : `${Math.round((transacoesComCategoria / totalTransacoes) * 100)}% categorizadas`}
                                            </small>
                                        </div>
                                    </div>
                                    <div>
                                        <small className="text-muted text-uppercase d-block mb-2">Categorias nesta fatura</small>
                                        {categoriasResumo.length === 0 ? (
                                            <span className="text-muted">Nenhuma categoria vinculada ainda.</span>
                                        ) : (
                                            <div className="d-flex flex-wrap gap-2">
                                                {categoriasResumo.map((cat) => (
                                                    <span
                                                        key={cat.id}
                                                        className="d-inline-flex align-items-center gap-2 border rounded px-2 py-1"
                                                        style={{
                                                            backgroundColor: cat.cor ? `${cat.cor}22` : '#f8f9fa',
                                                            borderColor: cat.cor || '#dee2e6',
                                                            borderLeftWidth: 4,
                                                            borderLeftStyle: 'solid',
                                                            borderLeftColor: cat.cor || '#adb5bd',
                                                        }}
                                                        title={`${cat.count} transação(ões) · ${formatCurrency(cat.total)}`}
                                                    >
                                                        {cat.cor && (
                                                            <span
                                                                className="rounded-circle border"
                                                                style={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    backgroundColor: cat.cor,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                        <span className="fw-medium">{cat.nome}</span>
                                                        <span className="text-muted small">{cat.count}x</span>
                                                        <span className="text-muted small">{formatCurrency(cat.total)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {categoriasChart.series.length > 0 && (
                                <Row className="mt-4">
                                    <Col md={12} lg={7} xl={6}>
                                        <h6 className="mb-3">Distribuição por categoria</h6>
                                        <ReactApexChart
                                            type="pie"
                                            height={320}
                                            series={categoriasChart.series}
                                            options={{
                                                labels: categoriasChart.labels,
                                                colors: categoriasChart.colors,
                                                legend: {
                                                    position: 'bottom',
                                                    fontSize: '13px',
                                                },
                                                dataLabels: {
                                                    enabled: true,
                                                    formatter: (val: number) => `${Math.round(val)}%`,
                                                },
                                                tooltip: {
                                                    y: {
                                                        formatter: (val: number) => formatCurrency(val),
                                                    },
                                                },
                                                chart: {
                                                    toolbar: { show: false },
                                                },
                                                responsive: [{
                                                    breakpoint: 576,
                                                    options: {
                                                        chart: { height: 280 },
                                                        legend: { position: 'bottom' },
                                                    },
                                                }],
                                            }}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h5 className="card-title mb-1">Transações</h5>
                                    <small className="text-muted">
                                        Ajuste valor, categoria, subcategoria e observação em cada linha. Use a coluna Resp. para definir outro responsável (padrão: Eu).
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
                                                <th style={{ minWidth: 150, maxWidth: 50 }}>Valor</th>
                                                <th>Tipo</th>
                                                <th style={{ minWidth: 160 }}>Categoria</th>
                                                <th style={{ minWidth: 160 }}>Subcategoria</th>
                                                <th style={{ minWidth: 250 }}>Observação</th>
                                                <th style={{ width: 90 }} title="Responsável">Resp.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transacoes.map((tx, idx) => {
                                                const subOptions = tx.categoria_id
                                                    ? (subcategoriasByCategoria[tx.categoria_id] ?? [])
                                                    : []
                                                const showResponsavelNome = !isMeuResponsavel(tx.responsavel_id)
                                                const responsavelNome =
                                                    tx.responsavel_nome
                                                    ?? responsaveisLookup.find((r) => Number(r.id) === Number(tx.responsavel_id))?.nome
                                                    ?? responsaveisOptions.find((o) => Number(o.value) === Number(tx.responsavel_id))?.label
                                                return (
                                                <tr key={tx.id ?? idx}>
                                                    <td>{formatDateBr(tx.data)}</td>
                                                    <td>{tx.estabelecimento_nome ?? tx.estabelecimento ?? '-'}</td>
                                                    <td  className="text-end">
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
                                                            style={
                                                                tx.categoria_id
                                                                    ? (getCategoriaFieldStyle(
                                                                        tx.categoria_cor
                                                                        ?? categoriasLookup.find((c) => c.id === tx.categoria_id)?.cor
                                                                    ) ?? undefined)
                                                                    : undefined
                                                            }
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
                                                            value={tx.subcategoria_id ?? ''}
                                                            disabled={!tx.categoria_id || !!savingIds[tx.id!]}
                                                            onChange={(e) => handleUpdateSelect(tx, 'subcategoria_id', e.target.value)}
                                                        >
                                                            <option value="">Sem subcategoria</option>
                                                            {subOptions.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="text"
                                                            bsSize="sm"
                                                            placeholder="Observação..."
                                                            value={tx.id != null ? (observacaoDrafts[tx.id] ?? '') : ''}
                                                            disabled={!!savingIds[tx.id!]}
                                                            onChange={(e) => {
                                                                if (!tx.id) return
                                                                setObservacaoDrafts((prev) => ({
                                                                    ...prev,
                                                                    [tx.id!]: e.target.value,
                                                                }))
                                                            }}
                                                            onBlur={() => handleObservacaoBlur(tx)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur()
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            type="button"
                                                            color="light"
                                                            size="sm"
                                                            className="border"
                                                            title={showResponsavelNome ? `Responsável: ${responsavelNome}` : 'Definir responsável'}
                                                            disabled={!!savingIds[tx.id!]}
                                                            onClick={() => openResponsavelModal(tx)}
                                                        >
                                                            <i className="ri-user-line me-1"></i>
                                                            {showResponsavelNome ? (
                                                                <span className="small">{responsavelNome}</span>
                                                            ) : (
                                                                <span className="small text-muted">Eu</span>
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>
                                                )
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <ResponsavelModal
                        isOpen={responsavelModalOpen}
                        toggle={() => {
                            setResponsavelModalOpen(false)
                            setRowForResponsavel(null)
                        }}
                        responsaveis={responsaveisLookup}
                        currentResponsavelId={rowForResponsavel?.responsavel_id}
                        onResponsaveisChange={setResponsaveisLookup}
                        onConfirm={handleConfirmResponsavel}
                    />

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
