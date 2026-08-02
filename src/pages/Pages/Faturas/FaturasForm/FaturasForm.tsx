import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { AnosSelect, useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Input, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { FATURA_FILE_ACCEPT, isValidFaturaFile, mesesOptions } from 'helpers/fatura_helpers'
import { FaturasDefaultValues, FaturasModel } from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { CartoesService } from 'services/Cartoes/CartoesService'

const FaturasForm = () => {
    const { state } = useLocation()
    const [record] = useState<FaturasModel>(
        state?.source
            ? {
                ...FaturasDefaultValues,
                ...state.source,
                fatura_id: state.source.fatura_id ?? state.source.id,
                cartao_id: state.source.cartao_id ?? null,
                cartao_bandeira_id: state.source.cartao_bandeira_id ?? null,
            }
            : FaturasDefaultValues
    )
    const { register, handleSubmit, control, setValue, watch } = useForm<FaturasModel>({
        defaultValues: record
    })
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
    const [bandeirasOptions, setBandeirasOptions] = useState<SelectOptions[]>([])
    const [showBandeiraSelect, setShowBandeiraSelect] = useState(false)
    const [bandeirasLoading, setBandeirasLoading] = useState(false)
    const [semBandeiras, setSemBandeiras] = useState(false)
    const [arquivoFile, setArquivoFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const faturasService = useRef(new FaturasService()).current
    const cartoesService = useRef(new CartoesService()).current
    const isEdit = Boolean(record.fatura_id)
    const cartaoId = watch('cartao_id')

    const getLookups = async (): Promise<void> => {
        try {
            const lookups = await faturasService.getLookupsFaturas()
            if (lookups?.cartoes) {
                setCartoesOptions(
                    lookups.cartoes.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `Cartão ${c.id}`,
                        cor_fundo: c.cor_fundo ?? null,
                        cor_texto: c.cor_texto ?? null,
                    }))
                )
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }

    const loadBandeiras = async (id: number | string | null | undefined) => {
        if (!id) {
            setBandeirasOptions([])
            setShowBandeiraSelect(false)
            setSemBandeiras(false)
            setValue('cartao_bandeira_id', null)
            return
        }

        setBandeirasLoading(true)
        setSemBandeiras(false)
        try {
            const list = await cartoesService.AsyncListBandeiras({ cartao_id: id })
            const ativas = (list ?? []).filter((b) => b.ativo !== false)

            if (ativas.length === 0) {
                setBandeirasOptions([])
                setShowBandeiraSelect(false)
                setSemBandeiras(true)
                setValue('cartao_bandeira_id', null)
                return
            }

            setBandeirasOptions(
                ativas.map((b) => ({
                    value: b.id!,
                    label: b.bandeira ?? `Bandeira ${b.id}`,
                }))
            )

            if (ativas.length === 1) {
                setShowBandeiraSelect(false)
                setValue('cartao_bandeira_id', ativas[0].id ?? null)
            } else {
                setShowBandeiraSelect(true)
                // Troca de cartão exige nova escolha quando há 2+ bandeiras
                setValue('cartao_bandeira_id', null)
            }
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error)
            setBandeirasOptions([])
            setShowBandeiraSelect(false)
            setSemBandeiras(true)
            setValue('cartao_bandeira_id', null)
        } finally {
            setBandeirasLoading(false)
        }
    }

    const extractFaturaId = (result: unknown): number | string | null => {
        const body = result as Record<string, any> | null | undefined
        return body?.fatura?.data?.id ?? body?.data?.id ?? body?.id ?? null
    }

    const onSubmit: SubmitHandler<FaturasModel> = async (data) => {
        try {
            if (!isEdit) {
                if (semBandeiras || !data.cartao_bandeira_id) {
                    toast.warning(
                        semBandeiras
                            ? 'Cadastre uma bandeira/número neste cartão antes de criar a fatura'
                            : 'Selecione a bandeira da fatura'
                    )
                    return
                }
            }

            if (isEdit) {
                await faturasService.editFaturas({
                    ...data,
                    fatura_id: record.fatura_id,
                    id: record.fatura_id,
                })
                toast.success('Fatura atualizada com sucesso')
                navigate(`/faturas/view/${record.fatura_id}`)
            } else {
                const payload = {
                    ...data,
                    cartao_bandeira_id: data.cartao_bandeira_id,
                    arquivo_pdf: arquivoFile,
                }
                const result = await faturasService.createFaturas(payload)
                toast.success('Fatura cadastrada com sucesso')
                const newId = extractFaturaId(result)
                if (newId) {
                    navigate(`/faturas/view/${newId}`)
                } else {
                    navigate('/faturas')
                }
            }
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao salvar fatura')
            throw error
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        if (file && !isValidFaturaFile(file)) {
            toast.error('Formato inválido. Envie PDF, CSV ou XML.')
            e.target.value = ''
            setArquivoFile(null)
            setValue('arquivo_pdf', null)
            return
        }
        setArquivoFile(file)
        setValue('arquivo_pdf', file)
    }

    useEffect(() => {
        getLookups()
    }, [])

    useEffect(() => {
        setActiveMenu('/faturas')
    }, [])

    useEffect(() => {
        if (!isEdit) {
            loadBandeiras(cartaoId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartaoId, isEdit])

    const optAnos = AnosSelect()

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/faturas"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEdit ? 'Editar' : 'Adicionar'} Fatura
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/faturas">Faturas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {isEdit ? 'Editar' : 'Adicionar'} Fatura
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
                                            <Col md={showBandeiraSelect ? 4 : 6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={cartoesOptions}
                                                        field="cartao_id"
                                                        control={control}
                                                        required={required}
                                                        disabled={isEdit}
                                                    />
                                                </div>
                                            </Col>
                                            {!isEdit && showBandeiraSelect && (
                                                <Col md={2}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cartao_bandeira_id" className="form-label">
                                                            Bandeira da fatura
                                                        </Label>
                                                        <SelectListControlled<FaturasModel>
                                                            options={bandeirasOptions}
                                                            field="cartao_bandeira_id"
                                                            control={control}
                                                            required={required}
                                                            isLoading={bandeirasLoading}
                                                        />
                                                    </div>
                                                </Col>
                                            )}
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="mes" className="form-label">Mês</Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={mesesOptions}
                                                        field="mes"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="ano" className="form-label">Ano</Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={optAnos}
                                                        field="ano"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        {!isEdit && semBandeiras && cartaoId && (
                                            <div className="alert alert-warning">
                                                Este cartão ainda não possui bandeira/número cadastrado.{' '}
                                                <Link to={`/cartoes/edit/${cartaoId}`}>
                                                    Cadastre uma bandeira/número neste cartão
                                                </Link>
                                            </div>
                                        )}
                                        {!isEdit && (
                                            <Row>
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="arquivo_fatura" className="form-label">
                                                            Arquivo da fatura
                                                        </Label>
                                                        <Input
                                                            id="arquivo_fatura"
                                                            innerRef={fileInputRef}
                                                            type="file"
                                                            accept={FATURA_FILE_ACCEPT}
                                                            onChange={handleFileChange}
                                                        />
                                                        <small className="text-muted">
                                                            Formatos aceitos: PDF, CSV ou XML (máx. 10MB)
                                                        </small>
                                                        {arquivoFile && (
                                                            <div className="mt-1 text-success">
                                                                <i className="ri-file-line me-1"></i>
                                                                {arquivoFile.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={6} className="d-flex align-items-center">
                                                    <div className="form-check form-switch form-switch-md mt-3">
                                                        <Label className="me-3" htmlFor="processar_automatico">Processar automaticamente</Label>
                                                        <InputCheckbox<FaturasModel>
                                                            field="processar_automatico"
                                                            register={register}
                                                            role="switch"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}
                                        <hr />
                                        <Row className="mt-3">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={!isEdit && (semBandeiras || bandeirasLoading)}
                                                    >
                                                        Salvar
                                                    </button>
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

export default FaturasForm
