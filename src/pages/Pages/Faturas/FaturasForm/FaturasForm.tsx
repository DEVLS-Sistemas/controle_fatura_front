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
import FaturaSenhaPdfModal, { FaturaSenhaUnlockPayload } from 'Components/Faturas/FaturaSenhaPdfModal'
import FaturaSelecaoModal, { FaturaSelecaoStep } from 'Components/Faturas/FaturaSelecaoModal'
import FaturaMetadadosModal from 'Components/Faturas/FaturaMetadadosModal'
import {
    FaturaSelecaoBandeiraOption,
    FaturaSelecaoError,
    FaturaSelecaoNumeroOption,
    FaturaSelecaoRetryPayload,
} from 'libs/api/exceptions/FaturaSelecaoError'
import {
    FaturaMetadadosCartaoOption,
    FaturaMetadadosError,
    FaturaMetadadosRetryPayload,
    FaturaMetadadosSugestao,
    isFalhaDeteccaoMetadados,
} from 'libs/api/exceptions/FaturaMetadadosError'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'
import { ValidationError } from 'libs/api/exceptions/ValidationError'

type PendingSenhaPayload = {
    senha_pdf?: string
    salvar_senha_pdf?: boolean
    senha_pdf_regra?: string | null
}

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
    const { register, handleSubmit, control, setValue, watch, getValues } = useForm<FaturasModel>({
        defaultValues: record
    })
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
    const [bandeirasOptions, setBandeirasOptions] = useState<SelectOptions[]>([])
    const [showBandeiraSelect, setShowBandeiraSelect] = useState(false)
    const [bandeirasLoading, setBandeirasLoading] = useState(false)
    const [arquivoFile, setArquivoFile] = useState<File | null>(null)
    /** Quando o back não detecta metadados no anexo, força cartão/mês/ano */
    const [exigeMetadadosManuais, setExigeMetadadosManuais] = useState(false)
    const [senhaModalOpen, setSenhaModalOpen] = useState(false)
    const [senhaModalFaturaId, setSenhaModalFaturaId] = useState<number | string | null>(null)
    const [senhaModalMeta, setSenhaModalMeta] = useState<SenhaPdfMeta | null>(null)
    const [senhaCadastroMode, setSenhaCadastroMode] = useState(false)
    const [selecaoModalOpen, setSelecaoModalOpen] = useState(false)
    const [selecaoStep, setSelecaoStep] = useState<FaturaSelecaoStep>('bandeira')
    const [selecaoBandeiras, setSelecaoBandeiras] = useState<FaturaSelecaoBandeiraOption[]>([])
    const [selecaoNumeros, setSelecaoNumeros] = useState<FaturaSelecaoNumeroOption[]>([])
    const [selecaoCartaoBandeiraId, setSelecaoCartaoBandeiraId] = useState<number | null>(null)
    const [selecaoBandeiraNome, setSelecaoBandeiraNome] = useState<string | null>(null)
    const [selecaoLoading, setSelecaoLoading] = useState(false)
    const [metadadosModalOpen, setMetadadosModalOpen] = useState(false)
    const [metadadosLoading, setMetadadosLoading] = useState(false)
    const [metadadosSugestao, setMetadadosSugestao] = useState<FaturaMetadadosSugestao | null>(null)
    const [metadadosCartoes, setMetadadosCartoes] = useState<FaturaMetadadosCartaoOption[]>([])
    const [metadadosBandeiras, setMetadadosBandeiras] = useState<FaturaSelecaoBandeiraOption[]>([])
    const [metadadosPrecisaBandeira, setMetadadosPrecisaBandeira] = useState(false)
    const pendingSelecaoRef = useRef<FaturaSelecaoRetryPayload>({})
    const pendingSenhaRef = useRef<PendingSenhaPayload>({})
    const pendingMetadadosRef = useRef<Partial<FaturaMetadadosRetryPayload>>({})
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const faturasService = useRef(new FaturasService()).current
    const cartoesService = useRef(new CartoesService()).current
    const isEdit = Boolean(record.fatura_id)
    const cartaoId = watch('cartao_id')

    const camposManualObrigatorios = isEdit || !arquivoFile || exigeMetadadosManuais

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

    const openSenhaModalPosCadastro = (faturaId: number | string, meta: SenhaPdfMeta | null) => {
        setSenhaCadastroMode(false)
        setSenhaModalFaturaId(faturaId)
        setSenhaModalMeta(meta)
        setSenhaModalOpen(true)
    }

    const openSenhaModalCadastro = (meta: SenhaPdfMeta | null) => {
        setSenhaCadastroMode(true)
        setSenhaModalFaturaId(null)
        setSenhaModalMeta(meta)
        setSenhaModalOpen(true)
    }

    const openSelecaoModal = (error: FaturaSelecaoError) => {
        if (error.precisa_selecionar_final || error.codigo === 'precisa_selecionar_final') {
            setSelecaoStep('final')
            setSelecaoNumeros(error.numeros)
            if (error.cartao_bandeira_id != null) {
                setSelecaoCartaoBandeiraId(error.cartao_bandeira_id)
                pendingSelecaoRef.current = {
                    ...pendingSelecaoRef.current,
                    cartao_bandeira_id: error.cartao_bandeira_id,
                }
            }
        } else {
            setSelecaoStep('bandeira')
            setSelecaoBandeiras(error.bandeiras)
            setSelecaoNumeros([])
            setSelecaoCartaoBandeiraId(null)
            setSelecaoBandeiraNome(null)
            pendingSelecaoRef.current = {}
        }
        setSelecaoModalOpen(true)
    }

    const openMetadadosModal = (error: FaturaMetadadosError) => {
        setMetadadosSugestao(error.sugestao)
        setMetadadosCartoes(error.cartoes)
        setMetadadosBandeiras(error.bandeiras)
        setMetadadosPrecisaBandeira(error.precisa_selecionar_bandeira)
        setMetadadosModalOpen(true)
    }

    const handleCreateSuccess = (result: unknown) => {
        const faturaData = extractFaturaPayload(result)
        const envelope = result as Record<string, any> | null
        const newId = extractFaturaId(result)

        if (faturaPrecisaSenhaPdf(faturaData, envelope) && newId) {
            toast.info('Fatura cadastrada. Informe a senha do PDF para continuar.')
            openSenhaModalPosCadastro(newId, resolveSenhaPdfMeta(faturaData, envelope))
            return
        }

        toast.success('Fatura cadastrada com sucesso')
        if (newId) {
            navigate(`/faturas/view/${newId}`)
        } else {
            navigate('/faturas')
        }
    }

    const handleCreateError = (error: unknown): boolean => {
        if (error instanceof FaturaMetadadosError) {
            openMetadadosModal(error)
            return true
        }
        if (error instanceof FaturaSelecaoError) {
            openSelecaoModal(error)
            return true
        }
        if (error instanceof PdfSenhaError) {
            openSenhaModalCadastro(error.senha_pdf ?? null)
            return true
        }
        if (error instanceof ValidationError && isFalhaDeteccaoMetadados(error.errors as any)) {
            const body = error.errors as Record<string, any> | undefined
            toast.warning(
                body?.message
                || 'Não foi possível identificar cartão, mês e ano pelo arquivo. Informe esses campos manualmente.'
            )
            setExigeMetadadosManuais(true)
            return true
        }
        return false
    }

    const submitCreate = async (extra?: FaturaSelecaoRetryPayload & Partial<FaturaMetadadosRetryPayload>) => {
        const data = getValues()
        const cartaoId =
            extra?.cartao_id
            ?? pendingMetadadosRef.current.cartao_id
            ?? data.cartao_id
        const cartaoNome =
            extra?.cartao_nome
            ?? pendingMetadadosRef.current.cartao_nome
            ?? undefined

        const payload: FaturasModel = {
            ...data,
            // Novo cartão: envia nome sem cartao_id para o back criar no mesmo POST
            cartao_id: cartaoNome ? null : (cartaoId ?? null),
            cartao_nome: cartaoNome || undefined,
            mes: extra?.mes ?? pendingMetadadosRef.current.mes ?? data.mes,
            ano: extra?.ano ?? pendingMetadadosRef.current.ano ?? data.ano,
            cartao_bandeira_id:
                extra?.cartao_bandeira_id
                ?? pendingMetadadosRef.current.cartao_bandeira_id
                ?? pendingSelecaoRef.current.cartao_bandeira_id
                ?? data.cartao_bandeira_id,
            bandeira:
                extra?.bandeira
                ?? pendingMetadadosRef.current.bandeira
                ?? pendingSelecaoRef.current.bandeira
                ?? undefined,
            cartao_numero_id: extra?.cartao_numero_id ?? pendingSelecaoRef.current.cartao_numero_id ?? undefined,
            ultimos_digitos: extra?.ultimos_digitos ?? pendingSelecaoRef.current.ultimos_digitos ?? undefined,
            senha_pdf: pendingSenhaRef.current.senha_pdf,
            salvar_senha_pdf: pendingSenhaRef.current.salvar_senha_pdf,
            senha_pdf_regra: pendingSenhaRef.current.senha_pdf_regra ?? undefined,
            arquivo_pdf: arquivoFile,
        }
        return faturasService.createFaturas(payload)
    }

    const validateCreateSubmit = (data: FaturasModel): boolean => {
        if (!arquivoFile) {
            if (!data.cartao_id) {
                toast.warning('Informe o cartão, o mês e o ano — ou anexe a fatura (PDF/CSV).')
                return false
            }
            if (data.mes == null || data.mes === '') {
                toast.warning('Informe o mês da fatura')
                return false
            }
            if (data.ano == null || data.ano === '') {
                toast.warning('Informe o ano da fatura')
                return false
            }
        } else if (exigeMetadadosManuais) {
            if (!data.cartao_id || data.mes == null || data.mes === '' || data.ano == null || data.ano === '') {
                toast.warning('Informe cartão, mês e ano para continuar com este arquivo.')
                return false
            }
        }

        if (showBandeiraSelect && !data.cartao_bandeira_id) {
            toast.warning('Selecione a bandeira da fatura')
            return false
        }

        return true
    }

    const onSubmit: SubmitHandler<FaturasModel> = async (data) => {
        try {
            if (isEdit) {
                await faturasService.editFaturas({
                    ...data,
                    fatura_id: record.fatura_id,
                    id: record.fatura_id,
                })
                toast.success('Fatura atualizada com sucesso')
                navigate(`/faturas/view/${record.fatura_id}`)
                return
            }

            if (!validateCreateSubmit(data)) return

            const result = await submitCreate()
            handleCreateSuccess(result)
        } catch (error: any) {
            if (handleCreateError(error)) return
            toast.error(error?.message || 'Erro ao salvar fatura')
            throw error
        }
    }

    const handleSelecaoConfirm = async (selection: FaturaSelecaoRetryPayload) => {
        const merged: FaturaSelecaoRetryPayload = {
            ...pendingSelecaoRef.current,
            ...selection,
        }
        pendingSelecaoRef.current = merged

        if (selection.bandeira) {
            setSelecaoBandeiraNome(selection.bandeira)
        }
        if (selection.cartao_bandeira_id != null) {
            setSelecaoCartaoBandeiraId(Number(selection.cartao_bandeira_id))
        }

        setSelecaoLoading(true)
        try {
            const result = await submitCreate(merged)
            setSelecaoModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (error instanceof FaturaSelecaoError) {
                if (error.precisa_selecionar_final || error.codigo === 'precisa_selecionar_final') {
                    setSelecaoStep('final')
                    setSelecaoNumeros(error.numeros)
                    if (error.cartao_bandeira_id != null) {
                        setSelecaoCartaoBandeiraId(error.cartao_bandeira_id)
                        pendingSelecaoRef.current = {
                            ...pendingSelecaoRef.current,
                            cartao_bandeira_id: error.cartao_bandeira_id,
                        }
                    }
                    toast.info('Selecione o final do cartão para continuar')
                    return
                }
                openSelecaoModal(error)
                return
            }
            if (handleCreateError(error)) {
                setSelecaoModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao salvar fatura')
        } finally {
            setSelecaoLoading(false)
        }
    }

    const handleMetadadosConfirm = async (selection: FaturaMetadadosRetryPayload) => {
        pendingMetadadosRef.current = selection
        setValue('mes', selection.mes)
        setValue('ano', selection.ano)
        if (selection.cartao_nome) {
            setValue('cartao_id', null)
            setValue('cartao_nome', selection.cartao_nome)
        } else if (selection.cartao_id != null) {
            setValue('cartao_id', selection.cartao_id)
            setValue('cartao_nome', null)
        }
        if (selection.cartao_bandeira_id != null) {
            setValue('cartao_bandeira_id', selection.cartao_bandeira_id)
            pendingSelecaoRef.current = {
                ...pendingSelecaoRef.current,
                cartao_bandeira_id: selection.cartao_bandeira_id,
                bandeira: undefined,
            }
        }
        if (selection.bandeira) {
            pendingSelecaoRef.current = {
                ...pendingSelecaoRef.current,
                bandeira: selection.bandeira,
                cartao_bandeira_id: selection.cartao_bandeira_id ?? undefined,
            }
        }

        setMetadadosLoading(true)
        try {
            const result = await submitCreate(selection)
            setMetadadosModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setMetadadosModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao salvar fatura')
        } finally {
            setMetadadosLoading(false)
        }
    }

    const handleSenhaCadastroUnlock = async (payload: FaturaSenhaUnlockPayload) => {
        pendingSenhaRef.current = {
            senha_pdf: payload.senha_pdf,
            salvar_senha_pdf: payload.salvar_senha_pdf,
            senha_pdf_regra: payload.senha_pdf_regra ?? null,
        }
        try {
            const result = await submitCreate()
            handleCreateSuccess(result)
        } catch (error) {
            if (error instanceof PdfSenhaError) {
                throw error
            }
            if (handleCreateError(error)) {
                return
            }
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
        if (!file) {
            setExigeMetadadosManuais(false)
        }
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
    const requiredManual = camposManualObrigatorios ? required : undefined

    return (
        <React.Fragment>
            <FaturaSenhaPdfModal
                isOpen={senhaModalOpen}
                faturaId={senhaModalFaturaId}
                senhaMeta={senhaModalMeta}
                onUnlock={senhaCadastroMode ? handleSenhaCadastroUnlock : undefined}
                onClose={() => {
                    setSenhaModalOpen(false)
                    setSenhaCadastroMode(false)
                    if (!senhaCadastroMode && senhaModalFaturaId) {
                        navigate(`/faturas/view/${senhaModalFaturaId}`)
                    }
                }}
                onSuccess={async () => {
                    if (!senhaCadastroMode && senhaModalFaturaId) {
                        navigate(`/faturas/view/${senhaModalFaturaId}`)
                    }
                }}
            />
            <FaturaSelecaoModal
                isOpen={selecaoModalOpen}
                step={selecaoStep}
                bandeiras={selecaoBandeiras}
                numeros={selecaoNumeros}
                cartaoBandeiraId={selecaoCartaoBandeiraId}
                bandeiraNome={selecaoBandeiraNome}
                loading={selecaoLoading}
                onClose={() => setSelecaoModalOpen(false)}
                onConfirm={handleSelecaoConfirm}
            />
            <FaturaMetadadosModal
                isOpen={metadadosModalOpen}
                sugestao={metadadosSugestao}
                cartoes={metadadosCartoes}
                bandeiras={metadadosBandeiras}
                precisaSelecionarBandeira={metadadosPrecisaBandeira}
                loading={metadadosLoading}
                onClose={() => setMetadadosModalOpen(false)}
                onConfirm={handleMetadadosConfirm}
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
                                                        <small className="text-muted d-block">
                                                            Formatos aceitos: PDF ou CSV (máx. 10MB).
                                                            {!arquivoFile && (
                                                                <> Sem anexo, informe cartão, mês e ano.</>
                                                            )}
                                                            {arquivoFile && !exigeMetadadosManuais && (
                                                                <> Com anexo, cartão/mês/ano são opcionais — tentamos detectar automaticamente.</>
                                                            )}
                                                            {exigeMetadadosManuais && (
                                                                <> Não foi possível detectar os dados: preencha cartão, mês e ano.</>
                                                            )}
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
                                        <Row>
                                            <Col md={showBandeiraSelect ? 4 : 6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="cartao_id" className="form-label">
                                                        Cartão
                                                        {!camposManualObrigatorios && (
                                                            <span className="text-muted fw-normal"> (opcional)</span>
                                                        )}
                                                    </Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={cartoesOptions}
                                                        field="cartao_id"
                                                        control={control}
                                                        required={requiredManual}
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
                                                    <Label htmlFor="mes" className="form-label">
                                                        Mês
                                                        {!camposManualObrigatorios && (
                                                            <span className="text-muted fw-normal"> (opcional)</span>
                                                        )}
                                                    </Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={mesesOptions}
                                                        field="mes"
                                                        control={control}
                                                        required={requiredManual}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="ano" className="form-label">
                                                        Ano
                                                        {!camposManualObrigatorios && (
                                                            <span className="text-muted fw-normal"> (opcional)</span>
                                                        )}
                                                    </Label>
                                                    <SelectListControlled<FaturasModel>
                                                        options={optAnos}
                                                        field="ano"
                                                        control={control}
                                                        required={requiredManual}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-3">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={!isEdit && bandeirasLoading}
                                                    >
                                                        {isEdit ? 'Salvar' : 'Cadastrar'}
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
