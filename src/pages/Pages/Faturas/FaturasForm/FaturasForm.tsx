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
import { FATURA_FILE_ACCEPT, isValidFaturaFile, mesesOptions, nomeResponsavelPadraoNaoEu } from 'helpers/fatura_helpers'
import {
    anexoFoiParaOutraFatura,
    destinoFaturaDoAnexo,
    formatCompetenciaMesAno,
    mensagemPdfVinculadoCompetencia,
} from 'helpers/fatura_competencia_pdf_helpers'
import {
    anexoDuplicadoRetryFields,
    extractFaturaMessage,
} from 'helpers/fatura_anexo_duplicado_helpers'
import { toBandeiraSelectOption } from 'helpers/cartao_helpers'
import {
    extractFaturaId,
    extractFaturaPayload,
    faturaPrecisaSenhaPdf,
    FaturasDefaultValues,
    FaturasModel,
    CartaoLookup,
    resolveSenhaPdfMeta,
    SenhaPdfMeta,
} from 'interfaces/Faturas/FaturasInterface'
import { ParserHomologado, PARSERS_HOMOLOGADOS_PADRAO } from 'interfaces/Cartoes/CartoesInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import FaturaSenhaPdfModal, { FaturaSenhaUnlockPayload } from 'Components/Faturas/FaturaSenhaPdfModal'
import FaturaSelecaoModal, { FaturaSelecaoStep } from 'Components/Faturas/FaturaSelecaoModal'
import FaturaMetadadosModal from 'Components/Faturas/FaturaMetadadosModal'
import FaturaTitularModal from 'Components/Faturas/FaturaTitularModal'
import FaturaCartaoTitularModal from 'Components/Faturas/FaturaCartaoTitularModal'
import FaturaAnexoDuplicadoModal from 'Components/Faturas/FaturaAnexoDuplicadoModal'
import FaturaParserNaoHomologadoModal from 'Components/Faturas/FaturaParserNaoHomologadoModal'
import {
    formatParsersHomologadosLista,
    parsersHomologadosOrFallback,
    precisaAvisarParserNaoHomologado,
    resolveCartaoHomologacao,
} from 'helpers/parser_homologado_helpers'
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
import {
    FaturaTitularError,
    FaturaTitularPessoaOption,
    FaturaTitularRetryPayload,
    FaturaTitularSugestao,
} from 'libs/api/exceptions/FaturaTitularError'
import {
    FaturaCartaoTitularError,
    FaturaCartaoTitularRetryPayload,
} from 'libs/api/exceptions/FaturaCartaoTitularError'
import { FaturaAnexoDuplicadoError } from 'libs/api/exceptions/FaturaAnexoDuplicadoError'
import { PessoasService } from 'services/Pessoas/PessoasService'
import { toPessoaSelectOption } from 'interfaces/Pessoas/PessoasInterface'

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
    const [titularModalOpen, setTitularModalOpen] = useState(false)
    const [titularLoading, setTitularLoading] = useState(false)
    const [titularTitulares, setTitularTitulares] = useState<string[]>([])
    const [titularNomeNoCartao, setTitularNomeNoCartao] = useState<string | null>(null)
    const [titularPessoas, setTitularPessoas] = useState<FaturaTitularPessoaOption[]>([])
    const [titularSugestao, setTitularSugestao] = useState<FaturaTitularSugestao | null>(null)
    const [titularOrientacao, setTitularOrientacao] = useState<string | null>(null)
    const [titularPerfilNome, setTitularPerfilNome] = useState<string | null>(null)
    const [cartaoTitularModalOpen, setCartaoTitularModalOpen] = useState(false)
    const [cartaoTitularLoading, setCartaoTitularLoading] = useState(false)
    const [cartaoTitularError, setCartaoTitularError] = useState<FaturaCartaoTitularError | null>(null)
    const [anexoDuplicadoModalOpen, setAnexoDuplicadoModalOpen] = useState(false)
    const [anexoDuplicadoLoading, setAnexoDuplicadoLoading] = useState(false)
    const [anexoDuplicadoError, setAnexoDuplicadoError] = useState<FaturaAnexoDuplicadoError | null>(null)
    const [pessoasOptions, setPessoasOptions] = useState<SelectOptions[]>([])
    const [cartoesLookup, setCartoesLookup] = useState<CartaoLookup[]>([])
    const [parsersHomologados, setParsersHomologados] = useState<ParserHomologado[]>(PARSERS_HOMOLOGADOS_PADRAO)
    const [homologModalOpen, setHomologModalOpen] = useState(false)
    const [homologIntent, setHomologIntent] = useState<'attach' | 'submit' | 'cartao'>('attach')
    const [pendingHomologFile, setPendingHomologFile] = useState<File | null>(null)
    const homologConfirmRef = useRef<string | null>(null)
    const prevCartaoIdRef = useRef<FaturasModel['cartao_id']>(record.cartao_id)
    const pendingSelecaoRef = useRef<FaturaSelecaoRetryPayload>({})
    const pendingSenhaRef = useRef<PendingSenhaPayload>({})
    const pendingMetadadosRef = useRef<Partial<FaturaMetadadosRetryPayload>>({})
    const pendingTitularRef = useRef<Partial<FaturaTitularRetryPayload>>({})
    const pendingCartaoTitularRef = useRef<{ cadastrar_cartao?: boolean; substituir_fatura?: boolean }>({})
    const pendingAnexoDuplicadoRef = useRef<{ confirmar_anexo_duplicado?: 'substituir' | 'manter'; fatura_duplicada_id?: number }>({})
    const pessoasService = useRef(new PessoasService()).current
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
                setCartoesLookup(lookups.cartoes)
                setCartoesOptions(
                    lookups.cartoes.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `Cartão ${c.id}`,
                        cor_fundo: c.cor_fundo ?? null,
                        cor_texto: c.cor_texto ?? null,
                    }))
                )
            }
            setParsersHomologados(parsersHomologadosOrFallback(lookups?.parsers_homologados))
            const pessoas = await pessoasService.AsyncListPessoas()
            if (pessoas) {
                setPessoasOptions([
                    { value: '', label: 'Não informado' },
                    ...pessoas.map((p) => toPessoaSelectOption(p)),
                ])
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }

    const homologAttemptKey = (cartao?: FaturasModel['cartao_id'], file?: File | null) =>
        `${cartao ?? ''}|${file ? `${file.name}:${file.size}:${file.lastModified}` : ''}`

    const cartaoLookupById = (id?: FaturasModel['cartao_id']) =>
        cartoesLookup.find((c) => Number(c.id) === Number(id))

    const homologacaoDoCartao = (id?: FaturasModel['cartao_id']) => {
        const lookup = cartaoLookupById(id)
        const option = cartoesOptions.find((c) => Number(c.value) === Number(id))
        return resolveCartaoHomologacao({
            nome: lookup?.nome ?? option?.label,
            banco: lookup?.banco,
            importacao_pdf_homologada: lookup?.importacao_pdf_homologada,
            parser_homologado: lookup?.parser_homologado,
        }, parsersHomologados)
    }

    const applyArquivo = (file: File | null) => {
        setArquivoFile(file)
        setValue('arquivo_pdf', file)
        if (!file) {
            setExigeMetadadosManuais(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const precisaConfirmarParser = (id?: FaturasModel['cartao_id'], file?: File | null) => {
        const lookup = cartaoLookupById(id)
        const option = cartoesOptions.find((c) => Number(c.value) === Number(id))
        return precisaAvisarParserNaoHomologado({
            temArquivo: Boolean(file),
            cartaoId: id,
            cartaoIdentificado: Boolean(lookup || option),
            homologada: homologacaoDoCartao(id).homologada,
            jaConfirmou: homologConfirmRef.current === homologAttemptKey(id, file),
        })
    }

    const confirmarParserDestaTentativa = (id?: FaturasModel['cartao_id'], file?: File | null) => {
        homologConfirmRef.current = homologAttemptKey(id, file)
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
                list.map((b) => toBandeiraSelectOption(b.value, b.label, b))
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

    const openTitularModal = (error: FaturaTitularError) => {
        setTitularTitulares(error.titulares)
        setTitularNomeNoCartao(error.nome_no_cartao ?? null)
        setTitularPessoas(error.pessoas)
        setTitularSugestao(error.sugestao)
        setTitularOrientacao(error.orientacao ?? error.message ?? null)
        setTitularPerfilNome(error.perfil_nome ?? null)
        setTitularModalOpen(true)
    }

    const openCartaoTitularModal = async (error: FaturaCartaoTitularError) => {
        let enriched = error
        if (error.bandeiras.length === 0) {
            try {
                const lookups = await cartoesService.getLookupsCartoes()
                const bandeiras = (lookups?.bandeiras ?? []).map((b) => ({
                    value: null as number | null,
                    label: b,
                    criar: true,
                })).filter((b) => b.label)
                if (bandeiras.length > 0) {
                    enriched = new FaturaCartaoTitularError({
                        ...error.body,
                        codigo: error.codigo,
                        precisa_cartao_do_titular: true,
                        pode_cadastrar_cartao: error.pode_cadastrar_cartao,
                        permitir_substituir: error.permitir_substituir,
                        fatura_existente_id: error.fatura_existente_id,
                        cartao_existente_id: error.cartao_existente_id,
                        pessoa_existente_nome: error.pessoa_existente_nome,
                        cartao_existente_nome: error.cartao_existente_nome,
                        titulares_detectados: error.titulares_detectados,
                        orientacao: error.orientacao,
                        sugestao: error.sugestao,
                        pessoas: error.pessoas,
                        bandeiras,
                    })
                }
            } catch {
                // modal ainda funciona sem lista de bandeiras
            }
        }
        setCartaoTitularError(enriched)
        setCartaoTitularModalOpen(true)
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
        const destino = destinoFaturaDoAnexo(result)
        const newId = extractFaturaId(result) ?? destino?.id
        const form = getValues()
        const realocado = anexoFoiParaOutraFatura(
            { mes: form.mes, ano: form.ano },
            destino,
        )
        const fromDuplicado = Boolean(pendingAnexoDuplicadoRef.current.confirmar_anexo_duplicado)
        pendingAnexoDuplicadoRef.current = {}

        if (faturaPrecisaSenhaPdf(faturaData, envelope) && newId) {
            toast.info('Fatura cadastrada. Informe a senha do PDF para continuar.')
            openSenhaModalPosCadastro(newId, resolveSenhaPdfMeta(faturaData, envelope))
            return
        }

        const apiMessage = extractFaturaMessage(result)
        toast.success(
            fromDuplicado && apiMessage
                ? apiMessage
                : (Boolean(arquivoFile) || realocado) && formatCompetenciaMesAno(destino)
                    ? mensagemPdfVinculadoCompetencia(destino, 'Fatura cadastrada com sucesso')
                    : (apiMessage || 'Fatura cadastrada com sucesso')
        )
        const nomeResp = nomeResponsavelPadraoNaoEu(faturaData)
        if (nomeResp) {
            toast.info(`Responsável "${nomeResp}" criado e aplicado nesta fatura.`)
        }
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
        if (error instanceof FaturaTitularError) {
            openTitularModal(error)
            return true
        }
        if (error instanceof FaturaCartaoTitularError) {
            openCartaoTitularModal(error)
            return true
        }
        if (error instanceof FaturaAnexoDuplicadoError) {
            setAnexoDuplicadoError(error)
            setAnexoDuplicadoModalOpen(true)
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

    const assertPeriodoLivre = async (params: {
        cartao_id?: number | string | null
        cartao_nome?: string | null
        cadastrar_cartao?: boolean
        substituir_fatura?: boolean
        mes?: number | string | null
        ano?: number | string | null
    }) => {
        if (params.cadastrar_cartao || params.cartao_nome || params.substituir_fatura) return
        if (params.cartao_id == null || params.cartao_id === '') return
        if (params.mes == null || params.mes === '' || params.ano == null || params.ano === '') return

        const existing = await faturasService.findFaturaNoPeriodo({
            cartao_id: params.cartao_id,
            mes: params.mes,
            ano: params.ano,
        })
        if (!existing) return

        const pessoaIncoming = pendingTitularRef.current.pessoa_id ?? getValues('pessoa_id')
        const outraPessoa =
            existing.pessoa_id != null
            && pessoaIncoming != null
            && pessoaIncoming !== ''
            && Number(existing.pessoa_id) !== Number(pessoaIncoming)

        throw new FaturaCartaoTitularError({
            codigo: 'precisa_cartao_do_titular',
            precisa_cartao_do_titular: true,
            pode_cadastrar_cartao: true,
            permitir_substituir: !outraPessoa,
            fatura_existente_id: existing.id,
            cartao_existente_id: params.cartao_id,
            pessoa_existente_nome: existing.pessoa_nome,
            cartao_existente_nome: existing.cartao_nome,
            titulares_detectados: pendingTitularRef.current.pessoa_nome
                ? [[pendingTitularRef.current.pessoa_nome, pendingTitularRef.current.pessoa_sobrenome].filter(Boolean).join(' ')]
                : [],
            orientacao: existing.pessoa_nome
                ? `Já existe fatura deste mês neste cartão (${existing.pessoa_nome}). Faturas de pessoas diferentes precisam de cartões separados — cadastre o cartão desta pessoa aqui para as duas coexistirem.`
                : 'Já existe fatura deste mês neste cartão. Se o PDF for de outra pessoa, cadastre o cartão dela aqui. Não vamos descartar a fatura que já está lançada sem você confirmar.',
            sugestao: {
                cartao_id: null,
                cartao_nome_sugerido: existing.cartao_nome,
                mes: Number(params.mes),
                ano: Number(params.ano),
                pessoa_id: pessoaIncoming ? Number(pessoaIncoming) : null,
            },
            bandeiras: metadadosBandeiras,
        })
    }

    type FaturaCreateExtra = FaturaSelecaoRetryPayload & Partial<FaturaMetadadosRetryPayload> & Partial<FaturaTitularRetryPayload> & {
        cadastrar_cartao?: boolean
        cartao_nome?: string | null
        substituir_fatura?: boolean
        pessoa_id?: number | string | null
        confirmar_anexo_duplicado?: 'substituir' | 'manter'
        fatura_duplicada_id?: number | string
        omitir_arquivo?: boolean
    }

    const submitCreate = async (extra?: FaturaCreateExtra) => {
        const data = getValues()
        const cartaoId =
            extra?.cartao_id
            ?? pendingMetadadosRef.current.cartao_id
            ?? data.cartao_id
        const cartaoNome =
            extra?.cartao_nome
            ?? pendingMetadadosRef.current.cartao_nome
            ?? undefined
        const cadastrarCartao = Boolean(
            extra?.cadastrar_cartao
            ?? pendingMetadadosRef.current.cadastrar_cartao
            ?? pendingCartaoTitularRef.current.cadastrar_cartao
            ?? cartaoNome
        )
        const substituirFatura = Boolean(
            extra?.substituir_fatura
            ?? pendingCartaoTitularRef.current.substituir_fatura
        )
        const confirmarAnexoDuplicado =
            extra?.confirmar_anexo_duplicado
            ?? pendingAnexoDuplicadoRef.current.confirmar_anexo_duplicado

        if (!confirmarAnexoDuplicado) {
            await assertPeriodoLivre({
                cartao_id: cartaoNome || cadastrarCartao ? null : cartaoId,
                cartao_nome: cartaoNome,
                cadastrar_cartao: cadastrarCartao,
                substituir_fatura: substituirFatura,
                mes: extra?.mes ?? pendingMetadadosRef.current.mes ?? data.mes,
                ano: extra?.ano ?? pendingMetadadosRef.current.ano ?? data.ano,
            })
        }

        const payload: FaturasModel = {
            ...data,
            // Novo cartão: envia nome sem cartao_id para o back criar no mesmo POST
            cartao_id: cartaoNome || cadastrarCartao ? null : (cartaoId ?? null),
            cartao_nome: cartaoNome || undefined,
            cadastrar_cartao: cadastrarCartao || undefined,
            substituir_fatura: substituirFatura || undefined,
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
            pessoa_id: (() => {
                const raw = extra?.pessoa_id ?? pendingTitularRef.current.pessoa_id ?? data.pessoa_id
                return raw === '' ? null : raw
            })(),
            cadastrar_pessoa: extra?.cadastrar_pessoa ?? pendingTitularRef.current.cadastrar_pessoa,
            pessoa_nome: extra?.pessoa_nome ?? pendingTitularRef.current.pessoa_nome,
            pessoa_sobrenome: extra?.pessoa_sobrenome ?? pendingTitularRef.current.pessoa_sobrenome,
            confirmar_titular: extra?.confirmar_titular ?? pendingTitularRef.current.confirmar_titular,
            confirmar_anexo_duplicado:
                extra?.confirmar_anexo_duplicado
                ?? pendingAnexoDuplicadoRef.current.confirmar_anexo_duplicado,
            fatura_duplicada_id:
                extra?.fatura_duplicada_id
                ?? pendingAnexoDuplicadoRef.current.fatura_duplicada_id,
            arquivo_pdf: extra?.omitir_arquivo ? null : arquivoFile,
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

            if (precisaConfirmarParser(data.cartao_id, arquivoFile)) {
                setPendingHomologFile(arquivoFile)
                setHomologIntent('submit')
                setHomologModalOpen(true)
                return
            }

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
        pendingMetadadosRef.current = {
            ...selection,
            cadastrar_cartao: Boolean(selection.cartao_nome) || selection.cadastrar_cartao,
        }
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
            const result = await submitCreate({
                ...selection,
                cadastrar_cartao: Boolean(selection.cartao_nome) || selection.cadastrar_cartao,
            })
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

    const handleTitularConfirm = async (selection: FaturaTitularRetryPayload) => {
        pendingTitularRef.current = selection
        if (selection.pessoa_id != null) {
            setValue('pessoa_id', selection.pessoa_id)
        }
        setTitularLoading(true)
        try {
            const result = await submitCreate(selection)
            setTitularModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setTitularModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao salvar fatura')
        } finally {
            setTitularLoading(false)
        }
    }

    const handleCartaoTitularConfirm = async (selection: FaturaCartaoTitularRetryPayload) => {
        pendingCartaoTitularRef.current = { cadastrar_cartao: true }
        pendingMetadadosRef.current = {
            ...pendingMetadadosRef.current,
            cartao_id: null,
            cartao_nome: selection.cartao_nome,
            cadastrar_cartao: true,
            mes: selection.mes,
            ano: selection.ano,
            bandeira: selection.bandeira,
            cartao_bandeira_id: selection.cartao_bandeira_id,
        }
        setValue('cartao_id', null)
        setValue('cartao_nome', selection.cartao_nome)
        setValue('mes', selection.mes)
        setValue('ano', selection.ano)
        if (selection.pessoa_id != null) {
            setValue('pessoa_id', selection.pessoa_id)
        }
        setCartaoTitularLoading(true)
        try {
            const result = await submitCreate(selection)
            setCartaoTitularModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setCartaoTitularModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao salvar fatura')
        } finally {
            setCartaoTitularLoading(false)
        }
    }

    const handleCartaoTitularSubstituir = async () => {
        pendingCartaoTitularRef.current = { substituir_fatura: true }
        setCartaoTitularLoading(true)
        try {
            const result = await submitCreate({ substituir_fatura: true })
            setCartaoTitularModalOpen(false)
            toast.info('A fatura deste mês neste cartão foi substituída pelo novo arquivo.')
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setCartaoTitularModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao salvar fatura')
        } finally {
            setCartaoTitularLoading(false)
        }
    }

    const handleAnexoDuplicadoSubstituir = async () => {
        const existingId = anexoDuplicadoError?.fatura_existente?.id
        if (existingId == null) {
            toast.error('Não foi possível identificar a fatura que já tem este arquivo.')
            return
        }
        const retry = anexoDuplicadoRetryFields('substituir', existingId)
        pendingAnexoDuplicadoRef.current = retry
        setAnexoDuplicadoLoading(true)
        try {
            const result = await submitCreate(retry)
            setAnexoDuplicadoModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setAnexoDuplicadoModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao substituir o anexo')
        } finally {
            setAnexoDuplicadoLoading(false)
        }
    }

    const handleAnexoDuplicadoManter = async () => {
        const existingId = anexoDuplicadoError?.fatura_existente?.id
        if (existingId == null) {
            toast.error('Não foi possível identificar a fatura que já tem este arquivo.')
            return
        }
        const retry = anexoDuplicadoRetryFields('manter', existingId)
        pendingAnexoDuplicadoRef.current = retry
        setAnexoDuplicadoLoading(true)
        try {
            const result = await submitCreate({ ...retry, omitir_arquivo: true })
            setAnexoDuplicadoModalOpen(false)
            handleCreateSuccess(result)
        } catch (error) {
            if (handleCreateError(error)) {
                setAnexoDuplicadoModalOpen(false)
                return
            }
            toast.error((error as Error)?.message || 'Erro ao manter o anexo')
        } finally {
            setAnexoDuplicadoLoading(false)
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
            applyArquivo(null)
            return
        }
        if (!file) {
            homologConfirmRef.current = null
            applyArquivo(null)
            return
        }
        const selectedCartao = getValues('cartao_id')
        if (precisaConfirmarParser(selectedCartao, file)) {
            e.target.value = ''
            setPendingHomologFile(file)
            setHomologIntent('attach')
            setHomologModalOpen(true)
            return
        }
        applyArquivo(file)
    }

    const closeHomologModal = () => {
        setHomologModalOpen(false)
        setPendingHomologFile(null)
        if (homologIntent === 'attach' && fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleHomologAnexarMesmoAssim = async () => {
        const file = pendingHomologFile ?? arquivoFile
        const selectedCartao = getValues('cartao_id')
        confirmarParserDestaTentativa(selectedCartao, file)
        setHomologModalOpen(false)

        if (homologIntent === 'attach' && file) {
            applyArquivo(file)
            setPendingHomologFile(null)
            return
        }

        setPendingHomologFile(null)
        if (homologIntent === 'submit') {
            try {
                const data = getValues()
                if (!validateCreateSubmit(data)) return
                const result = await submitCreate()
                handleCreateSuccess(result)
            } catch (error: any) {
                if (handleCreateError(error)) return
                toast.error(error?.message || 'Erro ao salvar fatura')
            }
        }
    }

    const handleHomologCadastrarSemAnexo = async () => {
        applyArquivo(null)
        setPendingHomologFile(null)
        setHomologModalOpen(false)
        homologConfirmRef.current = null

        if (homologIntent === 'submit') {
            try {
                const data = getValues()
                if (!validateCreateSubmit(data)) return
                const result = await submitCreate()
                handleCreateSuccess(result)
            } catch (error: any) {
                if (handleCreateError(error)) return
                toast.error(error?.message || 'Erro ao salvar fatura')
            }
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

        const prev = prevCartaoIdRef.current
        prevCartaoIdRef.current = cartaoId
        if (isEdit || prev === cartaoId) return
        homologConfirmRef.current = null
        if (!arquivoFile || cartaoId == null || cartaoId === '') return
        if (!precisaConfirmarParser(cartaoId, arquivoFile)) return
        setPendingHomologFile(arquivoFile)
        setHomologIntent('cartao')
        setHomologModalOpen(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartaoId, isEdit])

    const optAnos = AnosSelect()
    const requiredManual = camposManualObrigatorios ? required : undefined

    return (
        <React.Fragment>
            <FaturaParserNaoHomologadoModal
                isOpen={homologModalOpen}
                cartaoNome={cartaoLookupById(cartaoId)?.nome ?? cartoesOptions.find((c) => Number(c.value) === Number(cartaoId))?.label}
                parsers={parsersHomologados}
                onAnexarMesmoAssim={handleHomologAnexarMesmoAssim}
                onCadastrarSemAnexo={handleHomologCadastrarSemAnexo}
                onClose={closeHomologModal}
            />
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
            <FaturaTitularModal
                isOpen={titularModalOpen}
                titulares={titularTitulares}
                nomeNoCartao={titularNomeNoCartao}
                pessoas={titularPessoas}
                sugestao={titularSugestao}
                perfilNome={titularPerfilNome}
                orientacao={titularOrientacao}
                loading={titularLoading}
                onClose={() => setTitularModalOpen(false)}
                onConfirm={handleTitularConfirm}
            />
            <FaturaCartaoTitularModal
                isOpen={cartaoTitularModalOpen}
                error={cartaoTitularError}
                loading={cartaoTitularLoading}
                onClose={() => setCartaoTitularModalOpen(false)}
                onCadastrarCartao={handleCartaoTitularConfirm}
                onSubstituir={cartaoTitularError?.permitir_substituir ? handleCartaoTitularSubstituir : undefined}
            />
            <FaturaAnexoDuplicadoModal
                isOpen={anexoDuplicadoModalOpen}
                error={anexoDuplicadoError}
                loading={anexoDuplicadoLoading}
                onClose={() => setAnexoDuplicadoModalOpen(false)}
                onSubstituir={handleAnexoDuplicadoSubstituir}
                onManter={handleAnexoDuplicadoManter}
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
                                                        <small className="text-muted d-block mt-1">
                                                            Leitura automática homologada: {formatParsersHomologadosLista(parsersHomologados)}.
                                                            Outros cartões podem ser anexados, mas o valor lido pode não ser o correto.
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
                                            {!isEdit && pessoasOptions.length > 1 && (
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="pessoa_id" className="form-label">
                                                            Titular
                                                            <span className="text-muted fw-normal"> (opcional)</span>
                                                        </Label>
                                                        <SelectListControlled<FaturasModel>
                                                            options={pessoasOptions}
                                                            field="pessoa_id"
                                                            control={control}
                                                        />
                                                        <small className="text-muted">
                                                            Pessoa dona desta fatura. Se o PDF for de outra pessoa, o sistema pede confirmação.
                                                        </small>
                                                    </div>
                                                </Col>
                                            )}
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
