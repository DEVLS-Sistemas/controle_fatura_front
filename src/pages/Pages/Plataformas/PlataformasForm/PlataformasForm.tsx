import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { CategoriaTemaLookup } from 'interfaces/Categorias/CategoriasInterface'
import {
    PlataformasDefaultValues,
    PlataformasModel,
} from 'interfaces/Plataformas/PlataformasInterface'
import { PlataformasService } from 'services/Plataformas/PlataformasService'
import CorTemaSwatches from 'Components/CoresTema/CorTemaSwatches'
import {
    COR_TEMA_PADRAO,
    corTemaPadrao,
    normalizeHexTema,
    resolverTemasCategoria,
} from 'helpers/cores_tema_helpers'

const buildRecordFromSource = (source: any): PlataformasModel => ({
    ...PlataformasDefaultValues,
    ...source,
    id: source.id ?? null,
    plataforma_id: source.plataforma_id ?? source.id ?? null,
    cor: normalizeHexTema(source.cor) || COR_TEMA_PADRAO,
})

const PlataformasForm = () => {
    const { state } = useLocation()
    const { id: routeId } = useParams()
    const paramId = routeId

    const [record, setRecord] = useState<PlataformasModel>(
        state?.source ? buildRecordFromSource(state.source) : PlataformasDefaultValues
    )
    const [temas, setTemas] = useState<CategoriaTemaLookup[]>(resolverTemasCategoria())

    const { register, handleSubmit, control, reset, setValue, watch, getValues } = useForm<PlataformasModel>({
        defaultValues: record
    })

    const corValue = watch('cor') || COR_TEMA_PADRAO

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const plataformasService = new PlataformasService()

    const isEditing = !!(record.plataforma_id || record.id || paramId)

    const loadLookups = async () => {
        try {
            const lookups = await plataformasService.getLookupsPlataformas()
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
            const view = await plataformasService.getViewPlataformas({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar plataforma:', error)
            toast.error('Erro ao carregar plataforma.')
        }
    }

    const onSubmit: SubmitHandler<PlataformasModel> = async (data) => {
        try {
            const payload: PlataformasModel = {
                ...data,
                cor: normalizeHexTema(data.cor) || COR_TEMA_PADRAO,
            }
            if (isEditing) {
                await plataformasService.editPlataformas(payload)
                toast.success('Plataforma atualizada com sucesso!')
            } else {
                await plataformasService.createPlataformas(payload)
                toast.success('Plataforma cadastrada com sucesso!')
            }
            navigate('/plataformas')
        } catch (error) {
            console.error('Erro ao salvar plataforma:', error)
            toast.error('Erro ao salvar plataforma.')
        }
    }

    useEffect(() => {
        setActiveMenu('/plataformas')
        loadLookups()
    }, [])

    useEffect(() => {
        if (paramId) {
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
                                    <Link to="/plataformas"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Plataforma
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/plataformas">Plataformas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Plataforma
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
                                                    <InputTextControlled<PlataformasModel>
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

export default PlataformasForm
