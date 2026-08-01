import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Row } from 'reactstrap'
import { setActiveMenu } from 'helpers/system_helpers'

/**
 * Placeholder futuro para relatórios por responsável.
 * Backend já possui responsavel_id obrigatório e embrião no dashboard (por_responsavel).
 */
const RelatoriosPage = () => {
    useEffect(() => {
        setActiveMenu('/relatorios')
    }, [])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <Link to="/dashboard" className="me-2">
                                        <i className="bx bx-arrow-back bx-sm"></i>
                                    </Link>
                                    <h4 className="mb-0">Relatórios</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem>
                                        <Link to="/dashboard"><i className="ri-home-5-fill"></i></Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem active>Relatórios</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Card className="card-animate">
                                <CardBody>
                                    <h5 className="card-title">Projeção de Faturas</h5>
                                    <p className="text-muted mb-3">
                                        Previsão de valores por cartão e responsável nos próximos meses.
                                    </p>
                                    <Link to="/projecao-faturas" className="btn btn-soft-primary btn-sm">
                                        Abrir projeção
                                    </Link>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="card-animate">
                                <CardBody>
                                    <h5 className="card-title">Por fatura</h5>
                                    <p className="text-muted mb-0">
                                        O que cada responsável deve por fatura. Em breve.
                                    </p>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="card-animate">
                                <CardBody>
                                    <h5 className="card-title">Por responsável</h5>
                                    <p className="text-muted mb-0">
                                        Visão consolidada por responsável. Em breve.
                                    </p>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default RelatoriosPage
