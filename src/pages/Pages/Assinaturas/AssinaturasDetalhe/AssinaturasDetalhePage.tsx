import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  UncontrolledTooltip,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { CurrencyValue } from 'Components/Common/CurrencyValue'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatDateBr, origemCompraColor } from 'helpers/fatura_helpers'
import {
  AssinaturaAcao,
  AssinaturaCobranca,
  AssinaturaView,
} from 'interfaces/Assinaturas/AssinaturasInterface'
import {
  AssinaturaNaoEncontradaError,
  AssinaturasService,
} from 'services/Assinaturas/AssinaturasService'
import {
  cobrancaDestino,
  mensagemAcaoAssinatura,
  statusAssinaturaBadge,
  subtittleMaquininha,
} from 'helpers/assinaturas_helpers'
import AssinaturasAcoes from '../AssinaturasAcoes/AssinaturasAcoes'

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const faturaCompetencia = (mes?: number | null, ano?: number | null): string => {
  if (!mes || !ano) return '—'
  return `${MESES_ABREV[mes - 1] || mes}/${ano}`
}

const origemCobranca = (cobranca: AssinaturaCobranca): string =>
  cobranca.origem_compra_label || (cobranca.origem_compra ? String(cobranca.origem_compra) : 'Sem origem')

const AssinaturasDetalheSkeleton = () => (
  <React.Fragment>
    <Row className="g-3 mb-3">
      {[1, 2, 3].map((i) => (
        <Col xl={4} md={4} key={i}>
          <Card className="mb-0">
            <CardBody>
              <div className="placeholder-glow">
                <span className="placeholder col-6 mb-2"></span>
                <span className="placeholder col-8"></span>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
    <Card className="mb-3">
      <CardBody>
        <div className="placeholder-glow">
          <span className="placeholder col-4 mb-2"></span>
          <span className="placeholder col-12 mb-2"></span>
          <span className="placeholder col-10"></span>
        </div>
      </CardBody>
    </Card>
  </React.Fragment>
)

const AssinaturasDetalhePage = () => {
  const { identificador: identificadorParam } = useParams()
  const identificador = identificadorParam ? decodeURIComponent(identificadorParam) : ''
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [assinatura, setAssinatura] = useState<AssinaturaView>()
  const service = new AssinaturasService()

  const loadDetalhe = async (id: string) => {
    setLoading(true)
    setNotFound(false)
    try {
      const result = await service.getViewAssinaturas(id)
      setAssinatura(result)
    } catch (error: any) {
      if (error instanceof AssinaturaNaoEncontradaError || error?.name === 'AssinaturaNaoEncontradaError') {
        setNotFound(true)
        setAssinatura(undefined)
        return
      }
      toast.error(error?.message || 'Erro ao carregar a assinatura')
      setAssinatura(undefined)
    } finally {
      setLoading(false)
    }
  }

  const handleAcao = async (id: string, acao: AssinaturaAcao) => {
    if (acao === 'desfazer_confirmacao') {
      const ok = window.confirm('As cobranças deixam de ser pagamento de serviços. Continuar?')
      if (!ok) return
    }

    setActing(true)
    try {
      let result: any
      if (acao === 'confirmar') {
        result = await service.createAssinaturas({ identificador: id })
      } else if (acao === 'ignorar') {
        result = await service.deleteAssinaturas(id)
      } else {
        result = await service.editAssinaturas({ identificador: id, acao })
      }
      toast.success(mensagemAcaoAssinatura(acao, result?.message || result?.data?.message))
      await loadDetalhe(id)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar assinatura')
    } finally {
      setActing(false)
    }
  }

  const handleOpenCobranca = (cobranca: AssinaturaCobranca) => {
    const to = cobrancaDestino(cobranca)
    if (!to) return
    navigate(to, {
      state: {
        fromAssinaturas: true,
        from: `/assinaturas/${encodeURIComponent(identificador)}`,
      },
    })
  }

  useEffect(() => {
    setActiveMenu('/assinaturas')
  }, [])

  useEffect(() => {
    if (identificador) loadDetalhe(identificador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identificador])

  const badge = statusAssinaturaBadge(assinatura?.status, assinatura?.status_label)
  const maquininha = assinatura ? subtittleMaquininha(assinatura) : null
  const tooltipId = 'periodicidade-assumida-detalhe'
  const estabelecimentos = assinatura?.estabelecimentos ?? []
  const cobrancas = assinatura?.cobrancas_recentes ?? []

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <div className="d-flex align-items-start" style={{ minWidth: 0 }}>
                  <Link to="/assinaturas" className="me-2 mt-1 text-body">
                    <i className="bx bx-arrow-back bx-sm"></i>
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <h4 className="mb-0 text-truncate">
                        {loading ? 'Carregando assinatura…' : assinatura?.titulo || 'Assinatura'}
                      </h4>
                      {assinatura?.periodicidade_label ? (
                        <Badge
                          color="info"
                          pill
                          id={assinatura.periodicidade_assumida ? tooltipId : undefined}
                        >
                          {assinatura.periodicidade_label}
                          {assinatura.periodicidade_assumida ? (
                            <i className="ri-information-line ms-1"></i>
                          ) : null}
                        </Badge>
                      ) : null}
                      {assinatura ? (
                        <Badge color={badge.color} pill>
                          {badge.label}
                        </Badge>
                      ) : null}
                    </div>
                    {maquininha ? (
                      <p className="text-muted mb-0 fs-13">{maquininha}</p>
                    ) : null}
                  </div>
                </div>
                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                  <BreadcrumbItem>
                    <Link to="/dashboard">
                      <i className="ri-home-5-fill"></i>
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <Link to="/assinaturas">Assinaturas</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active>Detalhe</BreadcrumbItem>
                </Breadcrumb>
              </div>
            </Col>
          </Row>

          {assinatura?.periodicidade_assumida ? (
            <UncontrolledTooltip placement="top" target={tooltipId}>
              Assumimos mensal porque só há 1 cobrança já marcada como serviço
            </UncontrolledTooltip>
          ) : null}

          {loading ? (
            <AssinaturasDetalheSkeleton />
          ) : notFound ? (
            <Card>
              <CardBody className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                    <i className="ri-search-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Assinatura não encontrada</h5>
                <p className="text-muted mb-3">
                  Este grupo não existe ou não pertence à sua conta.
                </p>
                <Link to="/assinaturas" className="btn btn-primary">
                  Voltar
                </Link>
              </CardBody>
            </Card>
          ) : assinatura ? (
            <React.Fragment>
              <Row className="g-3 mb-3">
                <Col xl={4} md={4}>
                  <Card className="mb-0">
                    <CardBody>
                      <p className="text-uppercase fw-medium text-muted mb-0">Por ano</p>
                      <h4 className="fs-22 fw-semibold mb-0">
                        <CurrencyValue value={assinatura.estimativa_anual} />
                      </h4>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={4}>
                  <Card className="mb-0">
                    <CardBody>
                      <p className="text-uppercase fw-medium text-muted mb-0">Por cobrança</p>
                      <h4 className="fs-22 fw-semibold mb-0">
                        <CurrencyValue value={assinatura.valor_medio} />
                      </h4>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={4}>
                  <Card className="mb-0">
                    <CardBody>
                      <p className="text-uppercase fw-medium text-muted mb-0">Últimos 12 meses</p>
                      <h4 className="fs-22 fw-semibold mb-0">
                        <CurrencyValue value={assinatura.gasto_12_meses} />
                      </h4>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Card className="mb-3">
                <CardBody>
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        {assinatura.categoria_nome ? (
                          <Badge
                            color="light"
                            className="text-body"
                            style={
                              assinatura.categoria_cor
                                ? { borderLeft: `3px solid ${assinatura.categoria_cor}` }
                                : undefined
                            }
                          >
                            {assinatura.categoria_nome}
                          </Badge>
                        ) : null}
                        {assinatura.responsavel_nome ? (
                          <Badge color="light" className="text-body">
                            {assinatura.responsavel_nome}
                          </Badge>
                        ) : null}
                        {assinatura.confianca_label ? (
                          <span className="text-muted fs-12">
                            Confiança {assinatura.confianca_label.toLowerCase()}
                          </span>
                        ) : null}
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2 text-muted fs-13 mb-2">
                        {assinatura.primeira_cobranca ? (
                          <span>Primeira: {formatDateBr(assinatura.primeira_cobranca)}</span>
                        ) : null}
                        {assinatura.primeira_cobranca && assinatura.ultima_cobranca ? (
                          <i className="ri-arrow-right-line"></i>
                        ) : null}
                        {assinatura.ultima_cobranca ? (
                          <span>Última: {formatDateBr(assinatura.ultima_cobranca)}</span>
                        ) : null}
                        {assinatura.proxima_estimada ? (
                          <span>· Próxima (est.): {formatDateBr(assinatura.proxima_estimada)}</span>
                        ) : null}
                      </div>

                      {assinatura.cobrancas != null ? (
                        <p className="text-muted mb-0 fs-13">
                          {assinatura.cobrancas} {assinatura.cobrancas === 1 ? 'cobrança' : 'cobranças'}
                          {assinatura.cobrancas_pendentes
                            ? ` · ${assinatura.cobrancas_pendentes} ainda sem origem de serviço`
                            : ''}
                        </p>
                      ) : null}

                      {estabelecimentos.length > 1 ? (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {estabelecimentos.map((est) => (
                            <Badge key={est.id ?? est.nome} color="light" className="text-body">
                              {est.nome}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <AssinaturasAcoes
                      item={assinatura}
                      acting={acting}
                      onAcao={handleAcao}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Cobranças recentes</h5>
                </CardHeader>
                <CardBody className="p-0">
                  {cobrancas.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">Nenhuma cobrança recente.</p>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Data</th>
                            <th className="text-end">Valor</th>
                            <th>Origem</th>
                            <th>Estabelecimento</th>
                            <th>Fatura</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cobrancas.map((cobranca, index) => {
                            const destino = cobrancaDestino(cobranca)
                            const origem = origemCobranca(cobranca)
                            return (
                              <tr
                                key={String(cobranca.id ?? cobranca.transacao_id ?? index)}
                                role={destino ? 'button' : undefined}
                                onClick={() => destino && handleOpenCobranca(cobranca)}
                                style={destino ? { cursor: 'pointer' } : undefined}
                                title={destino ? 'Ver compra' : undefined}
                              >
                                <td>{formatDateBr(cobranca.data)}</td>
                                <td className="text-end">
                                  <CurrencyValue value={cobranca.valor} className="fw-semibold" />
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-1">
                                    <Badge
                                      color={origemCompraColor[cobranca.origem_compra || ''] ?? 'secondary'}
                                      pill
                                    >
                                      {origem}
                                    </Badge>
                                    {cobranca.confirmada ? (
                                      <Badge color="success" pill>
                                        Serviço
                                      </Badge>
                                    ) : null}
                                  </div>
                                </td>
                                <td>{cobranca.estabelecimento_nome || '—'}</td>
                                <td>{faturaCompetencia(cobranca.fatura_mes, cobranca.fatura_ano)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </React.Fragment>
          ) : (
            <Card>
              <CardBody className="text-center py-5">
                <h5 className="mb-1">Não foi possível carregar a assinatura</h5>
                <Button color="soft-primary" className="mt-2" onClick={() => navigate('/assinaturas')}>
                  Voltar
                </Button>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default AssinaturasDetalhePage
