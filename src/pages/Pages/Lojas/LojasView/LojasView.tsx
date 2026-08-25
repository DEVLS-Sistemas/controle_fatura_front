import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { SubmitHandler, useForm } from 'react-hook-form'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { frequenciaLabel } from 'helpers/estatisticas_helpers'
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
import { LojasView } from 'interfaces/Lojas/LojasInterface'
import { LojasService } from 'services/Lojas/LojasService'

const LojasViewPage = () => {
    const { state } = useLocation()
    const [searchParams] = useSearchParams()
    const { id } = useParams()
    const [record, setRecord] = useState<LojasView | null>(state?.source ?? null)
    const [stats, setStats] = useState<EstatisticasCompra | undefined>(
        state?.source ? pickEstatisticas(state.source) : undefined
    )
    const [loadingStats, setLoadingStats] = useState(false)
    const { voltarParaRotaAnterior } = useNavegacao()
    const lojasService = new LojasService()

    const periodoInicial = hasPeriodoQuery(searchParams)
        ? pickPeriodoFromSearchParams(searchParams)
        : pickPeriodoFiltro(state?.periodo)
    const { handleSubmit, control, register, watch, setValue } = useForm<PeriodoFiltro>({
        defaultValues: periodoInicial,
    })
    const [periodo, setPeriodo] = useState<PeriodoFiltro>(periodoInicial)

    const loadRecord = async (recordId: string) => {
        try {
            const view = await lojasService.getViewLojas({ id: recordId, ...periodo })
            if (view) {
                setRecord(view)
                setStats(pickEstatisticas(view))
            }
        } catch (error) {
            console.error('Erro ao carregar loja:', error)
            toast.error('Erro ao carregar loja.')
        }
    }

    const loadStats = async (recordId: string, filtro: PeriodoFiltro) => {
        setLoadingStats(true)
        try {
            const data = await lojasService.getEstatisticasLoja(recordId, filtro)
            setRecord((prev) => ({
                ...(prev ?? {}),
                ...data,
                id: data.id ?? prev?.id,
                nome: data.nome ?? prev?.nome,
            }))
            setStats(pickEstatisticas(data))
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
        setActiveMenu('/lojas')
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
                    <div className="text-center py-5">Loja não encontrada.</div>
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

    const vinculos = record.estabelecimentos ?? []
    const totais = pickEstatisticas(record)

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/lojas"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">Visualizar Loja</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/lojas">Lojas</Link></BreadcrumbItem>
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
                                            <Label className="form-label fw-semibold">Nome fantasia</Label>
                                            <p className="mb-0">{record.nome || '-'}</p>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Label className="form-label fw-semibold">Estabelecimentos</Label>
                                            <p className="text-muted mb-0">
                                                {record.estabelecimentos_count ?? vinculos.length}
                                            </p>
                                        </Col>
                                        <Col md={3} className="mb-3">
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
                                    <h6 className="text-muted text-uppercase mb-3">Total da loja</h6>
                                    <form onSubmit={handleSubmit(onFiltrar)} className="mb-4">
                                        <PeriodoFiltroCampos
                                            control={control}
                                            register={register}
                                            watch={watch}
                                            setValue={setValue}
                                            idPrefix="loja-view-periodo"
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
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted text-uppercase mb-3">Estabelecimentos vinculados</h6>
                                    {vinculos.length === 0 ? (
                                        <p className="text-muted mb-0">
                                            Nenhum estabelecimento vinculado. Associe pela tela de Estabelecimentos.
                                        </p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle table-nowrap table-striped-columns mb-0 text-center">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th scope="col" className="text-start">Estabelecimento</th>
                                                        <th scope="col">Compras</th>
                                                        <th scope="col">Gasto</th>
                                                        <th scope="col" className="text-start">Frequência</th>
                                                        <th scope="col">Ativo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vinculos.map((est) => {
                                                        const item = pickEstatisticas(est)
                                                        return (
                                                            <tr key={est.id}>
                                                                <td className="text-start">
                                                                    <Link
                                                                        to={`/estabelecimentos/view/${est.id}`}
                                                                        state={{ periodo }}
                                                                    >
                                                                        {est.nome}
                                                                    </Link>
                                                                </td>
                                                                <td>{item.compras ?? 0}</td>
                                                                <td className={VALOR_TEXT_CLASS}>{formatCurrency(item.valor_total)}</td>
                                                                <td className="text-start fw-medium">{frequenciaLabel(item)}</td>
                                                                <td>
                                                                    <span className={`badge bg-${est.ativo ? 'success' : 'danger'}`}>
                                                                        {est.ativo ? 'Ativo' : 'Inativo'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="fw-semibold">
                                                        <td className="text-start">Total {record.nome}</td>
                                                        <td>{totais.compras ?? 0}</td>
                                                        <td className={VALOR_TEXT_CLASS}>{formatCurrency(totais.valor_total)}</td>
                                                        <td className="text-start">{frequenciaLabel(totais)}</td>
                                                        <td>—</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <div className="hstack gap-2 justify-content-end mb-4">
                                <Link to={`/lojas/edit/${record.id}`} state={{ source: record }} className="btn btn-primary">
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

export default LojasViewPage
