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
  Row,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'
import {
  CompraNaoEncontradaError,
  CompraVisualizacaoService,
} from 'services/CompraVisualizacao/CompraVisualizacaoService'
import CompraVisualizacaoResumo from './CompraVisualizacaoResumo'
import CompraVisualizacaoDados from './CompraVisualizacaoDados'
import CompraVisualizacaoParcelas from './CompraVisualizacaoParcelas'

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

const CompraVisualizacaoPage = () => {
  const { identificador } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [compra, setCompra] = useState<CompraVisualizacaoView>()
  const service = new CompraVisualizacaoService()

  const mesParam = searchParams.get('mes')
  const anoParam = searchParams.get('ano')

  const handleVoltar = () => {
    const state = location.state as { from?: string; fromRanking?: boolean } | null
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    if (state?.from) {
      navigate(state.from)
      return
    }
    navigate(rankingFallbackPath(mesParam, anoParam))
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
    setActiveMenu('/parceladas')
  }, [])

  useEffect(() => {
    if (identificador) {
      loadCompra(identificador)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identificador, mesParam, anoParam])

  const titulo = compra?.titulo || 'Visualização da compra'
  const subtituloEstabelecimento =
    compra?.titulo_origem === 'observacoes'
      ? compra.estabelecimento?.nome || compra.estabelecimento?.loja_nome
      : null

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
                    </div>
                    {subtituloEstabelecimento ? (
                      <p className="text-muted mb-0 fs-13">{subtituloEstabelecimento}</p>
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
                    <Link to="/parceladas">Parceladas</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active>Compra</BreadcrumbItem>
                </Breadcrumb>
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
              <CompraVisualizacaoResumo compra={compra} />
              <CompraVisualizacaoDados compra={compra} />
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
    </React.Fragment>
  )
}

export default CompraVisualizacaoPage
