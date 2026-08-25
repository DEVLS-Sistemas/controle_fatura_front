import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { centavosToBr, formatCurrency, toCentavos, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { CartaoChip, BandeiraChip, buildBandeiraSelectOptions, extractCartaoErrorMessage } from 'helpers/cartao_helpers'
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    UncontrolledTooltip,
} from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { SelectList } from 'Components/ComponentController/Selects/Select/SelectList'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    BANDEIRA_COR_PADRAO,
    BANDEIRA_PRESETS_CORES_PADRAO,
    buildDiasOptions,
    CARTAO_COR_PADRAO,
    CARTAO_CORES_FUNDO_PADRAO,
    CARTAO_CORES_TEXTO_PADRAO,
    CARTAO_PARES_CORES_PADRAO,
    CARTAO_PRESETS_CORES_PADRAO,
    CartaoBandeira,
    CartaoNumero,
    CartoesDefaultValues,
    CartoesModel,
    findSenhaPdfRegraByBanco,
    matchPresetCorBandeira,
    matchPresetCorCartao,
    normalizeHexCor,
    ParCorBandeiraLookup,
    ParserHomologado,
    PARSERS_HOMOLOGADOS_PADRAO,
    PresetBandeiraLookup,
    PresetCorLookup,
    resolveSenhaPdfRegraDigitos,
    ParCorLookup,
    SenhaPdfRegraLookup,
    TIPOS_NUMERO_PADRAO,
} from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { PessoasService } from 'services/Pessoas/PessoasService'
import { toPessoaSelectOption } from 'interfaces/Pessoas/PessoasInterface'
import PasswordRevealInput from 'Components/Common/PasswordRevealInput'
import CartaoPdfHomologacaoBadge from 'Components/Cartoes/CartaoPdfHomologacaoBadge'
import {
    isParCorPdfHomologado,
    parsersHomologadosOrFallback,
    resolveCartaoHomologacao,
    textoFormCartaoHomologacao,
    tooltipParCorCartao,
} from 'helpers/parser_homologado_helpers'

const toPrecoDigits = (value: string | number | null | undefined): string | null => {
    if (value == null || value === '') return null
    const cents = toCentavos(value)
    return cents > 0 ? String(cents) : null
}

const newLocalKey = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const tipoLabel = (tipo?: string | null, tipos?: SelectOptions[]) => {
    if (!tipo) return null
    return tipos?.find((t) => String(t.value) === String(tipo))?.label ?? tipo
}

const normalizeBandeiras = (bandeiras?: CartaoBandeira[]): CartaoBandeira[] =>
    (bandeiras ?? []).map((b) => ({
        ...b,
        _key: b._key ?? (b.id != null ? `b_${b.id}` : newLocalKey()),
        limite_credito: toPrecoDigits(b.limite_credito),
        ativo: b.ativo !== false,
        numeros: (b.numeros ?? []).map((n) => ({
            ...n,
            _key: n._key ?? (n.id != null ? `n_${n.id}` : newLocalKey()),
            ativo: n.ativo !== false,
        })),
    }))

const buildRecordFromSource = (source: any): CartoesModel => ({
    ...CartoesDefaultValues,
    ...source,
    id: source.id ?? null,
    cartao_id: source.cartao_id ?? source.id ?? null,
    dia_limite_fatura: source.dia_limite_fatura ?? null,
    dia_vencimento_fatura: source.dia_vencimento_fatura ?? null,
    cor_fundo: source.cor_fundo ?? source.cor ?? null,
    cor_texto: source.cor_texto ?? (source.cor_fundo || source.cor ? '#ffffff' : null),
    // API nunca devolve a senha em claro
    senha_pdf: null,
    senha_pdf_regra: source.senha_pdf_regra ?? null,
    limpar_senha_pdf: false,
    tem_senha_pdf: Boolean(source.tem_senha_pdf),
    senha_pdf_orientacao: source.senha_pdf_orientacao ?? null,
    senha_pdf_regra_label: source.senha_pdf_regra_label ?? null,
    bandeiras: normalizeBandeiras(source.bandeiras),
    pessoa_id: source.pessoa_id ?? null,
    bandeiras_remover: [],
    numeros_remover: [],
})

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
            border: hex.toLowerCase() === '#e5e7eb' ? '1.5px solid #9ca3af' : '1.5px solid #000000',
            outline: selected ? '2px solid #405189' : 'none',
            outlineOffset: 2,
            boxShadow: selected ? '0 0 0 2px rgba(64,81,137,0.2)' : undefined,
            cursor: 'pointer',
            padding: 0,
        }}
    />
)

type NovoCartaoForm = {
    bandeira: string
    ultimos_digitos: string
    nome_no_cartao: string
    tipo: string
    apelido: string
    limite_credito: string
}

const novoCartaoDefault: NovoCartaoForm = {
    bandeira: '',
    ultimos_digitos: '',
    nome_no_cartao: '',
    tipo: 'fisico',
    apelido: '',
    limite_credito: '',
}

const CartoesForm = () => {
    const { state } = useLocation()
    const { cartao_id: routeCartaoId, id: routeId } = useParams()
    const paramId = routeCartaoId ?? routeId

    const [record, setRecord] = useState<CartoesModel>(
        state?.source ? buildRecordFromSource(state.source) : CartoesDefaultValues
    )
    const [bandeiras, setBandeiras] = useState<CartaoBandeira[]>(
        state?.source ? normalizeBandeiras(state.source.bandeiras) : []
    )
    const [bandeirasRemover, setBandeirasRemover] = useState<number[]>([])
    const [numerosRemover, setNumerosRemover] = useState<number[]>([])
    const [novoCartao, setNovoCartao] = useState<NovoCartaoForm>(novoCartaoDefault)
    const [editingLimiteKey, setEditingLimiteKey] = useState<string | null>(null)
    const [limiteDraft, setLimiteDraft] = useState('')
    const [limitePendenteModalOpen, setLimitePendenteModalOpen] = useState(false)
    const [temSenhaPdf, setTemSenhaPdf] = useState(Boolean(record.tem_senha_pdf))
    const [limparSenhaPdf, setLimparSenhaPdf] = useState(false)
    const [senhaPdfDigitada, setSenhaPdfDigitada] = useState('')
    const [senhasPdfRegras, setSenhasPdfRegras] = useState<SenhaPdfRegraLookup[]>([])
    const [parsersHomologados, setParsersHomologados] = useState<ParserHomologado[]>(PARSERS_HOMOLOGADOS_PADRAO)

    const { register, handleSubmit, control, reset, setValue, watch, getValues } = useForm<CartoesModel>({
        defaultValues: record
    })

    const corFundo = watch('cor_fundo')
    const corTexto = watch('cor_texto')
    const nomePreview = watch('nome')
    const bancoWatch = watch('banco')
    const senhaPdfRegraWatch = watch('senha_pdf_regra')
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const cartoesService = new CartoesService()

    const [bandeirasOptions, setBandeirasOptions] = useState<SelectOptions[]>(
        () => buildBandeiraSelectOptions()
    )
    const [tiposOptions, setTiposOptions] = useState<SelectOptions[]>(
        TIPOS_NUMERO_PADRAO.map((t) => ({ value: t.value, label: t.label }))
    )
    const [diasOptions, setDiasOptions] = useState<SelectOptions[]>(
        buildDiasOptions().map((d) => ({ value: d.value, label: d.label }))
    )
    const [coresFundo, setCoresFundo] = useState<string[]>(CARTAO_CORES_FUNDO_PADRAO)
    const [coresTexto, setCoresTexto] = useState<string[]>(CARTAO_CORES_TEXTO_PADRAO)
    const [paresCores, setParesCores] = useState<ParCorLookup[]>(CARTAO_PARES_CORES_PADRAO)
    const [presetsCores, setPresetsCores] = useState<PresetCorLookup[]>(CARTAO_PRESETS_CORES_PADRAO)
    const [corPadrao, setCorPadrao] = useState<ParCorLookup>(CARTAO_COR_PADRAO)
    const [presetsBandeiras, setPresetsBandeiras] = useState<PresetBandeiraLookup[]>(BANDEIRA_PRESETS_CORES_PADRAO)
    const [corPadraoBandeira, setCorPadraoBandeira] = useState<ParCorBandeiraLookup>(BANDEIRA_COR_PADRAO)
    const [coresManuais, setCoresManuais] = useState(
        () => !!(paramId || state?.source)
    )
    const [selectedChave, setSelectedChave] = useState<string | null>(
        paramId || state?.source ? null : 'padrao'
    )
    const [senhaPdfRegraOptions, setSenhaPdfRegraOptions] = useState<SelectOptions[]>([])
    const [pessoasOptions, setPessoasOptions] = useState<SelectOptions[]>([
        { value: '', label: 'Não informado' },
    ])
    const pessoasService = new PessoasService()

    const regraSelecionada = senhasPdfRegras.find(
        (r) => String(r.value) === String(senhaPdfRegraWatch ?? '')
    )
    const senhaPdfDigitos = resolveSenhaPdfRegraDigitos(regraSelecionada ?? senhaPdfRegraWatch, senhasPdfRegras)

    const isEditing = !!(record.cartao_id || record.id || paramId)
    const bandeiraJaExiste = bandeiras.some(
        (b) => b.bandeira.toLowerCase() === novoCartao.bandeira.trim().toLowerCase()
    )

    const applyParCor = (par: ParCorLookup, manual = true) => {
        setValue('cor_fundo', par.cor_fundo, { shouldDirty: manual })
        setValue('cor_texto', par.cor_texto, { shouldDirty: manual })
        setSelectedChave(par.chave ?? null)
        if (manual) setCoresManuais(true)
    }

    const applyHexManual = (campo: 'cor_fundo' | 'cor_texto', hex: string) => {
        setValue(campo, hex, { shouldDirty: true })
        setCoresManuais(true)
        setSelectedChave(null)
    }

    const getLookups = async (): Promise<void> => {
        try {
            const lookups = await cartoesService.getLookupsCartoes()
            const presetsBandeiraApi = lookups?.presets_bandeiras?.length
                ? lookups.presets_bandeiras
                : BANDEIRA_PRESETS_CORES_PADRAO
            const padraoBandeira = lookups?.cor_padrao_bandeira ?? BANDEIRA_COR_PADRAO
            setPresetsBandeiras(presetsBandeiraApi)
            setCorPadraoBandeira(padraoBandeira)
            setBandeirasOptions(
                buildBandeiraSelectOptions(
                    lookups?.bandeiras,
                    presetsBandeiraApi,
                    padraoBandeira
                )
            )
            if (lookups?.tipos_numero?.length) {
                setTiposOptions(
                    lookups.tipos_numero.map((t) => ({ value: t.value, label: t.label }))
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
            const presets = lookups?.presets_cores?.length
                ? lookups.presets_cores
                : CARTAO_PRESETS_CORES_PADRAO
            const padrao = lookups?.cor_padrao ?? CARTAO_COR_PADRAO

            setCoresFundo(fundo)
            setCoresTexto(texto)
            setParesCores(pares)
            setPresetsCores(presets)
            setCorPadrao(padrao)

            const regras = lookups?.senhas_pdf_regras ?? []
            setSenhasPdfRegras(regras)
            setSenhaPdfRegraOptions(
                regras.map((r) => ({ value: r.value, label: r.label }))
            )
            setParsersHomologados(parsersHomologadosOrFallback(lookups?.parsers_homologados))

            try {
                const pessoas = await pessoasService.AsyncListPessoas()
                if (pessoas) {
                    setPessoasOptions([
                        { value: '', label: 'Não informado' },
                        ...pessoas.map((p) => toPessoaSelectOption(p)),
                    ])
                }
            } catch (error) {
                console.error('Erro ao carregar pessoas:', error)
            }

            if (!isEditing && !coresManuais) {
                const matched = matchPresetCorCartao(
                    getValues('nome'),
                    getValues('banco'),
                    presets,
                    padrao
                )
                applyParCor(matched, false)
            }
        } catch (error) {
            console.error('Erro ao carregar lookups de cartões:', error)
            if (!isEditing && !getValues('cor_fundo')) {
                applyParCor(CARTAO_COR_PADRAO, false)
            }
        }
    }

    const loadRecord = async (id: string | number) => {
        try {
            const view = await cartoesService.getViewCartoes({ id })
            if (view) {
                const loaded = buildRecordFromSource(view)
                setRecord(loaded)
                setBandeiras(loaded.bandeiras ?? [])
                setBandeirasRemover([])
                setNumerosRemover([])
                setTemSenhaPdf(Boolean(loaded.tem_senha_pdf))
                setLimparSenhaPdf(false)
                setSenhaPdfDigitada('')
                reset(loaded)
                setCoresManuais(true)
                setSelectedChave(null)
            }
        } catch (error) {
            console.error('Erro ao carregar cartão:', error)
            toast.error('Erro ao carregar cartão.')
        }
    }

    const handleAddCartao = () => {
        const bandeiraNome = novoCartao.bandeira.trim()
        const digitos = novoCartao.ultimos_digitos.replace(/\D/g, '')

        if (!bandeiraNome) {
            toast.warning('Selecione a bandeira')
            return
        }
        if (digitos.length > 0 && digitos.length !== 4) {
            toast.warning('Informe exatamente 4 dígitos do final do cartão (ou deixe em branco)')
            return
        }

        const existing = bandeiras.find(
            (b) => b.bandeira.toLowerCase() === bandeiraNome.toLowerCase()
        )

        if (digitos.length === 0) {
            if (existing) {
                toast.warning('Esta bandeira já está na lista. Informe um final para adicionar um cartão nela.')
                return
            }
            const limiteCents = toCentavos(novoCartao.limite_credito)
            const coresBandeira = matchPresetCorBandeira(bandeiraNome, presetsBandeiras, corPadraoBandeira)
            const novaBandeira: CartaoBandeira = {
                _key: newLocalKey(),
                bandeira: bandeiraNome,
                limite_credito: limiteCents > 0 ? String(limiteCents) : null,
                ativo: true,
                cor_principal: coresBandeira.cor_principal,
                cor_secundaria: coresBandeira.cor_secundaria,
                bandeira_chave: coresBandeira.chave ?? null,
                bandeira_padrao: coresBandeira.padrao,
                numeros: [],
            }
            setBandeiras((prev) => [...prev, novaBandeira])
            setNovoCartao(novoCartaoDefault)
            return
        }

        if (existing?.numeros?.some((n) => n.ultimos_digitos === digitos)) {
            toast.warning('Este final já está cadastrado nesta bandeira')
            return
        }

        const numero: CartaoNumero = {
            _key: newLocalKey(),
            ultimos_digitos: digitos,
            tipo: novoCartao.tipo || 'fisico',
            nome_no_cartao: novoCartao.nome_no_cartao.trim() || null,
            apelido: novoCartao.apelido.trim() || null,
            ativo: true,
        }

        if (existing) {
            setBandeiras((prev) =>
                prev.map((b) =>
                    (b._key ?? b.id) === (existing._key ?? existing.id)
                        ? { ...b, numeros: [...(b.numeros ?? []), numero] }
                        : b
                )
            )
        } else {
            const limiteCents = toCentavos(novoCartao.limite_credito)
            const coresBandeira = matchPresetCorBandeira(bandeiraNome, presetsBandeiras, corPadraoBandeira)
            const novaBandeira: CartaoBandeira = {
                _key: newLocalKey(),
                bandeira: bandeiraNome,
                limite_credito: limiteCents > 0 ? String(limiteCents) : null,
                ativo: true,
                cor_principal: coresBandeira.cor_principal,
                cor_secundaria: coresBandeira.cor_secundaria,
                bandeira_chave: coresBandeira.chave ?? null,
                bandeira_padrao: coresBandeira.padrao,
                numeros: [numero],
            }
            setBandeiras((prev) => [...prev, novaBandeira])
        }

        setNovoCartao(novoCartaoDefault)
    }

    const handleToggleNumero = (bandeiraKey: string | number, numeroKey: string | number) => {
        setBandeiras((prev) =>
            prev.map((b) => {
                if ((b._key ?? b.id) !== bandeiraKey) return b
                return {
                    ...b,
                    numeros: (b.numeros ?? []).map((n) =>
                        (n._key ?? n.id) === numeroKey ? { ...n, ativo: !n.ativo } : n
                    ),
                }
            })
        )
    }

    const handleNomeNoCartaoChange = (
        bandeiraKey: string | number,
        numeroKey: string | number,
        value: string
    ) => {
        setBandeiras((prev) =>
            prev.map((b) => {
                if ((b._key ?? b.id) !== bandeiraKey) return b
                return {
                    ...b,
                    numeros: (b.numeros ?? []).map((n) =>
                        (n._key ?? n.id) === numeroKey
                            ? { ...n, nome_no_cartao: value || null }
                            : n
                    ),
                }
            })
        )
    }

    const handleRemoveNumero = (bandeira: CartaoBandeira, numero: CartaoNumero) => {
        if (numero.id) {
            const ok = window.confirm(
                'Números/bandeiras com faturas vinculadas podem ser só desativados. Deseja continuar a remoção?'
            )
            if (!ok) return
        }

        const bandeiraKey = bandeira._key ?? bandeira.id
        const numeroKey = numero._key ?? numero.id

        if (numero.id) {
            setNumerosRemover((prev) => (prev.includes(numero.id!) ? prev : [...prev, numero.id!]))
        }

        const numerosRestantes = (bandeira.numeros ?? []).filter(
            (n) => (n._key ?? n.id) !== numeroKey
        )

        setBandeiras((prev) =>
            prev.map((b) => {
                if ((b._key ?? b.id) !== bandeiraKey) return b
                return { ...b, numeros: numerosRestantes }
            })
        )
    }

    const handleRemoveBandeira = (bandeira: CartaoBandeira) => {
        if (bandeira.id) {
            const ok = window.confirm(
                'Números/bandeiras com faturas vinculadas podem ser só desativados. Deseja continuar a remoção?'
            )
            if (!ok) return
        }

        const bandeiraKey = bandeira._key ?? bandeira.id

        if (bandeira.id) {
            setBandeirasRemover((prev) =>
                prev.includes(bandeira.id!) ? prev : [...prev, bandeira.id!]
            )
        }

        for (const numero of bandeira.numeros ?? []) {
            if (numero.id) {
                setNumerosRemover((prev) =>
                    prev.includes(numero.id!) ? prev : [...prev, numero.id!]
                )
            }
        }

        setBandeiras((prev) => prev.filter((b) => (b._key ?? b.id) !== bandeiraKey))
    }

    const startEditLimite = (bandeira: CartaoBandeira) => {
        const key = String(bandeira._key ?? bandeira.id)
        setEditingLimiteKey(key)
        setLimiteDraft(bandeira.limite_credito != null ? String(bandeira.limite_credito) : '')
    }

    const saveLimite = (bandeira: CartaoBandeira) => {
        const key = bandeira._key ?? bandeira.id
        const cents = toCentavos(limiteDraft)
        setBandeiras((prev) =>
            prev.map((b) =>
                (b._key ?? b.id) === key
                    ? { ...b, limite_credito: cents > 0 ? String(cents) : null }
                    : b
            )
        )
        setEditingLimiteKey(null)
        setLimiteDraft('')
    }

    const applyLimiteDraftToBandeiras = (source: CartaoBandeira[]): CartaoBandeira[] => {
        if (editingLimiteKey == null) return source
        const cents = toCentavos(limiteDraft)
        return source.map((b) =>
            String(b._key ?? b.id) === editingLimiteKey
                ? { ...b, limite_credito: cents > 0 ? String(cents) : null }
                : b
        )
    }

    const getLimitesPendentes = () => {
        if (editingLimiteKey == null) return []
        const cents = toCentavos(limiteDraft)
        if (cents <= 0) return []
        const bandeira = bandeiras.find((b) => String(b._key ?? b.id) === editingLimiteKey)
        if (!bandeira) return []
        return [
            {
                key: editingLimiteKey,
                bandeiraNome: bandeira.bandeira,
                valorLabel: formatCurrency(cents / 100),
                bandeira,
            },
        ]
    }

    const persistCartao = async (
        data: CartoesModel,
        bandeirasToSave: CartaoBandeira[],
        options?: { stayOnPage?: boolean }
    ) => {
        try {
            const bandeirasPayload = bandeirasToSave.map((b) => {
                const limiteCents = toCentavos(b.limite_credito)
                return {
                    ...(b.id ? { id: b.id } : {}),
                    bandeira: b.bandeira,
                    cor_principal: b.cor_principal ?? null,
                    cor_secundaria: b.cor_secundaria ?? null,
                    limite_credito: limiteCents > 0 ? centavosToBr(limiteCents) : null,
                    ativo: b.ativo !== false,
                    numeros: (b.numeros ?? []).map((n) => ({
                        ...(n.id ? { id: n.id } : {}),
                        ultimos_digitos: n.ultimos_digitos,
                        tipo: n.tipo || 'fisico',
                        nome_no_cartao: n.nome_no_cartao || null,
                        apelido: n.apelido || null,
                        ativo: n.ativo !== false,
                    })),
                }
            })

            const regraValue = data.senha_pdf_regra
                ? String(data.senha_pdf_regra)
                : null
            const senhaNova = senhaPdfDigitada.replace(/\D/g, '')
            const digitosRegra = resolveSenhaPdfRegraDigitos(regraValue, senhasPdfRegras)

            if (senhaNova && digitosRegra != null && senhaNova.length !== digitosRegra) {
                toast.warning(`A senha do PDF deve ter exatamente ${digitosRegra} dígitos conforme a regra selecionada.`)
                return
            }

            const payload: CartoesModel = {
                nome: data.nome,
                banco: data.banco,
                dia_limite_fatura: data.dia_limite_fatura != null
                    ? Number(data.dia_limite_fatura)
                    : null,
                dia_vencimento_fatura: data.dia_vencimento_fatura != null
                    ? Number(data.dia_vencimento_fatura)
                    : null,
                cor_fundo: data.cor_fundo,
                cor_texto: data.cor_texto,
                ativo: data.ativo,
                pessoa_id: data.pessoa_id || null,
                senha_pdf_regra: regraValue || null,
                bandeiras: bandeirasPayload as CartaoBandeira[],
                bandeiras_remover: bandeirasRemover,
                numeros_remover: numerosRemover,
            }

            if (isEditing && limparSenhaPdf) {
                payload.limpar_senha_pdf = true
            } else if (senhaNova) {
                payload.senha_pdf = senhaNova
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

            if (options?.stayOnPage) {
                setBandeirasRemover([])
                setNumerosRemover([])
                setSenhaPdfDigitada('')
                setLimparSenhaPdf(false)
                if (paramId) {
                    await loadRecord(paramId)
                }
                return
            }

            navigate('/cartoes')
        } catch (error) {
            console.error('Erro ao salvar cartão:', error)
            toast.error(extractCartaoErrorMessage(error, 'Erro ao salvar cartão.'))
        }
    }

    const handleAplicarLimitesPendentes = async () => {
        const bandeirasAtualizadas = applyLimiteDraftToBandeiras(bandeiras)
        setBandeiras(bandeirasAtualizadas)
        setEditingLimiteKey(null)
        setLimiteDraft('')
        setLimitePendenteModalOpen(false)
        await persistCartao(getValues(), bandeirasAtualizadas, { stayOnPage: true })
    }

    const onSubmit: SubmitHandler<CartoesModel> = async (data) => {
        // Limite em edição fica só no draft até Ok; Salvar não pode ignorar silenciosamente
        if (getLimitesPendentes().length > 0) {
            setLimitePendenteModalOpen(true)
            return
        }

        await persistCartao(data, bandeiras)
    }

    useEffect(() => {
        setActiveMenu('/cartoes')
    }, [])

    useEffect(() => {
        getLookups()
    }, [])

    useEffect(() => {
        if (paramId) {
            // Sempre carrega o detalhe completo (listagem pode vir sem árvore)
            loadRecord(paramId)
        }
    }, [paramId])

    // Pré-seleciona regra de senha PDF quando o banco sugere (ex.: C6)
    useEffect(() => {
        if (!bancoWatch?.trim() || !senhasPdfRegras.length) return
        const current = getValues('senha_pdf_regra')
        if (current) return
        const sugerida = findSenhaPdfRegraByBanco(bancoWatch, senhasPdfRegras)
        if (sugerida) {
            setValue('senha_pdf_regra', sugerida.value, { shouldDirty: true })
        }
    }, [bancoWatch, senhasPdfRegras, getValues, setValue])

    // Aplica a cor oficial do banco enquanto o usuário não escolheu na mão
    useEffect(() => {
        if (coresManuais) return
        const matched = matchPresetCorCartao(nomePreview, bancoWatch, presetsCores, corPadrao)
        applyParCor(matched, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nomePreview, bancoWatch, coresManuais, presetsCores, corPadrao])

    // Limita a senha digitada ao máximo de dígitos da regra selecionada
    useEffect(() => {
        if (senhaPdfDigitos == null || senhaPdfDigitos <= 0) return
        setSenhaPdfDigitada((prev) => {
            const digits = prev.replace(/\D/g, '').slice(0, senhaPdfDigitos)
            return digits === prev ? prev : digits
        })
    }, [senhaPdfDigitos])

    const formatLimiteDisplay = (limite?: number | string | null) => {
        if (limite == null || limite === '') return 'Sem limite'
        const cents = toCentavos(limite)
        if (cents <= 0) return 'Sem limite'
        return formatCurrency(cents / 100)
    }

    const limitesPendentes = getLimitesPendentes()
    const homologacaoNome = useMemo(
        () => resolveCartaoHomologacao(
            { nome: nomePreview, banco: bancoWatch },
            parsersHomologados,
            presetsCores
        ),
        [nomePreview, bancoWatch, parsersHomologados, presetsCores]
    )
    const textoHomologacao = textoFormCartaoHomologacao(homologacaoNome, parsersHomologados)

    return (
        <React.Fragment>
            <Modal
                isOpen={limitePendenteModalOpen}
                toggle={() => setLimitePendenteModalOpen(false)}
                centered
            >
                <ModalHeader toggle={() => setLimitePendenteModalOpen(false)}>
                    Limite não confirmado
                </ModalHeader>
                <ModalBody>
                    <p className="mb-3">
                        Há limite em edição que ainda não foi confirmado com Ok. Deseja aplicar
                        e salvar agora?
                    </p>
                    <ul className="list-group mb-0">
                        {limitesPendentes.map((item) => (
                            <li
                                key={item.key}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <span>
                                    <BandeiraChip
                                        bandeira={item.bandeiraNome}
                                        cor_principal={item.bandeira.cor_principal}
                                        cor_secundaria={item.bandeira.cor_secundaria}
                                        label={item.bandeiraNome}
                                    />
                                </span>
                                <span className={VALOR_TEXT_CLASS}>{item.valorLabel}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted small mt-3 mb-0">
                        Ao confirmar, o limite será gravado e você permanecerá nesta tela para
                        continuar editando se quiser.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        type="button"
                        color="light"
                        onClick={() => setLimitePendenteModalOpen(false)}
                    >
                        Fechar
                    </Button>
                    <Button type="button" color="primary" onClick={handleAplicarLimitesPendentes}>
                        Aplicar e salvar
                    </Button>
                </ModalFooter>
            </Modal>
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
                                        <h6 className="text-muted text-uppercase mb-3">Dados do cartão</h6>
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
                                                    <Label htmlFor="banco" className="form-label">Banco</Label>
                                                    <InputTextControlled<CartoesModel>
                                                        field={"banco"}
                                                        control={control}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="pessoa_id" className="form-label">Titular</Label>
                                                    <SelectListControlled<CartoesModel>
                                                        field="pessoa_id"
                                                        control={control}
                                                        options={pessoasOptions}
                                                    />
                                                    <small className="text-muted">
                                                        Pessoa dona deste cartão. Faturas importadas herdam este titular quando o nome bater.
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col md={3}>
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
                                            <Col md={3}>
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
                                            <Col md={6}>
                                                <div className="form-check mt-4">
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

                                        <h6 className="text-muted text-uppercase mb-3 mt-2">Senha do PDF da fatura</h6>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="senha_pdf_regra" className="form-label">
                                                        Regra da senha do PDF
                                                    </Label>
                                                    <SelectListControlled<CartoesModel>
                                                        field="senha_pdf_regra"
                                                        control={control}
                                                        options={senhaPdfRegraOptions}
                                                    />
                                                    {regraSelecionada?.orientacao ? (
                                                        <small className="text-muted d-block mt-1">
                                                            {regraSelecionada.orientacao}
                                                        </small>
                                                    ) : (
                                                        <small className="text-muted d-block mt-1">
                                                            Opcional. Limpe o campo para nenhuma regra. Bancos como C6 são sugeridos automaticamente.
                                                        </small>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="senha_pdf" className="form-label">
                                                        Senha do PDF da fatura
                                                    </Label>
                                                    <PasswordRevealInput
                                                        id="senha_pdf"
                                                        value={senhaPdfDigitada}
                                                        disabled={limparSenhaPdf}
                                                        inputMode="numeric"
                                                        maxLength={senhaPdfDigitos ?? undefined}
                                                        placeholder={
                                                            temSenhaPdf
                                                                ? 'Senha já cadastrada — digite para alterar'
                                                                : senhaPdfDigitos != null
                                                                    ? `${senhaPdfDigitos} dígitos (opcional)`
                                                                    : 'Opcional'
                                                        }
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const digits = e.target.value.replace(/\D/g, '')
                                                            setSenhaPdfDigitada(
                                                                senhaPdfDigitos != null
                                                                    ? digits.slice(0, senhaPdfDigitos)
                                                                    : digits
                                                            )
                                                            if (limparSenhaPdf) setLimparSenhaPdf(false)
                                                        }}
                                                    />
                                                    <small className="text-muted d-block mt-1">
                                                        Usada automaticamente ao importar faturas deste cartão. Opcional.
                                                        {senhaPdfDigitos != null
                                                            ? ` Informe exatamente ${senhaPdfDigitos} dígitos conforme a regra.`
                                                            : ''}
                                                    </small>
                                                    {isEditing && temSenhaPdf && (
                                                        <div className="form-check mt-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="limpar_senha_pdf"
                                                                checked={limparSenhaPdf}
                                                                onChange={(e) => {
                                                                    setLimparSenhaPdf(e.target.checked)
                                                                    if (e.target.checked) setSenhaPdfDigitada('')
                                                                }}
                                                            />
                                                            <Label className="form-check-label" htmlFor="limpar_senha_pdf">
                                                                Remover senha salva
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                                        <Label className="form-label mb-0">Cores do cartão</Label>
                                                        {coresManuais ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-soft-primary"
                                                                onClick={() => setCoresManuais(false)}
                                                            >
                                                                Usar cor do banco
                                                            </button>
                                                        ) : (
                                                            <small className="text-muted">
                                                                A cor acompanha o nome/banco até você escolher um chip
                                                            </small>
                                                        )}
                                                    </div>

                                                    <div className="cartao-cores-grid mb-3">
                                                        {paresCores.map((par, index) => {
                                                            const chaveMatch = selectedChave
                                                                ? par.chave === selectedChave
                                                                : false
                                                            const corMatch =
                                                                normalizeHexCor(corFundo) === normalizeHexCor(par.cor_fundo) &&
                                                                normalizeHexCor(corTexto) === normalizeHexCor(par.cor_texto)
                                                            const selected = selectedChave ? chaveMatch : corMatch
                                                            const swatchId = `cartao-cor-swatch-${par.chave || index}`
                                                            const homologado = isParCorPdfHomologado(par, parsersHomologados)
                                                            return (
                                                                <div
                                                                    key={`${par.chave || par.label}-${par.cor_fundo}`}
                                                                    className={`cartao-cores-grid__item ${selected ? 'is-selected' : ''}`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        id={swatchId}
                                                                        className="border-0 bg-transparent p-0 w-100 d-flex flex-column align-items-center gap-1"
                                                                        onClick={() => applyParCor(par)}
                                                                    >
                                                                        <span
                                                                            className="cartao-cores-grid__chip"
                                                                            style={{
                                                                                backgroundColor: par.cor_fundo,
                                                                                color: par.cor_texto,
                                                                            }}
                                                                        >
                                                                            Aa
                                                                            {homologado && (
                                                                                <span className="cartao-cores-grid__homolog" aria-hidden>
                                                                                    <i className="ri-check-line"></i>
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="cartao-cores-grid__label">
                                                                            {par.label || 'Cor'}
                                                                        </span>
                                                                    </button>
                                                                    <UncontrolledTooltip placement="top" target={swatchId}>
                                                                        {tooltipParCorCartao(par, parsersHomologados)}
                                                                    </UncontrolledTooltip>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Label className="form-label small text-muted">Ajuste fino — fundo</Label>
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
                                                                        selected={normalizeHexCor(corFundo) === normalizeHexCor(hex)}
                                                                        onClick={() => applyHexManual('cor_fundo', hex)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Label className="form-label small text-muted">Ajuste fino — texto</Label>
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
                                                                        selected={normalizeHexCor(corTexto) === normalizeHexCor(hex)}
                                                                        onClick={() => applyHexManual('cor_texto', hex)}
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
                                                            label={nomePreview || 'Novo cartão'}
                                                        />
                                                        {(corFundo || corTexto) && (
                                                            <small className="text-muted">
                                                                {corFundo || '-'} / {corTexto || '-'}
                                                            </small>
                                                        )}
                                                        <CartaoPdfHomologacaoBadge
                                                            homologacao={homologacaoNome}
                                                            targetId="cartao-form-pdf-homolog"
                                                        />
                                                    </div>
                                                    <div
                                                        className={`small mt-2 ${textoHomologacao.homologada ? 'text-success' : 'text-muted'}`}
                                                    >
                                                        {textoHomologacao.texto}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        <hr className="my-4" />

                                        <h6 className="text-muted text-uppercase mb-3">Cartões deste grupo</h6>
                                        <p className="text-muted small mb-3">
                                            Finais são opcionais — você pode salvar o grupo só com nome/ciclo, ou
                                            cadastrar bandeiras sem finais e adicioná-los depois.
                                            O limite é único por bandeira — vários cartões (físico, virtual, adicional)
                                            compartilham o mesmo limite.
                                            O <strong>nome no cartão</strong> é o texto impresso no plástico
                                            (ex.: LEONARDO S FERREIRA), usado para identificar os grupos na fatura.
                                            O <strong>apelido</strong> é só um rótulo interno.
                                        </p>

                                        <Row className="align-items-end g-2 mb-3">
                                            <Col md={3}>
                                                <Label className="form-label">Bandeira</Label>
                                                <SelectList
                                                    options={bandeirasOptions}
                                                    value={novoCartao.bandeira || null}
                                                    placeholder="Selecionar..."
                                                    onChange={(val) =>
                                                        setNovoCartao((prev) => ({
                                                            ...prev,
                                                            bandeira: val ? String(val) : '',
                                                        }))
                                                    }
                                                />
                                            </Col>
                                            <Col md={2}>
                                                <Label className="form-label">Final <span className="text-muted fw-normal">(opcional)</span></Label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={4}
                                                    placeholder="••••"
                                                    value={novoCartao.ultimos_digitos}
                                                    onChange={(e) =>
                                                        setNovoCartao((prev) => ({
                                                            ...prev,
                                                            ultimos_digitos: e.target.value.replace(/\D/g, '').slice(0, 4),
                                                        }))
                                                    }
                                                />
                                            </Col>
                                            <Col md={3}>
                                                <Label className="form-label">Nome no cartão</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Ex.: LEONARDO S FERREIRA"
                                                    value={novoCartao.nome_no_cartao}
                                                    onChange={(e) =>
                                                        setNovoCartao((prev) => ({
                                                            ...prev,
                                                            nome_no_cartao: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </Col>
                                            <Col md={2}>
                                                <Label className="form-label">Tipo</Label>
                                                <Input
                                                    type="select"
                                                    value={novoCartao.tipo}
                                                    onChange={(e) =>
                                                        setNovoCartao((prev) => ({
                                                            ...prev,
                                                            tipo: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    {tiposOptions.map((opt) => (
                                                        <option key={String(opt.value)} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </Col>
                                            <Col md={2}>
                                                <Label className="form-label">Apelido</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Rótulo interno"
                                                    value={novoCartao.apelido}
                                                    onChange={(e) =>
                                                        setNovoCartao((prev) => ({
                                                            ...prev,
                                                            apelido: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </Col>
                                            {!bandeiraJaExiste && novoCartao.bandeira && (
                                                <Col md={2}>
                                                    <Label className="form-label">Limite da bandeira</Label>
                                                    <Input
                                                        type="text"
                                                        className={VALOR_TEXT_CLASS}
                                                        placeholder="Ex.: 15.000,00"
                                                        value={
                                                            novoCartao.limite_credito
                                                                ? centavosToBr(toCentavos(novoCartao.limite_credito))
                                                                : ''
                                                        }
                                                        onChange={(e) => {
                                                            const digits = e.target.value.replace(/\D/g, '')
                                                            setNovoCartao((prev) => ({
                                                                ...prev,
                                                                limite_credito: digits,
                                                            }))
                                                        }}
                                                    />
                                                </Col>
                                            )}
                                            <Col md="auto">
                                                <button
                                                    type="button"
                                                    className="btn btn-soft-primary"
                                                    onClick={handleAddCartao}
                                                >
                                                    <i className="ri-add-circle-line align-middle me-1"></i>
                                                    Adicionar cartão
                                                </button>
                                            </Col>
                                        </Row>

                                        {bandeiras.length === 0 ? (
                                            <div className="text-muted border rounded p-3 text-center mb-3">
                                                Nenhuma bandeira/final adicionado — opcional no cadastro.
                                            </div>
                                        ) : (
                                            <div className="mb-3">
                                                {bandeiras.map((bandeira) => {
                                                    const bKey = String(bandeira._key ?? bandeira.id)
                                                    const isEditingLimite = editingLimiteKey === bKey
                                                    const numerosBandeira = bandeira.numeros ?? []
                                                    return (
                                                        <div
                                                            key={bKey}
                                                            className="border rounded mb-3 overflow-hidden"
                                                        >
                                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 bg-light">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <BandeiraChip
                                                                        cor_principal={bandeira.cor_principal}
                                                                        cor_secundaria={bandeira.cor_secundaria}
                                                                        bandeira={bandeira.bandeira}
                                                                        label={bandeira.bandeira}
                                                                    />
                                                                    <span className="text-muted">·</span>
                                                                    {isEditingLimite ? (
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <Input
                                                                                type="text"
                                                                                bsSize="sm"
                                                                                className={VALOR_TEXT_CLASS}
                                                                                style={{ width: 140 }}
                                                                                value={
                                                                                    limiteDraft
                                                                                        ? centavosToBr(toCentavos(limiteDraft))
                                                                                        : ''
                                                                                }
                                                                                onChange={(e) =>
                                                                                    setLimiteDraft(
                                                                                        e.target.value.replace(/\D/g, '')
                                                                                    )
                                                                                }
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault()
                                                                                        saveLimite(bandeira)
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-primary"
                                                                                onClick={() => saveLimite(bandeira)}
                                                                            >
                                                                                Ok
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-light"
                                                                                onClick={() => {
                                                                                    setEditingLimiteKey(null)
                                                                                    setLimiteDraft('')
                                                                                }}
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className={`text-muted ${VALOR_TEXT_CLASS}`}>
                                                                            Limite {formatLimiteDisplay(bandeira.limite_credito)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!isEditingLimite && (
                                                                    <div className="d-flex gap-1">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-soft-secondary"
                                                                            onClick={() => startEditLimite(bandeira)}
                                                                        >
                                                                            Editar limite
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-soft-danger"
                                                                            onClick={() => handleRemoveBandeira(bandeira)}
                                                                        >
                                                                            Remover bandeira
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {numerosBandeira.length === 0 ? (
                                                                <div className="px-3 py-2 text-muted small">
                                                                    Nenhum final cadastrado nesta bandeira.
                                                                </div>
                                                            ) : (
                                                                <ul className="list-group list-group-flush">
                                                                    {numerosBandeira.map((numero) => {
                                                                        const nKey = String(numero._key ?? numero.id)
                                                                        const labelTipo = tipoLabel(numero.tipo, tiposOptions)
                                                                        return (
                                                                            <li
                                                                                key={nKey}
                                                                                className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2"
                                                                            >
                                                                                <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
                                                                                    <span className="fw-medium">
                                                                                        •••• {numero.ultimos_digitos}
                                                                                    </span>
                                                                                    <Input
                                                                                        type="text"
                                                                                        bsSize="sm"
                                                                                        style={{ maxWidth: 220 }}
                                                                                        placeholder="Nome no cartão"
                                                                                        value={numero.nome_no_cartao ?? ''}
                                                                                        onChange={(e) =>
                                                                                            handleNomeNoCartaoChange(
                                                                                                bandeira._key ?? bandeira.id!,
                                                                                                numero._key ?? numero.id!,
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {labelTipo && (
                                                                                        <span className="badge bg-light text-dark">
                                                                                            {labelTipo}
                                                                                        </span>
                                                                                    )}
                                                                                    {numero.apelido && (
                                                                                        <span className="text-muted small">
                                                                                            · {numero.apelido}
                                                                                        </span>
                                                                                    )}
                                                                                    {!numero.ativo && (
                                                                                        <span className="badge bg-danger">
                                                                                            Inativo
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="d-flex gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        className={`btn btn-sm ${numero.ativo ? 'btn-soft-warning' : 'btn-soft-success'}`}
                                                                                        onClick={() =>
                                                                                            handleToggleNumero(
                                                                                                bandeira._key ?? bandeira.id!,
                                                                                                numero._key ?? numero.id!
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {numero.ativo ? 'Desativar' : 'Ativar'}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-sm btn-soft-danger"
                                                                                        onClick={() =>
                                                                                            handleRemoveNumero(bandeira, numero)
                                                                                        }
                                                                                    >
                                                                                        Remover
                                                                                    </button>
                                                                                </div>
                                                                            </li>
                                                                        )
                                                                    })}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <hr />
                                        <Row className="mt-4">
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
