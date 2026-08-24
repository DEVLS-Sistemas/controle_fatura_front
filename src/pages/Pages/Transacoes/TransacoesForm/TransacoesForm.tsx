import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { mask, removeMask, useNavegacao } from 'helpers/functions_helpers'
import {
    centavosToBr,
    origemCompraLabel,
    parcelasOptions,
    splitValorEmParcelas,
    toCentavos,
    tipoTransacaoLabel,
    VALOR_TEXT_CLASS,
    isMeuResponsavelDisplay,
    nomeResponsavelPadraoNaoEu,
} from 'helpers/fatura_helpers'
import { Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { AsyncSelectListControlled } from 'Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    CategoriaLookup,
    EstabelecimentoLookup,
    ResponsavelLookup,
    TransacoesDefaultValues,
    TransacoesModel,
} from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { NumeroListItem } from 'interfaces/Cartoes/CartoesInterface'
import ResponsavelModal from '../ResponsavelModal/ResponsavelModal'
import CategoriaRapidoModal, { CategoriaRapidoConfirm } from '../CategoriaRapidoModal/CategoriaRapidoModal'
import SubcategoriaRapidoModal, { SubcategoriaRapidoConfirm } from '../SubcategoriaRapidoModal/SubcategoriaRapidoModal'

const formatNumeroOptionLabel = (n: NumeroListItem): string => {
    if (n.label) return n.label
    const digitos = String(n.ultimos_digitos ?? '').replace(/\D/g, '').slice(-4)
    const base = digitos ? `•••• ${digitos}` : `#${n.value}`
    const nome = n.nome_no_cartao?.trim() || null
    const extras = [
        n.bandeira,
        nome,
        !nome ? (n.apelido || (n.tipo ? String(n.tipo) : null)) : null,
    ].filter(Boolean)
    return extras.length ? `${extras.join(' · ')} · ${base}` : base
}

/**
 * UX: ao trocar o estabelecimento, a UI sempre reaplica
 * categoria_padrao_id e subcategoria_padrao_id do estabelecimento selecionado.
 * Editar categoria/subcategoria na compra NÃO atualiza o estabelecimento.
 *
 * Create: valor_compra + select 1..36; sem parcela_atual.
 * Parcelado: N inputs editáveis; total deve bater com valor_compra.
 */
const TransacoesForm = () => {
    const { state } = useLocation()
    const returnTo: string | undefined = state?.returnTo

    const toPrecoDigits = (value: string | number | null | undefined): string | null => {
        if (value == null || value === '') return null
        return String(toCentavos(value))
    }

    const [record] = useState<TransacoesModel>(
        state?.source
            ? {
                ...TransacoesDefaultValues,
                ...state.source,
                transacao_id: state.source.transacao_id ?? state.source.id,
                cartao_id: state.source.cartao_id ?? null,
                cartao_numero_id: state.source.cartao_numero_id ?? state.source.cartao_numero?.id ?? null,
                fatura_id: state.source.fatura_id ?? null,
                estabelecimento_id: state.source.estabelecimento_id ?? null,
                subcategoria_id: state.source.subcategoria_id ?? null,
                origem_compra: state.source.origem_compra ?? null,
                valor: toPrecoDigits(state.source.valor ?? state.source.valor_compra),
                valor_compra: toPrecoDigits(state.source.valor_compra ?? state.source.valor),
                parcelas_total: state.source.parcelas_total ?? 1,
                compra_grupo_id: state.source.compra_grupo_id ?? null,
            }
            : TransacoesDefaultValues
    )

    const { register, handleSubmit, control, setValue, watch } = useForm<TransacoesModel>({
        defaultValues: record,
    })

    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
    const [numerosOptions, setNumerosOptions] = useState<SelectOptions[]>([])
    const [showNumeroSelect, setShowNumeroSelect] = useState(false)
    const [semNumeros, setSemNumeros] = useState(false)
    const [numerosLoading, setNumerosLoading] = useState(false)
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [subcategoriasOptions, setSubcategoriasOptions] = useState<SelectOptions[]>([])
    const defaultOrigensCompraOptions: SelectOptions[] = Object.entries(origemCompraLabel).map(
        ([value, label]) => ({ value, label })
    )
    const [origensCompraOptions, setOrigensCompraOptions] = useState<SelectOptions[]>(defaultOrigensCompraOptions)
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
    const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
    const [categoriaRapidoOpen, setCategoriaRapidoOpen] = useState(false)
    const [subcategoriaRapidoOpen, setSubcategoriaRapidoOpen] = useState(false)
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [parcelasValores, setParcelasValores] = useState<string[]>([])

    const skipEstabelecimentoEffect = useRef(true)
    const skipCategoriaEffect = useRef(true)
    const skipCartaoNumeroEffect = useRef(true)
    const skipRedistributeParcelas = useRef(
        Array.isArray(state?.source?.parcelas) && state.source.parcelas.length > 0
    )
    const applyingEstabelecimentoDefaults = useRef(false)
    const estabelecimentosCache = useRef<Map<number, EstabelecimentoLookup>>(new Map())

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const transacoesService = new TransacoesService()
    const estabelecimentosService = new EstabelecimentosService()
    const subcategoriasService = new SubcategoriasService()
    const cartoesService = useRef(new CartoesService()).current
    const isEdit = Boolean(record.transacao_id ?? record.id)
    const fromFatura = Boolean(record.fatura_id)

    const cartaoId = watch('cartao_id')
    const estabelecimentoId = watch('estabelecimento_id')
    const categoriaId = watch('categoria_id')
    const responsavelId = watch('responsavel_id')
    const valorCompraWatch = watch('valor_compra')
    const parcelasTotalWatch = watch('parcelas_total')
    const propagarGrupo = watch('propagar_grupo')

    const nParcelas = Math.max(1, Math.min(36, Number(parcelasTotalWatch) || 1))
    const totalParcelasCentavos = parcelasValores.reduce((acc, v) => acc + toCentavos(v), 0)
    const valorCompraCentavos = toCentavos(valorCompraWatch)
    const totaisBatem = nParcelas <= 1 || totalParcelasCentavos === valorCompraCentavos
    const showFinalField = showNumeroSelect || semNumeros || numerosLoading
        || (isEdit && (numerosOptions.length > 0 || semNumeros || numerosLoading))

    const responsavelAtual = responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))
    const isMeuResponsavel = isMeuResponsavelDisplay({
        responsavelId,
        responsavelNome: responsavelAtual?.nome,
        defaultResponsavelId,
        padraoFaturaNome: state?.source?.responsavel_nome,
    })
    const responsavelLabel = isMeuResponsavel
        ? null
        : (responsavelAtual?.nome
            ?? nomeResponsavelPadraoNaoEu(state?.source)
            ?? (responsavelId ? `#${responsavelId}` : null))

    const optTipos: SelectOptions[] = Object.entries(tipoTransacaoLabel).map(([value, label]) => ({
        value,
        label,
    }))

    const optParcelas: SelectOptions[] = parcelasOptions.map((p) => ({
        value: p.value,
        label: p.label,
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

    const toBrPayload = (value: string | number | null | undefined): string => {
        return centavosToBr(toCentavos(value))
    }

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

    const loadNumeros = async (opts: {
        cartao_id?: number | string | null
        fatura_id?: number | string | null
        preserveSelection?: boolean
        /** No edit, o select fica sempre visível (mesmo com 1 final) */
        forceShowSelect?: boolean
    }) => {
        const { cartao_id, fatura_id, preserveSelection = false, forceShowSelect = false } = opts
        if (!cartao_id && !fatura_id) {
            setNumerosOptions([])
            setShowNumeroSelect(false)
            setSemNumeros(false)
            if (!preserveSelection) setValue('cartao_numero_id', null)
            return
        }

        setNumerosLoading(true)
        setSemNumeros(false)
        try {
            const list = (await cartoesService.AsyncListNumeros({
                ...(fatura_id ? { fatura_id } : {}),
                ...(cartao_id && !fatura_id ? { cartao_id } : {}),
            })) ?? []

            if (list.length === 0) {
                setNumerosOptions([])
                setShowNumeroSelect(false)
                setSemNumeros(true)
                if (!preserveSelection) setValue('cartao_numero_id', null)
                return
            }

            setNumerosOptions(
                list.map((n) => ({
                    value: n.value,
                    label: formatNumeroOptionLabel(n),
                }))
            )

            if (list.length === 1) {
                // Create: oculta e pré-seleciona. Edit: mantém visível para corrigir/atribuir.
                setShowNumeroSelect(forceShowSelect)
                if (preserveSelection) {
                    const current = record.cartao_numero_id
                    const stillValid = list.some((n) => Number(n.value) === Number(current))
                    setValue('cartao_numero_id', stillValid ? current : (list[0].value ?? null))
                } else {
                    setValue('cartao_numero_id', list[0].value ?? null)
                }
                return
            }

            setShowNumeroSelect(true)
            if (preserveSelection) {
                const current = record.cartao_numero_id
                const stillValid = list.some((n) => Number(n.value) === Number(current))
                setValue('cartao_numero_id', stillValid ? current : null)
            } else {
                setValue('cartao_numero_id', null)
            }
        } catch (error) {
            console.error('Erro ao carregar finais do cartão:', error)
            setNumerosOptions([])
            setShowNumeroSelect(false)
            setSemNumeros(true)
            if (!preserveSelection) setValue('cartao_numero_id', null)
        } finally {
            setNumerosLoading(false)
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
                        cor_fundo: c.cor_fundo ?? null,
                        cor_texto: c.cor_texto ?? null,
                    }))
                )
            }
            if (lookups?.categorias) {
                setCategoriasLookup(lookups.categorias)
                setCategoriasOptions(
                    lookups.categorias.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `#${c.id}`,
                    }))
                )
            }
            if (lookups?.origens_compra?.length) {
                setOrigensCompraOptions(
                    lookups.origens_compra.map((o) => ({
                        value: o.value ?? '',
                        label: o.label ?? o.value ?? '',
                    }))
                )
            }
            if (lookups?.responsaveis) {
                setResponsaveisLookup(lookups.responsaveis)
            }
            if (lookups?.default_responsavel_id != null) {
                setDefaultResponsavelId(lookups.default_responsavel_id)
            }
            if (!isEdit && record.responsavel_id) {
                setValue('responsavel_id', record.responsavel_id)
            } else if (!isEdit && lookups?.default_responsavel_id && !record.responsavel_id) {
                setValue('responsavel_id', lookups.default_responsavel_id)
            }

            if (record.categoria_id) {
                await loadSubcategorias(record.categoria_id)
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }

    const redistributeParcelas = (valor: string | number | null | undefined, n: number) => {
        if (n <= 1) {
            setParcelasValores([])
            return
        }
        setParcelasValores(splitValorEmParcelas(toCentavos(valor), n))
    }

    const handleParcelaChange = (index: number, raw: string) => {
        const digits = removeMask(raw)
        setParcelasValores((prev) => prev.map((v, i) => (i === index ? digits : v)))
    }

    const upsertCategoriaOption = (cat: CategoriaLookup) => {
        if (!cat.id) return
        setCategoriasLookup((prev) => {
            if (prev.some((c) => Number(c.id) === Number(cat.id))) {
                return prev.map((c) => (Number(c.id) === Number(cat.id) ? { ...c, ...cat } : c))
            }
            return [...prev, cat]
        })
        setCategoriasOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(cat.id))) {
                return prev.map((o) =>
                    Number(o.value) === Number(cat.id)
                        ? { ...o, label: cat.nome ?? o.label }
                        : o
                )
            }
            return [...prev, { value: cat.id!, label: cat.nome ?? `#${cat.id}` }]
        })
    }

    const upsertSubcategoriaOption = (id: number, nome: string) => {
        setSubcategoriasOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(id))) {
                return prev.map((o) => (Number(o.value) === Number(id) ? { ...o, label: nome } : o))
            }
            return [...prev, { value: id, label: nome }]
        })
    }

    const handleConfirmCategoriaRapido = async (result: CategoriaRapidoConfirm) => {
        const cat = result.data
        upsertCategoriaOption({ id: cat.id, nome: cat.nome, cor: cat.cor ?? undefined })
        const categoriaMudou = Number(categoriaId) !== Number(cat.id)
        setValue('categoria_id', cat.id)
        if (categoriaMudou) {
            setValue('subcategoria_id', null)
            await loadSubcategorias(cat.id)
        }

        if (isEdit) {
            const txId = record.id ?? record.transacao_id
            if (!txId) return
            try {
                await transacoesService.editTransacoes({
                    id: txId,
                    transacao_id: txId,
                    categoria_id: cat.id,
                    subcategoria_id: null,
                    propagar_grupo: result.propagar_grupo || undefined,
                } as TransacoesModel)
            } catch (error) {
                console.error('Erro ao vincular categoria na transação:', error)
                toast.error('Categoria cadastrada, mas falhou ao salvar na compra')
            }
        }
    }

    const handleConfirmSubcategoriaRapido = async (result: SubcategoriaRapidoConfirm) => {
        const sub = result.data
        if (!categoriaId) return
        upsertSubcategoriaOption(sub.id, sub.nome)
        setValue('subcategoria_id', sub.id)

        if (isEdit) {
            const txId = record.id ?? record.transacao_id
            if (!txId) return
            try {
                await transacoesService.editTransacoes({
                    id: txId,
                    transacao_id: txId,
                    categoria_id: categoriaId,
                    subcategoria_id: sub.id,
                    propagar_grupo: result.propagar_grupo || undefined,
                } as TransacoesModel)
            } catch (error) {
                console.error('Erro ao vincular subcategoria na transação:', error)
                toast.error('Subcategoria cadastrada, mas falhou ao salvar na compra')
            }
        }
    }

    const categoriaAtual = categoriasLookup.find((c) => Number(c.id) === Number(categoriaId))

    const onSubmit: SubmitHandler<TransacoesModel> = async (data) => {
        try {
            if (semNumeros) {
                toast.warning('Cadastre um final neste cartão antes de registrar a compra')
                return
            }
            if ((showNumeroSelect || (isEdit && numerosOptions.length > 1)) && !data.cartao_numero_id) {
                toast.warning('Selecione o final do cartão da compra')
                return
            }

            if (isEdit) {
                const payload: TransacoesModel = {
                    id: record.id ?? record.transacao_id,
                    transacao_id: record.transacao_id ?? record.id,
                    cartao_id: data.cartao_id,
                    cartao_numero_id: data.cartao_numero_id || null,
                    fatura_id: data.fatura_id,
                    data: data.data,
                    estabelecimento_id: data.estabelecimento_id,
                    valor: toCentavos(data.valor ?? data.valor_compra) / 100,
                    tipo: data.tipo,
                    origem_compra: data.origem_compra,
                    categoria_id: data.categoria_id,
                    subcategoria_id: data.categoria_id ? data.subcategoria_id : null,
                    responsavel_id: data.responsavel_id,
                    observacoes: data.observacoes,
                    propagar_grupo: Boolean(data.propagar_grupo && record.compra_grupo_id),
                }
                if (payload.estabelecimento_id) {
                    delete (payload as any).estabelecimento
                }
                await transacoesService.editTransacoes(payload)
                toast.success('Transação atualizada com sucesso')
            } else {
                if (nParcelas > 1 && !totaisBatem) {
                    toast.error('O total das parcelas deve ser igual ao valor da compra.')
                    return
                }

                const payload: TransacoesModel = {
                    cartao_id: data.cartao_id,
                    cartao_numero_id: data.cartao_numero_id || undefined,
                    data: data.data,
                    estabelecimento_id: data.estabelecimento_id,
                    valor_compra: toBrPayload(data.valor_compra),
                    tipo: data.tipo || 'purchase',
                    origem_compra: data.origem_compra,
                    parcelas_total: nParcelas,
                    categoria_id: data.categoria_id || undefined,
                    subcategoria_id: data.categoria_id ? (data.subcategoria_id || undefined) : undefined,
                    responsavel_id: data.responsavel_id || undefined,
                    observacoes: data.observacoes || undefined,
                }

                if (fromFatura && data.fatura_id) {
                    payload.fatura_id = data.fatura_id
                }

                if (nParcelas > 1) {
                    payload.parcelas = parcelasValores.map((valor, idx) => ({
                        parcela: idx + 1,
                        valor: toBrPayload(valor),
                    }))
                }

                if (payload.estabelecimento_id) {
                    delete (payload as any).estabelecimento
                }

                // Não enviar parcela_atual no create
                delete (payload as any).parcela_atual
                delete (payload as any).valor

                await transacoesService.createTransacoes(payload)
                toast.success(
                    nParcelas > 1
                        ? `Compra parcelada cadastrada (${nParcelas} parcelas)`
                        : 'Transação cadastrada com sucesso'
                )
            }

            navigate(returnTo || '/transacoes')
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

    // Carrega finais do cartão (grupo) ou da bandeira da fatura
    useEffect(() => {
        const isFirst = skipCartaoNumeroEffect.current
        if (isFirst) skipCartaoNumeroEffect.current = false

        // Edit com fatura: só finais da bandeira da fatura (corrigir/atribuir final)
        if (isEdit && record.fatura_id) {
            loadNumeros({
                fatura_id: record.fatura_id,
                preserveSelection: true,
                forceShowSelect: true,
            })
            return
        }

        // Create a partir da fatura
        if (!isEdit && fromFatura && record.fatura_id) {
            loadNumeros({ fatura_id: record.fatura_id, preserveSelection: isFirst })
            return
        }

        loadNumeros({
            cartao_id: cartaoId,
            preserveSelection: isEdit || (isFirst && Boolean(record.cartao_numero_id)),
            forceShowSelect: isEdit,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartaoId, fromFatura, isEdit, record.fatura_id])

    // Redistribui parcelas ao mudar valor_compra ou N (create)
    useEffect(() => {
        if (isEdit) return
        if (skipRedistributeParcelas.current) {
            skipRedistributeParcelas.current = false
            const fromSource = Array.isArray(state?.source?.parcelas) ? state.source.parcelas : []
            if (fromSource.length > 1) {
                setParcelasValores(fromSource.map((p: { valor?: string | number }) => String(toCentavos(p.valor))))
                return
            }
        }
        redistributeParcelas(valorCompraWatch, nParcelas)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valorCompraWatch, nParcelas, isEdit])

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
                                    <Link to={returnTo || '/transacoes'}><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {isEdit ? 'Editar' : 'Adicionar'} {fromFatura && !isEdit ? 'Compra' : 'Transação'}
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
                                            <Col md={showFinalField ? 4 : 6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="cartao_id" className="form-label">Cartão</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={cartoesOptions}
                                                        field="cartao_id"
                                                        control={control}
                                                        required={required}
                                                        disabled={fromFatura && !isEdit}
                                                    />
                                                    {fromFatura && !isEdit && (
                                                        <small className="text-muted">Vinculado à fatura selecionada</small>
                                                    )}
                                                </div>
                                            </Col>
                                            {showFinalField && (
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="cartao_numero_id" className="form-label">
                                                            Final do cartão
                                                        </Label>
                                                        {numerosLoading ? (
                                                            <div className="form-control-plaintext text-muted">Carregando...</div>
                                                        ) : semNumeros ? (
                                                            <div className="alert alert-warning mb-0 py-2">
                                                                Cadastre um final neste cartão antes de registrar a compra.{' '}
                                                                {cartaoId && (
                                                                    <Link to={`/cartoes/edit/${cartaoId}`}>
                                                                        Abrir cartão
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <SelectListControlled<TransacoesModel>
                                                                options={numerosOptions}
                                                                field="cartao_numero_id"
                                                                control={control}
                                                                required={required}
                                                            />
                                                        )}
                                                        {!semNumeros && !numerosLoading && (
                                                            <small className="text-muted">
                                                                {isEdit
                                                                    ? 'Atribua ou corrija o final quando a compra veio sem cartão identificado'
                                                                    : 'Qual plástico/virtual fez a compra'}
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>
                                            )}
                                            <Col md={showFinalField ? 2 : 3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="data" className="form-label">Data da compra</Label>
                                                    <InputDate<TransacoesModel>
                                                        field="data"
                                                        register={register}
                                                    />
                                                    {fromFatura && !isEdit && (
                                                        <small className="text-muted">
                                                            A 1ª parcela entra na fatura do ciclo desta data (não necessariamente a fatura de origem se a data for alterada).
                                                        </small>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={showFinalField ? 2 : 3}>
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
                                            <Col md={5}>
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
                                                    <Label htmlFor="origem_compra" className="form-label">Origem da compra</Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={origensCompraOptions}
                                                        field="origem_compra"
                                                        control={control}
                                                        required={required}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="valor_compra" className="form-label">
                                                        {isEdit ? 'Valor' : 'Valor da compra'}
                                                    </Label>
                                                    {isEdit ? (
                                                        <InputTextControlled<TransacoesModel>
                                                            field="valor"
                                                            control={control}
                                                            required={required}
                                                            textValor
                                                            mask="preco"
                                                        />
                                                    ) : (
                                                        <InputTextControlled<TransacoesModel>
                                                            field="valor_compra"
                                                            control={control}
                                                            required={required}
                                                            textValor
                                                            mask="preco"
                                                        />
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={2}>
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
                                                    <div className="d-flex gap-2 align-items-start">
                                                        <div className="flex-grow-1">
                                                            <SelectListControlled<TransacoesModel>
                                                                options={categoriasOptions}
                                                                field="categoria_id"
                                                                control={control}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            color="light"
                                                            className="border flex-shrink-0"
                                                            title="Nova categoria"
                                                            onClick={() => setCategoriaRapidoOpen(true)}
                                                        >
                                                            <i className="ri-add-line me-1"></i>
                                                            Nova
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="subcategoria_id" className="form-label">Subcategoria</Label>
                                                    <div className="d-flex gap-2 align-items-start">
                                                        <div className="flex-grow-1">
                                                            <SelectListControlled<TransacoesModel>
                                                                options={subcategoriasOptions}
                                                                field="subcategoria_id"
                                                                control={control}
                                                                disabled={!categoriaId}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            color="light"
                                                            className="border flex-shrink-0"
                                                            title={!categoriaId ? 'Selecione uma categoria antes' : 'Nova subcategoria'}
                                                            disabled={!categoriaId}
                                                            onClick={() => setSubcategoriaRapidoOpen(true)}
                                                        >
                                                            <i className="ri-add-line me-1"></i>
                                                            Nova
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="parcelas_total" className="form-label">Parcelas</Label>
                                                    {isEdit ? (
                                                        <div className="form-control-plaintext">
                                                            {record.parcelas_total && Number(record.parcelas_total) > 1
                                                                ? `${record.parcela_atual ?? 1}/${record.parcelas_total}`
                                                                : 'À vista'}
                                                        </div>
                                                    ) : (
                                                        <SelectListControlled<TransacoesModel>
                                                            options={optParcelas}
                                                            field="parcelas_total"
                                                            control={control}
                                                            required={required}
                                                        />
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        {!isEdit && nParcelas > 1 && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3 border rounded p-3 bg-light">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <Label className="form-label mb-0">Valores das parcelas</Label>
                                                            <span className={`small ${totaisBatem ? 'text-success' : 'text-danger'}`}>
                                                                Total das parcelas: {centavosToBr(totalParcelasCentavos)}
                                                                {!totaisBatem && (
                                                                    <> · esperado {centavosToBr(valorCompraCentavos)}</>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Row>
                                                            {parcelasValores.map((valor, idx) => (
                                                                <Col md={3} sm={6} key={`parcela-${idx}`}>
                                                                    <div className="mb-2">
                                                                        <Label className="form-label small">
                                                                            Parcela {idx + 1}/{nParcelas}
                                                                        </Label>
                                                                        <input
                                                                            type="text"
                                                                            className={`form-control ${VALOR_TEXT_CLASS}`}
                                                                            value={mask('preco', valor) ?? ''}
                                                                            onChange={(e) => handleParcelaChange(idx, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                        {!totaisBatem && (
                                                            <div className="alert alert-warning mb-0 mt-2 py-2">
                                                                Ajuste as parcelas até o total coincidir com o valor da compra.
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

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

                                        {isEdit && record.compra_grupo_id && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="form-check mb-3">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id="propagar_grupo"
                                                            checked={Boolean(propagarGrupo)}
                                                            onChange={(e) => setValue('propagar_grupo', e.target.checked)}
                                                        />
                                                        <Label className="form-check-label" htmlFor="propagar_grupo">
                                                            Aplicar estabelecimento, origem, final do cartão, categoria, responsável e observação a todas as parcelas da compra
                                                        </Label>
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
                                                        disabled={
                                                            semNumeros
                                                            || numerosLoading
                                                            || (!isEdit && nParcelas > 1 && !totaisBatem)
                                                        }
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-soft-success"
                                                        onClick={returnTo ? () => navigate(returnTo) : voltarParaRotaAnterior}
                                                    >
                                                        Voltar
                                                    </button>
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

            <CategoriaRapidoModal
                isOpen={categoriaRapidoOpen}
                toggle={() => setCategoriaRapidoOpen(false)}
                showPropagarGrupo={isEdit && Boolean(record.compra_grupo_id)}
                onConfirm={handleConfirmCategoriaRapido}
            />

            <SubcategoriaRapidoModal
                isOpen={subcategoriaRapidoOpen}
                toggle={() => setSubcategoriaRapidoOpen(false)}
                categoriaId={categoriaId ? Number(categoriaId) : null}
                categoriaNome={categoriaAtual?.nome}
                categoriaCor={categoriaAtual?.cor}
                showPropagarGrupo={isEdit && Boolean(record.compra_grupo_id)}
                onConfirm={handleConfirmSubcategoriaRapido}
            />
        </React.Fragment>
    )
}

export default TransacoesForm
