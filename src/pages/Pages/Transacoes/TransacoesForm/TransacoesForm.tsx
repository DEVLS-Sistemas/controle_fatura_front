import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { AsyncSelectListControlled } from 'Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { tipoTransacaoLabel } from 'helpers/fatura_helpers'
import {
    EstabelecimentoLookup,
    ResponsavelLookup,
    TransacoesDefaultValues,
    TransacoesModel,
} from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import ResponsavelModal from '../ResponsavelModal/ResponsavelModal'

/**
 * UX: ao trocar o estabelecimento, a UI sempre reaplica
 * categoria_padrao_id e subcategoria_padrao_id do estabelecimento selecionado.
 * Editar categoria/subcategoria na compra NÃO atualiza o estabelecimento.
 */
const TransacoesForm = () => {
    const { state } = useLocation()
    const [record] = useState<TransacoesModel>(
        state?.source
            ? {
                ...TransacoesDefaultValues,
                ...state.source,
                transacao_id: state.source.transacao_id ?? state.source.id,
                cartao_id: state.source.cartao_id ?? null,
                fatura_id: state.source.fatura_id ?? null,
                estabelecimento_id: state.source.estabelecimento_id ?? null,
                subcategoria_id: state.source.subcategoria_id ?? null,
            }
            : TransacoesDefaultValues
    )
    const { register, handleSubmit, control, setValue, watch } = useForm<TransacoesModel>({
        defaultValues: record,
    })
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [subcategoriasOptions, setSubcategoriasOptions] = useState<SelectOptions[]>([])
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
    const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
    const skipEstabelecimentoEffect = useRef(true)
    const skipCategoriaEffect = useRef(true)
    const applyingEstabelecimentoDefaults = useRef(false)
    const estabelecimentosCache = useRef<Map<number, EstabelecimentoLookup>>(new Map())

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const transacoesService = new TransacoesService()
    const estabelecimentosService = new EstabelecimentosService()
    const subcategoriasService = new SubcategoriasService()
    const isEdit = Boolean(record.transacao_id ?? record.id)

    const estabelecimentoId = watch('estabelecimento_id')
    const categoriaId = watch('categoria_id')
    const responsavelId = watch('responsavel_id')

    const responsavelAtual = responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))
    const isMeuResponsavel =
        responsavelId == null
        || (defaultResponsavelId != null && Number(responsavelId) === Number(defaultResponsavelId))
        || (responsavelAtual?.nome ?? '').trim().toLowerCase() === 'eu'
    const responsavelLabel = isMeuResponsavel
        ? null
        : (responsavelAtual?.nome ?? (responsavelId ? `#${responsavelId}` : null))

    const optTipos: SelectOptions[] = Object.entries(tipoTransacaoLabel).map(([value, label]) => ({
        value,
        label,
    }))

    const estabelecimentoDefault: SelectOptions | undefined =
        record.estabelecimento_id
            ? {
                value: record.estabelecimento_id,
                label:
                    state?.source?.estabelecimento_nome
                    ?? state?.source?.estabelecimento
                    ?? `#${record.estabelecimento_id}`,
            }
            : undefined

    const loadSubcategorias = async (catId: string | number | null | undefined) => {
        if (!catId) {
            setSubcategoriasOptions([])
            return
        }
        try {
            const list = await subcategoriasService.AsyncListSubcategorias({ categoria_id: catId })
            setSubcategoriasOptions(
                (list ?? []).map((s) => ({
                    value: s.id!,
                    label: s.nome ?? `#${s.id}`,
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error)
            setSubcategoriasOptions([])
        }
    }

    const searchEstabelecimentos = async (inputValue: string): Promise<SelectOptions[]> => {
        try {
            const list = await estabelecimentosService.AsyncListEstabelecimentos({
                palavra_chave: inputValue,
            })
            ;(list ?? []).forEach((e) => {
                if (e.id != null) {
                    estabelecimentosCache.current.set(Number(e.id), e)
                }
            })
            return (list ?? []).map((e) => ({
                value: e.id!,
                label: e.nome ?? `#${e.id}`,
            }))
        } catch (error) {
            console.error('Erro ao buscar estabelecimentos:', error)
            return []
        }
    }

    const getLookups = async (): Promise<void> => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (lookups?.cartoes) {
                setCartoesOptions(
                    lookups.cartoes.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `Cartão ${c.id}`,
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
                setResponsaveisLookup(lookups.responsaveis)
            }
            if (lookups?.default_responsavel_id != null) {
                setDefaultResponsavelId(lookups.default_responsavel_id)
            }
            if (!isEdit && lookups?.default_responsavel_id && !record.responsavel_id) {
                setValue('responsavel_id', lookups.default_responsavel_id)
            }

            if (record.categoria_id) {
                await loadSubcategorias(record.categoria_id)
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }

    const onSubmit: SubmitHandler<TransacoesModel> = async (data) => {
        try {
            const payload: TransacoesModel = {
                ...data,
                transacao_id: record.transacao_id ?? record.id,
                id: record.id ?? record.transacao_id,
                subcategoria_id: data.categoria_id ? data.subcategoria_id : null,
            }
            // remove texto legado se há estabelecimento_id
            if (payload.estabelecimento_id) {
                delete (payload as any).estabelecimento
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

    // Reaplica padrões ao trocar estabelecimento
    useEffect(() => {
        if (skipEstabelecimentoEffect.current) {
            skipEstabelecimentoEffect.current = false
            return
        }
        if (!estabelecimentoId) return

        const applyDefaults = async () => {
            let est = estabelecimentosCache.current.get(Number(estabelecimentoId))
            if (!est) {
                try {
                    const view = await estabelecimentosService.getViewEstabelecimentos({
                        id: estabelecimentoId,
                    })
                    if (view?.id != null) {
                        est = {
                            id: view.id,
                            nome: view.nome,
                            categoria_padrao_id: view.categoria_padrao_id ?? null,
                            subcategoria_padrao_id: view.subcategoria_padrao_id ?? null,
                        }
                        estabelecimentosCache.current.set(Number(view.id), est)
                    }
                } catch (error) {
                    console.error('Erro ao carregar estabelecimento:', error)
                    return
                }
            }
            if (!est) return

            applyingEstabelecimentoDefaults.current = true
            setValue('categoria_id', est.categoria_padrao_id ?? null)
            setValue('subcategoria_id', est.subcategoria_padrao_id ?? null)
            loadSubcategorias(est.categoria_padrao_id)
        }

        applyDefaults()
    }, [estabelecimentoId])

    useEffect(() => {
        if (skipCategoriaEffect.current) {
            skipCategoriaEffect.current = false
            if (categoriaId) loadSubcategorias(categoriaId)
            return
        }
        loadSubcategorias(categoriaId)
        if (applyingEstabelecimentoDefaults.current) {
            applyingEstabelecimentoDefaults.current = false
            return
        }
        setValue('subcategoria_id', null)
    }, [categoriaId])

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
                                                    <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={cartoesOptions}
                                                        field="cartao_id"
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
                                                    <Label htmlFor="estabelecimento_id" className="form-label">Estabelecimento</Label>
                                                    <AsyncSelectListControlled<TransacoesModel>
                                                        callback={searchEstabelecimentos}
                                                        field="estabelecimento_id"
                                                        control={control}
                                                        required={required}
                                                        defaultValue={estabelecimentoDefault}
                                                        placeholder="Digite para buscar..."
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="valor" className="form-label">Valor</Label>
                                                    <InputTextControlled<TransacoesModel>
                                                        field="valor"
                                                        control={control}
                                                        required={required}
                                                        textValor
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label className="form-label text-muted">Responsável</Label>
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            color="light"
                                                            className="border w-100 text-start"
                                                            onClick={() => setResponsavelModalOpen(true)}
                                                            title="Definir responsável"
                                                        >
                                                            <i className="ri-user-line me-2"></i>
                                                            {responsavelLabel ?? 'Eu'}
                                                            <i className="ri-arrow-down-s-line float-end mt-1"></i>
                                                        </Button>
                                                        {!responsavelLabel && (
                                                            <small className="text-muted">Padrão — clique para trocar ou cadastrar outro</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="categoria_id" className="form-label">Categoria</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={categoriasOptions}
                                                        field="categoria_id"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="subcategoria_id" className="form-label">Subcategoria</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={subcategoriasOptions}
                                                        field="subcategoria_id"
                                                        control={control}
                                                        disabled={!categoriaId}
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
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="observacoes" className="form-label">Observação</Label>
                                                    <textarea
                                                        {...register('observacoes')}
                                                        className="form-control"
                                                        rows={3}
                                                        placeholder="Texto livre opcional"
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

            <ResponsavelModal
                isOpen={responsavelModalOpen}
                toggle={() => setResponsavelModalOpen(false)}
                responsaveis={responsaveisLookup}
                currentResponsavelId={responsavelId}
                onResponsaveisChange={setResponsaveisLookup}
                onConfirm={(responsavel) => {
                    setValue('responsavel_id', responsavel.id ?? null)
                    toast.success(`Responsável: ${responsavel.nome}`)
                }}
            />
        </React.Fragment>
    )
}

export default TransacoesForm
