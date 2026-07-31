import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    SubcategoriasDefaultValues,
    SubcategoriasModel,
} from 'interfaces/Subcategorias/SubcategoriasInterface'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { CategoriasService } from 'services/Categorias/CategoriasService'

const buildRecordFromSource = (source: any): SubcategoriasModel => {
    const categoriaIds =
        source.categoria_ids
        ?? source.categorias?.map((c: any) => c.id).filter(Boolean)
        ?? []

    return {
        ...SubcategoriasDefaultValues,
        ...source,
        id: source.id ?? null,
        subcategoria_id: source.subcategoria_id ?? source.id ?? null,
        categoria_ids: categoriaIds,
    }
}

const SubcategoriasForm = () => {
    const { state } = useLocation()
    const { id: routeId } = useParams()
    const paramId = routeId

    const [record, setRecord] = useState<SubcategoriasModel>(
        state?.source ? buildRecordFromSource(state.source) : SubcategoriasDefaultValues
    )

    const { register, handleSubmit, control, reset } = useForm<SubcategoriasModel>({
        defaultValues: record
    })

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const subcategoriasService = new SubcategoriasService()
    const categoriasService = new CategoriasService()
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])

    const isEditing = !!(record.subcategoria_id || record.id || paramId)

    const loadCategorias = async () => {
        try {
            const list = await categoriasService.AsyncListCategorias({})
            setCategoriasOptions(
                (list ?? []).map((c: any) => ({
                    value: c.id,
                    label: c.nome ?? `#${c.id}`,
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        }
    }

    const loadRecord = async (id: string | number) => {
        try {
            const view = await subcategoriasService.getViewSubcategorias({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar subcategoria:', error)
            toast.error('Erro ao carregar subcategoria.')
        }
    }

    const onSubmit: SubmitHandler<SubcategoriasModel> = async (data) => {
        try {
            const categoriaIds = (data.categoria_ids ?? []).map((id) => Number(id)).filter((id) => !Number.isNaN(id))
            if (categoriaIds.length < 1) {
                toast.error('Selecione ao menos uma categoria.')
                return
            }

            const payload: SubcategoriasModel = {
                ...data,
                id: record.id ?? record.subcategoria_id,
                subcategoria_id: record.subcategoria_id ?? record.id,
                categoria_ids: categoriaIds,
            }

            if (isEditing) {
                await subcategoriasService.editSubcategorias(payload)
                toast.success('Subcategoria atualizada com sucesso!')
            } else {
                await subcategoriasService.createSubcategorias(payload)
                toast.success('Subcategoria cadastrada com sucesso!')
            }
            navigate('/subcategorias')
        } catch (error) {
            console.error('Erro ao salvar subcategoria:', error)
            toast.error('Erro ao salvar subcategoria.')
        }
    }

    useEffect(() => {
        setActiveMenu('/subcategorias')
        loadCategorias()
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
                                    <Link to="/subcategorias"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Subcategoria
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/subcategorias">Subcategorias</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Subcategoria
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
                                                    <InputTextControlled<SubcategoriasModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
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
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="categoria_ids" className="form-label">Categorias vinculadas</Label>
                                                    <SelectListControlled<SubcategoriasModel>
                                                        options={categoriasOptions}
                                                        field="categoria_ids"
                                                        control={control}
                                                        isMulti={true}
                                                        required={required}
                                                    />
                                                    <small className="text-muted">Selecione ao menos uma categoria.</small>
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

export default SubcategoriasForm
