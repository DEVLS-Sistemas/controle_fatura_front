import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatCpfCnpj, useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox'
import {
    onlyDigits,
    pessoaIdOf,
    pessoaNomeCompleto,
    PessoasDefaultValues,
    PessoasModel,
} from 'interfaces/Pessoas/PessoasInterface'
import { PessoasService } from 'services/Pessoas/PessoasService'

const buildRecord = (source?: any): PessoasModel => {
    if (!source) return PessoasDefaultValues
    return {
        ...PessoasDefaultValues,
        ...source,
        id: source.id ?? source.pessoa_id ?? null,
        pessoa_id: source.pessoa_id ?? source.id ?? null,
        cpf_cnpj: source.cpf_cnpj ?? null,
    }
}

const PessoasForm = () => {
    const { state, pathname } = useLocation()
    const { id: routeId } = useParams()
    const [record, setRecord] = useState<PessoasModel>(buildRecord(state?.source))
    const { register, handleSubmit, control, reset } = useForm<PessoasModel>({
        defaultValues: record
    })
    const [loading, setLoading] = useState(Boolean(routeId && !state?.source))
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const pessoasService = new PessoasService()
    const isView = pathname.includes('/pessoas/view/')
    const isEdit = Boolean(pessoaIdOf(record)) && !isView

    const loadRecord = async (id: string) => {
        try {
            const view = await pessoasService.getViewPessoas({ id })
            if (view) {
                const loaded = buildRecord(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar pessoa:', error)
            toast.error('Erro ao carregar pessoa')
        } finally {
            setLoading(false)
        }
    }

    const onSubmit: SubmitHandler<PessoasModel> = async (data) => {
        if (isView) return
        const payload: PessoasModel = {
            ...data,
            nome: data.nome?.trim() || null,
            sobrenome: data.sobrenome?.trim() || null,
            cpf_cnpj: onlyDigits(data.cpf_cnpj) || null,
            eh_principal: Boolean(record.eh_principal),
        }
        try {
            if (isEdit) {
                await pessoasService.editPessoas({
                    ...payload,
                    id: record.id ?? record.pessoa_id,
                    pessoa_id: record.pessoa_id ?? record.id,
                })
                toast.success('Pessoa atualizada com sucesso')
            } else {
                await pessoasService.createPessoas(payload)
                toast.success('Pessoa cadastrada com sucesso')
            }
            navigate('/pessoas')
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao salvar pessoa')
            throw error
        }
    }

    useEffect(() => {
        setActiveMenu('/pessoas')
    }, [])

    useEffect(() => {
        if (routeId && !state?.source) {
            loadRecord(routeId)
        }
    }, [routeId])

    const title = isView ? 'Visualizar' : isEdit ? 'Editar' : 'Adicionar'

    if (loading) {
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
                                    <Link to="/pessoas"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {title} Pessoa
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/pessoas">Pessoas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {title} Pessoa
                                    </BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    {isView ? (
                                        <>
                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Label className="form-label fw-semibold">Nome</Label>
                                                    <p className="mb-0">{pessoaNomeCompleto(record) || record.nome || '-'}</p>
                                                </Col>
                                                <Col md={6} className="mb-3">
                                                    <Label className="form-label fw-semibold">CPF/CNPJ</Label>
                                                    <p className="text-muted mb-0">
                                                        {record.cpf_cnpj ? formatCpfCnpj(record.cpf_cnpj) : '-'}
                                                    </p>
                                                </Col>
                                                <Col md={6} className="mb-3">
                                                    <Label className="form-label fw-semibold">Titular</Label>
                                                    <p className="mb-0">
                                                        {record.eh_principal
                                                            ? <span className="badge bg-info">Principal</span>
                                                            : <span className="badge bg-secondary">Adicional</span>}
                                                    </p>
                                                </Col>
                                                <Col md={6} className="mb-3">
                                                    <Label className="form-label fw-semibold">Ativo</Label>
                                                    <p className="mb-0">
                                                        <span className={`badge bg-${record.ativo ? 'success' : 'danger'}`}>
                                                            {record.ativo ? 'Sim' : 'Não'}
                                                        </span>
                                                    </p>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md={12}>
                                                    <div className="hstack gap-2 justify-content-end">
                                                        <Link
                                                            to={`/pessoas/edit/${pessoaIdOf(record)}`}
                                                            state={{ source: record }}
                                                            className="btn btn-primary"
                                                        >
                                                            Editar
                                                        </Link>
                                                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                                            Voltar
                                                        </button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </>
                                    ) : (
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Row>
                                            <Col md={12} className="d-flex flex-row justify-content-end align-items-center">
                                                <div className="form-check form-switch form-switch-md mb-3 form-check-right mb-2">
                                                    <Label className="me-3" htmlFor="ativo">Ativo</Label>
                                                    <InputCheckbox<PessoasModel> field="ativo" register={register} role="switch" />
                                                </div>
                                            </Col>
                                        </Row>
                                        {record.eh_principal && (
                                            <div className="alert alert-info">
                                                Esta é a pessoa principal da conta (vinculada ao perfil de login).
                                                Ela não pode ser excluída.
                                            </div>
                                        )}
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="nome" className="form-label">Nome</Label>
                                                    <InputTextControlled<PessoasModel>
                                                        field="nome"
                                                        control={control}
                                                        required={required}
                                                        placeholder="Nome"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="sobrenome" className="form-label">Sobrenome</Label>
                                                    <InputTextControlled<PessoasModel>
                                                        field="sobrenome"
                                                        control={control}
                                                        placeholder="Sobrenome"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="cpf_cnpj" className="form-label">CPF/CNPJ</Label>
                                                    <InputTextControlled<PessoasModel>
                                                        field="cpf_cnpj"
                                                        control={control}
                                                        mask="cpf_cnpj"
                                                        placeholder="000.000.000-00"
                                                    />
                                                    <small className="text-muted">Opcional. Usado só para identificação.</small>
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-3">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end flex-wrap">
                                                    <button type="submit" className="btn btn-primary">Salvar</button>
                                                    <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </form>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default PessoasForm
