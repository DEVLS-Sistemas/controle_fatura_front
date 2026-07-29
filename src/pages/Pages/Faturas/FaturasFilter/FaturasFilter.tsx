import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import {
    Breadcrumb, BreadcrumbItem, Button, Card, CardHeader, Col, Collapse, Label, Row
} from "reactstrap"
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled"
import { SelectListControlled } from "Components/ComponentController/Selects/Select/SelectListControlled"
import { SelectOptions } from "interfaces/SystemInterfaces/SelectInterface"
import { mesesOptions } from "helpers/fatura_helpers"
import { FaturasSearch } from "interfaces/Faturas/FaturasInterface"
import { FaturasService } from "services/Faturas/FaturasService"

export interface FaturasFilterProps {
    getRemoteFaturasList: (data: any) => void
}

const optStatus: SelectOptions[] = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'processando', label: 'Processando' },
    { value: 'processada', label: 'Processada' },
    { value: 'erro', label: 'Erro' },
]

const FaturasFilter = ({ getRemoteFaturasList }: FaturasFilterProps) => {
    const { handleSubmit, control, register } = useForm<FaturasSearch>({ defaultValues: {} })
    const [showFilter, setShowFilter] = useState<boolean>(false)
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const faturasService = new FaturasService()

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const lookups = await faturasService.getLookupsFaturas()
                if (lookups?.cartoes) {
                    const opts: SelectOptions[] = [{ value: '', label: 'Todos' }]
                    lookups.cartoes.forEach((c) => {
                        opts.push({
                            value: c.id!,
                            label: c.nome ?? `Cartão ${c.id}`,
                        })
                    })
                    setCartoesOptions(opts)
                }
            } catch (error) {
                console.error('Erro ao carregar lookups:', error)
            }
        }
        loadLookups()
    }, [])

    const anoAtual = new Date().getFullYear()
    const optAnos: SelectOptions[] = [{ value: '', label: 'Todos' }]
    for (let a = anoAtual; a >= anoAtual - 5; a--) {
        optAnos.push({ value: a, label: String(a) })
    }

    const optMeses: SelectOptions[] = [{ value: '', label: 'Todos' }, ...mesesOptions]

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
                            <h4 className="mb-0">Faturas</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                            <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                            <BreadcrumbItem active>Faturas</BreadcrumbItem>
                        </Breadcrumb>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-row justify-content-end align-items-center mb-4">
                        <Link to="/faturas/add" className="btn btn-primary">
                            <i className="ri-add-circle-line align-middle me-1"></i> Adicionar Fatura
                        </Link>
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
                                            <form onSubmit={handleSubmit(getRemoteFaturasList)}>
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
                                            onSubmit={handleSubmit(getRemoteFaturasList)}
                                        >
                                            <Row>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={cartoesOptions}
                                                            field="cartao_id"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="mes" className="form-label">Mês</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optMeses}
                                                            field="mes"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="ano" className="form-label">Ano</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optAnos}
                                                            field="ano"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="status" className="form-label">Status</Label>
                                                        <SelectListControlled<FaturasSearch>
                                                            options={optStatus}
                                                            field="status"
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row className="mt-3">
                                                <div className="d-flex flex-row justify-content-end align-items-center">
                                                    <Col md={6}>
                                                        <InputTextControlled<FaturasSearch>
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
        </React.Fragment>
    )
}

export default FaturasFilter
