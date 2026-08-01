import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required, maxLength } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    buildDiasOptions,
    CARTAO_CORES_FUNDO_PADRAO,
    CARTAO_CORES_TEXTO_PADRAO,
    CARTAO_PARES_CORES_PADRAO,
    CartoesDefaultValues,
    CartoesModel,
    ParCorLookup,
} from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'

const buildRecordFromSource = (source: any): CartoesModel => ({
    ...CartoesDefaultValues,
    ...source,
    id: source.id ?? null,
    cartao_id: source.cartao_id ?? source.id ?? null,
    dia_limite_fatura: source.dia_limite_fatura ?? null,
    dia_vencimento_fatura: source.dia_vencimento_fatura ?? null,
    cor_fundo: source.cor_fundo ?? source.cor ?? null,
    cor_texto: source.cor_texto ?? (source.cor_fundo || source.cor ? '#ffffff' : null),
})

const CORES_UNIFICADAS_PADRAO = Array.from(
    new Set([...CARTAO_CORES_FUNDO_PADRAO, ...CARTAO_CORES_TEXTO_PADRAO])
)

const ColorSwatch = ({
    hex,
    selected,
    onClick,
}: {
    hex: string
    selected: boolean
    onClick: () => void
}) => (
    <button
        type="button"
        className="p-0"
        title={hex}
        onClick={onClick}
        style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: hex,
            border: '1.5px solid #000000',
            outline: selected ? '2px solid #405189' : 'none',
            outlineOffset: 2,
            boxShadow: selected ? '0 0 0 2px rgba(64,81,137,0.2)' : undefined,
            cursor: 'pointer',
            padding: 0,
        }}
    />
)

const CartoesForm = () => {
    const { state } = useLocation()
    const { cartao_id: routeCartaoId, id: routeId } = useParams()
    const paramId = routeCartaoId ?? routeId

    const [record, setRecord] = useState<CartoesModel>(
        state?.source ? buildRecordFromSource(state.source) : CartoesDefaultValues
    )

    const { register, handleSubmit, control, reset, setValue, watch } = useForm<CartoesModel>({
        defaultValues: record
    })

    const corFundo = watch('cor_fundo')
    const corTexto = watch('cor_texto')
    const nomePreview = watch('nome')
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const cartoesService = new CartoesService()

    const [bandeirasOptions, setBandeirasOptions] = useState<SelectOptions[]>([])
    const [diasOptions, setDiasOptions] = useState<SelectOptions[]>(
        buildDiasOptions().map((d) => ({ value: d.value, label: d.label }))
    )
    const [coresFundo, setCoresFundo] = useState<string[]>(CORES_UNIFICADAS_PADRAO)
    const [coresTexto, setCoresTexto] = useState<string[]>(CORES_UNIFICADAS_PADRAO)
    const [paresCores, setParesCores] = useState<ParCorLookup[]>(CARTAO_PARES_CORES_PADRAO)

    const isEditing = !!(record.cartao_id || record.id || paramId)

    const applyParCor = (par: ParCorLookup) => {
        setValue('cor_fundo', par.cor_fundo, { shouldDirty: true })
        setValue('cor_texto', par.cor_texto, { shouldDirty: true })
    }

    const getLookups = async (): Promise<void> => {
        try {
            const lookups = await cartoesService.getLookupsCartoes()
            if (lookups?.bandeiras?.length) {
                setBandeirasOptions(
                    lookups.bandeiras.map((b) => ({ value: b, label: b }))
                )
            }
            if (lookups?.dias?.length) {
                setDiasOptions(
                    lookups.dias.map((d) => ({ value: d.value, label: d.label }))
                )
            }

            const fundo = lookups?.cores_fundo?.length
                ? lookups.cores_fundo
                : CARTAO_CORES_FUNDO_PADRAO
            const texto = lookups?.cores_texto?.length
                ? lookups.cores_texto
                : CARTAO_CORES_TEXTO_PADRAO
            const pares = lookups?.pares_cores?.length
                ? lookups.pares_cores
                : CARTAO_PARES_CORES_PADRAO

            // Mesmas opções nos dois lados (união das paletas, sem duplicar)
            const coresUnificadas = Array.from(new Set([...fundo, ...texto]))
            setCoresFundo(coresUnificadas)
            setCoresTexto(coresUnificadas)
            setParesCores(pares)

            if (!record.cor_fundo || !record.cor_texto) {
                const fallback = pares[0] ?? {
                    cor_fundo: coresUnificadas[0],
                    cor_texto: '#ffffff',
                }
                if (!record.cor_fundo) setValue('cor_fundo', fallback.cor_fundo)
                if (!record.cor_texto) setValue('cor_texto', fallback.cor_texto)
            }
        } catch (error) {
            console.error('Erro ao carregar lookups de cartões:', error)
            if (!record.cor_fundo) setValue('cor_fundo', CARTAO_PARES_CORES_PADRAO[0].cor_fundo)
            if (!record.cor_texto) setValue('cor_texto', CARTAO_PARES_CORES_PADRAO[0].cor_texto)
        }
    }

    const loadRecord = async (id: string | number) => {
        try {
            const view = await cartoesService.getViewCartoes({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                reset(loaded)
            }
        } catch (error) {
            console.error('Erro ao carregar cartão:', error)
            toast.error('Erro ao carregar cartão.')
        }
    }

    const onSubmit: SubmitHandler<CartoesModel> = async (data) => {
        try {
            const payload: CartoesModel = {
                ...data,
                dia_limite_fatura: data.dia_limite_fatura != null
                    ? Number(data.dia_limite_fatura)
                    : null,
                dia_vencimento_fatura: data.dia_vencimento_fatura != null
                    ? Number(data.dia_vencimento_fatura)
                    : null,
            }

            if (isEditing) {
                await cartoesService.editCartoes({
                    ...payload,
                    id: record.id ?? record.cartao_id,
                    cartao_id: record.cartao_id ?? record.id,
                })
                toast.success('Cartão atualizado com sucesso!')
            } else {
                await cartoesService.createCartoes(payload)
                toast.success('Cartão cadastrado com sucesso!')
            }
            navigate('/cartoes')
        } catch (error) {
            console.error('Erro ao salvar cartão:', error)
            toast.error('Erro ao salvar cartão.')
        }
    }

    useEffect(() => {
        setActiveMenu('/cartoes')
    }, [])

    useEffect(() => {
        getLookups()
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
                                    <Link to="/cartoes"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEditing ? 'Editar' : 'Adicionar'} Cartão
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/cartoes">Cartões de Crédito</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEditing ? 'Editar' : 'Adicionar'} Cartão
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
                                                    <InputTextControlled<CartoesModel>
                                                        field={"nome"}
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="bandeira" className="form-label">Bandeira</Label>
                                                    {bandeirasOptions.length > 0 ? (
                                                        <SelectListControlled<CartoesModel>
                                                            field="bandeira"
                                                            control={control}
                                                            options={bandeirasOptions}
                                                        />
                                                    ) : (
                                                        <InputTextControlled<CartoesModel>
                                                            field={"bandeira"}
                                                            control={control}
                                                        />
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="banco" className="form-label">Banco</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"banco"}
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="ultimos_digitos" className="form-label">Últimos Dígitos</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"ultimos_digitos"}
                                                        control={control}
                                                        maxLength={maxLength(4)}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="dia_limite_fatura" className="form-label">
                                                        Dia limite da fatura
                                                    </Label>
                                                    <SelectListControlled<CartoesModel>
                                                        field="dia_limite_fatura"
                                                        control={control}
                                                        options={diasOptions}
                                                        required={required}
                                                    />
                                                    <small className="text-muted">
                                                        Compras até este dia entram na fatura do mês
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="dia_vencimento_fatura" className="form-label">
                                                        Dia de vencimento
                                                    </Label>
                                                    <SelectListControlled<CartoesModel>
                                                        field="dia_vencimento_fatura"
                                                        control={control}
                                                        options={diasOptions}
                                                        required={required}
                                                    />
                                                    <small className="text-muted">
                                                        Data limite para pagamento
                                                    </small>
                                                </div>
                                            </Col>

                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label className="form-label">Cores do cartão</Label>
                                                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                                        <span className="text-muted small me-1">Sugestões:</span>
                                                        {paresCores.map((par) => {
                                                            const selected =
                                                                corFundo === par.cor_fundo &&
                                                                corTexto === par.cor_texto
                                                            return (
                                                                <button
                                                                    key={`${par.cor_fundo}-${par.cor_texto}-${par.label}`}
                                                                    type="button"
                                                                    className="btn btn-sm p-0 border-0"
                                                                    onClick={() => applyParCor(par)}
                                                                    title={par.label || `${par.cor_fundo} / ${par.cor_texto}`}
                                                                    style={{
                                                                        outline: selected
                                                                            ? '2px solid #405189'
                                                                            : '1px solid transparent',
                                                                        outlineOffset: 2,
                                                                        borderRadius: 4,
                                                                    }}
                                                                >
                                                                    <CartaoChip
                                                                        cor_fundo={par.cor_fundo}
                                                                        cor_texto={par.cor_texto}
                                                                        label={par.label || 'Aa'}
                                                                    />
                                                                </button>
                                                            )
                                                        })}
                                                    </div>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Label className="form-label small text-muted">Cor de fundo</Label>
                                                            <div
                                                                className="d-flex flex-wrap gap-2 mb-2 p-2 rounded"
                                                                style={{
                                                                    backgroundColor: '#eef1f5',
                                                                    border: '1px solid #e3e7ed',
                                                                }}
                                                            >
                                                                {coresFundo.map((hex) => (
                                                                    <ColorSwatch
                                                                        key={`fundo-${hex}`}
                                                                        hex={hex}
                                                                        selected={corFundo === hex}
                                                                        onClick={() =>
                                                                            setValue('cor_fundo', hex, { shouldDirty: true })
                                                                        }
                                                                    />
                                                                ))}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Label className="form-label small text-muted">Cor do texto</Label>
                                                            <div
                                                                className="d-flex flex-wrap gap-2 mb-2 p-2 rounded"
                                                                style={{
                                                                    backgroundColor: '#eef1f5',
                                                                    border: '1px solid #e3e7ed',
                                                                }}
                                                            >
                                                                {coresTexto.map((hex) => (
                                                                    <ColorSwatch
                                                                        key={`texto-${hex}`}
                                                                        hex={hex}
                                                                        selected={corTexto === hex}
                                                                        onClick={() =>
                                                                            setValue('cor_texto', hex, { shouldDirty: true })
                                                                        }
                                                                    />
                                                                ))}
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    <div className="d-flex align-items-center gap-2 mt-2">
                                                        <span className="text-muted small">Preview:</span>
                                                        <CartaoChip
                                                            cor_fundo={corFundo}
                                                            cor_texto={corTexto}
                                                            label={nomePreview || 'Cartão'}
                                                        />
                                                        {(corFundo || corTexto) && (
                                                            <small className="text-muted">
                                                                {corFundo || '-'} / {corTexto || '-'}
                                                            </small>
                                                        )}
                                                    </div>
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

export default CartoesForm
