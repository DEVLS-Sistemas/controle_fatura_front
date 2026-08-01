import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { CartoesView } from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'

const CartoesViewPage = () => {
    const { state } = useLocation()
    const { id } = useParams()
    const [record, setRecord] = useState<CartoesView | null>(state?.source ?? null)
    const { voltarParaRotaAnterior } = useNavegacao()
    const cartoesService = new CartoesService()

    const loadRecord = async (recordId: string) => {
        try {
            const view = await cartoesService.getViewCartoes({ id: recordId })
            if (view) setRecord(view)
        } catch (error) {
            console.error('Erro ao carregar cartão:', error)
            toast.error('Erro ao carregar cartão.')
        }
    }

    useEffect(() => {
        setActiveMenu('/cartoes')
    }, [])

    useEffect(() => {
        if (id && !state?.source) {
            loadRecord(id)
        }
    }, [id])

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
                                    <Link to="/cartoes"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">Visualizar Cartão</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/cartoes">Cartões de Crédito</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar Cartão</BreadcrumbItem>
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
                                            <p className="text-muted mb-0 d-flex align-items-center gap-2">
                                                {record.cor_fundo && (
                                                    <CartaoChip
                                                        cor_fundo={record.cor_fundo}
                                                        cor_texto={record.cor_texto}
                                                        label={record.nome ? String(record.nome).slice(0, 1) : '•'}
                                                    />
                                                )}
                                                {record.nome}
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Bandeira</Label>
                                            <p className="text-muted mb-0">{record.bandeira || '-'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Banco</Label>
                                            <p className="text-muted mb-0">{record.banco || '-'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Últimos Dígitos</Label>
                                            <p className="text-muted mb-0">{record.ultimos_digitos || '-'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Dia limite da fatura</Label>
                                            <p className="text-muted mb-0">
                                                {record.dia_limite_fatura != null
                                                    ? String(record.dia_limite_fatura).padStart(2, '0')
                                                    : '-'}
                                            </p>
                                            <small className="text-muted">
                                                Compras até este dia entram na fatura do mês
                                            </small>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Dia de vencimento</Label>
                                            <p className="text-muted mb-0">
                                                {record.dia_vencimento_fatura != null
                                                    ? String(record.dia_vencimento_fatura).padStart(2, '0')
                                                    : '-'}
                                            </p>
                                            <small className="text-muted">
                                                Data limite para pagamento
                                            </small>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Cores</Label>
                                            <p className="mb-0 d-flex align-items-center gap-2">
                                                {record.cor_fundo ? (
                                                    <>
                                                        <CartaoChip
                                                            cor_fundo={record.cor_fundo}
                                                            cor_texto={record.cor_texto}
                                                            label={record.nome || 'Cartão'}
                                                        />
                                                        <span className="text-muted small">
                                                            {record.cor_fundo} / {record.cor_texto || '-'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Ativo</Label>
                                            <p className="mb-0">
                                                <span className={`badge bg-${record.ativo ? 'success' : 'danger'}`}>
                                                    {record.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </p>
                                        </Col>
                                    </Row>
                                    <hr />
                                    <Row className="mt-3">
                                        <Col md={12}>
                                            <div className="hstack gap-2 justify-content-end">
                                                <Link to={`/cartoes/edit/${record.id}`} state={{ source: record }} className="btn btn-primary">
                                                    Editar
                                                </Link>
                                                <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                                    Voltar
                                                </button>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default CartoesViewPage
