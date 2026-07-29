import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required, maxLength } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { CartoesDefaultValues, CartoesModel } from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'

const buildRecordFromSource = (source: any): CartoesModel => ({
    ...CartoesDefaultValues,
    ...source,
    id: source.id ?? null,
    cartao_id: source.cartao_id ?? source.id ?? null,
})

const CartoesForm = () => {
    const { state } = useLocation()
    const { cartao_id: routeCartaoId, id: routeId } = useParams()
    const paramId = routeCartaoId ?? routeId

    const [record, setRecord] = useState<CartoesModel>(
        state?.source ? buildRecordFromSource(state.source) : CartoesDefaultValues
    )

    const { register, handleSubmit, control, reset } = useForm<CartoesModel>({
        defaultValues: record
    })

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const cartoesService = new CartoesService()

    const isEditing = !!(record.cartao_id || record.id || paramId)

    const loadRecord = async (id: string | number) => {
        try {
            const view = await cartoesService.getViewCartoes({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar cartão:', error)
            toast.error('Erro ao carregar cartão.')
        }
    }

    const onSubmit: SubmitHandler<CartoesModel> = async (data) => {
        try {
            if (isEditing) {
                await cartoesService.editCartoes(data)
                toast.success('Cartão atualizado com sucesso!')
            } else {
                await cartoesService.createCartoes(data)
                toast.success('Cartão cadastrado com sucesso!')
            }
            navigate('/cartoes')
        } catch (error) {
            console.error('Erro ao salvar cartão:', error)
            toast.error('Erro ao salvar cartão.')
        }
    }

    useEffect(() => {
        setActiveMenu('/cartoes')
    }, [])

    useEffect(() => {
        if (paramId && !state?.source) {
            loadRecord(paramId)
        }
    }, [paramId])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/cartoes"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Cartão
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/cartoes">Cartões de Crédito</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Cartão
                                    </BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="nome" className="form-label">Nome</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="bandeira" className="form-label">Bandeira</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"bandeira"}
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="banco" className="form-label">Banco</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"banco"}
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="ultimos_digitos" className="form-label">Últimos Dígitos</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"ultimos_digitos"}
                                                        control={control}
                                                        maxLength={maxLength(4)}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-check mt-4">
                                                    <input
                                                        {...register('ativo')}
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="ativo"
                                                    />
                                                    <Label className="form-check-label" htmlFor="ativo">Ativo</Label>
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-5">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    <button type="submit" className="btn btn-primary">Salvar</button>
                                                    <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default CartoesForm
