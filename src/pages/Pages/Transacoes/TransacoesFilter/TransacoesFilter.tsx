import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "react-toastify"
import {
    Breadcrumb, BreadcrumbItem, Button, Card, CardHeader, Col, Collapse, Label, Row
} from "reactstrap"
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled"
import { InputDate } from "Components/ComponentController/Inputs/Date/InputDate"
import { SelectListControlled } from "Components/ComponentController/Selects/Select/SelectListControlled"
import { AsyncSelectListControlled } from "Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled"
import { SelectOptions } from "interfaces/SystemInterfaces/SelectInterface"
import { mesesOptions } from "helpers/fatura_helpers"
import { AnosSelect } from "helpers/functions_helpers"
import { TransacoesSearch } from "interfaces/Transacoes/TransacoesInterface"
import { TransacoesService } from "services/Transacoes/TransacoesService"
import { SubcategoriasService } from "services/Subcategorias/SubcategoriasService"
import { EstabelecimentosService } from "services/Estabelecimentos/EstabelecimentosService"
import VincularLojaModal from "../VincularLojaModal/VincularLojaModal"

export interface TransacoesFilterProps {
    getRemoteTransacoesList: (data: any) => void
    cartoesOptions: SelectOptions[]
    categoriasOptions: SelectOptions[]
    plataformasOptions: SelectOptions[]
    responsaveisOptions: SelectOptions[]
    tiposOptions: SelectOptions[]
    origensCompraOptions: SelectOptions[]
    statusConciliacaoOptions: SelectOptions[]
    filtersRef: TransacoesSearch
    onAfterVincularLoja?: () => void | Promise<void>
}

const TransacoesFilter = ({
    getRemoteTransacoesList,
    cartoesOptions,
    categoriasOptions,
    plataformasOptions,
    responsaveisOptions,
    tiposOptions,
    origensCompraOptions,
    statusConciliacaoOptions,
    filtersRef,
    onAfterVincularLoja,
}: TransacoesFilterProps) => {
    const { handleSubmit, control, register, getValues, setValue } = useForm<TransacoesSearch>({
        defaultValues: filtersRef,
    })
    const [showFilter, setShowFilter] = useState<boolean>(false)
    const [exporting, setExporting] = useState(false)
    const [vincularLojaOpen, setVincularLojaOpen] = useState(false)
    const [subcategoriasOptions, setSubcategoriasOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const transacoesService = new TransacoesService()
    const subcategoriasService = new SubcategoriasService()
    const estabelecimentosService = new EstabelecimentosService()

    const searchEstabelecimentos = async (inputValue: string): Promise<SelectOptions[]> => {
        try {
            const list = await estabelecimentosService.AsyncListEstabelecimentos({
                palavra_chave: inputValue,
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

    const categoriaId = useWatch({ control, name: 'categoria_id' })

    const optAnos = AnosSelect({ includeTodos: true })

    const optMeses: SelectOptions[] = [{ value: '', label: 'Todos' }, ...mesesOptions]

    useEffect(() => {
        const load = async () => {
            if (!categoriaId) {
                setSubcategoriasOptions([{ value: '', label: 'Todos' }])
                setValue('subcategoria_id', null)
                return
            }
            try {
                const list = await subcategoriasService.AsyncListSubcategorias({ categoria_id: categoriaId })
                setSubcategoriasOptions([
                    { value: '', label: 'Todos' },
                    ...(list ?? []).map((s) => ({
                        value: s.id!,
                        label: s.nome ?? `#${s.id}`,
                        cor: s.cor ?? null,
                    })),
                ])
            } catch (error) {
                console.error('Erro ao carregar subcategorias do filtro:', error)
                setSubcategoriasOptions([{ value: '', label: 'Todos' }])
            }
        }
        load()
    }, [categoriaId])

    const syncFiltersToRef = () => {
        const filters = getValues()
        Object.assign(filtersRef, filters)
        return filters
    }

    const handleExportCsv = async () => {
        setExporting(true)
        try {
            const filters = syncFiltersToRef()
            Object.keys(filters).reduce(
                (acc, k) => (!filters[k as keyof TransacoesSearch] && filters[k as keyof TransacoesSearch] !== 0 && delete acc[k], acc),
                filters as Record<string, unknown>
            )
            const blob = await transacoesService.exportCsv(filters)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `transacoes_${Date.now()}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Exportação concluída')
        } catch (error) {
            console.error('Erro ao exportar:', error)
            toast.error('Erro ao exportar transações')
        } finally {
            setExporting(false)
        }
    }

    const handleOpenVincularLoja = () => {
        syncFiltersToRef()
        setVincularLojaOpen(true)
    }

    return (
        <React.Fragment>
            <UiContent />

            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <Link to="/dashboard" className="me-2">
                                <i className="bx bx-arrow-back bx-sm"></i>
                            </Link>
                            <h4 className="mb-0">Transações</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                            <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                            <BreadcrumbItem active>Transações</BreadcrumbItem>
                        </Breadcrumb>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-row justify-content-end align-items-center mb-4 gap-2 flex-wrap">
                        <Link to="/assinaturas" className="btn btn-outline-warning">
                            <i className="ri-refresh-line align-middle me-1"></i>
                            Ver assinaturas
                        </Link>
                        <Button
                            type="button"
                            color="info"
                            outline
                            onClick={handleOpenVincularLoja}
                        >
                            <i className="ri-store-2-line align-middle me-1"></i>
                            Vincular com loja
                        </Button>
                        <Link to="/transacoes/add" className="btn btn-primary">
                            <i className="ri-add-circle-line align-middle me-1"></i> Nova compra
                        </Link>
                        <Button
                            type="button"
                            color="secondary"
                            outline
                            onClick={handleExportCsv}
                            disabled={exporting}
                        >
                            <i className="ri-file-download-line align-middle me-1"></i>
                            {exporting ? 'Exportando...' : 'Exportar CSV/Excel'}
                        </Button>
                    </div>
                </Col>
                <Col xl={12}>
                    <Card>
                        <CardHeader>
                            <div className="gap-2 flex-wrap">
                                <Row>
                                    <Col md={4}>
                                        <Button onClick={() => setShowFilter(!showFilter)} color="primary" className="mb-1">
                                            Filtros
                                        </Button>
                                    </Col>
                                    {!showFilter && (
                                        <Col md={8}>
                                            <form onSubmit={handleSubmit(getRemoteTransacoesList)}>
                                                <div className="input-group">
                                                    <input
                                                        {...register("palavra_chave")}
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Buscar..."
                                                    />
                                                    <button className="btn btn-success" type="submit">
                                                        <i className="ri-search-line align-middle me-1"></i> Buscar
                                                    </button>
                                                </div>
                                            </form>
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            <Row>
                                <Col>
                                    <Collapse isOpen={showFilter} className="multi-collapse mt-3">
                                        <form
                                            className="px-0 my-0 m-2"
                                            id="form-search"
                                            onSubmit={handleSubmit(getRemoteTransacoesList)}
                                        >
                                            <Row>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="data_inicio" className="form-label">Data início</Label>
                                                        <InputDate<TransacoesSearch>
                                                            field="data_inicio"
                                                            register={register}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="data_fim" className="form-label">Data fim</Label>
                                                        <InputDate<TransacoesSearch>
                                                            field="data_fim"
                                                            register={register}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={cartoesOptions}
                                                            field="cartao_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="tipo" className="form-label">Tipo</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={tiposOptions}
                                                            field="tipo"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="origem_compra" className="form-label">Origem da compra</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={origensCompraOptions}
                                                            field="origem_compra"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="eh_assinatura" className="form-label">Assinatura</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={[
                                                                { value: '', label: 'Todas' },
                                                                { value: 'true', label: 'Só assinaturas' },
                                                                { value: 'false', label: 'Exceto assinaturas' },
                                                            ]}
                                                            field="eh_assinatura"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="estabelecimento_id" className="form-label">Estabelecimento</Label>
                                                        <AsyncSelectListControlled<TransacoesSearch>
                                                            callback={searchEstabelecimentos}
                                                            field="estabelecimento_id"
                                                            control={control}
                                                            placeholder="Digite para buscar..."
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="categoria_id" className="form-label">Categoria</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={categoriasOptions}
                                                            field="categoria_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="subcategoria_id" className="form-label">Subcategoria</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={subcategoriasOptions}
                                                            field="subcategoria_id"
                                                            control={control}
                                                            disabled={!categoriaId}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="plataforma_id" className="form-label">Plataforma</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={plataformasOptions}
                                                            field="plataforma_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="responsavel_id" className="form-label">Responsável</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={responsaveisOptions}
                                                            field="responsavel_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="mes" className="form-label">Mês</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={optMeses}
                                                            field="mes"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="ano" className="form-label">Ano</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={optAnos}
                                                            field="ano"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="status_conciliacao" className="form-label">Conciliação</Label>
                                                        <SelectListControlled<TransacoesSearch>
                                                            options={statusConciliacaoOptions}
                                                            field="status_conciliacao"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row className="mt-3">
                                                <div className="d-flex flex-row justify-content-end align-items-center">
                                                    <Col md={6}>
                                                        <InputTextControlled<TransacoesSearch>
                                                            field="palavra_chave"
                                                            control={control}
                                                            placeholder="Buscar..."
                                                        />
                                                    </Col>
                                                    <Col md={2} className="me-3">
                                                        <button className="btn btn-success form-control ms-3" type="submit">
                                                            Buscar
                                                        </button>
                                                    </Col>
                                                </div>
                                            </Row>
                                        </form>
                                    </Collapse>
                                </Col>
                            </Row>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>

            <VincularLojaModal
                isOpen={vincularLojaOpen}
                toggle={() => setVincularLojaOpen(false)}
                filters={filtersRef}
                onLinked={onAfterVincularLoja}
            />
        </React.Fragment>
    )
}

export default TransacoesFilter
