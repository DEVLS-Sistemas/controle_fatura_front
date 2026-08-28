import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { SubmitHandler, useForm } from 'react-hook-form'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row, Spinner } from 'reactstrap'
import EstatisticasCompraCards from 'Components/Estatisticas/EstatisticasCompraCards'
import PeriodoFiltroCampos from 'Components/Estatisticas/PeriodoFiltroCampos'
import {
    EstatisticasCompra,
    PeriodoFiltro,
    hasPeriodoQuery,
    pickEstatisticas,
    pickPeriodoFiltro,
    pickPeriodoFromSearchParams,
} from 'interfaces/Estatisticas/EstatisticasCompraInterface'
import { EstabelecimentosView } from 'interfaces/Estabelecimentos/EstabelecimentosInterface'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { corCategoria, corPlataforma, corSubcategoria } from 'helpers/cores_tema_helpers'

const EstabelecimentosViewPage = () => {
    const { state } = useLocation()
    const [searchParams] = useSearchParams()
    const { id } = useParams()
    const [record, setRecord] = useState<EstabelecimentosView | null>(state?.source ?? null)
    const [stats, setStats] = useState<EstatisticasCompra | undefined>(
        state?.source ? pickEstatisticas(state.source) : undefined
    )
    const [loadingStats, setLoadingStats] = useState(false)
    const { voltarParaRotaAnterior } = useNavegacao()
    const estabelecimentosService = new EstabelecimentosService()

    const periodoInicial = hasPeriodoQuery(searchParams)
        ? pickPeriodoFromSearchParams(searchParams)
        : pickPeriodoFiltro(state?.periodo)
    const { handleSubmit, control, register, watch, setValue } = useForm<PeriodoFiltro>({
        defaultValues: periodoInicial,
    })
    const [periodo, setPeriodo] = useState<PeriodoFiltro>(periodoInicial)

    const loadRecord = async (recordId: string) => {
        try {
            const view = await estabelecimentosService.getViewEstabelecimentos({ id: recordId, ...periodo })
            if (view) {
                setRecord(view)
                if (view.estatisticas) setStats(pickEstatisticas(view))
            }
        } catch (error) {
            console.error('Erro ao carregar estabelecimento:', error)
            toast.error('Erro ao carregar estabelecimento.')
        }
    }

    const loadStats = async (recordId: string, filtro: PeriodoFiltro) => {
        setLoadingStats(true)
        try {
            const data = await estabelecimentosService.getEstatisticasEstabelecimento(recordId, filtro)
            setStats(data)
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error)
            toast.error('Erro ao carregar estatísticas.')
        } finally {
            setLoadingStats(false)
        }
    }

    const onFiltrar: SubmitHandler<PeriodoFiltro> = async (data) => {
        const next = pickPeriodoFiltro(data)
        setPeriodo(next)
        if (id) await loadStats(id, next)
    }

    useEffect(() => {
        setActiveMenu('/estabelecimentos')
    }, [])

    useEffect(() => {
        if (id) {
            loadRecord(id)
            loadStats(id, periodo)
        }
    }, [id])

    if (!record && !id) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center py-5">Estabelecimento não encontrado.</div>
                </Container>
            </div>
        )
    }

    if (!record) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center py-5">Carregando...</div>
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
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/estabelecimentos"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">Visualizar Estabelecimento</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/estabelecimentos">Estabelecimentos</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Nome</Label>
                                            <p className="mb-0">{record.nome || '-'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Loja</Label>
                                            <p className="mb-0">
                                                {record.loja_id && record.loja_nome ? (
                                                    <Link to={`/lojas/view/${record.loja_id}`} state={{ periodo }}>
                                                        {record.loja_nome}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted">Sem loja</span>
                                                )}
                                            </p>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Label className="form-label fw-semibold">Categoria padrão</Label>
                                            <p className="text-muted mb-0 d-flex align-items-center gap-2">
                                                {record.categoria_padrao_nome ? (
                                                    <>
                                                        <span
                                                            className="d-inline-block rounded-circle"
                                                            title={corCategoria({
                                                                cor: record.categoria_padrao_cor,
                                                                categoria_id: record.categoria_padrao_id,
                                                            })}
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                backgroundColor: corCategoria({
                                                                    cor: record.categoria_padrao_cor,
                                                                    categoria_id: record.categoria_padrao_id,
                                                                }),
                                                            }}
                                                        />
                                                        {record.categoria_padrao_nome}
                                                    </>
                                                ) : '-'}
                                            </p>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Label className="form-label fw-semibold">Subcategoria padrão</Label>
                                            <p className="text-muted mb-0 d-flex align-items-center gap-2">
                                                {record.subcategoria_padrao_nome ? (
                                                    <>
                                                        <span
                                                            className="d-inline-block rounded-circle"
                                                            title={corSubcategoria({
                                                                cor: record.subcategoria_padrao_cor,
                                                                categoria_cor: record.categoria_padrao_cor,
                                                            })}
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                backgroundColor: corSubcategoria({
                                                                    cor: record.subcategoria_padrao_cor,
                                                                    categoria_cor: record.categoria_padrao_cor,
                                                                }),
                                                            }}
                                                        />
                                                        {record.subcategoria_padrao_nome}
                                                    </>
                                                ) : '-'}
                                            </p>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Label className="form-label fw-semibold">Plataforma padrão</Label>
                                            <p className="text-muted mb-0 d-flex align-items-center gap-2">
                                                {record.plataforma_padrao_nome ? (
                                                    <>
                                                        <span
                                                            className="d-inline-block rounded-circle"
                                                            title={corPlataforma({
                                                                cor: record.plataforma_padrao_cor,
                                                                plataforma_id: record.plataforma_padrao_id,
                                                            })}
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                backgroundColor: corPlataforma({
                                                                    cor: record.plataforma_padrao_cor,
                                                                    plataforma_id: record.plataforma_padrao_id,
                                                                }),
                                                            }}
                                                        />
                                                        {record.plataforma_padrao_nome}
                                                    </>
                                                ) : '-'}
                                            </p>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Label className="form-label fw-semibold">Ativo</Label>
                                            <p className="mb-0">
                                                <span className={`badge bg-${record.ativo ? 'success' : 'danger'}`}>
                                                    {record.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </p>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted text-uppercase mb-3">Estatísticas de compra</h6>
                                    <form onSubmit={handleSubmit(onFiltrar)} className="mb-4">
                                        <PeriodoFiltroCampos
                                            control={control}
                                            register={register}
                                            watch={watch}
                                            setValue={setValue}
                                            idPrefix="estabelecimento-view-periodo"
                                        />
                                        <button type="submit" className="btn btn-success btn-sm" disabled={loadingStats}>
                                            {loadingStats ? <Spinner size="sm" className="me-1" /> : null}
                                            Aplicar período
                                        </button>
                                    </form>
                                    <EstatisticasCompraCards
                                        estatisticas={stats}
                                        nomeLocal={record.nome}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <div className="hstack gap-2 justify-content-end mb-4">
                                <Link to={`/estabelecimentos/edit/${record.id}`} state={{ source: record }} className="btn btn-primary">
                                    Editar
                                </Link>
                                <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                    Voltar
                                </button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default EstabelecimentosViewPage
