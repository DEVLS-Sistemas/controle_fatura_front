import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { corCategoria, corPlataforma, corSubcategoria } from 'helpers/cores_tema_helpers'
import {
    EstabelecimentosDefaultValues,
    EstabelecimentosModel,
} from 'interfaces/Estabelecimentos/EstabelecimentosInterface'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { CategoriasService } from 'services/Categorias/CategoriasService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { PlataformasService } from 'services/Plataformas/PlataformasService'
import LojaModal, { LojaModalResult } from '../LojaModal/LojaModal'

const buildRecordFromSource = (source: any): EstabelecimentosModel => ({
    ...EstabelecimentosDefaultValues,
    ...source,
    id: source.id ?? null,
    estabelecimento_id: source.estabelecimento_id ?? source.id ?? null,
})

/**
 * Alterar categoria/subcategoria/plataforma padrão do estabelecimento NÃO reescreve
 * compras antigas — apenas influencia pré-seleção em novas compras.
 */
const EstabelecimentosForm = () => {
    const { state } = useLocation()
    const { id: routeId } = useParams()
    const paramId = routeId

    const [record, setRecord] = useState<EstabelecimentosModel>(
        state?.source ? buildRecordFromSource(state.source) : EstabelecimentosDefaultValues
    )

    const { register, handleSubmit, control, reset, setValue, watch } = useForm<EstabelecimentosModel>({
        defaultValues: record
    })

    const categoriaPadraoId = watch('categoria_padrao_id')
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const estabelecimentosService = new EstabelecimentosService()
    const categoriasService = new CategoriasService()
    const subcategoriasService = new SubcategoriasService()
    const plataformasService = new PlataformasService()

    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [subcategoriasOptions, setSubcategoriasOptions] = useState<SelectOptions[]>([])
    const [plataformasOptions, setPlataformasOptions] = useState<SelectOptions[]>([])
    const [lojaModalOpen, setLojaModalOpen] = useState(false)

    const isEditing = !!(record.estabelecimento_id || record.id || paramId)
    const lojaId = watch('loja_id')
    const lojaNome = watch('loja_nome')
    const estabelecimentoId = record.estabelecimento_id ?? record.id ?? (paramId ? Number(paramId) : null)

    const handleLojaConfirm = async (loja: LojaModalResult) => {
        setValue('loja_id', loja.id, { shouldDirty: true })
        setValue('loja_nome', loja.nome, { shouldDirty: true })
        setRecord((prev) => ({ ...prev, loja_id: loja.id, loja_nome: loja.nome }))
    }

    const loadCategorias = async () => {
        try {
            const list = await categoriasService.AsyncListCategorias({})
            setCategoriasOptions(
                (list ?? []).map((c: any) => ({
                    value: c.id,
                    label: c.nome ?? `#${c.id}`,
                    cor: corCategoria({ cor: c.cor, categoria_id: c.id }),
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        }
    }

    const loadPlataformas = async () => {
        try {
            const list = await plataformasService.AsyncListPlataformas({})
            setPlataformasOptions(
                (list ?? []).map((p) => ({
                    value: p.id!,
                    label: p.nome ?? `#${p.id}`,
                    cor: corPlataforma({ cor: p.cor, plataforma_id: p.id }),
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar plataformas:', error)
        }
    }

    const loadSubcategorias = async (categoriaId: string | number | null | undefined) => {
        if (!categoriaId) {
            setSubcategoriasOptions([])
            return
        }
        try {
            const list = await subcategoriasService.AsyncListSubcategorias({ categoria_id: categoriaId })
            setSubcategoriasOptions(
                (list ?? []).map((s) => ({
                    value: s.id!,
                    label: s.nome ?? `#${s.id}`,
                    cor: corSubcategoria({ cor: s.cor }),
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error)
            setSubcategoriasOptions([])
        }
    }

    const loadRecord = async (id: string | number) => {
        try {
            const view = await estabelecimentosService.getViewEstabelecimentos({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
                await loadSubcategorias(loaded.categoria_padrao_id)
            }
        } catch (error) {
            console.error('Erro ao carregar estabelecimento:', error)
            toast.error('Erro ao carregar estabelecimento.')
        }
    }

    const onSubmit: SubmitHandler<EstabelecimentosModel> = async (data) => {
        try {
            const payload: EstabelecimentosModel = {
                ...data,
                id: record.id ?? record.estabelecimento_id,
                estabelecimento_id: record.estabelecimento_id ?? record.id,
                subcategoria_padrao_id: data.categoria_padrao_id ? data.subcategoria_padrao_id : null,
            }
            if (isEditing) {
                payload.plataforma_padrao_id = data.plataforma_padrao_id || null
                await estabelecimentosService.editEstabelecimentos(payload)
                toast.success('Estabelecimento atualizado com sucesso!')
            } else {
                if (!payload.plataforma_padrao_id) {
                    delete payload.plataforma_padrao_id
                }
                await estabelecimentosService.createEstabelecimentos(payload)
                toast.success('Estabelecimento cadastrado com sucesso!')
            }
            navigate('/estabelecimentos')
        } catch (error) {
            console.error('Erro ao salvar estabelecimento:', error)
            toast.error('Erro ao salvar estabelecimento.')
        }
    }

    useEffect(() => {
        setActiveMenu('/estabelecimentos')
        loadCategorias()
        loadPlataformas()
    }, [])

    useEffect(() => {
        if (paramId && !state?.source) {
            loadRecord(paramId)
        } else if (record.categoria_padrao_id) {
            loadSubcategorias(record.categoria_padrao_id)
        }
    }, [paramId])

    useEffect(() => {
        loadSubcategorias(categoriaPadraoId)
        if (!categoriaPadraoId) {
            setValue('subcategoria_padrao_id', null)
        }
    }, [categoriaPadraoId])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/estabelecimentos"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Estabelecimento
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/estabelecimentos">Estabelecimentos</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Estabelecimento
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
                                                    <InputTextControlled<EstabelecimentosModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
                                                    />
                                                    <small className="text-muted">
                                                        Identificador da maquininha (ex.: atacadao152145)
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label className="form-label text-muted">Loja</Label>
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            color="light"
                                                            className="border w-100 text-start"
                                                            onClick={() => setLojaModalOpen(true)}
                                                            title={lojaNome ? `Loja: ${lojaNome}` : 'Definir loja'}
                                                        >
                                                            <i className="ri-store-2-line me-2"></i>
                                                            {lojaNome || 'Definir loja'}
                                                            <i className="ri-arrow-down-s-line float-end mt-1"></i>
                                                        </Button>
                                                        <small className="text-muted">
                                                            Nome fantasia — agrupa várias máquinas do mesmo lugar
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-check mb-3">
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
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="categoria_padrao_id" className="form-label">Categoria padrão</Label>
                                                    <SelectListControlled<EstabelecimentosModel>
                                                        options={categoriasOptions}
                                                        field="categoria_padrao_id"
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="subcategoria_padrao_id" className="form-label">Subcategoria padrão</Label>
                                                    <SelectListControlled<EstabelecimentosModel>
                                                        options={subcategoriasOptions}
                                                        field="subcategoria_padrao_id"
                                                        control={control}
                                                        disabled={!categoriaPadraoId}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="plataforma_padrao_id" className="form-label">Plataforma padrão</Label>
                                                    <SelectListControlled<EstabelecimentosModel>
                                                        options={plataformasOptions}
                                                        field="plataforma_padrao_id"
                                                        control={control}
                                                        placeholder="Selecione / inferir pelo nome"
                                                    />
                                                    <small className="text-muted">
                                                        Vazio no cadastro: o sistema infere pelo nome (ex.: Mercadolivre*Mercadol)
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-5">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    {isEditing && (record.id || record.estabelecimento_id || paramId) && (
                                                        <Link
                                                            to={`/estabelecimentos/view/${record.id ?? record.estabelecimento_id ?? paramId}`}
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
            <LojaModal
                isOpen={lojaModalOpen}
                toggle={() => setLojaModalOpen(false)}
                estabelecimentoId={isEditing ? estabelecimentoId : null}
                currentLojaId={lojaId}
                currentLojaNome={lojaNome}
                onConfirm={handleLojaConfirm}
            />
        </React.Fragment>
    )
}

export default EstabelecimentosForm
