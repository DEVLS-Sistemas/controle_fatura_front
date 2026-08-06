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
import {
    extractFaturaId,
    extractFaturaPayload,
    faturaPrecisaSenhaPdf,
    FaturasDefaultValues,
    FaturasModel,
    resolveSenhaPdfMeta,
    SenhaPdfMeta,
} from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import FaturaSenhaPdfModal from 'Components/Faturas/FaturaSenhaPdfModal'

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
    const [arquivoFile, setArquivoFile] = useState<File | null>(null)
    const [senhaModalOpen, setSenhaModalOpen] = useState(false)
    const [senhaModalFaturaId, setSenhaModalFaturaId] = useState<number | string | null>(null)
    const [senhaModalMeta, setSenhaModalMeta] = useState<SenhaPdfMeta | null>(null)
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
            setValue('cartao_bandeira_id', null)
            return
        }

        setBandeirasLoading(true)
        try {
            const list = (await cartoesService.AsyncListBandeiras({ cartao_id: id })) ?? []

            if (list.length === 0) {
                setBandeirasOptions([])
                setShowBandeiraSelect(false)
                setValue('cartao_bandeira_id', null)
                return
            }

            setBandeirasOptions(
                list.map((b) => ({
                    value: b.value,
                    label: b.label,
                }))
            )

            if (list.length === 1) {
                setShowBandeiraSelect(false)
                setValue('cartao_bandeira_id', list[0].value ?? null)
            } else {
                setShowBandeiraSelect(true)
                // Troca de cartão exige nova escolha quando há 2+ bandeiras
                setValue('cartao_bandeira_id', null)
            }
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error)
            setBandeirasOptions([])
            setShowBandeiraSelect(false)
            setValue('cartao_bandeira_id', null)
        } finally {
            setBandeirasLoading(false)
        }
    }

    const openSenhaModal = (faturaId: number | string, meta: SenhaPdfMeta | null) => {
        setSenhaModalFaturaId(faturaId)
        setSenhaModalMeta(meta)
        setSenhaModalOpen(true)
    }

    const onSubmit: SubmitHandler<FaturasModel> = async (data) => {
        try {
            if (!isEdit && showBandeiraSelect && !data.cartao_bandeira_id) {
                toast.warning('Selecione a bandeira da fatura')
                return
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
                const faturaData = extractFaturaPayload(result)
                const envelope = result as Record<string, any> | null
                const newId = extractFaturaId(result)

                if (faturaPrecisaSenhaPdf(faturaData, envelope) && newId) {
                    toast.info('Fatura cadastrada. Informe a senha do PDF para continuar.')
                    openSenhaModal(newId, resolveSenhaPdfMeta(faturaData, envelope))
                    return
                }

                toast.success('Fatura cadastrada com sucesso')
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
            toast.error('Formato inválido. Envie PDF ou CSV.')
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
            <FaturaSenhaPdfModal
                isOpen={senhaModalOpen}
                faturaId={senhaModalFaturaId}
                senhaMeta={senhaModalMeta}
                onClose={() => {
                    setSenhaModalOpen(false)
                    if (senhaModalFaturaId) {
                        navigate(`/faturas/view/${senhaModalFaturaId}`)
                    }
                }}
                onSuccess={async () => {
                    if (senhaModalFaturaId) {
                        navigate(`/faturas/view/${senhaModalFaturaId}`)
                    }
                }}
            />
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
                                        {!isEdit && (
                                            <Row>
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="arquivo_fatura" className="form-label">
                                                            Anexo da fatura (PDF ou CSV)
                                                        </Label>
                                                        <Input
                                                            id="arquivo_fatura"
                                                            innerRef={fileInputRef}
                                                            type="file"
                                                            accept={FATURA_FILE_ACCEPT}
                                                            onChange={handleFileChange}
                                                        />
                                                        <small className="text-muted">
                                                            Formatos aceitos: PDF ou CSV (máx. 10MB)
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
                                                        disabled={!isEdit && bandeirasLoading}
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
