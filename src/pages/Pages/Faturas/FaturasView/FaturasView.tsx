import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import {
    Badge, Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container,
    Input, Label, Row, Spinner, Table
} from 'reactstrap'
import { toast } from 'react-toastify'
import { AxiosHttpClient } from 'libs/api/ApiConfig'
import {
    formatCurrency, formatDateBr, faturaStatusColor,
    tipoTransacaoColor, tipoTransacaoLabel,
    FATURA_FILE_ACCEPT, isValidFaturaFile,
} from 'helpers/fatura_helpers'
import { FaturasView } from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'

interface TransacaoItem {
    id?: number
    data?: string
    estabelecimento?: string
    valor?: number
    tipo?: string
    categoria?: string
    categoria_nome?: string
    responsavel?: string
    responsavel_nome?: string
}

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    processada: 'Processada',
    erro: 'Erro',
}

const FaturasViewPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { voltarParaRotaAnterior } = useNavegacao()
    const faturasService = new FaturasService()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fatura, setFatura] = useState<FaturasView | null>(null)
    const [transacoes, setTransacoes] = useState<TransacaoItem[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [processarAuto, setProcessarAuto] = useState(true)

    const formatPeriodo = (mes?: number, ano?: number) => {
        if (!mes || !ano) return '-'
        return `${String(mes).padStart(2, '0')}/${ano}`
    }

    const loadPdf = useCallback(async (faturaId: string) => {
        try {
            const raw = sessionStorage.getItem('authUser')
            const token = raw ? JSON.parse(raw).token : null
            const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api/v1/'
            const res = await fetch(`${base}faturas/pdf/${faturaId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) return
            const blob = await res.blob()
            setPdfBlobUrl(URL.createObjectURL(blob))
        } catch (error) {
            console.error('Erro ao carregar PDF:', error)
        }
    }, [])

    const loadTransacoes = useCallback(async (faturaId: string) => {
        try {
            const http = new AxiosHttpClient()
            const response = await http.get<{ data?: TransacaoItem[] } | TransacaoItem[]>({
                url: 'transacoes/listar',
                body: { fatura_id: faturaId, perPage: 200, page: 1 },
            })
            const body = response.body
            if (Array.isArray(body)) {
                setTransacoes(body)
            } else if (body && 'data' in body && Array.isArray(body.data)) {
                setTransacoes(body.data)
            }
        } catch (error) {
            console.error('Erro ao carregar transações:', error)
        }
    }, [])

    const loadFatura = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const view = await faturasService.getViewFaturas({ id })
            if (view) {
                setFatura(view)
                if (view.tem_pdf || view.pdf_url || view.arquivo_pdf) {
                    await loadPdf(id)
                }
                await loadTransacoes(id)
            }
        } catch (error) {
            console.error('Erro ao carregar fatura:', error)
            toast.error('Erro ao carregar fatura')
        } finally {
            setLoading(false)
        }
    }, [id, loadPdf, loadTransacoes])

    const handleReprocessar = async () => {
        if (!id) return
        try {
            await faturasService.processarPdf(Number(id))
            toast.success('Reprocessamento iniciado')
            await loadFatura()
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
            await loadFatura()
        } catch (error) {
            toast.error('Erro ao enviar arquivo')
        }
    }

    useEffect(() => {
        setActiveMenu('/faturas')
    }, [])

    useEffect(() => {
        loadFatura()
    }, [loadFatura])

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
                    <button className="btn btn-soft-success" onClick={() => navigate('/faturas')}>Voltar</button>
                </Container>
            </div>
        )
    }

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
                                    <h4 className="mb-0">Detalhes da Fatura</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/faturas">Faturas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar</BreadcrumbItem>
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
                                    <div className="d-flex flex-wrap gap-3 text-muted">
                                        <span><strong>Período:</strong> {formatPeriodo(fatura.mes, fatura.ano)}</span>
                                        <span><strong>Valor:</strong> {formatCurrency(fatura.valor_total)}</span>
                                        <span>
                                            <strong>Status:</strong>{' '}
                                            <Badge color={faturaStatusColor[fatura.status ?? ''] ?? 'secondary'}>
                                                {statusLabel[fatura.status ?? ''] ?? fatura.status}
                                            </Badge>
                                        </span>
                                        {fatura.total_transacoes !== undefined && (
                                            <span><strong>Transações:</strong> {fatura.total_transacoes}</span>
                                        )}
                                        {fatura.processado_em && (
                                            <span><strong>Processado em:</strong> {formatDateBr(fatura.processado_em)}</span>
                                        )}
                                    </div>
                                    {fatura.erro_mensagem && (
                                        <div className="alert alert-danger mt-3 mb-0">{fatura.erro_mensagem}</div>
                                    )}
                                </Col>
                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                            Voltar
                                        </button>
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

                    <Row>
                        <Col lg={6} className="mb-4">
                            <Card className="h-100">
                                <CardBody>
                                    <h5 className="card-title mb-3">Visualização do PDF</h5>
                                    {pdfBlobUrl ? (
                                        <iframe
                                            src={pdfBlobUrl}
                                            title="PDF da Fatura"
                                            style={{ width: '100%', height: '600px', border: '1px solid #dee2e6' }}
                                        />
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            Nenhum PDF disponível para visualização.
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                        <Col lg={6} className="mb-4">
                            <Card className="h-100">
                                <CardBody>
                                    <h5 className="card-title mb-3">Transações Extraídas</h5>
                                    {transacoes.length === 0 ? (
                                        <div className="text-center text-muted py-5">
                                            Nenhuma transação encontrada.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped className="align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Estabelecimento</th>
                                                        <th>Valor</th>
                                                        <th>Tipo</th>
                                                        <th>Categoria</th>
                                                        <th>Responsável</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transacoes.map((tx, idx) => (
                                                        <tr key={tx.id ?? idx}>
                                                            <td>{formatDateBr(tx.data)}</td>
                                                            <td>{tx.estabelecimento ?? '-'}</td>
                                                            <td>{formatCurrency(tx.valor)}</td>
                                                            <td>
                                                                <Badge color={tipoTransacaoColor[tx.tipo ?? ''] ?? 'secondary'}>
                                                                    {tipoTransacaoLabel[tx.tipo ?? ''] ?? tx.tipo}
                                                                </Badge>
                                                            </td>
                                                            <td>{tx.categoria_nome ?? tx.categoria ?? '-'}</td>
                                                            <td>{tx.responsavel_nome ?? tx.responsavel ?? '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default FaturasViewPage
