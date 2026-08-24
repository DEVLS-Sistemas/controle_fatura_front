import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Row,
  Spinner,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import {
  formatCurrency,
  formatDateBr,
  statusRepasseBadgeClass,
  statusRepasseLabel,
  VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import {
  RepasseCelula,
  RepasseColuna,
  RepasseCompra,
  RepasseMatrizView,
  StatusRepasse,
} from 'interfaces/Repasses/RepassesInterface'
import { RepassesService } from 'services/Repasses/RepassesService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { buildResponsavelVisualizarPath } from 'helpers/responsavel_visualizar_helpers'

const RepasseModal = lazy(() => import('../RepasseModal/RepasseModal'))

export type RepassesResponsavelLocationState = {
  nome?: string
  tipo?: string
}

type RepasseModalContext = {
  estabelecimento?: string | null
  observacoes?: string | null
  competenciaLabel?: string
  celula: RepasseCelula
}

const stickyColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  backgroundColor: 'var(--vz-secondary-bg, #fff)',
  minWidth: 220,
  maxWidth: 280,
}

const stickyHeadStyle: React.CSSProperties = {
  ...stickyColStyle,
  zIndex: 3,
  backgroundColor: 'var(--vz-light, #f3f6f9)',
}

const stickyMetricStyle = (left: number): React.CSSProperties => ({
  position: 'sticky',
  left,
  zIndex: 2,
  backgroundColor: 'var(--vz-secondary-bg, #fff)',
  minWidth: 88,
  width: 88,
})

const stickyMetricHeadStyle = (left: number): React.CSSProperties => ({
  ...stickyMetricStyle(left),
  zIndex: 3,
  backgroundColor: 'var(--vz-light, #f3f6f9)',
})

const shiftCompetencia = (mes: number, ano: number, delta: number) => {
  const d = new Date(ano, mes - 1 + delta, 1)
  return { mes: d.getMonth() + 1, ano: d.getFullYear() }
}

const formatPeriodo = (mes?: number, ano?: number) => {
  if (!mes || !ano) return '-'
  return `${String(mes).padStart(2, '0')}/${ano}`
}

const colunaLabelCurto = (col: RepasseColuna) => {
  const label = col && col.label != null ? String(col.label) : ''
  if (!label) {
    if (col && col.mes && col.ano) return `${String(col.mes).padStart(2, '0')}/${col.ano}`
    return (col && col.chave) || '—'
  }
  const parts = label.split('/')
  return parts[0] || label
}

const cellBg = (status?: StatusRepasse | null, referencia?: boolean): string | undefined => {
  if (status === 'pago') return 'rgba(10, 179, 156, 0.12)'
  if (status === 'parcial') return 'rgba(247, 184, 75, 0.18)'
  if (referencia) return 'rgba(var(--vz-primary-rgb, 64, 81, 137), 0.06)'
  return undefined
}

const normalizeMatriz = (raw: any): RepasseMatrizView | null => {
  if (!raw || typeof raw !== 'object') return null
  const hasOwnLists = Array.isArray(raw.compras) || Array.isArray(raw.colunas)
  const data = !hasOwnLists && raw.data && typeof raw.data === 'object' ? raw.data : raw
  return {
    ...data,
    colunas: Array.isArray(data.colunas) ? data.colunas : [],
    compras: Array.isArray(data.compras) ? data.compras : [],
    resumo: data.resumo && typeof data.resumo === 'object'
      ? data.resumo
      : {
          valor_pago: 0,
          valor_aberto: 0,
          valor_aberto_na_referencia: 0,
          compras_abertas: 0,
        },
    referencia: data.referencia || { mes: 0, ano: 0 },
    responsavel_id: Number(data.responsavel_id) || 0,
  }
}

const CelulaRepasse = ({
  celula,
  coluna,
  onClick,
}: {
  celula?: RepasseCelula
  coluna: RepasseColuna
  onClick?: () => void
}) => {
  if (!celula) {
    return (
      <td
        className={`text-center text-muted ${coluna.referencia ? 'table-primary' : ''}`}
        style={{ minWidth: 92, width: 92 }}
      >
        —
      </td>
    )
  }

  const status = (celula.status_repasse || 'pendente') as StatusRepasse
  const clickable = typeof onClick === 'function'
  const valorAberto = Number(celula.valor_aberto ?? 0)
  const valorPago = Number(celula.valor_pago ?? 0)
  const valorDevido = Number(celula.valor_devido ?? 0)
  const title = [
    statusRepasseLabel[status] || status,
    `Devido ${formatCurrency(valorDevido)}`,
    `Recebido ${formatCurrency(valorPago)}`,
    valorAberto > 0 ? `Falta ${formatCurrency(valorAberto)}` : null,
    celula.data_ultimo_pagamento
      ? `Último ${formatDateBr(celula.data_ultimo_pagamento)}`
      : null,
  ].filter(Boolean).join(' · ')

  return (
    <td
      className={`text-center ${coluna.referencia ? 'table-primary' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={title}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      style={{
        minWidth: 92,
        width: 92,
        cursor: clickable ? 'pointer' : undefined,
        backgroundColor: cellBg(status, coluna.referencia),
      }}
    >
      <span className={`d-block fw-semibold ${VALOR_TEXT_CLASS}`} style={{ fontSize: '0.82rem' }}>
        {status === 'parcial'
          ? `${formatCurrency(valorPago).replace('R$', '').trim()}/${formatCurrency(valorDevido).replace('R$', '').trim()}`
          : formatCurrency(status === 'pago' ? valorPago : valorDevido)}
      </span>
      <span
        className={`badge ${statusRepasseBadgeClass[status] || 'bg-secondary-subtle text-secondary'}`}
        style={{ fontSize: '0.62rem' }}
      >
        {status === 'pago' ? 'pago' : status === 'parcial' ? 'parcial' : 'não pagou'}
        {Number(celula.parcelas_total) > 1
          ? ` ${celula.parcela_atual}/${celula.parcelas_total}`
          : ''}
      </span>
    </td>
  )
}

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('RepassesResponsavelView crash:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page-content">
          <Container fluid>
            <div className="alert alert-danger mt-3">
              <strong>Erro ao abrir pagamentos do responsável.</strong>
              <div className="small mt-2">{this.state.error.message}</div>
            </div>
            <Link to="/projecao-faturas" className="btn btn-primary">
              Voltar à Projeção
            </Link>
          </Container>
        </div>
      )
    }
    return this.props.children
  }
}

const RepassesResponsavelViewInner = () => {
  const { responsavelId } = useParams<{ responsavelId: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { voltarParaRotaAnterior } = useNavegacao()

  const locationState = (location.state || {}) as RepassesResponsavelLocationState

  const mes = Number(searchParams.get('mes')) || new Date().getMonth() + 1
  const ano = Number(searchParams.get('ano')) || new Date().getFullYear()
  const somenteAbertosParam = searchParams.get('somente_abertos') === '1'
  const cartaoIdParam = searchParams.get('cartao_id')
    ? Number(searchParams.get('cartao_id'))
    : null

  const repassesService = useRef(new RepassesService()).current
  const cartoesService = useRef(new CartoesService()).current

  const [matriz, setMatriz] = useState<RepasseMatrizView | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [quitando, setQuitando] = useState(false)
  const [somenteAbertos, setSomenteAbertos] = useState(somenteAbertosParam)
  const [filtroCartaoId, setFiltroCartaoId] = useState<number | null>(cartaoIdParam)
  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState<RepasseModalContext | null>(null)
  const [expandedMobile, setExpandedMobile] = useState<Record<string, boolean>>({})

  const anterior = shiftCompetencia(mes, ano, -1)
  const proxima = shiftCompetencia(mes, ano, 1)

  const updateQuery = useCallback((patch: Record<string, string | null>) => {
    if (!responsavelId) return
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    })
    navigate(
      `/projecao-faturas/responsaveis/${responsavelId}/repasses?${next.toString()}`,
      { replace: true, state: location.state }
    )
  }, [responsavelId, searchParams, navigate, location.state])

  const goCompetencia = useCallback((nextMes: number, nextAno: number) => {
    updateQuery({ mes: String(nextMes), ano: String(nextAno) })
  }, [updateQuery])

  const loadMatriz = useCallback(async () => {
    if (!responsavelId) return
    setLoading(true)
    setLoadError(null)
    try {
      const result = await repassesService.getMatriz({
        responsavel_id: responsavelId,
        mes,
        ano,
        janela: 13,
        incluir_abertos: 1,
        somente_abertos: somenteAbertos ? 1 : 0,
        cartao_id: filtroCartaoId,
      })
      setMatriz(normalizeMatriz(result))
    } catch (error: any) {
      console.error(error)
      const message = error?.message || 'Erro ao carregar pagamentos do responsável'
      setLoadError(message)
      toast.error(message)
      setMatriz(null)
    } finally {
      setLoading(false)
    }
  }, [responsavelId, mes, ano, somenteAbertos, filtroCartaoId, repassesService])

  useEffect(() => {
    setActiveMenu('/projecao-faturas')
    ;(async () => {
      try {
        const list = await cartoesService.AsyncListCartoes({})
        setCartoesOptions(
          (list || []).map((c: any) => ({
            value: c.id,
            label: c.nome || `#${c.id}`,
          }))
        )
      } catch (error) {
        console.error(error)
      }
    })()
  }, [cartoesService])

  useEffect(() => {
    setSomenteAbertos(somenteAbertosParam)
  }, [somenteAbertosParam])

  useEffect(() => {
    setFiltroCartaoId(cartaoIdParam)
  }, [cartaoIdParam])

  useEffect(() => {
    loadMatriz()
  }, [loadMatriz])

  const colunas = Array.isArray(matriz?.colunas) ? matriz!.colunas : []
  const compras = Array.isArray(matriz?.compras) ? matriz!.compras : []
  const resumo = matriz?.resumo

  const nomeResponsavel =
    matriz?.responsavel_nome
    || locationState.nome
    || `#${responsavelId}`

  const tipoResponsavel = matriz?.responsavel_tipo || locationState.tipo

  const faturaPath = useMemo(() => {
    if (!responsavelId) return '/projecao-faturas'
    const qs = new URLSearchParams({ mes: String(mes), ano: String(ano) })
    if (filtroCartaoId != null) qs.set('cartao_id', String(filtroCartaoId))
    return `/projecao-faturas/responsaveis/${responsavelId}/fatura?${qs.toString()}`
  }, [responsavelId, mes, ano, filtroCartaoId])

  const openCelula = (compra: RepasseCompra, coluna: RepasseColuna, celula: RepasseCelula) => {
    setModalContext({
      estabelecimento: compra.estabelecimento,
      observacoes: compra.observacoes,
      competenciaLabel: String(coluna.label || colunaLabelCurto(coluna)),
      celula,
    })
    setModalOpen(true)
  }

  const handleSomenteAbertos = (checked: boolean) => {
    setSomenteAbertos(checked)
    updateQuery({ somente_abertos: checked ? '1' : null })
  }

  const handleFiltroCartao = (value: string) => {
    const parsed = value === '' ? null : Number(value)
    setFiltroCartaoId(parsed)
    updateQuery({ cartao_id: parsed == null ? null : String(parsed) })
  }

  const handleQuitarCompetencia = async () => {
    if (!responsavelId) return
    const label = formatPeriodo(mes, ano)
    if (!window.confirm(`Marcar como pago tudo que ${nomeResponsavel} ainda deve em ${label}?`)) {
      return
    }
    setQuitando(true)
    try {
      const today = new Date()
      const dataPagamento = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const result = await repassesService.quitarCompetencia({
        responsavel_id: responsavelId,
        mes,
        ano,
        data_pagamento: dataPagamento,
      })
      const qtd = result?.quantidade ?? result?.qtd ?? result?.repasses?.length
      toast.success(
        qtd != null
          ? `${qtd} parcela(s) marcada(s) como paga(s)`
          : 'Competência marcada como paga'
      )
      await loadMatriz()
    } catch (error: any) {
      console.error(error)
      if (error instanceof ValidationError) {
        toast.error((error.errors as any)?.message || error.message)
      } else {
        toast.error(error?.message || 'Erro ao marcar competência como paga')
      }
    } finally {
      setQuitando(false)
    }
  }

  if (!responsavelId) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="alert alert-danger">Responsável inválido.</div>
          <Link to="/projecao-faturas" className="btn btn-soft-primary">Voltar à Projeção</Link>
        </Container>
      </div>
    )
  }

  return (
    <div className="page-content">
      <Container fluid>
        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Link to="/projecao-faturas" className="me-2">
              <i className="bx bx-arrow-back bx-sm"></i>
            </Link>
            <h4 className="mb-0">Pagamentos do responsável</h4>
          </div>
          <div className="text-muted small">
            <Link to="/projecao-faturas">Projeção</Link>
            {' / '}
            Pagamentos
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <Button
            type="button"
            color="light"
            className="border"
            onClick={() => goCompetencia(anterior.mes, anterior.ano)}
          >
            <i className="ri-arrow-left-line me-1"></i>
            Anterior
            <span className="ms-1 text-muted">{formatPeriodo(anterior.mes, anterior.ano)}</span>
          </Button>
          <div className="text-center small text-muted d-none d-md-block">
            {[nomeResponsavel, tipoResponsavel, formatPeriodo(mes, ano)].filter(Boolean).join(' · ')}
          </div>
          <Button
            type="button"
            color="light"
            className="border"
            onClick={() => goCompetencia(proxima.mes, proxima.ano)}
          >
            <span className="me-1 text-muted">{formatPeriodo(proxima.mes, proxima.ano)}</span>
            Próxima
            <i className="ri-arrow-right-line ms-1"></i>
          </Button>
        </div>

        <Card className="mb-3">
          <CardBody>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="fw-bold text-truncate" style={{ fontSize: '1.5rem', lineHeight: 1.2 }}>
                  Pagamentos de {nomeResponsavel}
                </div>
                {tipoResponsavel ? (
                  <span className="badge bg-primary-subtle text-primary-emphasis mt-1">
                    {String(tipoResponsavel).charAt(0).toUpperCase() + String(tipoResponsavel).slice(1)}
                  </span>
                ) : null}
                <div className="text-muted small mt-2">
                  Clique na célula do mês para marcar se o responsável já te pagou.
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                  Voltar
                </button>
                {responsavelId ? (
                  <Link
                    to={buildResponsavelVisualizarPath(responsavelId, mes, ano)}
                    className="btn btn-soft-secondary"
                  >
                    <i className="ri-user-3-line me-1"></i>
                    Ver responsável
                  </Link>
                ) : null}
                <Link to={faturaPath} state={location.state} className="btn btn-soft-info">
                  Fatura do responsável
                </Link>
                <Link to="/projecao-faturas" className="btn btn-soft-primary">
                  Projeção
                </Link>
              </div>
            </div>

            <div className="bg-light rounded p-3 mb-3">
              <Row className="g-3 text-center text-md-start">
                <Col xs={6} md={3}>
                  <small className="text-muted text-uppercase d-block">Em aberto</small>
                  <span className={`fw-bold text-danger ${VALOR_TEXT_CLASS}`} style={{ fontSize: '1.35rem' }}>
                    {formatCurrency(resumo?.valor_aberto)}
                  </span>
                </Col>
                <Col xs={6} md={3}>
                  <small className="text-muted text-uppercase d-block">Recebido</small>
                  <span className={`fw-semibold text-success ${VALOR_TEXT_CLASS}`} style={{ fontSize: '1.35rem' }}>
                    {formatCurrency(resumo?.valor_pago)}
                  </span>
                </Col>
                <Col xs={6} md={3}>
                  <small className="text-muted text-uppercase d-block">A receber (ref.)</small>
                  <span className={`fw-semibold ${VALOR_TEXT_CLASS}`} style={{ fontSize: '1.35rem' }}>
                    {formatCurrency(resumo?.valor_aberto_na_referencia)}
                  </span>
                </Col>
                <Col xs={6} md={3}>
                  <small className="text-muted text-uppercase d-block">Compras abertas</small>
                  <span className="fw-semibold" style={{ fontSize: '1.35rem' }}>
                    {resumo?.compras_abertas ?? '—'}
                  </span>
                </Col>
              </Row>
            </div>

            <Row className="g-2 align-items-center">
              <Col md={3}>
                <Input
                  type="select"
                  value={filtroCartaoId ?? ''}
                  onChange={(e) => handleFiltroCartao(e.target.value)}
                >
                  <option value="">Todos os cartões</option>
                  {cartoesOptions.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                  ))}
                </Input>
              </Col>
              <Col md={4}>
                <div className="form-check form-switch mt-2 mt-md-0">
                  <Input
                    type="checkbox"
                    className="form-check-input"
                    id="somente-abertos"
                    checked={somenteAbertos}
                    onChange={(e) => handleSomenteAbertos(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="somente-abertos">
                    Somente em aberto
                  </label>
                </div>
              </Col>
              <Col md={5} className="text-md-end">
                <Button
                  type="button"
                  color="success"
                  outline
                  disabled={quitando || loading || Number(resumo?.valor_aberto_na_referencia ?? 0) <= 0}
                  onClick={handleQuitarCompetencia}
                >
                  {quitando
                    ? 'Marcando...'
                    : `Marcar tudo de ${formatPeriodo(mes, ano)} como pago`}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="text-muted mt-2">Carregando pagamentos...</div>
          </div>
        ) : loadError ? (
          <Card>
            <CardBody className="text-center py-5">
              <div className="alert alert-danger d-inline-block text-start mb-3">
                {loadError}
              </div>
              <div>
                <Button type="button" color="primary" onClick={loadMatriz}>
                  Tentar novamente
                </Button>
                <Link to="/projecao-faturas" className="btn btn-soft-primary ms-2">
                  Voltar à Projeção
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : compras.length === 0 ? (
          <Card>
            <CardBody className="text-center text-muted py-5">
              {somenteAbertos
                ? 'Nada em aberto com este responsável.'
                : 'Nenhuma compra deste responsável na janela.'}
              <div className="mt-3">
                <Link to="/projecao-faturas" className="btn btn-soft-primary">
                  Voltar à Projeção
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card className="d-none d-lg-block mb-4">
              <CardBody>
                <div className="table-responsive">
                  <table className="table align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={stickyHeadStyle}>Compra</th>
                        <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(220)}>Total</th>
                        <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(308)}>Recebido</th>
                        <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(396)}>Falta</th>
                        {colunas.map((col, idx) => (
                          <th
                            key={col.chave || `${col.mes}-${col.ano}-${idx}`}
                            className={`text-center ${col.referencia ? 'table-primary' : ''}`}
                            style={{ minWidth: 92, width: 92, lineHeight: 1.15 }}
                          >
                            <span className="d-block fw-semibold">{colunaLabelCurto(col)}</span>
                            {col.referencia ? <span className="d-block fs-10 text-primary">ref.</span> : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((compra, compraIdx) => {
                        const status = (compra.status_repasse || 'pendente') as StatusRepasse
                        const rowKey = String(compra.chave_compra || compra.compra_grupo_id || compraIdx)
                        const celulas = compra.celulas && typeof compra.celulas === 'object'
                          ? compra.celulas
                          : {}
                        return (
                          <tr key={rowKey}>
                            <td style={stickyColStyle}>
                              <div className="fw-medium text-truncate" title={compra.estabelecimento || undefined}>
                                {compra.estabelecimento || 'Sem estabelecimento'}
                              </div>
                              {compra.observacoes ? (
                                <div className="text-muted fs-12 text-truncate" title={compra.observacoes}>
                                  {compra.observacoes}
                                </div>
                              ) : null}
                              <div className="text-muted fs-12">
                                {[
                                  compra.data_compra ? formatDateBr(compra.data_compra) : null,
                                  Number(compra.parcelas_total) > 1
                                    ? `${compra.parcelas_pagas || 0}/${compra.parcelas_total} pagas`
                                    : 'À vista',
                                ].filter(Boolean).join(' · ')}
                              </div>
                              {compra.cartao_nome ? (
                                <span className="d-inline-flex align-items-center gap-1 mt-1">
                                  {compra.cartao_cor_fundo ? (
                                    <CartaoChip
                                      cor_fundo={compra.cartao_cor_fundo}
                                      cor_texto={compra.cartao_cor_texto}
                                      label={String(compra.cartao_nome).slice(0, 1)}
                                    />
                                  ) : null}
                                  <span className="badge bg-light text-muted fw-normal">
                                    {compra.cartao_nome}
                                    {compra.ultimos_digitos ? ` ···${compra.ultimos_digitos}` : ''}
                                  </span>
                                </span>
                              ) : null}
                              <div className="mt-1">
                                <span className={`badge ${statusRepasseBadgeClass[status] || 'bg-secondary-subtle text-secondary'}`}>
                                  {statusRepasseLabel[status] || status}
                                </span>
                              </div>
                            </td>
                            <td className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricStyle(220)}>
                              {formatCurrency(compra.valor_total)}
                            </td>
                            <td className={`text-end text-success ${VALOR_TEXT_CLASS}`} style={stickyMetricStyle(308)}>
                              {formatCurrency(compra.valor_pago)}
                            </td>
                            <td className={`text-end text-danger fw-semibold ${VALOR_TEXT_CLASS}`} style={stickyMetricStyle(396)}>
                              {formatCurrency(compra.valor_aberto)}
                            </td>
                            {colunas.map((col, colIdx) => {
                              const chave = col.chave || `${col.ano}-${String(col.mes).padStart(2, '0')}`
                              const celula = celulas[chave]
                              return (
                                <CelulaRepasse
                                  key={`${rowKey}-${chave}-${colIdx}`}
                                  celula={celula}
                                  coluna={col}
                                  onClick={
                                    celula
                                      ? () => openCelula(compra, col, celula)
                                      : undefined
                                  }
                                />
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="alert alert-success border-0 mt-3 mb-0 small">
                  <strong>Como usar:</strong> clique na célula do mês → informe valor e data,
                  ou use <em>Marcar como pago</em>.
                </div>
              </CardBody>
            </Card>

            <div className="d-lg-none mb-4">
              {compras.map((compra, compraIdx) => {
                const rowKey = String(compra.chave_compra || compra.compra_grupo_id || compraIdx)
                const open = !!expandedMobile[rowKey]
                const status = (compra.status_repasse || 'pendente') as StatusRepasse
                const celulas = compra.celulas && typeof compra.celulas === 'object'
                  ? compra.celulas
                  : {}
                return (
                  <Card key={rowKey} className="mb-2">
                    <CardBody className="py-3">
                      <button
                        type="button"
                        className="btn btn-link text-start text-decoration-none text-body p-0 w-100"
                        onClick={() =>
                          setExpandedMobile((prev) => ({
                            ...prev,
                            [rowKey]: !prev[rowKey],
                          }))
                        }
                      >
                        <div className="d-flex justify-content-between gap-2">
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{compra.estabelecimento || 'Compra'}</div>
                            {compra.observacoes ? (
                              <div className="text-muted small text-truncate">{compra.observacoes}</div>
                            ) : null}
                            <span className={`badge ${statusRepasseBadgeClass[status] || 'bg-secondary-subtle text-secondary'}`}>
                              {statusRepasseLabel[status] || status}
                            </span>
                          </div>
                          <div className="text-end">
                            <div className={`small text-danger ${VALOR_TEXT_CLASS}`}>
                              Falta {formatCurrency(compra.valor_aberto)}
                            </div>
                            <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`}></i>
                          </div>
                        </div>
                      </button>
                      {open ? (
                        <div className="mt-3">
                          <div className="d-flex justify-content-between small mb-2">
                            <span>Total {formatCurrency(compra.valor_total)}</span>
                            <span className="text-success">Recebido {formatCurrency(compra.valor_pago)}</span>
                          </div>
                          {colunas.map((col, colIdx) => {
                            const chave = col.chave || `${col.ano}-${String(col.mes).padStart(2, '0')}`
                            const celula = celulas[chave]
                            if (!celula) return null
                            return (
                              <button
                                key={`${rowKey}-${chave}-${colIdx}`}
                                type="button"
                                className="btn btn-light border w-100 text-start mb-2"
                                onClick={() => openCelula(compra, col, celula)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>
                                    {colunaLabelCurto(col)}
                                    {col.referencia ? ' (ref.)' : ''}
                                    <Badge color="light" className="ms-1 text-muted">
                                      {Number(celula.parcelas_total) > 1
                                        ? `${celula.parcela_atual}/${celula.parcelas_total}`
                                        : 'À vista'}
                                    </Badge>
                                  </span>
                                  <span className={VALOR_TEXT_CLASS}>
                                    {formatCurrency(
                                      Number(celula.valor_aberto) > 0
                                        ? celula.valor_aberto
                                        : celula.valor_devido
                                    )}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </Container>

      {modalOpen ? (
        <Suspense fallback={null}>
          <RepasseModal
            isOpen={modalOpen}
            toggle={() => {
              setModalOpen(false)
              setModalContext(null)
            }}
            context={modalContext}
            onSaved={async () => {
              await loadMatriz()
            }}
          />
        </Suspense>
      ) : null}
    </div>
  )
}

const RepassesResponsavelView = () => (
  <PageErrorBoundary>
    <RepassesResponsavelViewInner />
  </PageErrorBoundary>
)

export default RepassesResponsavelView
