import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { tipoTransacaoLabel } from 'helpers/fatura_helpers'
import { TransacoesDefaultValues, TransacoesModel } from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'

const TransacoesForm = () => {
    const { state } = useLocation()
    const [record] = useState<TransacoesModel>(
        state?.source
            ? {
                ...TransacoesDefaultValues,
                ...state.source,
                transacao_id: state.source.transacao_id ?? state.source.id,
                fatura_id: state.source.fatura_id ?? null,
            }
            : TransacoesDefaultValues
    )
    const { register, handleSubmit, control } = useForm<TransacoesModel>({
        defaultValues: record,
    })
    const [faturasOptions, setFaturasOptions] = useState<SelectOptions[]>([])
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([])
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const transacoesService = new TransacoesService()
    const isEdit = Boolean(record.transacao_id ?? record.id)

    const optTipos: SelectOptions[] = Object.entries(tipoTransacaoLabel).map(([value, label]) => ({
        value,
        label,
    }))

    const getLookups = async (): Promise<void> => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (lookups?.faturas) {
                setFaturasOptions(
                    lookups.faturas.map((f) => ({
                        value: f.id!,
                        label: f.cartao_nome
                            ? `${f.cartao_nome} — ${String(f.mes).padStart(2, '0')}/${f.ano}`
                            : `Fatura ${f.id}`,
                    }))
                )
            }
            if (lookups?.categorias) {
                setCategoriasOptions(
                    lookups.categorias.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `#${c.id}`,
                    }))
                )
            }
            if (lookups?.responsaveis) {
                setResponsaveisOptions(
                    lookups.responsaveis.map((r) => ({
                        value: r.id!,
                        label: r.nome ?? `#${r.id}`,
                    }))
                )
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }

    const onSubmit: SubmitHandler<TransacoesModel> = async (data) => {
        try {
            const payload = {
                ...data,
                transacao_id: record.transacao_id ?? record.id,
                id: record.id ?? record.transacao_id,
            }
            if (isEdit) {
                await transacoesService.editTransacoes(payload)
                toast.success('Transação atualizada com sucesso')
            } else {
                await transacoesService.createTransacoes(payload)
                toast.success('Transação cadastrada com sucesso')
            }
            navigate('/transacoes')
        } catch (error: any) {
            toast.error('Erro ao salvar transação')
            throw error
        }
    }

    useEffect(() => {
        getLookups()
    }, [])

    useEffect(() => {
        setActiveMenu('/transacoes')
    }, [])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/transacoes"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEdit ? 'Editar' : 'Adicionar'} Transação
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/transacoes">Transações</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEdit ? 'Editar' : 'Adicionar'} Transação
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
                                                    <Label htmlFor="fatura_id" className="form-label">Fatura</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={faturasOptions}
                                                        field="fatura_id"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="data" className="form-label">Data</Label>
                                                    <InputDate<TransacoesModel>
                                                        field="data"
                                                        register={register}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="tipo" className="form-label">Tipo</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={optTipos}
                                                        field="tipo"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="estabelecimento" className="form-label">Estabelecimento</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="estabelecimento"
                                                        control={control}
                                                        rules={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="valor" className="form-label">Valor</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="valor"
                                                        control={control}
                                                        rules={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="categoria_id" className="form-label">Categoria</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={categoriasOptions}
                                                        field="categoria_id"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="responsavel_id" className="form-label">Responsável</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={responsaveisOptions}
                                                        field="responsavel_id"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="parcela_atual" className="form-label">Parcela atual</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="parcela_atual"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="parcelas_total" className="form-label">Total parcelas</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="parcelas_total"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="observacoes" className="form-label">Observações</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="observacoes"
                                                        control={control}
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

export default TransacoesForm
