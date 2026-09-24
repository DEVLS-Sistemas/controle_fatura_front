import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    Badge,
    Button,
    Col,
    FormFeedback,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner,
} from 'reactstrap'
import { SelectList } from 'Components/ComponentController/Selects/Select/SelectList'
import { AnosSelect } from 'helpers/functions_helpers'
import { formatCurrency, mesesOptions } from 'helpers/fatura_helpers'
import {
    COPY_CONFERIR_COMPETENCIA_PDF,
    formatCompetenciaMesAno,
} from 'helpers/fatura_competencia_pdf_helpers'
import {
    avisoParserOuPadrao,
    isParserChaveHomologada,
    parsersHomologadosOrFallback,
    resolveCartaoHomologacao,
} from 'helpers/parser_homologado_helpers'
import { ParserHomologado, PARSERS_HOMOLOGADOS_PADRAO } from 'interfaces/Cartoes/CartoesInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { buildBandeiraSelectOptions, toBandeiraSelectOption } from 'helpers/cartao_helpers'
import {
    FaturaMetadadosCartaoOption,
    FaturaMetadadosModo,
    FaturaMetadadosRetryPayload,
    FaturaMetadadosSugestao,
    FaturaNoPeriodo,
} from 'libs/api/exceptions/FaturaMetadadosError'
import {
    bandeirasDaCompetencia,
    bandeirasDoModal,
    bandeiraConfereComFaturaExistente,
    competenciaExigeSelectBandeira,
    faturaDoPeriodoPelaBandeira,
    nomeCartaoDoPayload,
    resolveModoMetadados,
    retryMetadadosPelaBandeira,
} from 'helpers/fatura_metadados_helpers'
import { FaturaExistenteAnexoDuplicado } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'
import { CartoesService } from 'services/Cartoes/CartoesService'
import {
    COPY_AGUARDE_PROCESSANDO_SUBSTITUIR,
    faturaExistenteTemAnexo,
    labelCtaFaturaExistente,
    podeSubstituirFaturaExistente,
    resolveAcaoSugeridaFatura,
} from 'helpers/fatura_substituir_existente_helpers'
import {
    rotuloCartaoBandeira,
    rotuloCompetenciaFatura,
    rotuloValorTransacoes,
} from 'helpers/fatura_anexo_duplicado_helpers'
import {
    valoresConferenciaFatura,
} from 'helpers/fatura_conferencia_helpers'

export type FaturaMetadadosModalProps = {
    isOpen: boolean
    sugestao?: FaturaMetadadosSugestao | null
    cartoes?: FaturaMetadadosCartaoOption[]
    bandeiras?: FaturaSelecaoBandeiraOption[]
    modo?: FaturaMetadadosModo | null
    podeCadastrarCartao?: boolean
    orientacao?: string | null
    precisaSelecionarBandeira?: boolean
    acaoSugerida?: string | null
    faturaExistente?: FaturaExistenteAnexoDuplicado | null
    faturaExistenteId?: number | null
    faturasPeriodo?: FaturaNoPeriodo[]
    /** Bandeira já escolhida no formulário, antes do 422. */
    bandeiraIdEscolhida?: number | string | null
    loading?: boolean
    onClose: () => void
    onConfirm: (payload: FaturaMetadadosRetryPayload) => void | Promise<void>
}

type CartaoMode = 'existente' | 'novo'

const CRIAR_PREFIX = 'criar:'
const NOVO_CARTAO_VALUE = '__novo_cartao__'

const toBandeiraSelectValue = (opt: FaturaSelecaoBandeiraOption): string => {
    if (opt.criar || opt.value == null || opt.value === '') {
        return `${CRIAR_PREFIX}${opt.label}`
    }
    return String(opt.value)
}

const confiancaLabel = (confianca?: string | null): string | null => {
    switch (confianca) {
        case 'alta':
            return 'Identificado automaticamente'
        case 'media':
            return 'Sugestão por banco/parser'
        case 'ambigua':
            return 'Vários cartões possíveis — confirme o correto'
        case 'baixa':
            return 'Cartão ainda não cadastrado'
        default:
            return null
    }
}

const FaturaMetadadosModal = ({
    isOpen,
    sugestao = null,
    cartoes = [],
    bandeiras: bandeirasIniciais = [],
    modo: modoProp = null,
    podeCadastrarCartao = false,
    orientacao = null,
    precisaSelecionarBandeira = false,
    acaoSugerida = null,
    faturaExistente = null,
    faturaExistenteId = null,
    faturasPeriodo = [],
    bandeiraIdEscolhida = null,
    loading = false,
    onClose,
    onConfirm,
}: FaturaMetadadosModalProps) => {
    const cartoesService = useRef(new CartoesService()).current
    const [mode, setMode] = useState<CartaoMode>('existente')
    const [cartaoId, setCartaoId] = useState<string | number | null>(null)
    const [cartaoNome, setCartaoNome] = useState('')
    const [mes, setMes] = useState<string | number | null>(null)
    const [ano, setAno] = useState<string | number | null>(null)
    const [bandeiraValue, setBandeiraValue] = useState<string | null>(null)
    const [bandeiras, setBandeiras] = useState<FaturaSelecaoBandeiraOption[]>([])
    const [bandeirasLookup, setBandeirasLookup] = useState<FaturaSelecaoBandeiraOption[]>([])
    const [showBandeira, setShowBandeira] = useState(false)
    const [bandeirasLoading, setBandeirasLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bandeiraError, setBandeiraError] = useState<string | null>(null)
    const [parsersHomologados, setParsersHomologados] = useState<ParserHomologado[]>(PARSERS_HOMOLOGADOS_PADRAO)
    const [aceiteValores, setAceiteValores] = useState(false)
    const initialCartaoRef = useRef<string | number | null>(null)

    const cartaoOptions: SelectOptions[] = useMemo(
        () => [
            ...cartoes.map((c) => ({
                value: c.value,
                label: c.sugerido
                    ? `${c.label}${c.banco ? ` (${c.banco})` : ''} · sugerido`
                    : c.banco
                        ? `${c.label} (${c.banco})`
                        : c.label,
            })),
            {
                value: NOVO_CARTAO_VALUE,
                label: '＋ Cadastrar novo cartão nesta tela',
            },
        ],
        [cartoes]
    )

    const bandeiraOptions: SelectOptions[] = useMemo(
        () =>
            bandeiras.map((b) =>
                toBandeiraSelectOption(toBandeiraSelectValue(b), b.label, b)
            ),
        [bandeiras]
    )

    const anosOptions = useMemo(() => AnosSelect(), [])
    const modoResolvido = useMemo(
        () =>
            resolveModoMetadados({
                modo: modoProp,
                pode_cadastrar_cartao: podeCadastrarCartao,
                sugestao,
            }),
        [modoProp, podeCadastrarCartao, sugestao]
    )
    const nomeIdentificado = useMemo(
        () => nomeCartaoDoPayload(sugestao, modoResolvido),
        [sugestao, modoResolvido]
    )
    const periodo = faturasPeriodo.length > 0
        ? faturasPeriodo
        : (sugestao?.faturas_periodo ?? [])
    const exigeBandeira = competenciaExigeSelectBandeira({
        precisaSelecionarBandeira,
        faturasPeriodo: periodo,
    })
    const cartaoDoPeriodo = sugestao?.cartao_id ?? null
    const idEscolhidoNoFormulario = (() => {
        const id = Number(bandeiraIdEscolhida)
        return Number.isFinite(id) && id > 0 ? id : null
    })()
    const preferirBandeiraId = idEscolhidoNoFormulario ?? sugestao?.cartao_bandeira_id ?? null
    const preferirBandeiraLabel = idEscolhidoNoFormulario != null
        ? null
        : (sugestao?.bandeira_sugerida ?? null)
    const noCartaoDoPeriodo = (id?: number | string | null) => (
        cartaoDoPeriodo != null
        && id != null
        && id !== ''
        && Number(id) === Number(cartaoDoPeriodo)
    )

    const applyBandeiras = (
        list: FaturaSelecaoBandeiraOption[],
        forceShow: boolean,
        options?: {
            preferId?: number | null
            preferLabel?: string | null
            /** No cadastro de cartão novo, o usuário deve escolher a bandeira */
            autoSelect?: boolean
        }
    ) => {
        const { preferId = null, preferLabel = null, autoSelect = true } = options ?? {}
        setBandeiras(list)
        const mustShow = forceShow || list.length === 0 || list.length >= 2
        setShowBandeira(mustShow)

        if (!autoSelect) {
            setBandeiraValue(null)
            return
        }

        if (!mustShow && list.length === 1) {
            setBandeiraValue(toBandeiraSelectValue(list[0]))
            return
        }

        if (preferId != null) {
            const byId = list.find((b) => b.value != null && Number(b.value) === Number(preferId))
            if (byId) {
                setBandeiraValue(toBandeiraSelectValue(byId))
                return
            }
        }
        if (preferLabel) {
            const byLabel = list.find(
                (b) => b.label.toLowerCase() === String(preferLabel).toLowerCase()
            )
            if (byLabel) {
                setBandeiraValue(toBandeiraSelectValue(byLabel))
                return
            }
        }
        if (list.length === 1) {
            setBandeiraValue(toBandeiraSelectValue(list[0]))
            return
        }
        setBandeiraValue(null)
    }

    const enterNovoMode = (nomeSugestao?: string) => {
        setMode('novo')
        setCartaoId(null)
        setBandeiraError(null)
        setCartaoNome(nomeSugestao || nomeIdentificado)
        const list = bandeirasDoModal({
            modo: 'cadastrar_cartao',
            payload: bandeirasIniciais,
            lookup: bandeirasLookup,
        })
        applyBandeiras(list, true, {
            preferLabel: sugestao?.bandeira_sugerida ?? null,
            autoSelect: Boolean(sugestao?.bandeira_sugerida),
        })
    }

    const enterExistenteMode = (id?: number | string | null) => {
        setMode('existente')
        setCartaoNome('')
        const next = id ?? null
        setCartaoId(next)
        setBandeiraError(null)
        if (next == null) {
            setBandeiras([])
            setShowBandeira(false)
            setBandeiraValue(null)
            return
        }
        const forcarSelect = exigeBandeira && noCartaoDoPeriodo(next)
        const mesmoCartaoInicial = initialCartaoRef.current != null
            && Number(next) === Number(initialCartaoRef.current)
        if (mesmoCartaoInicial && (bandeirasIniciais.length > 0 || forcarSelect)) {
            const lista = forcarSelect
                ? bandeirasDaCompetencia({ payload: bandeirasIniciais, lookup: bandeirasLookup })
                : bandeirasIniciais
            if (lista.length > 0) {
                applyBandeiras(lista, precisaSelecionarBandeira || forcarSelect, {
                    preferId: preferirBandeiraId,
                    preferLabel: preferirBandeiraLabel,
                })
                return
            }
        }
        void loadBandeirasForCartao(next, forcarSelect)
    }

    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        ;(async () => {
            try {
                const lookups = await cartoesService.getLookupsCartoes()
                if (cancelled) return
                const list = buildBandeiraSelectOptions(lookups?.bandeiras).map((opt) => ({
                    value: null,
                    label: String(opt.label ?? ''),
                    criar: true,
                    cor_principal: opt.cor_principal,
                    cor_secundaria: opt.cor_secundaria,
                }))
                setBandeirasLookup(list)
                setParsersHomologados(parsersHomologadosOrFallback(lookups?.parsers_homologados))
            } catch {
                if (!cancelled) setBandeirasLookup([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [isOpen, cartoesService])

    useEffect(() => {
        if (!isOpen) return
        setError(null)
        setBandeiraError(null)
        setAceiteValores(false)
        const nextCartao = sugestao?.cartao_id ?? null
        initialCartaoRef.current = nextCartao
        setMes(sugestao?.mes ?? null)
        setAno(sugestao?.ano ?? null)

        if (modoResolvido === 'cadastrar_cartao') {
            enterNovoMode(nomeIdentificado)
        } else {
            enterExistenteMode(nextCartao)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, sugestao, bandeirasIniciais, precisaSelecionarBandeira, modoResolvido, nomeIdentificado, faturasPeriodo, bandeiraIdEscolhida])

    useEffect(() => {
        if (!isOpen || mode !== 'novo' || bandeirasLookup.length === 0) return
        const next = bandeirasDoModal({
            modo: 'cadastrar_cartao',
            payload: bandeirasIniciais,
            lookup: bandeirasLookup,
        })
        const sameLabels =
            next.length === bandeiras.length
            && next.every((b, i) => b.label === bandeiras[i]?.label)
        if (sameLabels) return
        applyBandeiras(next, true, {
            preferLabel: sugestao?.bandeira_sugerida ?? null,
            autoSelect: Boolean(sugestao?.bandeira_sugerida),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, bandeirasLookup, bandeirasIniciais])

    useEffect(() => {
        if (!isOpen || mode !== 'existente' || !exigeBandeira) return
        if (!noCartaoDoPeriodo(cartaoId)) return
        if (bandeirasLookup.length === 0 && bandeirasIniciais.length === 0) return
        const next = bandeirasDaCompetencia({
            payload: bandeirasIniciais.length > 0 ? bandeirasIniciais : bandeiras,
            lookup: bandeirasLookup,
        })
        if (next.length === 0) return
        const same = next.length === bandeiras.length
            && next.every((b, i) => (
                b.label === bandeiras[i]?.label && Boolean(b.criar) === Boolean(bandeiras[i]?.criar)
            ))
        if (same && showBandeira) return
        const atual = bandeiraValue
        const criarAtual = atual != null && String(atual).startsWith(CRIAR_PREFIX)
        const idAtual = !criarAtual && atual != null && atual !== '' && Number(atual) > 0
            ? Number(atual)
            : null
        const idSugestao = sugestao?.cartao_bandeira_id != null ? Number(sugestao.cartao_bandeira_id) : null
        const aindaEhSugestao = idAtual == null || (idSugestao != null && idAtual === idSugestao)
        const preferId = idEscolhidoNoFormulario != null && aindaEhSugestao
            ? idEscolhidoNoFormulario
            : (idAtual ?? preferirBandeiraId)
        applyBandeiras(next, true, {
            preferId: criarAtual ? null : preferId,
            preferLabel: criarAtual
                ? String(atual).slice(CRIAR_PREFIX.length)
                : (idEscolhidoNoFormulario != null && aindaEhSugestao ? null : preferirBandeiraLabel),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, exigeBandeira, bandeirasLookup, bandeirasIniciais, cartaoId])

    const loadBandeirasForCartao = async (id: number | string, forceShow = false) => {
        setBandeirasLoading(true)
        try {
            const list = (await cartoesService.AsyncListBandeiras({ cartao_id: id })) ?? []
            const mapped = list.map((b) => ({
                value: b.value,
                label: b.label,
                cor_principal: b.cor_principal,
                cor_secundaria: b.cor_secundaria,
            }))
            const lista = forceShow
                ? bandeirasDaCompetencia({ payload: mapped, lookup: bandeirasLookup })
                : mapped
            applyBandeiras(
                lista.length > 0 ? lista : mapped,
                forceShow,
                {
                    preferId: forceShow ? preferirBandeiraId : null,
                    preferLabel: forceShow ? preferirBandeiraLabel : (sugestao?.bandeira_sugerida ?? null),
                }
            )
        } catch {
            applyBandeiras([], true, { autoSelect: false })
        } finally {
            setBandeirasLoading(false)
        }
    }

    const handleCartaoChange = (value: string | number | null | undefined) => {
        setError(null)
        setBandeiraError(null)
        if (value === NOVO_CARTAO_VALUE) {
            enterNovoMode()
            return
        }
        const next = value != null && value !== '' ? value : null
        enterExistenteMode(next)
    }

    const resolveBandeiraPayload = (
        payload: FaturaMetadadosRetryPayload,
        required: boolean
    ): boolean => {
        if (!bandeiraValue) {
            if (required || showBandeira) {
                setBandeiraError('Selecione a bandeira')
                return false
            }
            return true
        }
        if (String(bandeiraValue).startsWith(CRIAR_PREFIX)) {
            payload.bandeira = String(bandeiraValue).slice(CRIAR_PREFIX.length)
        } else {
            payload.cartao_bandeira_id = bandeiraValue
            const escolhida = bandeiras.find((b) => toBandeiraSelectValue(b) === String(bandeiraValue))
            const nome = String(escolhida?.label ?? '').trim()
            if (nome) payload.bandeira = nome
        }
        return true
    }

    const buildPayload = (): FaturaMetadadosRetryPayload | null => {
        setBandeiraError(null)

        if (mes == null || mes === '') {
            setError('Selecione o mês')
            return null
        }
        if (ano == null || ano === '') {
            setError('Selecione o ano')
            return null
        }

        if (mode === 'novo') {
            const nome = cartaoNome.trim()
            if (!nome) {
                setError('Informe o nome do cartão para cadastrá-lo')
                return null
            }
            const payload: FaturaMetadadosRetryPayload = {
                cartao_id: null,
                cartao_nome: nome,
                cadastrar_cartao: true,
                mes,
                ano,
            }
            if (!resolveBandeiraPayload(payload, true)) return null
            return payload
        }

        if (cartaoId == null || cartaoId === '') {
            setError('Selecione o cartão ou cadastre um novo nesta tela')
            return null
        }

        const payload: FaturaMetadadosRetryPayload = {
            cartao_id: cartaoId,
            mes,
            ano,
        }
        const bandeiraObrigatoria = showBandeira || (exigeBandeira && noCartaoDoPeriodo(cartaoId))
        if (!resolveBandeiraPayload(payload, bandeiraObrigatoria)) return null
        return payload
    }

    const faturaCard = faturaExistente ?? sugestao?.fatura_existente ?? null
    const acaoCta = resolveAcaoSugeridaFatura({
        acao_sugerida: acaoSugerida ?? sugestao?.acao_sugerida,
        fatura_existente: faturaCard,
    })
    const idDaEscolha = (() => {
        const doCard = Number(faturaCard?.id)
        if (Number.isFinite(doCard) && doCard > 0) return doCard
        const informado = Number(faturaExistenteId ?? sugestao?.fatura_existente_id)
        return Number.isFinite(informado) && informado > 0 ? informado : null
    })()
    const escolhaBandeiraAtual = () => {
        if (bandeiraValue == null || bandeiraValue === '') return {}
        if (String(bandeiraValue).startsWith(CRIAR_PREFIX)) {
            return {
                criar: true,
                bandeira: String(bandeiraValue).slice(CRIAR_PREFIX.length),
            }
        }
        const opt = bandeiras.find((b) => toBandeiraSelectValue(b) === String(bandeiraValue))
        const id = Number(opt?.value ?? bandeiraValue)
        return {
            criar: Boolean(opt?.criar),
            bandeira: opt?.label ?? null,
            cartao_bandeira_id: Number.isFinite(id) && id > 0 ? id : null,
        }
    }
    const escolhaAtual = escolhaBandeiraAtual()
    const faturaDaBandeira = faturaDoPeriodoPelaBandeira(periodo, escolhaAtual)
    const confereBandeira = bandeiraConfereComFaturaExistente(escolhaAtual, faturaCard, periodo)
    const decidirPelaBandeira = mode === 'existente'
        && (exigeBandeira || showBandeira)
        && (faturaDaBandeira != null || faturaCard != null)
    const retryBandeira = retryMetadadosPelaBandeira({
        exigeBandeira: decidirPelaBandeira,
        escolha: escolhaAtual,
        periodo,
        confereComExistente: confereBandeira,
        faturaTemAnexo: faturaDaBandeira ? Boolean(faturaDaBandeira.tem_anexo) : faturaExistenteTemAnexo(faturaCard),
        faturaId: faturaDaBandeira?.id ?? idDaEscolha,
    })
    const acaoVisivel = decidirPelaBandeira ? retryBandeira.acao : acaoCta
    const isNovo = mode === 'novo'
    const mostrarBandeira = isNovo || showBandeira || (exigeBandeira && noCartaoDoPeriodo(cartaoId))
    const ctaLabel = labelCtaFaturaExistente(acaoVisivel, { cadastrarCartao: isNovo && acaoVisivel === 'cadastrar' })
    const podeSubstituir = acaoVisivel !== 'substituir' || podeSubstituirFaturaExistente(faturaExistente ?? sugestao?.fatura_existente)
    const rotuloExistente = faturaDaBandeira?.bandeira
        ? [
            (faturaExistente ?? sugestao?.fatura_existente)?.cartao_nome,
            faturaDaBandeira.bandeira,
        ].filter(Boolean).join(' · ')
        : rotuloCartaoBandeira(faturaExistente ?? sugestao?.fatura_existente)
    const competenciaExistente = faturaDaBandeira?.competencia
        ?? rotuloCompetenciaFatura(faturaExistente ?? sugestao?.fatura_existente)
    const trocouBandeira = decidirPelaBandeira && !confereBandeira

    const handleSubmit = async () => {
        setError(null)
        setBandeiraError(null)
        if (precisaAceiteValores && !aceiteValores) {
            setError('Marque que você leu o aviso dos valores para continuar')
            return
        }
        const payload = buildPayload()
        if (!payload) return
        if (decidirPelaBandeira) {
            if (retryBandeira.confirmar_substituir_fatura && retryBandeira.fatura_existente_id != null) {
                payload.fatura_existente_id = retryBandeira.fatura_existente_id
                payload.confirmar_substituir_fatura = true
            } else if (retryBandeira.fatura_existente_id != null && !faturaExistenteTemAnexo(faturaCard)) {
                payload.fatura_existente_id = retryBandeira.fatura_existente_id
            }
        } else if (acaoCta === 'substituir' && idDaEscolha != null) {
            payload.fatura_existente_id = idDaEscolha
            payload.confirmar_substituir_fatura = true
        } else if (acaoCta === 'cadastrar' && idDaEscolha != null && !faturaExistenteTemAnexo(faturaCard)) {
            payload.fatura_existente_id = idDaEscolha
        }
        await onConfirm(payload)
    }

    const bandeiraFieldError = bandeiraError
        ? { message: bandeiraError }
        : undefined

    const chipConfianca = confiancaLabel(sugestao?.confianca)
    const finais = sugestao?.ultimos_digitos?.filter(Boolean) ?? []
    const valor = sugestao?.valor_fatura
    const competenciaLida = formatCompetenciaMesAno({ mes, ano, competencia: null })
    const cartaoSelecionado = cartoes.find((c) => Number(c.value) === Number(cartaoId))
    const homologacaoCartao = resolveCartaoHomologacao(
        isNovo
            ? { nome: cartaoNome, banco: null }
            : {
                nome: cartaoSelecionado?.label,
                banco: cartaoSelecionado?.banco,
                importacao_pdf_homologada: cartaoSelecionado?.importacao_pdf_homologada,
                parser_homologado: cartaoSelecionado?.parser_homologado,
            },
        parsersHomologados
    )
    const parserNaoHomologado =
        sugestao?.importacao_pdf_homologada === false
        || Boolean(sugestao?.aviso_parser?.trim())
        || (Boolean(sugestao?.parser) && !isParserChaveHomologada(sugestao?.parser, parsersHomologados))
    const cartaoNaoHomologado = !isNovo && cartaoSelecionado
        ? homologacaoCartao.homologada === false
        : false
    const precisaAceiteValores = parserNaoHomologado || cartaoNaoHomologado
    const valoresConferencia = valoresConferenciaFatura(sugestao?.conferencia)
    const parserHomologadoNota =
        !precisaAceiteValores
            ? (sugestao?.parser_homologado?.nota ?? homologacaoCartao.parser?.nota)
            : null

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered size="lg">
            <ModalHeader toggle={onClose}>Confirmar dados da fatura</ModalHeader>
            <ModalBody>
                {precisaAceiteValores && (
                    <Alert color="warning" className="mb-3">
                        {avisoParserOuPadrao(sugestao?.aviso_parser)}
                    </Alert>
                )}
                {parserHomologadoNota && (
                    <p className="small text-muted mb-3">{parserHomologadoNota}</p>
                )}
                {valoresConferencia && (
                    <Alert color="info" className="mb-3">
                        Total no PDF: {formatCurrency(valoresConferencia.valorCabecalho)}.
                        {' '}Soma das linhas: {formatCurrency(valoresConferencia.somaTransacoes)}.
                        {valoresConferencia.diferenca != null && (
                            <> Diferença: {formatCurrency(valoresConferencia.diferenca)}.</>
                        )}
                        {' '}O total da fatura continua o do PDF.
                    </Alert>
                )}
                {isNovo ? (
                    <>
                        <p className="mb-2">
                            {nomeIdentificado
                                ? <>Identificamos <strong>{nomeIdentificado}</strong>, o mês e o ano no arquivo.</>
                                : <>Identificamos o <strong>mês</strong> e o <strong>ano</strong> no arquivo.</>}
                            {' '}O cartão ainda não está vinculado — você pode <strong>cadastrá-lo agora</strong>,
                            nesta mesma tela, informando o nome e a bandeira.
                        </p>
                        {orientacao && (
                            <p className="small text-muted mb-2">{orientacao}</p>
                        )}
                        <Alert color="success" className="mb-3">
                            <i className="ri-checkbox-circle-line me-1 align-middle"></i>
                            Não precisa sair para cadastrar o cartão nem anexar o arquivo de novo.
                            Ao confirmar, criamos o cartão e a fatura juntos.
                        </Alert>
                    </>
                ) : (
                    <>
                        {orientacao && (
                            <Alert color="warning" className="mb-3">{orientacao}</Alert>
                        )}
                        <p className="mb-3">
                            Identificamos cartão, mês e ano no arquivo. Confirme os dados antes de cadastrar.
                        </p>
                    </>
                )}

                <Alert color="warning" className="mb-3">
                    {COPY_CONFERIR_COMPETENCIA_PDF}
                </Alert>
                {(faturaExistente || sugestao?.fatura_existente) && (
                    <Alert color={acaoVisivel === 'substituir' ? 'warning' : 'info'} className="mb-3">
                        {acaoVisivel === 'substituir' ? (
                            <>
                                Já existe fatura com anexo
                                {[rotuloExistente, competenciaExistente].filter(Boolean).length
                                    ? ` (${[rotuloExistente, competenciaExistente].filter(Boolean).join(' · ')})`
                                    : ''}
                                . O botão único é <strong>Substituir fatura</strong> — não cria outra linha.
                            </>
                        ) : trocouBandeira ? (
                            <>
                                Outra bandeira nesta competência é outra fatura.
                                {' '}O botão é <strong>Cadastrar fatura</strong> — não substitui a que já existe.
                            </>
                        ) : (
                            <>
                                Há uma fatura sem anexo nesta competência
                                {competenciaExistente ? ` (${competenciaExistente})` : ''}.
                                {' '}O arquivo será anexado nela.
                            </>
                        )}
                        {(faturaExistente ?? sugestao?.fatura_existente) && (
                            <div className="small mt-1">
                                {rotuloValorTransacoes(faturaExistente ?? sugestao?.fatura_existente)}
                            </div>
                        )}
                    </Alert>
                )}
                {!podeSubstituir && (
                    <Alert color="info" className="mb-3">
                        {COPY_AGUARDE_PROCESSANDO_SUBSTITUIR}
                    </Alert>
                )}
                {competenciaLida ? (
                    <div className="text-center mb-3">
                        <div className="text-muted small">Competência lida do arquivo</div>
                        <div className="fs-2 fw-semibold lh-1">{competenciaLida}</div>
                    </div>
                ) : (
                    <p className="text-muted mb-3">
                        Informe o mês e o ano da fatura. Não usamos o ano corrente como padrão.
                    </p>
                )}

                {(chipConfianca || finais.length > 0 || valor != null) && (
                    <Alert color="info" className="mb-3">
                        {chipConfianca && (
                            <div className="mb-1">
                                <Badge color="primary" className="me-1">
                                    {chipConfianca}
                                </Badge>
                            </div>
                        )}
                        {finais.length > 0 && (
                            <div className="small">
                                Finais detectados:{' '}
                                {finais.map((f) => (
                                    <Badge key={f} color="secondary" className="me-1">
                                        ••{f}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {valor != null && valor !== '' && (
                            <div className="small mt-1">
                                Valor da fatura: {formatCurrency(valor)}
                            </div>
                        )}
                    </Alert>
                )}

                <Row>
                    <Col md={3}>
                        <div className="mb-3">
                            <Label className="form-label">Mês</Label>
                            <SelectList
                                name="fatura_metadados_mes"
                                options={mesesOptions}
                                value={mes}
                                onChange={(value) => {
                                    setMes(value ?? null)
                                    if (error) setError(null)
                                }}
                                isDisabled={loading}
                            />
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="mb-3">
                            <Label className="form-label">Ano da fatura</Label>
                            <SelectList
                                name="fatura_metadados_ano"
                                options={anosOptions}
                                value={ano}
                                onChange={(value) => {
                                    setAno(value ?? null)
                                    if (error) setError(null)
                                }}
                                isDisabled={loading}
                            />
                        </div>
                    </Col>
                </Row>

                {isNovo ? (
                    <Row>
                        <Col md={6}>
                            <div className="mb-3">
                                <Label className="form-label" htmlFor="fatura_metadados_cartao_nome">
                                    Nome do cartão
                                </Label>
                                <Input
                                    id="fatura_metadados_cartao_nome"
                                    type="text"
                                    placeholder="Ex.: C6, Nubank, Sofisa…"
                                    value={cartaoNome}
                                    disabled={loading}
                                    onChange={(e) => {
                                        setCartaoNome(e.target.value)
                                        if (error) setError(null)
                                    }}
                                />
                                <small className="text-muted d-block mt-1">
                                    Esse será o nome do cartão na sua lista.
                                </small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-3">
                                <Label className="form-label">Bandeira</Label>
                                <SelectList
                                    name="fatura_metadados_bandeira_nova"
                                    options={bandeiraOptions}
                                    value={bandeiraValue}
                                    errors={bandeiraFieldError}
                                    onChange={(value) => {
                                        setBandeiraValue(
                                            value != null && value !== '' ? String(value) : null
                                        )
                                        setBandeiraError(null)
                                        if (error) setError(null)
                                    }}
                                    isDisabled={loading || bandeirasLoading}
                                    isLoading={bandeirasLoading}
                                />
                                {sugestao?.bandeira_sugerida && (
                                    <small className="text-muted d-block mt-1">
                                        Sugestão da fatura: {sugestao.bandeira_sugerida} — confirme no select.
                                    </small>
                                )}
                            </div>
                        </Col>
                        {cartoes.length > 0 && (
                            <Col md={12}>
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm px-0"
                                    disabled={loading}
                                    onClick={() => enterExistenteMode(sugestao?.cartao_id ?? null)}
                                >
                                    Já tenho este cartão cadastrado — escolher da lista
                                </button>
                            </Col>
                        )}
                    </Row>
                ) : (
                    <>
                        <Row>
                            <Col md={6}>
                                <div className="mb-3">
                                    <Label className="form-label">Cartão</Label>
                                    <SelectList
                                        name="fatura_metadados_cartao"
                                        options={cartaoOptions}
                                        value={cartaoId}
                                        onChange={handleCartaoChange}
                                        isDisabled={loading}
                                    />
                                </div>
                            </Col>
                            {mostrarBandeira && (
                                <Col md={6}>
                                    <div className="mb-3">
                                        <Label className="form-label">Bandeira</Label>
                                        <SelectList
                                            name="fatura_metadados_bandeira"
                                            options={bandeiraOptions}
                                            value={bandeiraValue}
                                            errors={bandeiraFieldError}
                                            onChange={(value) => {
                                                setBandeiraValue(
                                                    value != null && value !== '' ? String(value) : null
                                                )
                                                setBandeiraError(null)
                                                if (error) setError(null)
                                            }}
                                            isDisabled={loading || bandeirasLoading}
                                            isLoading={bandeirasLoading}
                                        />
                                        <small className="text-muted d-block mt-1">
                                            {exigeBandeira && noCartaoDoPeriodo(cartaoId)
                                                ? (idEscolhidoNoFormulario != null
                                                    ? 'A bandeira escolhida no formulário vem selecionada. Outra bandeira neste mês é outra fatura.'
                                                    : 'Outra bandeira neste mês é outra fatura. A sugerida já vem selecionada; você pode trocar.')
                                                : (
                                                    <>
                                                        Selecione a bandeira desta fatura
                                                        {sugestao?.bandeira_sugerida
                                                            ? ` (sugerida: ${sugestao.bandeira_sugerida})`
                                                            : ''}
                                                        .
                                                    </>
                                                )}
                                        </small>
                                    </div>
                                </Col>
                            )}
                        </Row>
                        <button
                            type="button"
                            className="btn btn-link btn-sm px-0 mb-2"
                            disabled={loading}
                            onClick={() => enterNovoMode()}
                        >
                            Cartão não está na lista? Cadastre-o aqui (nome + bandeira)
                        </button>
                    </>
                )}

                {error && <FormFeedback className="d-block">{error}</FormFeedback>}

                {precisaAceiteValores && (
                    <div className="form-check mt-3">
                        <Input
                            id="fatura_metadados_aceite_valores"
                            type="checkbox"
                            className="form-check-input"
                            checked={aceiteValores}
                            disabled={loading}
                            onChange={(e) => setAceiteValores(e.target.checked)}
                        />
                        <Label className="form-check-label" htmlFor="fatura_metadados_aceite_valores">
                            Li que os valores podem não ser os corretos e quero continuar
                        </Label>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    type="button"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading || bandeirasLoading || !podeSubstituir}
                    title={
                        !podeSubstituir
                            ? COPY_AGUARDE_PROCESSANDO_SUBSTITUIR
                            : (precisaAceiteValores && !aceiteValores
                                ? 'Marque a confirmação dos valores para continuar'
                                : undefined)
                    }
                >
                    {loading && <Spinner size="sm" className="me-2" />}
                    {ctaLabel}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaMetadadosModal
