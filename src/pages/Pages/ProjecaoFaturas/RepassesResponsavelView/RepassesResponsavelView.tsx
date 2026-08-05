import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Row,
  Spinner,
  UncontrolledTooltip,
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
import RepasseModal, { RepasseModalContext } from '../RepasseModal/RepasseModal'

export type RepassesResponsavelLocationState = {
  nome?: string
  tipo?: string
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

const cellBg = (status?: StatusRepasse | null, referencia?: boolean): string | undefined => {
  if (status === 'pago') return 'rgba(10, 179, 156, 0.12)'
  if (status === 'parcial') return 'rgba(247, 184, 75, 0.18)'
  if (referencia) return 'rgba(var(--vz-primary-rgb, 64, 81, 137), 0.06)'
  return undefined
}

const CelulaRepasse = ({
  celula,
  coluna,
  cellId,
  onClick,
}: {
  celula?: RepasseCelula
  coluna: RepasseColuna
  cellId: string
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

  const status = celula.status_repasse
  const clickable = typeof onClick === 'function'
  const titleParts = [
    statusRepasseLabel[status] ?? status,
    `Devido ${formatCurrency(celula.valor_devido)}`,
    `Repassado ${formatCurrency(celula.valor_pago)}`,
    celula.valor_aberto > 0 ? `Aberto ${formatCurrency(celula.valor_aberto)}` : null,
    celula.data_ultimo_pagamento
      ? `Último repasse ${formatDateBr(celula.data_ultimo_pagamento)}`
      : null,
  ].filter(Boolean)

  return (
    <td
      id={cellId}
      className={`text-center ${coluna.referencia ? 'table-primary' : ''} ${clickable ? 'cursor-pointer' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={titleParts.join(' · ')}
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
          ? `${formatCurrency(celula.valor_pago).replace('R$', '').trim()}/${formatCurrency(celula.valor_devido).replace('R$', '').trim()}`
          : formatCurrency(status === 'pago' ? celula.valor_pago : celula.valor_devido)}
      </span>
      <span className={`badge ${statusRepasseBadgeClass[status] ?? 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.62rem' }}>
        {status === 'pago' ? '✓' : status === 'parcial' ? 'parc.' : 'pend.'}
        {celula.parcelas_total && celula.parcelas_total > 1
          ? ` ${celula.parcela_atual}/${celula.parcelas_total}`
          : ''}
      </span>
      <UncontrolledTooltip placement="top" target={cellId}>
        {titleParts.join(' · ')}
      </UncontrolledTooltip>
    </td>
  )
}

const RepassesResponsavelView = () => {
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
      setMatriz(result ?? null)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Erro ao carregar controle de repasses')
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
          (list ?? []).map((c: any) => ({
            value: c.id!,
            label: c.nome ?? `#${c.id}`,
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goCompetencia(anterior.mes, anterior.ano)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goCompetencia(proxima.mes, proxima.ano)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [anterior.mes, anterior.ano, proxima.mes, proxima.ano, goCompetencia])

  const colunas = matriz?.colunas ?? []
  const compras = matriz?.compras ?? []
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
      competenciaLabel: coluna.label,
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
    if (!window.confirm(`Quitar todas as parcelas em aberto de ${label} deste responsável?`)) {
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
          ? `${qtd} parcela(s) quitada(s) com o responsável`
          : 'Competência quitada com o responsável'
      )
      await loadMatriz()
    } catch (error: any) {
      console.error(error)
      if (error instanceof ValidationError) {
        toast.error((error.errors as any)?.message || error.message)
      } else {
        toast.error(error?.message || 'Erro ao quitar competência')
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
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Link to="/projecao-faturas" className="me-2">
                    <i className="bx bx-arrow-back bx-sm"></i>
                  </Link>
                  <h4 className="mb-0">Controle de Repasses</h4>
                </div>
                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                  <BreadcrumbItem>
                    <Link to="/dashboard"><i className="ri-home-5-fill"></i></Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <Link to="/projecao-faturas">Projeção</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active>Repasses</BreadcrumbItem>
                </Breadcrumb>
              </div>
            </Col>
          </Row>

          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 sticky-top py-2 bg-body"
            style={{ zIndex: 10 }}
          >
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
                    Repasses · {nomeResponsavel}
                  </div>
                  {tipoResponsavel && (
                    <span className="badge bg-primary-subtle text-primary-emphasis mt-1">
                      {String(tipoResponsavel).charAt(0).toUpperCase() + String(tipoResponsavel).slice(1)}
                    </span>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                    Voltar
                  </button>
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
                    <small className="text-muted text-uppercase d-block">Repassado</small>
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
                    {quitando ? 'Quitando...' : `Quitar competência ${formatPeriodo(mes, ano)}`}
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
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
              {/* Desktop grade */}
              <Card className="d-none d-lg-block mb-4">
                <CardBody>
                  <div className="table-responsive">
                    <table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={stickyHeadStyle}>Compra</th>
                          <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(220)}>Total</th>
                          <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(308)}>Repassado</th>
                          <th className={`text-end ${VALOR_TEXT_CLASS}`} style={stickyMetricHeadStyle(396)}>Aberto</th>
                          {colunas.map((col) => (
                            <th
                              key={col.chave}
                              className={`text-center ${col.referencia ? 'table-primary' : ''}`}
                              style={{ minWidth: 92, width: 92, lineHeight: 1.15 }}
                            >
                              <span className="d-block fw-semibold">{col.label.split('/')[0] || col.label}</span>
                              {col.referencia && <span className="d-block fs-10 text-primary">ref.</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {compras.map((compra) => {
                          const status = compra.status_repasse
                          return (
                            <tr key={compra.chave_compra}>
                              <td style={stickyColStyle}>
                                <div className="fw-medium text-truncate" title={compra.estabelecimento || undefined}>
                                  {compra.estabelecimento || 'Sem estabelecimento'}
                                </div>
                                {compra.observacoes && (
                                  <div className="text-muted fs-12 text-truncate" title={compra.observacoes}>
                                    {compra.observacoes}
                                  </div>
                                )}
                                <div className="text-muted fs-12">
                                  {[
                                    compra.data_compra ? formatDateBr(compra.data_compra) : null,
                                    compra.parcelas_total && compra.parcelas_total > 1
                                      ? `${compra.parcelas_pagas ?? 0}/${compra.parcelas_total} pagas`
                                      : 'À vista',
                                  ].filter(Boolean).join(' · ')}
                                </div>
                                {compra.cartao_nome && (
                                  <span className="d-inline-flex align-items-center gap-1 mt-1">
                                    {compra.cartao_cor_fundo && (
                                      <CartaoChip
                                        cor_fundo={compra.cartao_cor_fundo}
                                        cor_texto={compra.cartao_cor_texto}
                                        label={String(compra.cartao_nome).slice(0, 1)}
                                      />
                                    )}
                                    <span className="badge bg-light text-muted fw-normal">
                                      {compra.cartao_nome}
                                      {compra.ultimos_digitos ? ` ·••${compra.ultimos_digitos}` : ''}
                                    </span>
                                  </span>
                                )}
                                <div className="mt-1">
                                  <span className={`badge ${statusRepasseBadgeClass[status] ?? ''}`}>
                                    {statusRepasseLabel[status] ?? status}
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
                              {colunas.map((col) => (
                                <CelulaRepasse
                                  key={`${compra.chave_compra}-${col.chave}`}
                                  celula={compra.celulas?.[col.chave]}
                                  coluna={col}
                                  cellId={`rep-${compra.chave_compra}-${col.chave}`.replace(/[^a-zA-Z0-9_-]/g, '_')}
                                  onClick={
                                    compra.celulas?.[col.chave]
                                      ? () => openCelula(compra, col, compra.celulas[col.chave])
                                      : undefined
                                  }
                                />
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-muted small mt-3">
                    Clique na célula para registrar o repasse. Copy: “Repassado” = responsável te pagou (não é quitação da fatura do cartão).
                  </div>
                </CardBody>
              </Card>

              {/* Mobile acordeão */}
              <div className="d-lg-none mb-4">
                {compras.map((compra) => {
                  const open = !!expandedMobile[compra.chave_compra]
                  const status = compra.status_repasse
                  return (
                    <Card key={compra.chave_compra} className="mb-2">
                      <CardBody className="py-3">
                        <button
                          type="button"
                          className="btn btn-link text-start text-decoration-none text-body p-0 w-100"
                          onClick={() =>
                            setExpandedMobile((prev) => ({
                              ...prev,
                              [compra.chave_compra]: !prev[compra.chave_compra],
                            }))
                          }
                        >
                          <div className="d-flex justify-content-between gap-2">
                            <div className="min-w-0">
                              <div className="fw-semibold text-truncate">{compra.estabelecimento || 'Compra'}</div>
                              {compra.observacoes && (
                                <div className="text-muted small text-truncate">{compra.observacoes}</div>
                              )}
                              <span className={`badge ${statusRepasseBadgeClass[status] ?? ''}`}>
                                {statusRepasseLabel[status] ?? status}
                              </span>
                            </div>
                            <div className="text-end">
                              <div className={`small text-danger ${VALOR_TEXT_CLASS}`}>
                                Aberto {formatCurrency(compra.valor_aberto)}
                              </div>
                              <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`}></i>
                            </div>
                          </div>
                        </button>
                        {open && (
                          <div className="mt-3">
                            <div className="d-flex justify-content-between small mb-2">
                              <span>Total {formatCurrency(compra.valor_total)}</span>
                              <span className="text-success">Repassado {formatCurrency(compra.valor_pago)}</span>
                            </div>
                            {colunas.map((col) => {
                              const celula = compra.celulas?.[col.chave]
                              if (!celula) return null
                              return (
                                <button
                                  key={col.chave}
                                  type="button"
                                  className="btn btn-light border w-100 text-start mb-2"
                                  onClick={() => openCelula(compra, col, celula)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span>
                                      {col.label}
                                      {col.referencia ? ' (ref.)' : ''}
                                      <Badge color="light" className="ms-1 text-muted">
                                        {celula.parcelas_total && celula.parcelas_total > 1
                                          ? `${celula.parcela_atual}/${celula.parcelas_total}`
                                          : 'À vista'}
                                      </Badge>
                                    </span>
                                    <span className={VALOR_TEXT_CLASS}>
                                      {formatCurrency(celula.valor_aberto > 0 ? celula.valor_aberto : celula.valor_devido)}
                                      <span className={`badge ms-1 ${statusRepasseBadgeClass[celula.status_repasse] ?? ''}`}>
                                        {statusRepasseLabel[celula.status_repasse] ?? celula.status_repasse}
                                      </span>
                                    </span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </Container>
      </div>

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
    </React.Fragment>
  )
}

export default RepassesResponsavelView
