import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { LojasDefaultValues, LojasModel, LojasView } from 'interfaces/Lojas/LojasInterface'
import { LojasService } from 'services/Lojas/LojasService'

const buildRecordFromSource = (source: any): LojasModel => ({
    ...LojasDefaultValues,
    ...source,
    id: source.id ?? null,
    loja_id: source.loja_id ?? source.id ?? null,
})

const LojasForm = () => {
    const { state } = useLocation()
    const { id: routeId } = useParams()
    const paramId = routeId

    const [record, setRecord] = useState<LojasModel>(
        state?.source ? buildRecordFromSource(state.source) : LojasDefaultValues
    )
    const [vinculos, setVinculos] = useState<LojasView['estabelecimentos']>(
        state?.source?.estabelecimentos ?? []
    )
    const [estabelecimentosCount, setEstabelecimentosCount] = useState<number>(
        state?.source?.estabelecimentos_count ?? 0
    )

    const { register, handleSubmit, control, reset } = useForm<LojasModel>({
        defaultValues: record
    })

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const lojasService = new LojasService()

    const isEditing = !!(record.loja_id || record.id || paramId)

    const loadRecord = async (id: string | number) => {
        try {
            const view = await lojasService.getViewLojas({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
                setVinculos(view.estabelecimentos ?? [])
                setEstabelecimentosCount(view.estabelecimentos_count ?? view.estabelecimentos?.length ?? 0)
            }
        } catch (error) {
            console.error('Erro ao carregar loja:', error)
            toast.error('Erro ao carregar loja.')
        }
    }

    const onSubmit: SubmitHandler<LojasModel> = async (data) => {
        try {
            const payload = {
                ...data,
                id: record.id ?? record.loja_id,
                loja_id: record.loja_id ?? record.id,
            }
            if (isEditing) {
                await lojasService.editLojas(payload)
                toast.success('Loja atualizada com sucesso!')
            } else {
                await lojasService.createLojas(payload)
                toast.success('Loja cadastrada com sucesso!')
            }
            navigate('/lojas')
        } catch (error) {
            console.error('Erro ao salvar loja:', error)
            toast.error('Erro ao salvar loja.')
        }
    }

    useEffect(() => {
        setActiveMenu('/lojas')
    }, [])

    useEffect(() => {
        if (paramId && !state?.source) {
            loadRecord(paramId)
        } else if (paramId && state?.source && !state.source.estabelecimentos) {
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
                                    <Link to="/lojas"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Loja
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/lojas">Lojas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Loja
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
                                                    <Label htmlFor="nome" className="form-label">Nome fantasia</Label>
                                                    <InputTextControlled<LojasModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
                                                        placeholder="Ex.: Atacadão"
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

                                        {isEditing && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3">
                                                        <Label className="form-label">
                                                            Estabelecimentos vinculados ({estabelecimentosCount})
                                                        </Label>
                                                        {vinculos && vinculos.length > 0 ? (
                                                            <ul className="list-group">
                                                                {vinculos.map((est) => (
                                                                    <li
                                                                        key={est.id}
                                                                        className="list-group-item d-flex justify-content-between align-items-center"
                                                                    >
                                                                        <Link to={`/estabelecimentos/edit/${est.id}`}>
                                                                            {est.nome}
                                                                        </Link>
                                                                        <span className={`badge bg-${est.ativo ? 'success' : 'danger'}`}>
                                                                            {est.ativo ? 'Ativo' : 'Inativo'}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-muted small mb-0">
                                                                Nenhum estabelecimento vinculado. Associe pela tela de Estabelecimentos.
                                                            </p>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

                                        <hr />
                                        <Row className="mt-5">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    {isEditing && (record.id || record.loja_id) && (
                                                        <Link
                                                            to={`/lojas/view/${record.id ?? record.loja_id}`}
                                                            className="btn btn-soft-info"
                                                        >
                                                            Ver estatísticas
                                                        </Link>
                                                    )}
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

export default LojasForm
