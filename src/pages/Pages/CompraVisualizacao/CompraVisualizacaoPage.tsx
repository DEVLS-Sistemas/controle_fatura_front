import React, { useEffect, useState } from 'react'
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
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import {
  CompraNaoEncontradaError,
  CompraVisualizacaoService,
} from 'services/CompraVisualizacao/CompraVisualizacaoService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import {
  compraToEditSource,
  faturaIdDaCompra,
  badgeConciliacaoColor,
  badgeConciliacaoStyle,
  isCompraManual,
  precisaConciliarCompra,
  labelPrecisaConciliar,
  origemLancamentoCompra,
  textoCompraDaCompra,
  LABEL_ESTABELECIMENTO_VAZIO,
} from 'helpers/cadastro_manual_compra_helpers'
import CompraVisualizacaoResumo from './CompraVisualizacaoResumo'
import CompraVisualizacaoDados from './CompraVisualizacaoDados'
import CompraVisualizacaoParcelas from './CompraVisualizacaoParcelas'
import CompraVisualizacaoConciliacao from './CompraVisualizacaoConciliacao'
import CompraVisualizacaoAnexos from './CompraVisualizacaoAnexos'
import CompraVisualizacaoHistorico from './CompraVisualizacaoHistorico'

const CompraVisualizacaoSkeleton = () => (
  <React.Fragment>
    <Row className="g-3 mb-3">
      {[1, 2, 3, 4].map((i) => (
        <Col xl={3} md={6} key={i}>
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
          <span className="placeholder col-8"></span>
        </div>
      </CardBody>
    </Card>
    <Card>
      <CardBody>
        <div className="placeholder-glow">
          <span className="placeholder col-12 mb-2"></span>
          <span className="placeholder col-12 mb-2"></span>
          <span className="placeholder col-10"></span>
        </div>
      </CardBody>
    </Card>
  </React.Fragment>
)

const rankingFallbackPath = (mes?: string | null, ano?: string | null): string => {
  const params = new URLSearchParams()
  if (mes) params.set('mes', mes)
  if (ano) params.set('ano', ano)
  const qs = params.toString()
  return qs ? `/parceladas?${qs}` : '/parceladas'
}

type CompraVisualizacaoLocationState = {
  from?: string
  fromRanking?: boolean
  fromAssinaturas?: boolean
} | null

const veioDeAssinaturas = (state: CompraVisualizacaoLocationState): boolean =>
  Boolean(state?.fromAssinaturas || state?.from?.startsWith('/assinaturas'))

const veioDeTransacoes = (state: CompraVisualizacaoLocationState): boolean =>
  Boolean(state?.from === '/transacoes' || state?.from?.startsWith('/transacoes'))

const veioDeFatura = (state: CompraVisualizacaoLocationState): boolean =>
  Boolean(state?.from?.startsWith('/faturas'))

const CompraVisualizacaoPage = () => {
  const { identificador } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [compra, setCompra] = useState<CompraVisualizacaoView>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const service = new CompraVisualizacaoService()
  const transacoesService = new TransacoesService()

  const mesParam = searchParams.get('mes')
  const anoParam = searchParams.get('ano')

  const locationState = location.state as CompraVisualizacaoLocationState
  const fromAssinaturas = veioDeAssinaturas(locationState)
  const fromTransacoes = veioDeTransacoes(locationState)
  const fromFatura = veioDeFatura(locationState)

  const handleVoltar = () => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    if (locationState?.from) {
      navigate(locationState.from)
      return
    }
    if (fromAssinaturas) {
      navigate('/assinaturas')
      return
    }
    navigate(rankingFallbackPath(mesParam, anoParam))
  }

  const handleEditar = () => {
    if (!compra) return
    const source = compraToEditSource(compra)
    const editId = source.id ?? source.transacao_id
    if (!editId) {
      toast.error('Não foi possível abrir a edição desta compra')
      return
    }
    navigate(`/transacoes/edit/${editId}`, {
      state: {
        source,
        returnTo: `${location.pathname}${location.search}`,
      },
    })
  }

  const handleExcluir = async (excluirGrupo = false) => {
    const id = compra?.transacao_id ?? compra?.parcelas?.[0]?.id
    if (!id || deleting) return
    setDeleting(true)
    try {
      await transacoesService.deleteTransacoes(id, { excluir_grupo: excluirGrupo })
      toast.success(
        excluirGrupo
          ? 'Todas as parcelas da compra foram excluídas'
          : 'Compra excluída com sucesso'
      )
      setDeleteOpen(false)
      if (locationState?.from) {
        navigate(locationState.from)
      } else if (fromAssinaturas) {
        navigate('/assinaturas')
      } else {
        navigate('/transacoes')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir a compra')
    } finally {
      setDeleting(false)
    }
  }

  const loadCompra = async (id: string) => {
    setLoading(true)
    setNotFound(false)
    try {
      const mes = Number(mesParam)
      const ano = Number(anoParam)
      const result = await service.getVisualizarCompra(id, {
        mes: Number.isFinite(mes) && mes > 0 ? mes : null,
        ano: Number.isFinite(ano) && ano > 0 ? ano : null,
      })
      if (result) {
        try {
          const anexos = await transacoesService.listAnexosTransacao({
            identificador: id,
            transacao_id: result.transacao_id ?? undefined,
          })
          result.anexos = anexos
        } catch {
          // visualização pode já trazer anexos
        }
      }
      setCompra(result)
    } catch (error: any) {
      if (error instanceof CompraNaoEncontradaError || error?.name === 'CompraNaoEncontradaError') {
        setNotFound(true)
        setCompra(undefined)
        return
      }
      toast.error(error?.message || 'Erro ao carregar a compra')
      setCompra(undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fromAssinaturas) setActiveMenu('/assinaturas')
    else if (fromTransacoes) setActiveMenu('/transacoes')
    else if (fromFatura) setActiveMenu('/faturas')
    else setActiveMenu('/parceladas')
  }, [fromAssinaturas, fromTransacoes, fromFatura])

  useEffect(() => {
    if (identificador) {
      loadCompra(identificador)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identificador, mesParam, anoParam])

  const titulo = textoCompraDaCompra(compra) || 'Visualização da compra'
  const estabelecimentoNome = compra?.estabelecimento?.nome?.trim()
  const subtituloEstabelecimento = `Estabelecimento ${estabelecimentoNome || LABEL_ESTABELECIMENTO_VAZIO}`
  const statusConciliacao = compra?.conciliacao?.status
  const precisaConciliar = precisaConciliarCompra({
    precisa_conciliar: compra?.precisa_conciliar,
    compra_manual: compra?.compra_manual,
    status_conciliacao: statusConciliacao,
  })
  const origemLancamento = origemLancamentoCompra(compra)
  const mostrarConciliacao = precisaConciliar || isCompraManual(compra)
  const faturaId = faturaIdDaCompra(compra)
  const ehParcelada = Boolean(compra?.compra_grupo_id) && !compra?.avista

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <div className="d-flex align-items-start" style={{ minWidth: 0 }}>
                  <button
                    type="button"
                    className="btn btn-link text-body p-0 me-2 mt-1"
                    onClick={handleVoltar}
                    title="Voltar"
                  >
                    <i className="bx bx-arrow-back bx-sm"></i>
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <h4 className="mb-0 text-truncate">{loading ? 'Carregando compra…' : titulo}</h4>
                      {compra?.avista ? (
                        <Badge color="secondary" pill>
                          À vista
                        </Badge>
                      ) : compra?.parcela_atual != null && compra?.parcelas_total != null ? (
                        <Badge color="primary" pill>
                          {compra.parcela_atual}/{compra.parcelas_total}
                        </Badge>
                      ) : null}
                      {compra?.quitada ? (
                        <Badge color="success" pill>
                          Quitada
                        </Badge>
                      ) : null}
                      {precisaConciliar ? (
                        <Badge
                          color="warning"
                          pill
                          style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
                        >
                          <i className="ri-alert-line me-1"></i>
                          {labelPrecisaConciliar(compra)}
                        </Badge>
                      ) : origemLancamento ? (
                        <Badge color={origemLancamento.tone} pill>
                          {origemLancamento.label}
                        </Badge>
                      ) : null}
                      {mostrarConciliacao && statusConciliacao ? (
                        <Badge
                          color={badgeConciliacaoColor(statusConciliacao)}
                          pill
                          style={badgeConciliacaoStyle(statusConciliacao)}
                        >
                          {compra?.conciliacao?.status_label || statusConciliacao}
                        </Badge>
                      ) : null}
                    </div>
                    {subtituloEstabelecimento ? (
                      <p className="text-muted mb-0 fs-13">{subtituloEstabelecimento}</p>
                    ) : null}
                  </div>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-sm-0 pt-1">
                  {compra ? (
                    <>
                      <Button color="primary" outline size="sm" onClick={handleEditar}>
                        <i className="ri-pencil-line me-1"></i>
                        Editar
                      </Button>
                      {faturaId ? (
                        <Link to={`/faturas/view/${faturaId}`} className="btn btn-soft-info btn-sm">
                          <i className="ri-file-list-3-line me-1"></i>
                          Ver fatura
                        </Link>
                      ) : null}
                      <Button color="danger" outline size="sm" onClick={() => setDeleteOpen(true)}>
                        <i className="ri-delete-bin-line me-1"></i>
                        Excluir
                      </Button>
                    </>
                  ) : null}
                  <Breadcrumb pageTitle="" listClassName="mb-0 py-1">
                    <BreadcrumbItem>
                      <Link to="/dashboard">
                        <i className="ri-home-5-fill"></i>
                      </Link>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                      {fromAssinaturas ? (
                        <Link to="/assinaturas">Assinaturas</Link>
                      ) : fromTransacoes ? (
                        <Link to="/transacoes">Transações</Link>
                      ) : fromFatura && locationState?.from ? (
                        <Link to={locationState.from}>Fatura</Link>
                      ) : (
                        <Link to="/parceladas">Parceladas</Link>
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbItem active>Compra</BreadcrumbItem>
                  </Breadcrumb>
                </div>
              </div>
            </Col>
          </Row>

          {loading ? (
            <CompraVisualizacaoSkeleton />
          ) : notFound ? (
            <Card>
              <CardBody className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                    <i className="ri-search-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Compra não encontrada</h5>
                <p className="text-muted mb-3">
                  Esta compra não existe ou não pertence à sua conta.
                </p>
                <Button color="primary" onClick={handleVoltar}>
                  Voltar
                </Button>
              </CardBody>
            </Card>
          ) : compra ? (
            <React.Fragment>
              {precisaConciliar ? (
                <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                  <i className="ri-alert-line fs-18 mt-1"></i>
                  <div>
                    <strong>{labelPrecisaConciliar(compra)}</strong>
                    <div className="small mb-0">
                      Compra lançada à mão. O estabelecimento aparece como {LABEL_ESTABELECIMENTO_VAZIO} até conciliar com o lançamento da fatura.
                    </div>
                  </div>
                </div>
              ) : null}
              <CompraVisualizacaoResumo compra={compra} />
              {mostrarConciliacao ? (
                <CompraVisualizacaoConciliacao
                  compra={compra}
                  onChanged={() => identificador && loadCompra(identificador)}
                />
              ) : null}
              <CompraVisualizacaoDados compra={compra} />
              <CompraVisualizacaoAnexos
                compra={compra}
                onChanged={() => identificador && loadCompra(identificador)}
              />
              <CompraVisualizacaoHistorico compra={compra} />
              <CompraVisualizacaoParcelas compra={compra} />
            </React.Fragment>
          ) : (
            <Card>
              <CardBody className="text-center py-5">
                <h5 className="mb-1">Não foi possível carregar a compra</h5>
                <Button color="soft-primary" className="mt-2" onClick={handleVoltar}>
                  Voltar
                </Button>
              </CardBody>
            </Card>
          )}
        </Container>
      </div>

      <Modal isOpen={deleteOpen} toggle={() => !deleting && setDeleteOpen(false)} centered>
        <ModalHeader toggle={() => !deleting && setDeleteOpen(false)}>
          Confirmação de exclusão
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <i className="ri-delete-bin-line display-5 text-danger"></i>
          {ehParcelada ? (
            <>
              <p className="mt-3 mb-1">Esta compra possui múltiplas parcelas.</p>
              <p className="text-muted small mb-4">
                Excluir só a parcela atual ou todas as parcelas da compra?
              </p>
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                <Button color="light" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button color="warning" onClick={() => handleExcluir(false)} disabled={deleting}>
                  Só esta parcela
                </Button>
                <Button color="danger" onClick={() => handleExcluir(true)} disabled={deleting}>
                  Todas as parcelas
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 mb-4">Deseja realmente excluir esta compra?</p>
              <div className="d-flex gap-2 justify-content-center">
                <Button color="light" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button color="danger" onClick={() => handleExcluir(false)} disabled={deleting}>
                  Excluir
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </React.Fragment>
  )
}

export default CompraVisualizacaoPage
