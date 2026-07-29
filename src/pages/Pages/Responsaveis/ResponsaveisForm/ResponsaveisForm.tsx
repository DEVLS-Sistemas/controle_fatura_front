import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { ResponsaveisDefaultValues, ResponsaveisModel } from 'interfaces/Responsaveis/ResponsaveisInterface'
import { ResponsaveisService } from 'services/Responsaveis/ResponsaveisService'

const optTipo: SelectOptions[] = [
    { value: 'pessoal', label: 'Pessoal' },
    { value: 'empresa', label: 'Empresa' },
]

const ResponsaveisForm = () => {
    const { state } = useLocation()
    const [record, setRecord] = useState<ResponsaveisModel>(
        state?.source
            ? { ...state.source, responsavel_id: state.source.responsavel_id ?? state.source.id }
            : ResponsaveisDefaultValues
    )
    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<ResponsaveisModel>({
        defaultValues: record
    })
    const [display, setDisplay] = useState<boolean>(false)
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const responsaveisService = new ResponsaveisService()
    const isEdit = Boolean(record.responsavel_id)

    const onSubmit: SubmitHandler<ResponsaveisModel> = async (data) => {
        try {
            if (isEdit) {
                await responsaveisService.editResponsaveis({ ...data, responsavel_id: record.responsavel_id })
                toast.success('Responsável atualizado com sucesso')
            } else {
                await responsaveisService.createResponsaveis(data)
                toast.success('Responsável cadastrado com sucesso')
            }
            navigate('/responsaveis')
        } catch (error: any) {
            toast.error('Erro ao salvar responsável')
            throw error
        }
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        setActiveMenu('/responsaveis')
    }, [])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/responsaveis"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEdit ? 'Editar' : 'Adicionar'} Responsável
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/responsaveis">Responsáveis</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEdit ? 'Editar' : 'Adicionar'} Responsável
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
                                            <Col md={12} className="d-flex flex-row justify-content-end align-items-center">
                                                <div className="form-check form-switch form-switch-md mb-3 form-check-right mb-2">
                                                    <Label className="me-3" htmlFor="ativo">Ativo</Label>
                                                    <InputCheckbox<ResponsaveisModel> field="ativo" register={register} role="switch" />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="nome" className="form-label">Nome</Label>
                                                    <InputTextControlled<ResponsaveisModel>
                                                        field="nome"
                                                        control={control}
                                                        required={required}
                                                        placeholder="Nome"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="tipo" className="form-label">Tipo</Label>
                                                    <SelectListControlled<ResponsaveisModel>
                                                        options={optTipo}
                                                        field="tipo"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-3">
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

export default ResponsaveisForm
