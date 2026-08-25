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
    FaturaMetadadosRetryPayload,
    FaturaMetadadosSugestao,
} from 'libs/api/exceptions/FaturaMetadadosError'
import { FaturaSelecaoBandeiraOption } from 'libs/api/exceptions/FaturaSelecaoError'
import { CartoesService } from 'services/Cartoes/CartoesService'

export type FaturaMetadadosModalProps = {
    isOpen: boolean
    sugestao?: FaturaMetadadosSugestao | null
    cartoes?: FaturaMetadadosCartaoOption[]
    bandeiras?: FaturaSelecaoBandeiraOption[]
    precisaSelecionarBandeira?: boolean
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

const parserToNomeSugestao = (parser?: string | null, cartaoNome?: string | null): string => {
    if (cartaoNome?.trim()) return cartaoNome.trim()
    if (!parser) return ''
    const map: Record<string, string> = {
        c6: 'C6',
        sofisa: 'Sofisa',
        nubank: 'Nubank',
        inter: 'Inter',
        itau: 'Itaú',
        bradesco: 'Bradesco',
        santander: 'Santander',
        xp: 'XP',
    }
    const key = String(parser).toLowerCase()
    return map[key] || parser.charAt(0).toUpperCase() + parser.slice(1)
}

const FaturaMetadadosModal = ({
    isOpen,
    sugestao = null,
    cartoes = [],
    bandeiras: bandeirasIniciais = [],
    precisaSelecionarBandeira = false,
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
        setCartaoNome(nomeSugestao ?? parserToNomeSugestao(sugestao?.parser, sugestao?.cartao_nome))
        const list =
            bandeirasIniciais.length > 0
                ? bandeirasIniciais
                : bandeirasLookup.length > 0
                    ? bandeirasLookup
                    : []
        // Sempre deixa o select vazio — usuário confirma a bandeira
        applyBandeiras(list, true, { autoSelect: false })
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
        if (
            initialCartaoRef.current != null
            && Number(next) === Number(initialCartaoRef.current)
            && bandeirasIniciais.length > 0
        ) {
            applyBandeiras(bandeirasIniciais, precisaSelecionarBandeira, {
                preferId: sugestao?.cartao_bandeira_id ?? null,
                preferLabel: sugestao?.bandeira_sugerida ?? null,
            })
            return
        }
        void loadBandeirasForCartao(next)
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

        const semCartao =
            nextCartao == null
            || sugestao?.confianca === 'baixa'

        if (semCartao) {
            enterNovoMode(parserToNomeSugestao(sugestao?.parser, sugestao?.cartao_nome))
        } else {
            enterExistenteMode(nextCartao)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, sugestao, bandeirasIniciais, precisaSelecionarBandeira])

    // Completa opções de bandeira do lookup sem pré-selecionar (usuário escolhe)
    useEffect(() => {
        if (!isOpen || mode !== 'novo' || bandeirasLookup.length === 0) return
        if (bandeiras.length > 0) return
        applyBandeiras(bandeirasLookup, true, { autoSelect: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, bandeirasLookup])

    const loadBandeirasForCartao = async (id: number | string) => {
        setBandeirasLoading(true)
        try {
            const list = (await cartoesService.AsyncListBandeiras({ cartao_id: id })) ?? []
            applyBandeiras(
                list.map((b) => ({
                    value: b.value,
                    label: b.label,
                    cor_principal: b.cor_principal,
                    cor_secundaria: b.cor_secundaria,
                })),
                false,
                { preferLabel: sugestao?.bandeira_sugerida ?? null }
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
                cartao_nome: nome,
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
        if (!resolveBandeiraPayload(payload, showBandeira)) return null
        return payload
    }

    const handleSubmit = async () => {
        setError(null)
        setBandeiraError(null)
        const payload = buildPayload()
        if (!payload) return
        await onConfirm(payload)
    }

    const bandeiraFieldError = bandeiraError
        ? { message: bandeiraError }
        : undefined

    const chipConfianca = confiancaLabel(sugestao?.confianca)
    const finais = sugestao?.ultimos_digitos?.filter(Boolean) ?? []
    const valor = sugestao?.valor_fatura
    const isNovo = mode === 'novo'
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
    const conferencia = sugestao?.conferencia
    const conferenciaDiverge = conferencia != null && conferencia.bate === false
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
                {conferenciaDiverge && (
                    <Alert color="warning" className="mb-3">
                        O total do cabeçalho da fatura ({formatCurrency(conferencia?.valor_cabecalho)})
                        {' '}diverge da soma das transações ({formatCurrency(conferencia?.soma_transacoes)}).
                        {' '}Vamos usar a soma das transações.
                    </Alert>
                )}
                {isNovo ? (
                    <>
                        <p className="mb-2">
                            Identificamos o <strong>mês</strong> e o <strong>ano</strong> no arquivo.
                            O cartão ainda não está vinculado — você pode <strong>cadastrá-lo agora</strong>,
                            nesta mesma tela, informando o nome e a bandeira.
                        </p>
                        <Alert color="success" className="mb-3">
                            <i className="ri-checkbox-circle-line me-1 align-middle"></i>
                            Não precisa sair para cadastrar o cartão nem anexar o arquivo de novo.
                            Ao confirmar, criamos o cartão e a fatura juntos.
                        </Alert>
                    </>
                ) : (
                    <p className="mb-3">
                        Identificamos cartão, mês e ano no arquivo. Confirme os dados antes de cadastrar.
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
                            <Label className="form-label">Ano</Label>
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
                            {showBandeira && (
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
                                            Selecione a bandeira desta fatura
                                            {sugestao?.bandeira_sugerida
                                                ? ` (sugerida: ${sugestao.bandeira_sugerida})`
                                                : ''}
                                            .
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
                    disabled={loading || bandeirasLoading || (precisaAceiteValores && !aceiteValores)}
                >
                    {loading && <Spinner size="sm" className="me-2" />}
                    {isNovo ? 'Cadastrar cartão e fatura' : 'Confirmar e cadastrar'}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaMetadadosModal
