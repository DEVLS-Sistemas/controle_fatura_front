import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { CategoriasDefaultValues, CategoriasModel } from 'interfaces/Categorias/CategoriasInterface'
import { CategoriasService } from 'services/Categorias/CategoriasService'

const buildRecordFromSource = (source: any): CategoriasModel => ({
    ...CategoriasDefaultValues,
    ...source,
    id: source.id ?? null,
    categoria_id: source.categoria_id ?? source.id ?? null,
})

const CategoriasForm = () => {
    const { state } = useLocation()
    const { categoria_id: routeCategoriaId, id: routeId } = useParams()
    const paramId = routeCategoriaId ?? routeId

    const [record, setRecord] = useState<CategoriasModel>(
        state?.source ? buildRecordFromSource(state.source) : CategoriasDefaultValues
    )

    const { register, handleSubmit, control, reset, setValue, watch } = useForm<CategoriasModel>({
        defaultValues: record
    })

    const corValue = watch('cor') || '#000000'

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const categoriasService = new CategoriasService()

    const isEditing = !!(record.categoria_id || record.id || paramId)

    const loadRecord = async (id: string | number) => {
        try {
            const view = await categoriasService.getViewCategorias({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar categoria:', error)
            toast.error('Erro ao carregar categoria.')
        }
    }

    const onSubmit: SubmitHandler<CategoriasModel> = async (data) => {
        try {
            if (isEditing) {
                await categoriasService.editCategorias(data)
                toast.success('Categoria atualizada com sucesso!')
            } else {
                await categoriasService.createCategorias(data)
                toast.success('Categoria cadastrada com sucesso!')
            }
            navigate('/categorias')
        } catch (error) {
            console.error('Erro ao salvar categoria:', error)
            toast.error('Erro ao salvar categoria.')
        }
    }

    useEffect(() => {
        setActiveMenu('/categorias')
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
                                    <Link to="/categorias"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Categoria
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/categorias">Categorias</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Categoria
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
                                                    <InputTextControlled<CategoriasModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="cor" className="form-label">Cor</Label>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <input
                                                            type="color"
                                                            className="form-control form-control-color"
                                                            id="cor"
                                                            value={corValue}
                                                            onChange={(e) => setValue('cor', e.target.value)}
                                                        />
                                                        <InputTextControlled<CategoriasModel>
                                                            field={"cor"}
                                                            control={control}
                                                            placeholder="#000000"
                                                        />
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-check mt-2">
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

export default CategoriasForm
