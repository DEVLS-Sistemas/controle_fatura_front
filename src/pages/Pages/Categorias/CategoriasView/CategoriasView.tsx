import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { CategoriasView } from 'interfaces/Categorias/CategoriasInterface'
import { CategoriasService } from 'services/Categorias/CategoriasService'
import { corCategoria } from 'helpers/cores_tema_helpers'

const CategoriasViewPage = () => {
    const { state } = useLocation()
    const { id } = useParams()
    const [record, setRecord] = useState<CategoriasView | null>(state?.source ?? null)
    const { voltarParaRotaAnterior } = useNavegacao()
    const categoriasService = new CategoriasService()

    const loadRecord = async (recordId: string) => {
        try {
            const view = await categoriasService.getViewCategorias({ id: recordId })
            if (view) setRecord(view)
        } catch (error) {
            console.error('Erro ao carregar categoria:', error)
            toast.error('Erro ao carregar categoria.')
        }
    }

    useEffect(() => {
        setActiveMenu('/categorias')
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

    const cor = corCategoria({
        cor: record.cor,
        categoria_id: record.id,
    })

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/categorias"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">Visualizar Categoria</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/categorias">Categorias</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar Categoria</BreadcrumbItem>
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
                                            <p className="text-muted mb-0">{record.nome}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Cor</Label>
                                            <p className="mb-0">
                                                <span className="d-flex align-items-center gap-2">
                                                    <span
                                                        className="d-inline-block rounded border"
                                                        style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            backgroundColor: cor,
                                                        }}
                                                    />
                                                    <span className="text-muted">{cor}</span>
                                                </span>
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
                                                <Link to={`/categorias/edit/${record.id}`} state={{ source: record }} className="btn btn-primary">
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

export default CategoriasViewPage
