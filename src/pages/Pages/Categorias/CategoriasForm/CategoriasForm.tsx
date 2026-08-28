import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import {
    CategoriaTemaLookup,
    CategoriasDefaultValues,
    CategoriasModel,
} from 'interfaces/Categorias/CategoriasInterface'
import { CategoriasService } from 'services/Categorias/CategoriasService'
import CorTemaSwatches from 'Components/CoresTema/CorTemaSwatches'
import {
    COR_TEMA_PADRAO,
    corTemaPadrao,
    normalizeHexTema,
    resolverTemasCategoria,
} from 'helpers/cores_tema_helpers'

const buildRecordFromSource = (source: any): CategoriasModel => ({
    ...CategoriasDefaultValues,
    ...source,
    id: source.id ?? null,
    categoria_id: source.categoria_id ?? source.id ?? null,
    cor: normalizeHexTema(source.cor) || COR_TEMA_PADRAO,
})

const CategoriasForm = () => {
    const { state } = useLocation()
    const { categoria_id: routeCategoriaId, id: routeId } = useParams()
    const paramId = routeCategoriaId ?? routeId

    const [record, setRecord] = useState<CategoriasModel>(
        state?.source ? buildRecordFromSource(state.source) : CategoriasDefaultValues
    )
    const [temas, setTemas] = useState<CategoriaTemaLookup[]>(resolverTemasCategoria())

    const { register, handleSubmit, control, reset, setValue, watch, getValues } = useForm<CategoriasModel>({
        defaultValues: record
    })

    const corValue = watch('cor') || COR_TEMA_PADRAO

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const categoriasService = new CategoriasService()

    const isEditing = !!(record.categoria_id || record.id || paramId)

    const loadLookups = async () => {
        try {
            const lookups = await categoriasService.getLookupsCategorias()
            setTemas(resolverTemasCategoria(lookups))
            if (!isEditing) {
                const atual = normalizeHexTema(getValues('cor'))
                if (!atual || atual === COR_TEMA_PADRAO) {
                    setValue('cor', corTemaPadrao(lookups))
                }
            }
        } catch (error) {
            console.error('Erro ao carregar cores tema:', error)
        }
    }

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
            const payload: CategoriasModel = {
                ...data,
                cor: normalizeHexTema(data.cor) || COR_TEMA_PADRAO,
            }
            if (isEditing) {
                await categoriasService.editCategorias(payload)
                toast.success('Categoria atualizada com sucesso!')
            } else {
                await categoriasService.createCategorias(payload)
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
        loadLookups()
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
                                                    <Label className="form-label">Cor tema</Label>
                                                    <input type="hidden" {...register('cor')} />
                                                    <CorTemaSwatches
                                                        temas={temas}
                                                        value={corValue}
                                                        onChange={(hex) => setValue('cor', hex, { shouldDirty: true })}
                                                    />
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
