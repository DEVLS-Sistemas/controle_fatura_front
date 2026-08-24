import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { AnosSelect } from 'helpers/functions_helpers'
import { responsavelTipoColor } from 'helpers/fatura_helpers'
import {
    MESES_NOMES_PT,
    buildComprasAtalhoPath,
    buildFaturaResponsavelAtalhoPath,
    buildPessoaViewPath,
    buildRankingAtalhoPath,
    buildRepassesAtalhoPath,
    parseCompetenciaQuery,
    shiftCompetencia,
} from 'helpers/responsavel_visualizar_helpers'
import { ResponsavelVisualizarView } from 'interfaces/Responsaveis/ResponsaveisInterface'
import {
    ResponsaveisService,
    ResponsavelNaoEncontradoError,
} from 'services/Responsaveis/ResponsaveisService'
import ResponsaveisVisualizarContadores from './ResponsaveisVisualizarContadores'
import ResponsaveisVisualizarRelacionados from './ResponsaveisVisualizarRelacionados'

const ResponsaveisVisualizarSkeleton = () => (
    <React.Fragment>
        <Row className="g-3 mb-3">
            {[1, 2, 3, 4].map((i) => (
                <Col xl={3} md={6} key={i}>
                    <Card className="mb-0">
                        <CardBody>
                            <div className="placeholder-glow">
                                <span className="placeholder col-6 mb-2"></span>
                                <span className="placeholder col-8"></span>
                                <span className="placeholder col-4"></span>
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

const ResponsaveisVisualizarPage = () => {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [data, setData] = useState<ResponsavelVisualizarView>()
    const service = useMemo(() => new ResponsaveisService(), [])

    const { mes, ano } = parseCompetenciaQuery(searchParams.get('mes'), searchParams.get('ano'))
    const anterior = shiftCompetencia(mes, ano, -1)
    const proxima = shiftCompetencia(mes, ano, 1)
    const optAnos = AnosSelect({ anosFuturos: 4 })

    const handleVoltar = () => {
        if (location.key !== 'default') {
            navigate(-1)
            return
        }
        navigate('/responsaveis')
    }

    const goCompetencia = useCallback((nextMes: number, nextAno: number) => {
        if (!id) return
        const next = new URLSearchParams(searchParams)
        next.set('mes', String(nextMes))
        next.set('ano', String(nextAno))
        navigate(`${location.pathname}?${next.toString()}`, { state: location.state })
    }, [id, searchParams, navigate, location.state, location.pathname])

    const loadData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setNotFound(false)
        try {
            const result = await service.getVisualizarResponsavel(id, { mes, ano })
            setData(result)
        } catch (error: any) {
            if (error instanceof ResponsavelNaoEncontradoError || error?.name === 'ResponsavelNaoEncontradoError') {
                setNotFound(true)
                setData(undefined)
                return
            }
            toast.error(error?.message || 'Erro ao carregar o responsável')
            setData(undefined)
        } finally {
            setLoading(false)
        }
    }, [id, mes, ano, service])

    useEffect(() => {
        setActiveMenu('/responsaveis')
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

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

    const fallbackRef = data
        ? { id: data.id, mes: data.referencia?.mes ?? mes, ano: data.referencia?.ano ?? ano }
        : (id ? { id, mes, ano } : null)

    const faturaPath = buildFaturaResponsavelAtalhoPath(data?.atalhos?.fatura_responsavel, fallbackRef || undefined)
    const repassesPath = buildRepassesAtalhoPath(data?.atalhos?.repasses, fallbackRef || undefined)
    const rankingPath = buildRankingAtalhoPath(data?.atalhos?.ranking_parceladas, fallbackRef || undefined)
    const comprasPath = buildComprasAtalhoPath(data?.atalhos?.compras, data?.id ?? id)
    const pessoaPath = buildPessoaViewPath(data?.pessoa?.id)
    const tipoLabel = data?.tipo_label || (data?.tipo
        ? data.tipo.charAt(0).toUpperCase() + data.tipo.slice(1)
        : null)
    const semCompras = Boolean(data && Number(data.totais?.compras ?? 0) === 0)

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
                                            <h4 className="mb-0 text-truncate">
                                                {loading ? 'Carregando responsável…' : (data?.nome || 'Visualizar responsável')}
                                            </h4>
                                            {tipoLabel ? (
                                                <Badge color={responsavelTipoColor[data?.tipo ?? ''] ?? 'secondary'}>
                                                    {tipoLabel}
                                                </Badge>
                                            ) : null}
                                            {data?.eh_eu ? <Badge color="info">Você</Badge> : null}
                                            {data && data.ativo === false ? <Badge color="danger">Inativo</Badge> : null}
                                        </div>
                                        {data?.pessoa?.nome_completo && pessoaPath ? (
                                            <p className="text-muted mb-0 fs-13">
                                                Titular:{' '}
                                                <Link to={pessoaPath}>{data.pessoa.nome_completo}</Link>
                                            </p>
                                        ) : data?.pessoa?.nome_completo ? (
                                            <p className="text-muted mb-0 fs-13">
                                                Titular: {data.pessoa.nome_completo}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem>
                                        <Link to="/dashboard"><i className="ri-home-5-fill"></i></Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem>
                                        <Link to="/responsaveis">Responsáveis</Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            title={`Competência anterior (${String(anterior.mes).padStart(2, '0')}/${anterior.ano})`}
                            onClick={() => goCompetencia(anterior.mes, anterior.ano)}
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Anterior
                        </Button>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <Input
                                type="select"
                                bsSize="sm"
                                style={{ width: 140 }}
                                value={mes}
                                onChange={(e) => goCompetencia(Number(e.target.value), ano)}
                            >
                                {MESES_NOMES_PT.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </Input>
                            <Input
                                type="select"
                                bsSize="sm"
                                style={{ width: 100 }}
                                value={ano}
                                onChange={(e) => goCompetencia(mes, Number(e.target.value))}
                            >
                                {optAnos.map((item) => (
                                    <option key={String(item.value)} value={item.value}>{item.label}</option>
                                ))}
                            </Input>
                            <span className="text-muted small">
                                {data?.referencia?.label || `${String(mes).padStart(2, '0')}/${ano}`}
                            </span>
                        </div>
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            title={`Próxima competência (${String(proxima.mes).padStart(2, '0')}/${proxima.ano})`}
                            onClick={() => goCompetencia(proxima.mes, proxima.ano)}
                        >
                            Próxima
                            <i className="ri-arrow-right-line ms-1"></i>
                        </Button>
                    </div>

                    {id ? (
                        <div className="d-flex flex-wrap gap-2 justify-content-end mb-3">
                            {faturaPath ? (
                                <Link to={faturaPath} className="btn btn-primary">
                                    <i className="ri-file-list-3-line align-middle me-1"></i>
                                    Fatura do responsável
                                </Link>
                            ) : null}
                            {repassesPath && !data?.eh_eu ? (
                                <Link to={repassesPath} className="btn btn-soft-success">
                                    <i className="ri-hand-coin-line align-middle me-1"></i>
                                    Controle de repasses
                                </Link>
                            ) : null}
                            {rankingPath ? (
                                <Link to={rankingPath} className="btn btn-soft-warning">
                                    <i className="ri-time-line align-middle me-1"></i>
                                    Parceladas em aberto
                                </Link>
                            ) : null}
                            {comprasPath ? (
                                <Link to={comprasPath} className="btn btn-soft-secondary">
                                    <i className="ri-shopping-bag-3-line align-middle me-1"></i>
                                    Todas as compras
                                </Link>
                            ) : null}
                            <Link to={`/responsaveis/edit/${id}`} className="btn btn-soft-info">
                                <i className="ri-pencil-line align-middle me-1"></i>
                                Editar
                            </Link>
                        </div>
                    ) : null}

                    {loading ? (
                        <ResponsaveisVisualizarSkeleton />
                    ) : notFound ? (
                        <Card>
                            <CardBody className="text-center py-5">
                                <div className="avatar-md mx-auto mb-3">
                                    <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                                        <i className="ri-user-unfollow-line"></i>
                                    </span>
                                </div>
                                <h5 className="mb-1">Responsável não encontrado</h5>
                                <p className="text-muted mb-3">
                                    Este responsável não existe ou não pertence à sua conta.
                                </p>
                                <Button color="primary" onClick={handleVoltar}>
                                    Voltar
                                </Button>
                            </CardBody>
                        </Card>
                    ) : data ? (
                        <React.Fragment>
                            {semCompras ? (
                                <div className="alert alert-info border-0 mb-3" role="alert">
                                    Nenhuma compra deste responsável.
                                </div>
                            ) : null}
                            <ResponsaveisVisualizarContadores data={data} />
                            <ResponsaveisVisualizarRelacionados data={data} />
                        </React.Fragment>
                    ) : (
                        <Card>
                            <CardBody className="text-center py-5">
                                <h5 className="mb-1">Não foi possível carregar o responsável</h5>
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

export default ResponsaveisVisualizarPage
