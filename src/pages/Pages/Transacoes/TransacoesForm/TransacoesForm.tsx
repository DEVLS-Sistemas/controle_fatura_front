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
import { isEhAssinatura } from 'helpers/assinaturas_helpers'
import {
    adicionarMesesCompetencia,
    competenciaPrimeiraParcela,
    labelCompetenciaCompleta,
    todayISO,
} from 'helpers/simulador_compra_helpers'
import {
    aplicarErrosMensagemApiCompra,
    dataCaiForaDaFaturaAberta,
    ErrosFormularioCompra,
    faturaAbertaDoSource,
    identificadorAposCadastro,
    MENSAGEM_CAMPO_COMPRA,
    mensagemAposCadastro,
    pathVisualizacaoCompra,
    primeiroCampoInvalido,
    validarFormularioCompra,
    ValidarFormularioCompraInput,
} from 'helpers/cadastro_manual_compra_helpers'
import { Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate'
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { AsyncSelectListControlled } from 'Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    CartaoLookup,
    CategoriaLookup,
    EstabelecimentoLookup,
    FaturaLookup,
    ResponsavelLookup,
    TransacoesDefaultValues,
    TransacoesModel,
} from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { NumeroListItem } from 'interfaces/Cartoes/CartoesInterface'
import { toCartaoSelectOption } from 'helpers/cartao_helpers'
import ResponsavelModal from '../ResponsavelModal/ResponsavelModal'
import CategoriaRapidoModal, { CategoriaRapidoConfirm } from '../CategoriaRapidoModal/CategoriaRapidoModal'
import SubcategoriaRapidoModal, { SubcategoriaRapidoConfirm } from '../SubcategoriaRapidoModal/SubcategoriaRapidoModal'
import CartaoRapidoModal, { CartaoRapidoConfirm, CartaoRapidoModo } from '../CartaoRapidoModal/CartaoRapidoModal'

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

    const [record] = useState<TransacoesModel>(() => {
        const source = state?.source
        const isEditInit = Boolean(source?.transacao_id ?? source?.id)
        if (!source) {
            return { ...TransacoesDefaultValues, data: todayISO(), tipo: 'purchase' }
        }
        return {
            ...TransacoesDefaultValues,
            ...source,
            transacao_id: source.transacao_id ?? source.id,
            cartao_id: source.cartao_id ?? null,
            cartao_numero_id: source.cartao_numero_id ?? source.cartao_numero?.id ?? null,
            fatura_id: source.fatura_id ?? null,
            estabelecimento_id: source.estabelecimento_id ?? null,
            estabelecimento: source.estabelecimento_id ? null : (source.estabelecimento ?? null),
            subcategoria_id: source.subcategoria_id ?? null,
            origem_compra: source.origem_compra ?? null,
            eh_assinatura: source.eh_assinatura != null
                ? isEhAssinatura(source.eh_assinatura)
                : source.origem_compra === 'PAGAMENTO_SERVICOS',
            observacoes: source.observacoes
                ?? source.texto_compra
                ?? source.descricao
                ?? null,
            valor: toPrecoDigits(source.valor ?? source.valor_compra),
            valor_compra: toPrecoDigits(source.valor_compra ?? source.valor),
            parcelas_total: source.parcelas_total ?? 1,
            compra_grupo_id: source.compra_grupo_id ?? null,
            tipo: source.tipo ?? 'purchase',
            data: source.data ?? (isEditInit ? null : todayISO()),
        }
    })

    const { register, handleSubmit, control, setValue, watch, getValues } = useForm<TransacoesModel>({
        defaultValues: record,
    })

    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([])
    const [cartoesLookup, setCartoesLookup] = useState<CartaoLookup[]>([])
    const [faturasLookup, setFaturasLookup] = useState<FaturaLookup[]>([])
    const [lookupsReady, setLookupsReady] = useState(false)
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
    const [cartaoRapidoOpen, setCartaoRapidoOpen] = useState(false)
    const [cartaoRapidoModo, setCartaoRapidoModo] = useState<CartaoRapidoModo>('cartao')
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [parcelasValores, setParcelasValores] = useState<string[]>([])
    const [fieldErrors, setFieldErrors] = useState<ErrosFormularioCompra>({})
    const [saving, setSaving] = useState(false)

    const skipEstabelecimentoEffect = useRef(true)
    const skipCategoriaEffect = useRef(true)
    const skipCartaoNumeroEffect = useRef(true)
    const preserveNumeroFromRapido = useRef(false)
    const skipRedistributeParcelas = useRef(
        Array.isArray(state?.source?.parcelas) && state.source.parcelas.length > 0
    )
    const applyingEstabelecimentoDefaults = useRef(false)
    const estabelecimentosCache = useRef<Map<number, EstabelecimentoLookup>>(new Map())
    const origemAnteriorRef = useRef(record.origem_compra)

    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const transacoesService = new TransacoesService()
    const estabelecimentosService = new EstabelecimentosService()
    const subcategoriasService = new SubcategoriasService()
    const cartoesService = useRef(new CartoesService()).current
    const isEdit = Boolean(record.transacao_id ?? record.id)
    const fromFatura = Boolean(record.fatura_id)

    const cartaoId = watch('cartao_id')
    const cartaoNumeroId = watch('cartao_numero_id')
    const estabelecimentoId = watch('estabelecimento_id')
    const estabelecimentoTexto = watch('estabelecimento')
    const dataWatch = watch('data')
    const categoriaId = watch('categoria_id')
    const responsavelId = watch('responsavel_id')
    const valorCompraWatch = watch('valor_compra')
    const valorWatch = watch('valor')
    const parcelasTotalWatch = watch('parcelas_total')
    const origemCompraWatch = watch('origem_compra')
    const faturaIdWatch = watch('fatura_id')
    const observacoesWatch = watch('observacoes')
    const propagarGrupo = watch('propagar_grupo')

    const nParcelas = Math.max(1, Math.min(36, Number(parcelasTotalWatch) || 1))
    const totalParcelasCentavos = parcelasValores.reduce((acc, v) => acc + toCentavos(v), 0)
    const valorCompraCentavos = toCentavos(valorCompraWatch)
    const totaisBatem = nParcelas <= 1 || totalParcelasCentavos === valorCompraCentavos
    const showFinalField = showNumeroSelect || semNumeros || numerosLoading
        || (isEdit && (numerosOptions.length > 0 || semNumeros || numerosLoading))
    const isCompraFlow = !isEdit || (record.tipo ?? 'purchase') === 'purchase'
    const pageTitle = isEdit
        ? (isCompraFlow ? 'Editar compra' : 'Editar transação')
        : 'Nova compra'
    const exigeFinalCartao = !semNumeros && !numerosLoading && numerosOptions.length > 1
    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    const erroCampo = (campo: string) => (
        fieldErrors[campo] ? { message: fieldErrors[campo] } : undefined
    )

    const montarInputValidacao = (data?: Partial<TransacoesModel>): ValidarFormularioCompraInput => ({
        isEdit,
        validarDescricao: isCompraFlow,
        observacoes: data?.observacoes ?? observacoesWatch,
        valor_compra: isEdit ? (data?.valor ?? valorWatch) : (data?.valor_compra ?? valorCompraWatch),
        data: data?.data ?? dataWatch,
        cartao_id: data?.cartao_id ?? cartaoId,
        fatura_id: data?.fatura_id ?? faturaIdWatch ?? record.fatura_id,
        cartao_numero_id: data?.cartao_numero_id ?? cartaoNumeroId,
        origem_compra: data?.origem_compra ?? origemCompraWatch,
        exigeFinalCartao,
        parcelas: !isEdit && nParcelas > 1 ? parcelasValores : undefined,
    })

    const focarCampoInvalido = (campo: string) => {
        requestAnimationFrame(() => {
            const root = document.querySelector(`[data-compra-field="${campo}"]`) as HTMLElement | null
            if (!root) return
            root.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const focusable = root.querySelector<HTMLElement>(
                'textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), input[type="text"]'
            )
            focusable?.focus({ preventScroll: true })
        })
    }

    const aplicarErrosCampos = (erros: ErrosFormularioCompra) => {
        setFieldErrors(erros)
        const primeiro = primeiroCampoInvalido(erros)
        if (primeiro) focarCampoInvalido(primeiro)
    }

    const cartaoAtual = cartoesLookup.find((c) => Number(c.id) === Number(cartaoId))
    const numeroAtual = numerosOptions.find((n) => Number(n.value) === Number(cartaoNumeroId))
    const primeiraCompetenciaCiclo = competenciaPrimeiraParcela(dataWatch, cartaoAtual?.dia_limite_fatura ?? null)
    const faturaOverride = faturasLookup.find((f) => Number(f.id) === Number(faturaIdWatch))
    const primeiraCompetencia = faturaOverride?.mes && faturaOverride?.ano
        ? { mes: faturaOverride.mes, ano: faturaOverride.ano }
        : primeiraCompetenciaCiclo
    const ultimaCompetencia = primeiraCompetencia && nParcelas > 1
        ? adicionarMesesCompetencia(primeiraCompetencia.mes, primeiraCompetencia.ano, nParcelas - 1)
        : null
    const faturaAberta = faturaAbertaDoSource(state?.source)
        ?? (record.fatura_id
            ? (() => {
                const fat = faturasLookup.find((f) => Number(f.id) === Number(record.fatura_id))
                return fat?.mes && fat?.ano ? { mes: fat.mes, ano: fat.ano } : null
            })()
            : null)
    const caiForaDaFaturaAberta = Boolean(
        fromFatura && !isEdit && dataCaiForaDaFaturaAberta(primeiraCompetencia, faturaAberta)
    )
    const faturasOptions = [
        { value: '', label: 'Automática (pelo ciclo)' },
        ...faturasLookup
            .filter((f) => {
                if (f.id == null) return false
                if (!cartaoId) return true
                if (f.cartao_id != null) return Number(f.cartao_id) === Number(cartaoId)
                if (f.cartao_nome && cartaoAtual?.nome) return f.cartao_nome === cartaoAtual.nome
                return true
            })
            .map((f) => ({
                value: f.id!,
                label: [
                    f.mes && f.ano ? labelCompetenciaCompleta(f.mes, f.ano) : `Fatura ${f.id}`,
                    f.cartao_nome && f.cartao_nome !== cartaoAtual?.nome ? f.cartao_nome : null,
                ].filter(Boolean).join(' · '),
            })),
    ]

    const responsavelAtual = responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))
    const responsavelIdNum = responsavelId == null || responsavelId === ''
        ? null
        : Number(responsavelId)
    const isMeuResponsavel = isMeuResponsavelDisplay({
        responsavelId: Number.isFinite(responsavelIdNum) ? responsavelIdNum : null,
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
                setCartoesLookup(lookups.cartoes)
                setCartoesOptions(lookups.cartoes.map((c) => toCartaoSelectOption(c)))
            }
            if (lookups?.faturas) {
                setFaturasLookup(lookups.faturas)
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
        } finally {
            setLookupsReady(true)
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

    const applyNumerosFromRapido = (result: CartaoRapidoConfirm) => {
        const data = result.data
        const list: NumeroListItem[] = []
        ;(data.bandeiras ?? []).forEach((bandeiraItem) => {
            ;(bandeiraItem.numeros ?? []).forEach((numero) => {
                if (numero.id == null) return
                list.push({
                    value: numero.id,
                    ultimos_digitos: numero.ultimos_digitos ?? null,
                    tipo: numero.tipo ?? null,
                    bandeira: bandeiraItem.bandeira ?? null,
                    label: '',
                })
            })
        })
        if (
            data.cartao_numero_id
            && !list.some((n) => Number(n.value) === Number(data.cartao_numero_id))
        ) {
            list.push({
                value: data.cartao_numero_id,
                ultimos_digitos: null,
                label: `•••• ${data.cartao_numero_id}`,
            })
        }
        setNumerosOptions(
            list.map((n) => ({
                value: n.value,
                label: formatNumeroOptionLabel(n),
            }))
        )
        setSemNumeros(list.length === 0)
        setShowNumeroSelect(isEdit || list.length > 1)
        setNumerosLoading(false)
        setValue('cartao_numero_id', data.cartao_numero_id ?? list[0]?.value ?? null)
    }

    const handleConfirmCartaoRapido = async (result: CartaoRapidoConfirm) => {
        const data = result.data
        const cartaoIdNovo = data.id
        setCartoesLookup((prev) => {
            const next: CartaoLookup = {
                id: cartaoIdNovo,
                nome: data.nome,
                cor_fundo: data.cor_fundo ?? null,
                cor_texto: data.cor_texto ?? null,
                dia_limite_fatura: data.dia_limite_fatura ?? null,
                dia_vencimento_fatura: data.dia_vencimento_fatura ?? null,
                pessoa_id: (data as CartaoLookup).pessoa_id ?? null,
                pessoa_nome: (data as CartaoLookup).pessoa_nome ?? null,
            }
            if (prev.some((c) => Number(c.id) === Number(cartaoIdNovo))) {
                return prev.map((c) => (Number(c.id) === Number(cartaoIdNovo) ? { ...c, ...next } : c))
            }
            return [...prev, next]
        })
        setCartoesOptions((prev) => {
            const option = toCartaoSelectOption(data)
            if (prev.some((o) => Number(o.value) === Number(cartaoIdNovo))) {
                return prev.map((o) => (Number(o.value) === Number(cartaoIdNovo) ? { ...o, ...option } : o))
            }
            return [...prev, option]
        })

        if (Number(cartaoId) !== Number(cartaoIdNovo)) {
            preserveNumeroFromRapido.current = true
        }
        applyNumerosFromRapido(result)
        setValue('cartao_id', cartaoIdNovo)

        if (isEdit) {
            const txId = record.id ?? record.transacao_id
            if (!txId) return
            try {
                await transacoesService.editTransacoes({
                    id: txId,
                    transacao_id: txId,
                    cartao_id: cartaoIdNovo,
                    cartao_numero_id: data.cartao_numero_id ?? undefined,
                    propagar_grupo: result.propagar_grupo || undefined,
                } as TransacoesModel)
            } catch (error) {
                console.error('Erro ao vincular cartão na transação:', error)
                toast.error('Cartão cadastrado, mas falhou ao salvar na compra')
            }
        }
    }

    const categoriaAtual = categoriasLookup.find((c) => Number(c.id) === Number(categoriaId))

    const onSubmit: SubmitHandler<TransacoesModel> = async (data) => {
        const erros = validarFormularioCompra(montarInputValidacao(data))
        if (semNumeros) {
            erros.cartao_numero_id = MENSAGEM_CAMPO_COMPRA.sem_finais
        }
        if (Object.keys(erros).length > 0) {
            aplicarErrosCampos(erros)
            return
        }
        setFieldErrors({})

        try {
            setSaving(true)
            const textoCompra = String(data.observacoes ?? observacoesWatch ?? '').trim()
            const estabelecimentoNome = String(data.estabelecimento ?? '').trim()

            if (isEdit) {
                const payload: TransacoesModel = {
                    id: record.id ?? record.transacao_id,
                    transacao_id: record.transacao_id ?? record.id,
                    cartao_id: data.cartao_id,
                    cartao_numero_id: data.cartao_numero_id || null,
                    fatura_id: data.fatura_id,
                    data: data.data,
                    valor: toCentavos(data.valor ?? data.valor_compra) / 100,
                    tipo: isCompraFlow ? 'purchase' : data.tipo,
                    origem_compra: data.origem_compra,
                    eh_assinatura: nParcelas <= 1 ? Boolean(data.eh_assinatura) : false,
                    categoria_id: data.categoria_id,
                    subcategoria_id: data.categoria_id ? data.subcategoria_id : null,
                    responsavel_id: data.responsavel_id,
                    observacoes: textoCompra || undefined,
                    descricao: isCompraFlow ? (textoCompra || undefined) : undefined,
                    propagar_grupo: Boolean(data.propagar_grupo && record.compra_grupo_id),
                }
                if (isCompraFlow) {
                    if (record.estabelecimento_id) {
                        payload.estabelecimento_id = record.estabelecimento_id
                    }
                } else {
                    payload.estabelecimento_id = data.estabelecimento_id
                    payload.estabelecimento = data.estabelecimento_id ? undefined : (estabelecimentoNome || undefined)
                    if (payload.estabelecimento_id) {
                        delete (payload as any).estabelecimento
                    }
                }
                const result = await transacoesService.editTransacoes(payload)
                toast.success(mensagemAposCadastro(result, 'Compra atualizada com sucesso'))
                const identificador = record.compra_grupo_id
                    || record.transacao_id
                    || record.id
                if (identificador && isCompraFlow) {
                    navigate(pathVisualizacaoCompra(String(identificador)), {
                        state: { from: returnTo || '/transacoes' },
                    })
                    return
                }
                navigate(returnTo || '/transacoes')
                return
            }

            const payload: TransacoesModel = {
                cartao_id: data.cartao_id,
                cartao_numero_id: data.cartao_numero_id || undefined,
                data: data.data,
                valor_compra: toBrPayload(data.valor_compra),
                tipo: 'purchase',
                origem_compra: data.origem_compra,
                eh_assinatura: nParcelas <= 1 ? Boolean(data.eh_assinatura) : false,
                parcelas_total: nParcelas,
                categoria_id: data.categoria_id || undefined,
                subcategoria_id: data.categoria_id ? (data.subcategoria_id || undefined) : undefined,
                responsavel_id: data.responsavel_id || undefined,
                observacoes: textoCompra || undefined,
                descricao: textoCompra || undefined,
                compra_manual: true,
            }

            if (!isCompraFlow) {
                if (data.estabelecimento_id) {
                    payload.estabelecimento_id = data.estabelecimento_id
                } else if (estabelecimentoNome) {
                    payload.estabelecimento = estabelecimentoNome
                }
            }

            if (data.fatura_id) {
                payload.fatura_id = data.fatura_id
            }

            if (nParcelas > 1) {
                payload.parcelas = parcelasValores.map((valor, idx) => ({
                    parcela: idx + 1,
                    valor: toBrPayload(valor),
                }))
            }

            delete (payload as any).parcela_atual
            delete (payload as any).valor

            const result = await transacoesService.createTransacoes(payload)
            const fallbackMsg = nParcelas > 1
                ? `Compra parcelada cadastrada (${nParcelas} parcelas)`
                : 'Transação cadastrada com sucesso!'
            toast.success(mensagemAposCadastro(result, fallbackMsg))

            const identificador = identificadorAposCadastro(result)
            if (identificador) {
                navigate(pathVisualizacaoCompra(identificador), {
                    state: { from: returnTo || '/transacoes' },
                })
                return
            }
            navigate(returnTo || '/transacoes')
        } catch (error: any) {
            const message = error?.message || 'Erro ao salvar compra'
            toast.error(message)
            const extras = aplicarErrosMensagemApiCompra(message)
            if (Object.keys(extras).length > 0) {
                aplicarErrosCampos(extras)
            }
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        getLookups()
    }, [])

    useEffect(() => {
        if (nParcelas > 1) {
            setValue('eh_assinatura', false)
            origemAnteriorRef.current = origemCompraWatch
            return
        }
        if (
            origemCompraWatch === 'PAGAMENTO_SERVICOS'
            && origemAnteriorRef.current !== 'PAGAMENTO_SERVICOS'
        ) {
            setValue('eh_assinatura', true)
        }
        origemAnteriorRef.current = origemCompraWatch
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origemCompraWatch, nParcelas])

    useEffect(() => {
        setActiveMenu('/transacoes')
    }, [])

    // Carrega finais do cartão (grupo) ou da bandeira da fatura
    useEffect(() => {
        const isFirst = skipCartaoNumeroEffect.current
        if (isFirst) skipCartaoNumeroEffect.current = false

        if (preserveNumeroFromRapido.current) {
            preserveNumeroFromRapido.current = false
            return
        }

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
            setValue('estabelecimento', null)
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

    useEffect(() => {
        setFieldErrors((prev) => {
            if (Object.keys(prev).length === 0) return prev
            const atuais = validarFormularioCompra(montarInputValidacao(getValues()))
            if (semNumeros) {
                atuais.cartao_numero_id = MENSAGEM_CAMPO_COMPRA.sem_finais
            }
            let changed = false
            const next = { ...prev }
            for (const key of Object.keys(prev)) {
                if (!atuais[key]) {
                    delete next[key]
                    changed = true
                }
            }
            return changed ? next : prev
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        observacoesWatch,
        cartaoId,
        cartaoNumeroId,
        dataWatch,
        origemCompraWatch,
        valorCompraWatch,
        valorWatch,
        faturaIdWatch,
        parcelasValores,
        nParcelas,
        exigeFinalCartao,
        semNumeros,
    ])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to={returnTo || '/transacoes'}><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">{pageTitle}</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/transacoes">Transações</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>{pageTitle}</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <form
                                        className={`needs-validation${hasFieldErrors ? ' was-validated' : ''}`}
                                        noValidate
                                        onSubmit={handleSubmit(onSubmit)}
                                    >
                                        {lookupsReady && cartoesOptions.length === 0 ? (
                                            <div className="alert alert-warning">
                                                Cadastre um cartão com o botão <strong>Nova</strong> ao lado do campo Cartão.
                                            </div>
                                        ) : null}

                                        {isCompraFlow ? (
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3" data-compra-field="observacoes">
                                                        <Label htmlFor="observacoes" className="form-label">
                                                            Descrição da compra <span className="text-danger">*</span>
                                                        </Label>
                                                        <textarea
                                                            {...register('observacoes')}
                                                            id="observacoes"
                                                            className={`form-control${fieldErrors.observacoes ? ' is-invalid' : ''}`}
                                                            rows={2}
                                                            placeholder="Ex.: Mouse Logitech"
                                                        />
                                                        {fieldErrors.observacoes ? (
                                                            <div className="d-block invalid-feedback">{fieldErrors.observacoes}</div>
                                                        ) : null}
                                                        <small className="text-muted">
                                                            O que foi comprado. Não é o nome do estabelecimento da fatura — isso entra na conciliação.
                                                        </small>
                                                    </div>
                                                </Col>
                                            </Row>
                                        ) : null}

                                        <Row>
                                            <Col md={showFinalField ? (isCompraFlow ? 5 : 4) : (isCompraFlow ? 6 : 6)}>
                                                <div className="mb-3" data-compra-field="cartao_id">
                                                    <Label htmlFor="cartao_id" className="form-label">
                                                        Cartão <span className="text-danger">*</span>
                                                    </Label>
                                                    <div className="d-flex gap-2 align-items-start">
                                                        <div className="flex-grow-1">
                                                            <SelectListControlled<TransacoesModel>
                                                                options={cartoesOptions}
                                                                field="cartao_id"
                                                                control={control}
                                                                disabled={fromFatura && !isEdit}
                                                                errors={erroCampo('cartao_id')}
                                                            />
                                                        </div>
                                                        {!(fromFatura && !isEdit) ? (
                                                            <Button
                                                                type="button"
                                                                color="light"
                                                                className="border flex-shrink-0"
                                                                title="Novo cartão"
                                                                onClick={() => {
                                                                    setCartaoRapidoModo('cartao')
                                                                    setCartaoRapidoOpen(true)
                                                                }}
                                                            >
                                                                <i className="ri-add-line me-1"></i>
                                                                Nova
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                    {fromFatura && !isEdit && (
                                                        <small className="text-muted">Vinculado à fatura selecionada</small>
                                                    )}
                                                </div>
                                            </Col>
                                            {showFinalField && (
                                                <Col md={isCompraFlow ? 4 : 4}>
                                                    <div className="mb-3" data-compra-field="cartao_numero_id">
                                                        <Label htmlFor="cartao_numero_id" className="form-label">
                                                            Final do cartão
                                                            {exigeFinalCartao ? <span className="text-danger"> *</span> : null}
                                                        </Label>
                                                        {numerosLoading ? (
                                                            <div className="form-control-plaintext text-muted">Carregando...</div>
                                                        ) : semNumeros ? (
                                                            <div className={`alert alert-warning mb-0 py-2${fieldErrors.cartao_numero_id ? ' border-danger' : ''}`}>
                                                                Cadastre um final neste cartão antes de registrar a compra.{' '}
                                                                {cartaoId ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link btn-sm p-0 align-baseline"
                                                                        onClick={() => {
                                                                            setCartaoRapidoModo('final')
                                                                            setCartaoRapidoOpen(true)
                                                                        }}
                                                                    >
                                                                        Cadastrar final
                                                                    </button>
                                                                ) : null}
                                                                {fieldErrors.cartao_numero_id ? (
                                                                    <div className="d-block invalid-feedback mt-1">{fieldErrors.cartao_numero_id}</div>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <SelectListControlled<TransacoesModel>
                                                                options={numerosOptions}
                                                                field="cartao_numero_id"
                                                                control={control}
                                                                errors={erroCampo('cartao_numero_id')}
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
                                            <Col md={showFinalField ? 3 : 3}>
                                                <div className="mb-3" data-compra-field="data">
                                                    <Label htmlFor="data" className="form-label">
                                                        Data da compra <span className="text-danger">*</span>
                                                    </Label>
                                                    <InputDate<TransacoesModel>
                                                        field="data"
                                                        register={register}
                                                        errors={erroCampo('data')}
                                                    />
                                                    {fromFatura && !isEdit && (
                                                        <small className="text-muted">
                                                            A 1ª parcela entra na fatura do ciclo desta data (não necessariamente a fatura de origem se a data for alterada).
                                                        </small>
                                                    )}
                                                </div>
                                            </Col>
                                            {!isCompraFlow ? (
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
                                            ) : null}
                                        </Row>
                                        <Row>
                                            {!isCompraFlow ? (
                                            <Col md={5}>
                                                <div className="mb-3">
                                                    <Label htmlFor="estabelecimento_id" className="form-label">Estabelecimento</Label>
                                                    <AsyncSelectListControlled<TransacoesModel>
                                                        callback={searchEstabelecimentos}
                                                        field="estabelecimento_id"
                                                        control={control}
                                                        required={!String(estabelecimentoTexto ?? '').trim() ? required : undefined}
                                                        defaultValue={estabelecimentoDefault}
                                                        placeholder="Digite para buscar..."
                                                    />
                                                    {!estabelecimentoId ? (
                                                        <div className="mt-2">
                                                            <Label htmlFor="estabelecimento" className="form-label small mb-1">
                                                                Não encontrou? Use o nome digitado
                                                            </Label>
                                                            <input
                                                                id="estabelecimento"
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Nome do estabelecimento"
                                                                {...register('estabelecimento')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm px-0"
                                                            onClick={() => {
                                                                setValue('estabelecimento_id', null)
                                                                setValue('estabelecimento', '')
                                                            }}
                                                        >
                                                            Usar um nome novo em vez deste
                                                        </button>
                                                    )}
                                                </div>
                                            </Col>
                                            ) : null}
                                            <Col md={isCompraFlow ? 4 : 3}>
                                                <div className="mb-3" data-compra-field="origem_compra">
                                                    <Label htmlFor="origem_compra" className="form-label">
                                                        Origem da compra <span className="text-danger">*</span>
                                                    </Label>
                                                    <SelectListControlled<TransacoesModel>
                                                        options={origensCompraOptions}
                                                        field="origem_compra"
                                                        control={control}
                                                        errors={erroCampo('origem_compra')}
                                                    />
                                                    {nParcelas <= 1 ? (
                                                        <div className="form-check form-switch mt-2 mb-0">
                                                            <InputCheckbox<TransacoesModel>
                                                                field="eh_assinatura"
                                                                register={register}
                                                                role="switch"
                                                            />
                                                            <Label className="form-check-label" htmlFor="eh_assinatura">
                                                                É assinatura
                                                            </Label>
                                                            <div className="text-muted fs-12">
                                                                Entra na lista oficial mesmo sem o detector
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={isCompraFlow ? 4 : 2}>
                                                <div className="mb-3" data-compra-field="valor_compra">
                                                    <Label htmlFor="valor_compra" className="form-label">
                                                        {isEdit ? 'Valor' : 'Valor da compra'} <span className="text-danger">*</span>
                                                    </Label>
                                                    {isEdit ? (
                                                        <InputTextControlled<TransacoesModel>
                                                            field="valor"
                                                            control={control}
                                                            errors={erroCampo('valor_compra')}
                                                            textValor
                                                            mask="preco"
                                                        />
                                                    ) : (
                                                        <InputTextControlled<TransacoesModel>
                                                            field="valor_compra"
                                                            control={control}
                                                            errors={erroCampo('valor_compra')}
                                                            textValor
                                                            mask="preco"
                                                        />
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={isCompraFlow ? 4 : 2}>
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

                                        {!isEdit && primeiraCompetencia ? (
                                            <Row>
                                                <Col md={12}>
                                                    <div className={`mb-3 border rounded p-3 ${caiForaDaFaturaAberta ? 'border-warning bg-warning-subtle' : 'bg-light'}`}>
                                                        <div className="text-muted text-uppercase fs-11 fw-semibold mb-1">Fatura</div>
                                                        {faturasOptions.length > 1 ? (
                                                            <div className="mb-2" style={{ maxWidth: 360 }}>
                                                                <SelectListControlled<TransacoesModel>
                                                                    options={faturasOptions}
                                                                    field="fatura_id"
                                                                    control={control}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        <div className="fw-semibold">
                                                            {nParcelas > 1 ? 'Primeira fatura: ' : ''}
                                                            {labelCompetenciaCompleta(primeiraCompetencia.mes, primeiraCompetencia.ano)}
                                                        </div>
                                                        {ultimaCompetencia ? (
                                                            <div className="fw-semibold">
                                                                Última fatura: {labelCompetenciaCompleta(ultimaCompetencia.mes, ultimaCompetencia.ano)}
                                                            </div>
                                                        ) : null}
                                                        <div className="text-muted fs-13 mt-1">
                                                            {[
                                                                cartaoAtual?.nome,
                                                                cartaoAtual?.pessoa_nome,
                                                                numeroAtual?.label,
                                                            ].filter(Boolean).join(' · ')}
                                                        </div>
                                                        <small className="text-muted d-block mt-1">
                                                            {faturaIdWatch
                                                                ? 'Você escolheu a primeira fatura. As parcelas seguintes avançam um mês a partir dela.'
                                                                : 'Definida pelo cartão e pela data. As parcelas seguintes caem nas faturas dos meses seguintes.'}
                                                        </small>
                                                        {caiForaDaFaturaAberta && faturaAberta ? (
                                                            <div className="alert alert-warning mb-0 mt-2 py-2">
                                                                Esta data cai na fatura de {labelCompetenciaCompleta(primeiraCompetencia.mes, primeiraCompetencia.ano)}, não na fatura aberta ({labelCompetenciaCompleta(faturaAberta.mes, faturaAberta.ano)}).
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </Col>
                                            </Row>
                                        ) : null}

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3" data-compra-field="categoria_id">
                                                    <Label htmlFor="categoria_id" className="form-label">Categoria</Label>
                                                    <div className="d-flex gap-2 align-items-start">
                                                        <div className="flex-grow-1">
                                                            <SelectListControlled<TransacoesModel>
                                                                options={categoriasOptions}
                                                                field="categoria_id"
                                                                control={control}
                                                                errors={erroCampo('categoria_id')}
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
                                                <div className="mb-3" data-compra-field="subcategoria_id">
                                                    <Label htmlFor="subcategoria_id" className="form-label">Subcategoria</Label>
                                                    <div className="d-flex gap-2 align-items-start">
                                                        <div className="flex-grow-1">
                                                            <SelectListControlled<TransacoesModel>
                                                                options={subcategoriasOptions}
                                                                field="subcategoria_id"
                                                                control={control}
                                                                disabled={!categoriaId}
                                                                errors={erroCampo('subcategoria_id')}
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
                                                <div className="mb-3" data-compra-field="parcelas_total">
                                                    <Label htmlFor="parcelas_total" className="form-label">Parcelamento</Label>
                                                    {isEdit ? (
                                                        <div className="form-control-plaintext">
                                                            {record.parcelas_total && Number(record.parcelas_total) > 1
                                                                ? `${record.parcela_atual ?? 1}/${record.parcelas_total}`
                                                                : 'À vista'}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="btn-group w-100 mb-2" role="group">
                                                                <button
                                                                    type="button"
                                                                    className={`btn ${nParcelas <= 1 ? 'btn-primary' : 'btn-soft-primary'}`}
                                                                    onClick={() => setValue('parcelas_total', 1)}
                                                                >
                                                                    À vista
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`btn ${nParcelas > 1 ? 'btn-primary' : 'btn-soft-primary'}`}
                                                                    onClick={() => {
                                                                        if (nParcelas <= 1) setValue('parcelas_total', 2)
                                                                    }}
                                                                >
                                                                    Parcelada
                                                                </button>
                                                            </div>
                                                            {nParcelas > 1 ? (
                                                                <SelectListControlled<TransacoesModel>
                                                                    options={optParcelas.filter((o) => Number(o.value) > 1)}
                                                                    field="parcelas_total"
                                                                    control={control}
                                                                    errors={erroCampo('parcelas_total')}
                                                                />
                                                            ) : (
                                                                <input type="hidden" {...register('parcelas_total')} />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        {!isEdit && nParcelas > 1 && (
                                            <Row>
                                                <Col md={12}>
                                                    <div className={`mb-3 border rounded p-3 ${fieldErrors.parcelas ? 'border-danger' : 'bg-light'}`} data-compra-field="parcelas">
                                                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                                            <Label className="form-label mb-0">Valores das parcelas</Label>
                                                            <span className={`small ${totaisBatem && !fieldErrors.parcelas ? 'text-success' : 'text-danger'}`}>
                                                                {parcelasValores[0] ? `Parcela: ${centavosToBr(toCentavos(parcelasValores[0]))}` : null}
                                                                {' · '}
                                                                Total das parcelas: {centavosToBr(totalParcelasCentavos)}
                                                                {(!totaisBatem || fieldErrors.parcelas) && (
                                                                    <> · esperado {centavosToBr(valorCompraCentavos)}</>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Row>
                                                            {parcelasValores.map((valor, idx) => (
                                                                <Col md={3} sm={6} key={`parcela-${idx}`}>
                                                                    <div className="mb-2" data-compra-field={`parcela_${idx + 1}`}>
                                                                        <Label className="form-label small">
                                                                            Parcela {idx + 1}/{nParcelas}
                                                                        </Label>
                                                                        <input
                                                                            type="text"
                                                                            className={`form-control ${VALOR_TEXT_CLASS}${fieldErrors[`parcela_${idx + 1}`] || fieldErrors.parcelas ? ' is-invalid' : ''}`}
                                                                            value={mask('preco', valor) ?? ''}
                                                                            onChange={(e) => handleParcelaChange(idx, e.target.value)}
                                                                        />
                                                                        {fieldErrors[`parcela_${idx + 1}`] ? (
                                                                            <div className="d-block invalid-feedback">
                                                                                {fieldErrors[`parcela_${idx + 1}`]}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                        {fieldErrors.parcelas ? (
                                                            <div className="d-block invalid-feedback mt-2">{fieldErrors.parcelas}</div>
                                                        ) : !totaisBatem ? (
                                                            <div className="alert alert-warning mb-0 mt-2 py-2">
                                                                Ajuste as parcelas até o total coincidir com o valor da compra.
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

                                        {!isCompraFlow ? (
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
                                        ) : null}

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
                                                            Aplicar origem, final do cartão, categoria, responsável e observação a todas as parcelas da compra
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
                                                        disabled={saving || numerosLoading}
                                                    >
                                                        {saving ? 'Salvando...' : 'Salvar'}
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

            <CartaoRapidoModal
                isOpen={cartaoRapidoOpen}
                toggle={() => setCartaoRapidoOpen(false)}
                modo={cartaoRapidoModo}
                cartaoId={cartaoRapidoModo === 'final' ? cartaoId : null}
                cartaoNome={cartaoAtual?.nome}
                showPropagarGrupo={isEdit && Boolean(record.compra_grupo_id)}
                onConfirm={handleConfirmCartaoRapido}
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
