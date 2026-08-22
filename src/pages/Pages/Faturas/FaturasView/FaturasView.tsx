import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactApexChart from 'react-apexcharts'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import {
    Badge, Breadcrumb, BreadcrumbItem, Button, Card, CardBody, Col, Container,
    Input, Label, Row, Spinner, Table
} from 'reactstrap'
import { toast } from 'react-toastify'
import {
    formatCurrency, formatDateBr, faturaStatusColor,
    faturaQuitacaoLabel, faturaQuitacaoColor,
    tipoTransacaoColor, tipoTransacaoLabel,
    origemCompraLabel,
    isTransacaoOperacional,
    FATURA_FILE_ACCEPT, isValidFaturaFile, resolveFaturaAnexo, downloadFaturaAnexo,
    getCategoriaFieldStyle, VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import { CartaoChip, BandeiraChip, resolveCartaoCores } from 'helpers/cartao_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    extractFaturaPayload,
    faturaPrecisaSenhaPdf,
    FaturaGrupoPorCartao,
    FaturasView,
    resolveSenhaPdfMeta,
    SenhaPdfMeta,
} from 'interfaces/Faturas/FaturasInterface'
import { CategoriaLookup, ResponsavelLookup, TransacoesList } from 'interfaces/Transacoes/TransacoesInterface'
import { NumeroListItem } from 'interfaces/Cartoes/CartoesInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import ResponsavelModal from 'pages/Pages/Transacoes/ResponsavelModal/ResponsavelModal'
import CategoriaRapidoModal, { CategoriaRapidoConfirm } from 'pages/Pages/Transacoes/CategoriaRapidoModal/CategoriaRapidoModal'
import SubcategoriaRapidoModal, { SubcategoriaRapidoConfirm } from 'pages/Pages/Transacoes/SubcategoriaRapidoModal/SubcategoriaRapidoModal'
import FaturaSenhaPdfModal from 'Components/Faturas/FaturaSenhaPdfModal'
import FaturaSelecaoModal, { FaturaSelecaoStep } from 'Components/Faturas/FaturaSelecaoModal'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'
import {
    FaturaSelecaoBandeiraOption,
    FaturaSelecaoError,
    FaturaSelecaoNumeroOption,
    FaturaSelecaoRetryPayload,
} from 'libs/api/exceptions/FaturaSelecaoError'
import { getApiBaseUrl } from 'libs/api/ApiConfig'

const formatNumeroOptionLabel = (n: NumeroListItem): string => {
    if (n.label) return n.label
    const digitos = String(n.ultimos_digitos ?? '').replace(/\D/g, '').slice(-4)
    const base = digitos ? `•••• ${digitos}` : `#${n.value}`
    const nome = n.nome_no_cartao?.trim() || null
    if (nome) return `${base} · ${nome}`
    return n.apelido ? `${base} · ${n.apelido}` : base
}

const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    processada: 'Processada',
    erro: 'Erro',
}

const formatParcelas = (atual?: number, total?: number) => {
    if (!total || total <= 1) return 'À vista'
    return `${atual ?? 1}/${total}`
}

const compraDestinoDaFatura = (
    tx: TransacoesList,
    mes?: number | null,
    ano?: number | null
): string | null => {
    if (!tx.id || isTransacaoOperacional(tx)) return null
    const params = new URLSearchParams()
    if (mes) params.set('mes', String(mes))
    if (ano) params.set('ano', String(ano))
    const qs = params.toString()
    return qs ? `/compras/${tx.id}?${qs}` : `/compras/${tx.id}`
}

const OPERACIONAIS_KEY = '__operacionais__'
const SEM_CARTAO_KEY = '__sem_cartao__'

const getTxUltimosDigitos = (tx: TransacoesList): string | null => {
    const digitos = tx.ultimos_digitos
        ?? tx.cartao_numero?.ultimos_digitos
        ?? null
    if (!digitos) return null
    return String(digitos).replace(/\D/g, '').slice(-4) || null
}

const getTxNumeroKey = (tx: TransacoesList): string => {
    if (isTransacaoOperacional(tx)) return OPERACIONAIS_KEY
    if (tx.cartao_numero_id != null) return `numero_${tx.cartao_numero_id}`
    if (tx.cartao_numero?.id != null) return `numero_${tx.cartao_numero.id}`
    const digitos = getTxUltimosDigitos(tx)
    return digitos ? `digitos_${digitos}` : SEM_CARTAO_KEY
}

const getTxNomeNoCartao = (tx: TransacoesList): string | null => {
    const nome = tx.cartao_numero_nome_no_cartao
        ?? tx.cartao_numero?.nome_no_cartao
        ?? null
    return nome?.trim() || null
}

const getTxNumeroLabel = (tx: TransacoesList): string => {
    if (isTransacaoOperacional(tx)) return 'Operacionais'
    const digitos = getTxUltimosDigitos(tx)
    if (!digitos) return 'Sem cartão identificado'
    const nomeNoCartao = getTxNomeNoCartao(tx)
    if (nomeNoCartao) return `•••• ${digitos} · ${nomeNoCartao}`
    const tipo = tx.cartao_numero?.tipo ?? tx.cartao_numero_tipo
    const apelido = tx.cartao_numero?.apelido ?? tx.cartao_numero_apelido
    const extras = [apelido || tipo].filter(Boolean).join(' · ')
    return extras ? `•••• ${digitos} · ${extras}` : `•••• ${digitos}`
}

const formatGrupoLabel = (meta: FaturaGrupoPorCartao): string => {
    if (meta.label) return meta.label
    if (!meta.ultimos_digitos) return 'Sem cartão identificado'
    const digitos = String(meta.ultimos_digitos).replace(/\D/g, '').slice(-4)
    if (meta.nome_no_cartao?.trim()) return `•••• ${digitos} · ${meta.nome_no_cartao.trim()}`
    return `•••• ${digitos}`
}

type TransacaoGrupo = {
    key: string
    cartaoNumeroId: number | null
    digitos: string | null
    label: string
    items: TransacoesList[]
    subtotal: number
}

const grupoSortOrder = (g: TransacaoGrupo): number => {
    if (g.key === OPERACIONAIS_KEY) return 2
    if (g.key === SEM_CARTAO_KEY) return 1
    return 0
}

const groupTransacoesPorFinal = (
    rows: TransacoesList[],
    metaGrupos?: FaturaGrupoPorCartao[] | null
): TransacaoGrupo[] => {
    const metaByKey = new Map<string, FaturaGrupoPorCartao>()
    ;(metaGrupos ?? []).forEach((g) => {
        const key = g.cartao_numero_id != null
            ? `numero_${g.cartao_numero_id}`
            : (g.ultimos_digitos
                ? `digitos_${String(g.ultimos_digitos).replace(/\D/g, '').slice(-4)}`
                : SEM_CARTAO_KEY)
        metaByKey.set(key, g)
    })

    const map = new Map<string, TransacaoGrupo>()

    rows.forEach((tx) => {
        const key = getTxNumeroKey(tx)
        const isOperacional = key === OPERACIONAIS_KEY
        const digitos = isOperacional ? null : getTxUltimosDigitos(tx)
        const cartaoNumeroId = isOperacional
            ? null
            : (tx.cartao_numero_id ?? tx.cartao_numero?.id ?? null)
        const meta = isOperacional ? undefined : metaByKey.get(key)
        const current = map.get(key)
        if (current) {
            current.items.push(tx)
            current.subtotal += Number(tx.valor ?? 0)
            return
        }
        map.set(key, {
            key,
            cartaoNumeroId,
            digitos,
            label: isOperacional
                ? 'Operacionais'
                : ((meta ? formatGrupoLabel(meta) : null) || getTxNumeroLabel(tx)),
            items: [tx],
            subtotal: Number(tx.valor ?? 0),
        })
    })

    // Inclui grupos da API sem linhas (ex.: após filtro local)
    metaByKey.forEach((meta, key) => {
        if (map.has(key) || key === OPERACIONAIS_KEY) return
        map.set(key, {
            key,
            cartaoNumeroId: meta.cartao_numero_id ?? null,
            digitos: meta.ultimos_digitos
                ? String(meta.ultimos_digitos).replace(/\D/g, '').slice(-4) || null
                : null,
            label: formatGrupoLabel(meta),
            items: [],
            subtotal: Number(meta.valor_total ?? 0),
        })
    })

    return Array.from(map.values())
        .filter((g) => g.items.length > 0)
        .sort((a, b) => {
            const orderDiff = grupoSortOrder(a) - grupoSortOrder(b)
            if (orderDiff !== 0) return orderDiff
            if (a.digitos == null) return 1
            if (b.digitos == null) return -1
            return a.digitos.localeCompare(b.digitos, 'pt-BR')
        })
}

const FaturasViewPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { voltarParaRotaAnterior } = useNavegacao()
    const faturasService = useRef(new FaturasService()).current
    const transacoesService = useRef(new TransacoesService()).current
    const subcategoriasService = useRef(new SubcategoriasService()).current
    const cartoesService = useRef(new CartoesService()).current
    const loadedSubcategoriasRef = useRef<Set<number>>(new Set())
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fatura, setFatura] = useState<FaturasView | null>(null)
    const [transacoes, setTransacoes] = useState<TransacoesList[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [showPdfPreview, setShowPdfPreview] = useState(false)
    const [loadingPdf, setLoadingPdf] = useState(false)
    const [processarAuto, setProcessarAuto] = useState(true)
    const [senhaModalOpen, setSenhaModalOpen] = useState(false)
    const [senhaModalMeta, setSenhaModalMeta] = useState<SenhaPdfMeta | null>(null)
    const senhaModalAutoOpenedRef = useRef<string | null>(null)
    const [selecaoModalOpen, setSelecaoModalOpen] = useState(false)
    const [selecaoStep, setSelecaoStep] = useState<FaturaSelecaoStep>('bandeira')
    const [selecaoBandeiras, setSelecaoBandeiras] = useState<FaturaSelecaoBandeiraOption[]>([])
    const [selecaoNumeros, setSelecaoNumeros] = useState<FaturaSelecaoNumeroOption[]>([])
    const [selecaoCartaoBandeiraId, setSelecaoCartaoBandeiraId] = useState<number | null>(null)
    const [selecaoBandeiraNome, setSelecaoBandeiraNome] = useState<string | null>(null)
    const [selecaoLoading, setSelecaoLoading] = useState(false)
    const pendingSelecaoRef = useRef<FaturaSelecaoRetryPayload>({})
    const pendingUploadFileRef = useRef<File | null>(null)
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [subcategoriasByCategoria, setSubcategoriasByCategoria] = useState<Record<number, SelectOptions[]>>({})
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([])
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [origensCompraOptions, setOrigensCompraOptions] = useState<SelectOptions[]>(
        () => Object.entries(origemCompraLabel).map(([value, label]) => ({ value, label }))
    )
    const [numerosOptions, setNumerosOptions] = useState<SelectOptions[]>([])
    const [numerosLoading, setNumerosLoading] = useState(false)
    const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
    const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
    const [rowForResponsavel, setRowForResponsavel] = useState<TransacoesList | null>(null)
    const [categoriaRapidoOpen, setCategoriaRapidoOpen] = useState(false)
    const [subcategoriaRapidoOpen, setSubcategoriaRapidoOpen] = useState(false)
    const [rowForCategoriaRapido, setRowForCategoriaRapido] = useState<TransacoesList | null>(null)
    const [rowForSubcategoriaRapido, setRowForSubcategoriaRapido] = useState<TransacoesList | null>(null)
    const [savingIds, setSavingIds] = useState<Record<number, boolean>>({})
    const [valorDrafts, setValorDrafts] = useState<Record<number, string>>({})
    const [observacaoDrafts, setObservacaoDrafts] = useState<Record<number, string>>({})
    /** Finais salvos na sessão “Sem cartão identificado” — não redistribui até atualizar a tela */
    const [finalSelecionados, setFinalSelecionados] = useState<Record<number, number | null>>({})
    const [exporting, setExporting] = useState(false)
    /** null = todos; '__sem_cartao__' ou chave do grupo */
    const [filtroFinalKey, setFiltroFinalKey] = useState<string | null>(null)
    /** Navegação anterior/próxima (fallback se a API não enviar os ids) */
    const [navVizinhos, setNavVizinhos] = useState<{
        anteriorId: number | null
        proximaId: number | null
        anteriorCompetencia: string | null
        proximaCompetencia: string | null
    }>({ anteriorId: null, proximaId: null, anteriorCompetencia: null, proximaCompetencia: null })

    const isMeuResponsavel = (responsavelId?: number | null) => {
        if (responsavelId == null) return true
        if (defaultResponsavelId != null) return Number(responsavelId) === Number(defaultResponsavelId)
        const nome = responsaveisLookup.find((r) => Number(r.id) === Number(responsavelId))?.nome
            ?? responsaveisOptions.find((o) => Number(o.value) === Number(responsavelId))?.label
        return (nome ?? '').trim().toLowerCase() === 'eu'
    }

    const formatPeriodo = (mes?: number, ano?: number) => {
        if (!mes || !ano) return '-'
        return `${String(mes).padStart(2, '0')}/${ano}`
    }

    const clearPdfBlobUrl = useCallback(() => {
        setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
        })
    }, [])

    const loadPdf = useCallback(async (faturaId: string) => {
        setLoadingPdf(true)
        try {
            const raw = sessionStorage.getItem('authUser')
            const token = raw ? JSON.parse(raw).token : null
            const base = getApiBaseUrl()
            const res = await fetch(`${base}faturas/pdf/${faturaId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) {
                toast.error('Erro ao carregar PDF')
                return false
            }

            const contentType = (res.headers.get('content-type') || '').toLowerCase()
            if (!contentType.includes('pdf')) {
                clearPdfBlobUrl()
                toast.warning('Pré-visualização disponível apenas para PDF')
                return false
            }

            const blob = await res.blob()
            setPdfBlobUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(blob)
            })
            return true
        } catch (error) {
            console.error('Erro ao carregar PDF:', error)
            toast.error('Erro ao carregar PDF')
            return false
        } finally {
            setLoadingPdf(false)
        }
    }, [clearPdfBlobUrl])

    const loadSubcategoriasForCategoria = useCallback(async (categoriaId: number) => {
        if (!categoriaId || loadedSubcategoriasRef.current.has(categoriaId)) return
        loadedSubcategoriasRef.current.add(categoriaId)
        try {
            const list = await subcategoriasService.AsyncListSubcategorias({ categoria_id: categoriaId })
            const options = (list ?? []).map((s) => ({
                value: s.id!,
                label: s.nome ?? `#${s.id}`,
            }))
            setSubcategoriasByCategoria((prev) => ({ ...prev, [categoriaId]: options }))
        } catch (error) {
            console.error('Erro ao carregar subcategorias:', error)
            loadedSubcategoriasRef.current.delete(categoriaId)
            setSubcategoriasByCategoria((prev) => ({ ...prev, [categoriaId]: [] }))
        }
    }, [subcategoriasService])

    const loadTransacoes = useCallback(async (faturaId: string) => {
        try {
            const response = await transacoesService.listTransacoesPaginate({
                fatura_id: faturaId,
                perPage: 200,
                page: 1,
            } as any)
            const rows = response?.data ?? []
            setTransacoes(rows)
            const drafts: Record<number, string> = {}
            const obsDrafts: Record<number, string> = {}
            const categoriaIds = new Set<number>()
            rows.forEach((tx) => {
                if (tx.id != null && tx.valor != null) {
                    drafts[tx.id] = Number(tx.valor).toFixed(2)
                }
                if (tx.id != null) {
                    obsDrafts[tx.id] = tx.observacoes ?? ''
                }
                if (tx.categoria_id != null) {
                    categoriaIds.add(tx.categoria_id)
                }
            })
            setValorDrafts(drafts)
            setObservacaoDrafts(obsDrafts)
            setFinalSelecionados({})
            await Promise.all(Array.from(categoriaIds).map((catId) => loadSubcategoriasForCategoria(catId)))
        } catch (error) {
            console.error('Erro ao carregar transações:', error)
        }
    }, [transacoesService, loadSubcategoriasForCategoria])

    const loadLookups = useCallback(async () => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (lookups?.categorias) {
                setCategoriasLookup(lookups.categorias)
                setCategoriasOptions(
                    lookups.categorias.map((c) => ({
                        value: c.id!,
                        label: c.nome ?? `#${c.id}`,
                    }))
                )
            }
            if (lookups?.responsaveis) {
                setResponsaveisLookup(lookups.responsaveis)
                setResponsaveisOptions(
                    lookups.responsaveis.map((r) => ({
                        value: r.id!,
                        label: r.nome ?? `#${r.id}`,
                    }))
                )
            }
            if (lookups?.default_responsavel_id != null) {
                setDefaultResponsavelId(lookups.default_responsavel_id)
            }
            if (lookups?.origens_compra?.length) {
                setOrigensCompraOptions(
                    lookups.origens_compra.map((o) => ({
                        value: o.value ?? '',
                        label: o.label ?? o.value ?? '',
                    }))
                )
            }
        } catch (error) {
            console.error('Erro ao carregar lookups:', error)
        }
    }, [transacoesService])

    const loadNumeros = useCallback(async (faturaId: string) => {
        setNumerosLoading(true)
        try {
            const list = (await cartoesService.AsyncListNumeros({ fatura_id: faturaId })) ?? []
            setNumerosOptions(
                list.map((n) => ({
                    value: n.value,
                    label: formatNumeroOptionLabel(n),
                }))
            )
        } catch (error) {
            console.error('Erro ao carregar finais do cartão:', error)
            setNumerosOptions([])
        } finally {
            setNumerosLoading(false)
        }
    }, [cartoesService])

    const formatCompetenciaLabel = (mes?: number, ano?: number, competencia?: string | null) => {
        if (competencia) return competencia
        if (!mes || !ano) return null
        return `${String(mes).padStart(2, '0')}/${ano}`
    }

    const resolveNavVizinhos = useCallback(async (view: FaturasView) => {
        if (view.fatura_anterior_id != null || view.fatura_proxima_id != null) {
            setNavVizinhos({
                anteriorId: view.fatura_anterior_id ?? null,
                proximaId: view.fatura_proxima_id ?? null,
                anteriorCompetencia: view.fatura_anterior_competencia ?? null,
                proximaCompetencia: view.fatura_proxima_competencia ?? null,
            })
            return
        }

        const bandeiraId = view.cartao_bandeira_id
        if (!bandeiraId || !view.id) {
            setNavVizinhos({
                anteriorId: null,
                proximaId: null,
                anteriorCompetencia: null,
                proximaCompetencia: null,
            })
            return
        }

        try {
            const list = await faturasService.listFaturasPaginate({
                cartao_bandeira_id: bandeiraId,
                perPage: 100,
                page: 1,
            })
            const faturas = (list?.data ?? [])
                .flatMap((g) => g.faturas ?? [])
                .filter((f) => f.cartao_bandeira_id == null || Number(f.cartao_bandeira_id) === Number(bandeiraId))
                .sort((a, b) => {
                    const anoDiff = Number(a.ano ?? 0) - Number(b.ano ?? 0)
                    if (anoDiff !== 0) return anoDiff
                    return Number(a.mes ?? 0) - Number(b.mes ?? 0)
                })

            const idx = faturas.findIndex((f) => Number(f.id) === Number(view.id))
            if (idx < 0) {
                setNavVizinhos({
                    anteriorId: null,
                    proximaId: null,
                    anteriorCompetencia: null,
                    proximaCompetencia: null,
                })
                return
            }

            const anterior = idx > 0 ? faturas[idx - 1] : null
            const proxima = idx < faturas.length - 1 ? faturas[idx + 1] : null
            setNavVizinhos({
                anteriorId: anterior?.id ?? null,
                proximaId: proxima?.id ?? null,
                anteriorCompetencia: formatCompetenciaLabel(anterior?.mes, anterior?.ano, anterior?.competencia),
                proximaCompetencia: formatCompetenciaLabel(proxima?.mes, proxima?.ano, proxima?.competencia),
            })
        } catch (error) {
            console.error('Erro ao resolver navegação de faturas:', error)
            setNavVizinhos({
                anteriorId: null,
                proximaId: null,
                anteriorCompetencia: null,
                proximaCompetencia: null,
            })
        }
    }, [faturasService])

    const openSenhaModal = useCallback((meta?: SenhaPdfMeta | null) => {
        setSenhaModalMeta(meta ?? null)
        setSenhaModalOpen(true)
    }, [])

    const loadFatura = useCallback(async (opts?: { silent?: boolean; openSenhaIfNeeded?: boolean }) => {
        if (!id) return
        if (!opts?.silent) setLoading(true)
        try {
            const view = await faturasService.getViewFaturas({ id })
            if (view) {
                setFatura(view)
                setShowPdfPreview(false)
                clearPdfBlobUrl()
                await Promise.all([
                    loadTransacoes(id),
                    loadNumeros(id),
                    resolveNavVizinhos(view),
                ])
                if (opts?.openSenhaIfNeeded !== false && faturaPrecisaSenhaPdf(view)) {
                    if (senhaModalAutoOpenedRef.current !== String(id)) {
                        senhaModalAutoOpenedRef.current = String(id)
                        openSenhaModal(resolveSenhaPdfMeta(view))
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar fatura:', error)
            if (!opts?.silent) toast.error('Erro ao carregar fatura')
        } finally {
            if (!opts?.silent) setLoading(false)
        }
    }, [id, faturasService, clearPdfBlobUrl, loadTransacoes, loadNumeros, resolveNavVizinhos, openSenhaModal])

    const handleReprocessar = async () => {
        if (!id) return
        if (fatura && faturaPrecisaSenhaPdf(fatura)) {
            openSenhaModal(resolveSenhaPdfMeta(fatura))
            return
        }
        try {
            await faturasService.processarPdf(Number(id))
            toast.success('Reprocessamento concluído')
            // Refetch completo para atualizar quitação (inclui competência anterior na listagem ao voltar)
            await loadFatura({ silent: true, openSenhaIfNeeded: false })
        } catch (error) {
            if (error instanceof PdfSenhaError) {
                openSenhaModal(error.senha_pdf ?? null)
                return
            }
            toast.error('Erro ao reprocessar fatura')
        }
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

    const handleUploadSuccess = async (result: unknown) => {
        const faturaData = extractFaturaPayload(result)
        const envelope = result as Record<string, any> | null
        if (fileInputRef.current) fileInputRef.current.value = ''
        pendingUploadFileRef.current = null

        if (faturaPrecisaSenhaPdf(faturaData, envelope)) {
            toast.info('Arquivo enviado. Informe a senha do PDF para continuar.')
            await loadFatura({ silent: true, openSenhaIfNeeded: false })
            openSenhaModal(resolveSenhaPdfMeta(faturaData, envelope))
            return
        }

        toast.success('Arquivo enviado com sucesso')
        await loadFatura({ silent: true, openSenhaIfNeeded: false })
    }

    const handleUploadPdf = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file || !id) {
            toast.warning('Selecione um arquivo PDF ou CSV')
            return
        }
        if (!isValidFaturaFile(file)) {
            toast.error('Formato inválido. Envie PDF ou CSV.')
            return
        }
        pendingUploadFileRef.current = file
        try {
            const result = await faturasService.uploadPdf({
                id: Number(id),
                arquivo_pdf: file,
                processar_automatico: processarAuto,
            })
            await handleUploadSuccess(result)
        } catch (error) {
            if (error instanceof FaturaSelecaoError) {
                openSelecaoModal(error)
                return
            }
            if (error instanceof PdfSenhaError) {
                await loadFatura({ silent: true, openSenhaIfNeeded: false })
                openSenhaModal(error.senha_pdf ?? null)
                return
            }
            toast.error('Erro ao enviar arquivo')
        }
    }

    const handleSelecaoConfirm = async (selection: FaturaSelecaoRetryPayload) => {
        const file = pendingUploadFileRef.current ?? fileInputRef.current?.files?.[0]
        if (!file || !id) {
            toast.warning('Selecione um arquivo PDF ou CSV')
            setSelecaoModalOpen(false)
            return
        }

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
            const result = await faturasService.uploadPdf({
                id: Number(id),
                arquivo_pdf: file,
                processar_automatico: processarAuto,
                ...merged,
            })
            setSelecaoModalOpen(false)
            await handleUploadSuccess(result)
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
            if (error instanceof PdfSenhaError) {
                setSelecaoModalOpen(false)
                await loadFatura({ silent: true, openSenhaIfNeeded: false })
                openSenhaModal(error.senha_pdf ?? null)
                return
            }
            toast.error('Erro ao enviar arquivo')
        } finally {
            setSelecaoLoading(false)
        }
    }

    const handleDownloadAnexo = async (tipo: 'pdf' | 'csv') => {
        if (!id || !fatura) return
        try {
            await downloadFaturaAnexo(id, tipo, {
                cartaoNome: fatura.cartao_nome,
                competencia: fatura.competencia ?? formatPeriodo(fatura.mes, fatura.ano),
                mes: fatura.mes,
                ano: fatura.ano,
            })
        } catch (error) {
            console.error('Erro ao baixar anexo:', error)
            toast.error(tipo === 'pdf' ? 'PDF não disponível' : 'CSV não disponível')
        }
    }

    const handleExportCsv = async () => {
        if (!id) return
        setExporting(true)
        try {
            const blob = await transacoesService.exportCsv({ fatura_id: id })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fatura_${id}_transacoes_${Date.now()}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Exportação concluída')
        } catch (error) {
            console.error('Erro ao exportar:', error)
            toast.error('Erro ao exportar transações')
        } finally {
            setExporting(false)
        }
    }

    const saveTransacao = async (
        tx: TransacoesList,
        patch: Partial<Pick<
            TransacoesList,
            | 'categoria_id'
            | 'categoria_nome'
            | 'categoria_cor'
            | 'subcategoria_id'
            | 'subcategoria_nome'
            | 'responsavel_id'
            | 'valor'
            | 'observacoes'
            | 'origem_compra'
        >> & {
            propagar_grupo?: boolean
        }
    ) => {
        if (!tx.id) return
        setSavingIds((prev) => ({ ...prev, [tx.id!]: true }))
        try {
            const valor = patch.valor !== undefined ? patch.valor : tx.valor
            const categoriaId = patch.categoria_id !== undefined ? patch.categoria_id : (tx.categoria_id ?? null)
            const subcategoriaId = patch.subcategoria_id !== undefined
                ? patch.subcategoria_id
                : (categoriaId ? (tx.subcategoria_id ?? null) : null)
            const origemCompra = patch.origem_compra !== undefined
                ? patch.origem_compra
                : (tx.origem_compra ?? null)
            const { propagar_grupo: propagarGrupo, ...rowPatch } = patch

            await transacoesService.editTransacoes({
                id: tx.id,
                transacao_id: tx.id,
                cartao_id: tx.cartao_id ?? null,
                fatura_id: tx.fatura_id ?? Number(id),
                estabelecimento_id: tx.estabelecimento_id ?? null,
                estabelecimento: tx.estabelecimento_id ? undefined : (tx.estabelecimento ?? null),
                valor: valor ?? null,
                valor_parcela: valor ?? null,
                data: tx.data ?? null,
                tipo: tx.tipo ?? null,
                origem_compra: origemCompra,
                categoria_id: categoriaId,
                subcategoria_id: subcategoriaId,
                responsavel_id: patch.responsavel_id !== undefined ? patch.responsavel_id : (tx.responsavel_id ?? null),
                observacoes: patch.observacoes !== undefined ? patch.observacoes : (tx.observacoes ?? null),
                propagar_grupo: propagarGrupo || undefined,
            })
            setTransacoes((prev) =>
                prev.map((item) => {
                    const sameGrupo = Boolean(
                        propagarGrupo
                        && tx.compra_grupo_id
                        && item.compra_grupo_id === tx.compra_grupo_id
                    )
                    if (item.id !== tx.id && !sameGrupo) return item
                    const next = { ...item, ...rowPatch }
                    if (rowPatch.categoria_id !== undefined) {
                        const categoria = categoriasLookup.find((o) => o.id === rowPatch.categoria_id)
                        next.categoria_nome = rowPatch.categoria_nome ?? categoria?.nome
                        next.categoria_cor = rowPatch.categoria_cor ?? categoria?.cor
                        if (rowPatch.subcategoria_id === undefined && rowPatch.categoria_id !== item.categoria_id) {
                            next.subcategoria_id = null
                            next.subcategoria_nome = undefined
                        }
                    }
                    if (rowPatch.subcategoria_id !== undefined) {
                        const opts = categoriaId ? (subcategoriasByCategoria[categoriaId] ?? []) : []
                        next.subcategoria_nome =
                            rowPatch.subcategoria_nome
                            ?? opts.find((o) => Number(o.value) === rowPatch.subcategoria_id)?.label
                    }
                    if (rowPatch.origem_compra !== undefined) {
                        next.origem_compra_label =
                            origensCompraOptions.find((o) => o.value === rowPatch.origem_compra)?.label
                            ?? origemCompraLabel[rowPatch.origem_compra ?? '']
                            ?? null
                    }
                    if (rowPatch.responsavel_id !== undefined) {
                        const responsavel =
                            responsaveisLookup.find((r) => Number(r.id) === Number(rowPatch.responsavel_id))
                            ?? null
                        const fromOptions = responsaveisOptions.find((o) => Number(o.value) === rowPatch.responsavel_id)
                        next.responsavel_nome = responsavel?.nome ?? fromOptions?.label
                        next.responsavel_tipo = responsavel?.tipo ?? next.responsavel_tipo
                    }
                    return next
                })
            )
            if (patch.valor !== undefined && tx.id) {
                setValorDrafts((prev) => ({
                    ...prev,
                    [tx.id!]: Number(patch.valor).toFixed(2),
                }))
            }
            if (patch.observacoes !== undefined && tx.id) {
                setObservacaoDrafts((prev) => ({
                    ...prev,
                    [tx.id!]: patch.observacoes ?? '',
                }))
            }
        } catch (error) {
            toast.error('Erro ao atualizar transação')
            await loadTransacoes(id!)
        } finally {
            setSavingIds((prev) => {
                const next = { ...prev }
                delete next[tx.id!]
                return next
            })
        }
    }

    const handleUpdateSelect = async (
        tx: TransacoesList,
        field: 'categoria_id' | 'subcategoria_id' | 'responsavel_id',
        value: string
    ) => {
        const parsed = value === '' ? null : Number(value)

        if (field === 'categoria_id') {
            if (parsed) await loadSubcategoriasForCategoria(parsed)
            setTransacoes((prev) =>
                prev.map((item) =>
                    item.id === tx.id
                        ? { ...item, categoria_id: parsed, subcategoria_id: null, subcategoria_nome: undefined }
                        : item
                )
            )
            await saveTransacao(tx, { categoria_id: parsed, subcategoria_id: null })
            return
        }

        setTransacoes((prev) =>
            prev.map((item) =>
                item.id === tx.id ? { ...item, [field]: parsed } : item
            )
        )
        await saveTransacao(tx, { [field]: parsed })
    }

    const handleUpdateOrigem = async (tx: TransacoesList, value: string) => {
        const origem = value === '' ? null : value
        if ((tx.origem_compra ?? null) === origem) return
        setTransacoes((prev) =>
            prev.map((item) =>
                item.id === tx.id
                    ? {
                        ...item,
                        origem_compra: origem,
                        origem_compra_label:
                            origensCompraOptions.find((o) => o.value === origem)?.label
                            ?? origemCompraLabel[origem ?? '']
                            ?? null,
                    }
                    : item
            )
        )
        await saveTransacao(tx, { origem_compra: origem })
    }

    const handleUpdateFinal = async (tx: TransacoesList, value: string) => {
        if (!tx.id || !id) return
        const parsed = value === '' ? null : Number(value)
        const current = finalSelecionados[tx.id] !== undefined
            ? finalSelecionados[tx.id]
            : (tx.cartao_numero_id ?? tx.cartao_numero?.id ?? null)
        if ((current == null && parsed == null) || Number(current) === Number(parsed)) return

        let propagarGrupo = false
        if (tx.compra_grupo_id && parsed != null) {
            propagarGrupo = window.confirm(
                'Esta compra é parcelada. Deseja aplicar o final a todas as parcelas?'
            )
        }

        setSavingIds((prev) => ({ ...prev, [tx.id!]: true }))
        try {
            await transacoesService.editTransacoes({
                id: tx.id,
                transacao_id: tx.id,
                cartao_id: tx.cartao_id ?? fatura?.cartao_id ?? null,
                fatura_id: tx.fatura_id ?? Number(id),
                estabelecimento_id: tx.estabelecimento_id ?? null,
                estabelecimento: tx.estabelecimento_id ? undefined : (tx.estabelecimento ?? null),
                valor: tx.valor ?? null,
                valor_parcela: tx.valor ?? null,
                data: tx.data ?? null,
                tipo: tx.tipo ?? null,
                origem_compra: tx.origem_compra ?? null,
                categoria_id: tx.categoria_id ?? null,
                subcategoria_id: tx.subcategoria_id ?? null,
                responsavel_id: tx.responsavel_id ?? null,
                observacoes: tx.observacoes ?? null,
                cartao_numero_id: parsed,
                propagar_grupo: propagarGrupo,
            })

            // Mantém a linha em “Sem cartão identificado”; redistribui só ao atualizar a tela
            setFinalSelecionados((prev) => {
                const next = { ...prev, [tx.id!]: parsed }
                if (propagarGrupo && tx.compra_grupo_id) {
                    transacoes.forEach((item) => {
                        if (
                            item.id != null
                            && item.compra_grupo_id === tx.compra_grupo_id
                            && (item.cartao_numero_id == null && item.cartao_numero?.id == null)
                        ) {
                            next[item.id] = parsed
                        }
                    })
                }
                return next
            })
            toast.success(
                parsed == null
                    ? 'Final removido. Atualize a tela para redistribuir.'
                    : 'Final salvo. Atualize a tela para redistribuir as transações.'
            )
        } catch (error) {
            console.error('Erro ao atualizar final do cartão:', error)
            toast.error('Erro ao atualizar final do cartão')
        } finally {
            setSavingIds((prev) => {
                const next = { ...prev }
                delete next[tx.id!]
                return next
            })
        }
    }

    const handleValorBlur = async (tx: TransacoesList) => {
        if (!tx.id) return
        const raw = (valorDrafts[tx.id] ?? '').replace(',', '.').trim()
        const parsed = Number(raw)
        if (raw === '' || Number.isNaN(parsed)) {
            toast.warning('Informe um valor válido')
            setValorDrafts((prev) => ({
                ...prev,
                [tx.id!]: Number(tx.valor ?? 0).toFixed(2),
            }))
            return
        }
        const normalized = Number(parsed.toFixed(2))
        if (Number(tx.valor) === normalized) {
            setValorDrafts((prev) => ({ ...prev, [tx.id!]: normalized.toFixed(2) }))
            return
        }
        await saveTransacao(tx, { valor: normalized })
    }

    const handleObservacaoBlur = async (tx: TransacoesList) => {
        if (!tx.id) return
        const next = observacaoDrafts[tx.id] ?? ''
        const current = tx.observacoes ?? ''
        if (next === current) return
        await saveTransacao(tx, { observacoes: next || undefined })
    }

    const openResponsavelModal = (tx: TransacoesList) => {
        setRowForResponsavel(tx)
        setResponsavelModalOpen(true)
    }

    const handleConfirmResponsavel = async (responsavel: ResponsavelLookup) => {
        if (!rowForResponsavel?.id) return
        setResponsaveisLookup((prev) => {
            if (prev.some((r) => Number(r.id) === Number(responsavel.id))) return prev
            return [...prev, responsavel]
        })
        setResponsaveisOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(responsavel.id))) return prev
            return [...prev, { value: responsavel.id!, label: responsavel.nome ?? `#${responsavel.id}` }]
        })
        await saveTransacao(rowForResponsavel, { responsavel_id: responsavel.id ?? null })
    }

    const openCategoriaRapidoModal = (tx: TransacoesList) => {
        setRowForCategoriaRapido(tx)
        setCategoriaRapidoOpen(true)
    }

    const openSubcategoriaRapidoModal = (tx: TransacoesList) => {
        if (!tx.categoria_id) {
            toast.warning('Selecione uma categoria antes')
            return
        }
        setRowForSubcategoriaRapido(tx)
        setSubcategoriaRapidoOpen(true)
    }

    const handleConfirmCategoriaRapido = async (result: CategoriaRapidoConfirm) => {
        if (!rowForCategoriaRapido?.id) return
        const cat = result.data
        setCategoriasLookup((prev) => {
            if (prev.some((c) => Number(c.id) === Number(cat.id))) {
                return prev.map((c) =>
                    Number(c.id) === Number(cat.id)
                        ? { ...c, nome: cat.nome, cor: cat.cor ?? c.cor }
                        : c
                )
            }
            return [...prev, { id: cat.id, nome: cat.nome, cor: cat.cor ?? undefined }]
        })
        setCategoriasOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(cat.id))) {
                return prev.map((o) =>
                    Number(o.value) === Number(cat.id) ? { ...o, label: cat.nome } : o
                )
            }
            return [...prev, { value: cat.id, label: cat.nome }]
        })
        await loadSubcategoriasForCategoria(cat.id)
        await saveTransacao(rowForCategoriaRapido, {
            categoria_id: cat.id,
            categoria_nome: cat.nome,
            categoria_cor: cat.cor ?? undefined,
            subcategoria_id: null,
            propagar_grupo: result.propagar_grupo,
        })
        setRowForCategoriaRapido(null)
    }

    const handleConfirmSubcategoriaRapido = async (result: SubcategoriaRapidoConfirm) => {
        if (!rowForSubcategoriaRapido?.id || !rowForSubcategoriaRapido.categoria_id) return
        const sub = result.data
        const catId = Number(rowForSubcategoriaRapido.categoria_id)
        setSubcategoriasByCategoria((prev) => {
            const current = prev[catId] ?? []
            const exists = current.some((o) => Number(o.value) === Number(sub.id))
            const nextOpts = exists
                ? current.map((o) => (Number(o.value) === Number(sub.id) ? { ...o, label: sub.nome } : o))
                : [...current, { value: sub.id, label: sub.nome }]
            return { ...prev, [catId]: nextOpts }
        })
        loadedSubcategoriasRef.current.add(catId)
        await saveTransacao(rowForSubcategoriaRapido, {
            categoria_id: catId,
            subcategoria_id: sub.id,
            subcategoria_nome: sub.nome,
            propagar_grupo: result.propagar_grupo,
        })
        setRowForSubcategoriaRapido(null)
    }

    useEffect(() => {
        setActiveMenu('/faturas')
        loadLookups()
    }, [loadLookups])

    useEffect(() => {
        senhaModalAutoOpenedRef.current = null
        loadFatura()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- carga única ao abrir a tela / trocar id
    }, [id])

    useEffect(() => {
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
        }
    }, [pdfBlobUrl])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
                return
            }
            if (e.key === 'ArrowLeft' && navVizinhos.anteriorId != null) {
                e.preventDefault()
                navigate(`/faturas/view/${navVizinhos.anteriorId}`)
            } else if (e.key === 'ArrowRight' && navVizinhos.proximaId != null) {
                e.preventDefault()
                navigate(`/faturas/view/${navVizinhos.proximaId}`)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [navVizinhos.anteriorId, navVizinhos.proximaId, navigate])

    const totalTransacoes = transacoes.length || fatura?.total_transacoes || 0
    const transacoesComCategoria = useMemo(
        () => transacoes.filter((tx) => tx.categoria_id != null).length,
        [transacoes]
    )
    const categoriasResumo = useMemo(() => {
        const map = new Map<number, { id: number; nome: string; cor?: string; count: number; total: number }>()
        transacoes.forEach((tx) => {
            if (tx.categoria_id == null) return
            const fromLookup = categoriasLookup.find((c) => c.id === tx.categoria_id)
            const current = map.get(tx.categoria_id)
            const valor = Number(tx.valor ?? 0)
            if (current) {
                current.count += 1
                current.total += valor
                return
            }
            map.set(tx.categoria_id, {
                id: tx.categoria_id,
                nome: tx.categoria_nome ?? fromLookup?.nome ?? `#${tx.categoria_id}`,
                cor: tx.categoria_cor ?? fromLookup?.cor,
                count: 1,
                total: valor,
            })
        })
        return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }, [transacoes, categoriasLookup])

    const categoriasChart = useMemo(() => {
        const withTotal = categoriasResumo.filter((c) => c.total > 0)
        return {
            labels: withTotal.map((c) => c.nome),
            series: withTotal.map((c) => Number(c.total.toFixed(2))),
            colors: withTotal.map((c) => c.cor || '#6b7280'),
        }
    }, [categoriasResumo])

    const gruposPorFinal = useMemo(
        () => groupTransacoesPorFinal(transacoes, fatura?.grupos_por_cartao),
        [transacoes, fatura?.grupos_por_cartao]
    )

    const gruposVisiveis = useMemo(() => {
        if (!filtroFinalKey) return gruposPorFinal
        const filtered = gruposPorFinal.filter((g) => g.key === filtroFinalKey)
        return filtered.length > 0 ? filtered : gruposPorFinal
    }, [gruposPorFinal, filtroFinalKey])

    useEffect(() => {
        if (filtroFinalKey && !gruposPorFinal.some((g) => g.key === filtroFinalKey)) {
            setFiltroFinalKey(null)
        }
    }, [gruposPorFinal, filtroFinalKey])

    if (loading) {
        return (
            <div className="page-content text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        )
    }

    if (!fatura) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="alert alert-danger">Fatura não encontrada.</div>
                    <button type="button" className="btn btn-soft-success" onClick={() => navigate('/faturas')}>Voltar</button>
                </Container>
            </div>
        )
    }

    const isProcessing = fatura.status === 'pendente' || fatura.status === 'processando'
    const precisaSenhaPdf = faturaPrecisaSenhaPdf(fatura)
    const anexo = resolveFaturaAnexo(fatura)
    const competenciaAtual = fatura.competencia ?? formatPeriodo(fatura.mes, fatura.ano)
    const bandeiraLabel = fatura.bandeira || fatura.cartao_bandeira
    const coresCartao = resolveCartaoCores({
        nome: fatura.cartao_nome,
        cor_fundo: fatura.cartao_cor_fundo,
        cor_texto: fatura.cartao_cor_texto,
    })

    return (
        <React.Fragment>
            <FaturaSenhaPdfModal
                isOpen={senhaModalOpen}
                faturaId={id ?? null}
                senhaMeta={senhaModalMeta}
                onClose={() => setSenhaModalOpen(false)}
                onSuccess={async () => {
                    senhaModalAutoOpenedRef.current = String(id)
                    await loadFatura({ silent: true, openSenhaIfNeeded: false })
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
                onClose={() => {
                    setSelecaoModalOpen(false)
                    pendingUploadFileRef.current = null
                }}
                onConfirm={handleSelecaoConfirm}
            />
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <Link to="/faturas" className="me-2">
                                        <i className="bx bx-arrow-back bx-sm"></i>
                                    </Link>
                                    <h4 className="mb-0">Detalhe da Fatura</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/faturas">Faturas</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Detalhe</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 sticky-top py-2 bg-body" style={{ zIndex: 10 }}>
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            disabled={navVizinhos.anteriorId == null}
                            title={navVizinhos.anteriorCompetencia
                                ? `Fatura anterior (${navVizinhos.anteriorCompetencia})`
                                : 'Não há fatura anterior'}
                            onClick={() => navVizinhos.anteriorId != null && navigate(`/faturas/view/${navVizinhos.anteriorId}`)}
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Anterior
                            {navVizinhos.anteriorCompetencia && (
                                <span className="ms-1 text-muted">{navVizinhos.anteriorCompetencia}</span>
                            )}
                        </Button>
                        <div className="text-center small text-muted d-none d-md-block">
                            {[fatura.cartao_nome, bandeiraLabel, competenciaAtual].filter(Boolean).join(' · ')}
                        </div>
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            disabled={navVizinhos.proximaId == null}
                            title={navVizinhos.proximaCompetencia
                                ? `Próxima fatura (${navVizinhos.proximaCompetencia})`
                                : 'Não há próxima fatura'}
                            onClick={() => navVizinhos.proximaId != null && navigate(`/faturas/view/${navVizinhos.proximaId}`)}
                        >
                            {navVizinhos.proximaCompetencia && (
                                <span className="me-1 text-muted">{navVizinhos.proximaCompetencia}</span>
                            )}
                            Próxima
                            <i className="ri-arrow-right-line ms-1"></i>
                        </Button>
                    </div>

                    <Card className="mb-4">
                        <CardBody>
                            <div
                                className="d-flex flex-wrap align-items-center justify-content-between gap-3"
                            >
                                <div className="d-flex align-items-center gap-3 min-w-0">
                                    <CartaoChip
                                        cor_fundo={coresCartao.cor_fundo}
                                        cor_texto={coresCartao.cor_texto}
                                        label={fatura.cartao_nome || 'Cartão'}
                                        className="fs-5 px-3 py-2"
                                    />
                                    <div className="min-w-0">
                                        {(fatura.bandeira || fatura.cartao_bandeira) && (
                                            <div>
                                                <BandeiraChip
                                                    cor_principal={fatura.bandeira_cor_principal}
                                                    cor_secundaria={fatura.bandeira_cor_secundaria}
                                                    bandeira={bandeiraLabel}
                                                    label={bandeiraLabel}
                                                    className="fs-6"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-md-end">
                                    <div className="text-muted text-uppercase small fw-semibold mb-1">
                                        Competência
                                    </div>
                                    <div
                                        className="fw-bold text-primary"
                                        style={{ fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '0.02em' }}
                                    >
                                        {fatura.competencia ?? formatPeriodo(fatura.mes, fatura.ano)}
                                    </div>
                                </div>
                            </div>

                            <hr className="my-3" />

                            <div
                                className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3"
                            >
                                <div className="d-flex flex-wrap gap-3 text-muted">
                                    {(fatura.periodo_inicio || fatura.periodo_fim) && (
                                        <span>
                                            <strong>Ciclo:</strong>{' '}
                                            {formatDateBr(fatura.periodo_inicio)} – {formatDateBr(fatura.periodo_fim)}
                                        </span>
                                    )}
                                    {fatura.data_vencimento && (
                                        <span>
                                            <strong>Vencimento:</strong> {formatDateBr(fatura.data_vencimento)}
                                        </span>
                                    )}
                                    <span>
                                        <strong>Quitação:</strong>{' '}
                                        <Badge color={faturaQuitacaoColor(fatura.pago)}>
                                            {faturaQuitacaoLabel(fatura.pago)}
                                        </Badge>
                                    </span>
                                    <span>
                                        <strong>Status PDF:</strong>{' '}
                                        <Badge color={faturaStatusColor[fatura.status ?? ''] ?? 'secondary'}>
                                            {statusLabel[fatura.status ?? ''] ?? fatura.status}
                                        </Badge>
                                    </span>
                                    <span><strong>Lançamentos:</strong> {fatura.total_transacoes ?? transacoes.length}</span>
                                    {fatura.processado_em && (
                                        <span><strong>Processado em:</strong> {formatDateBr(fatura.processado_em)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-light rounded p-3 mb-3">
                                <Row className="g-3 text-center text-md-start">
                                    <Col xs={6} md={3}>
                                        <small className="text-muted text-uppercase d-block">Total da fatura</small>
                                        <span
                                            className={`fw-semibold text-primary ${VALOR_TEXT_CLASS} d-block`}
                                            style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                        >
                                            {formatCurrency(fatura.valor_total)}
                                        </span>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <small className="text-muted text-uppercase d-block">Total pago</small>
                                        <span
                                            className={`fw-semibold text-success ${VALOR_TEXT_CLASS} d-block`}
                                            style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                        >
                                            {formatCurrency(fatura.valor_pago)}
                                        </span>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <small className="text-muted text-uppercase d-block">Restante</small>
                                        <span
                                            className={`fw-semibold ${Number(fatura.valor_restante ?? 0) > 0 ? 'text-warning' : 'text-muted'} ${VALOR_TEXT_CLASS} d-block`}
                                            style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                        >
                                            {formatCurrency(fatura.valor_restante)}
                                        </span>
                                    </Col>
                                    <Col xs={6} md={3} className="d-flex flex-column justify-content-center">
                                        <small className="text-muted text-uppercase d-block mb-1">Status</small>
                                        <Badge
                                            color={faturaQuitacaoColor(fatura.pago)}
                                            className="align-self-md-start"
                                            style={{ fontSize: '0.95rem' }}
                                        >
                                            {faturaQuitacaoLabel(fatura.pago)}
                                        </Badge>
                                    </Col>
                                </Row>
                                {Number(fatura.pagamentos_total ?? 0) > 0 && (
                                    <div className="text-muted small mt-3 pt-3 border-top">
                                        Dos pagamentos desta fatura ({formatCurrency(fatura.pagamentos_total)}):
                                        <ul className="mb-0 mt-1 ps-3">
                                            <li>
                                                {formatCurrency(fatura.pagamentos_abatido_anterior)} quitou a fatura anterior
                                            </li>
                                            <li>
                                                {formatCurrency(fatura.pagamentos_antecipado)} antecipou este ciclo
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <Row className="align-items-center">
                                <Col md={8}>
                                    {precisaSenhaPdf && (
                                        <div className="alert alert-warning mb-0">
                                            {fatura.erro_mensagem
                                                || 'Este PDF da fatura está protegido por senha. Informe a senha para continuar.'}
                                            {fatura.senha_pdf?.orientacao && (
                                                <div className="mt-1 small">
                                                    {fatura.senha_pdf.orientacao}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!precisaSenhaPdf && fatura.erro_mensagem && (
                                        <div className="alert alert-danger mb-0">{fatura.erro_mensagem}</div>
                                    )}
                                    {!precisaSenhaPdf && isProcessing && (
                                        <div className="alert alert-info mb-0">
                                            Fatura pendente/processando. Use <strong>Reprocessar</strong> para atualizar as transações.
                                        </div>
                                    )}
                                </Col>
                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                            Voltar
                                        </button>
                                        <Link to={`/faturas/edit/${id}`} className="btn btn-soft-primary">
                                            Editar
                                        </Link>
                                        {precisaSenhaPdf ? (
                                            <button
                                                type="button"
                                                className="btn btn-warning"
                                                onClick={() => openSenhaModal(resolveSenhaPdfMeta(fatura))}
                                            >
                                                <i className="ri-lock-unlock-line me-1"></i>
                                                Informar senha
                                            </button>
                                        ) : (
                                            <button type="button" className="btn btn-warning" onClick={handleReprocessar}>
                                                Reprocessar
                                            </button>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            <Row className="mt-3 align-items-end">
                                <Col md={4}>
                                    <Label htmlFor="upload_pdf" className="form-label">Anexo da fatura (PDF ou CSV)</Label>
                                    <Input innerRef={fileInputRef} type="file" accept={FATURA_FILE_ACCEPT} />
                                    <small className="text-muted">PDF ou CSV</small>
                                </Col>
                                <Col md={3}>
                                    <div className="form-check form-switch mt-4">
                                        <Input
                                            type="checkbox"
                                            role="switch"
                                            id="processar_auto"
                                            checked={processarAuto}
                                            onChange={(e) => setProcessarAuto(e.target.checked)}
                                        />
                                        <Label className="ms-2" htmlFor="processar_auto">Processar automaticamente</Label>
                                    </div>
                                </Col>
                                <Col md={2}>
                                    <button type="button" className="btn btn-primary mt-2" onClick={handleUploadPdf}>
                                        Enviar arquivo
                                    </button>
                                </Col>
                            </Row>

                            <Row className="mt-4">
                                <Col md={12}>
                                    <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                                        <div className="bg-light rounded px-3 py-2">
                                            <small className="text-muted text-uppercase d-block">Categorias preenchidas</small>
                                            <span className="fs-5 fw-semibold">
                                                {transacoesComCategoria}/{totalTransacoes}
                                            </span>
                                            <small className="text-muted ms-2">
                                                {totalTransacoes === 0
                                                    ? 'sem transações'
                                                    : `${Math.round((transacoesComCategoria / totalTransacoes) * 100)}% categorizadas`}
                                            </small>
                                        </div>
                                    </div>
                                    <div>
                                        <small className="text-muted text-uppercase d-block mb-2">Categorias nesta fatura</small>
                                        {categoriasResumo.length === 0 ? (
                                            <span className="text-muted">Nenhuma categoria vinculada ainda.</span>
                                        ) : (
                                            <div className="d-flex flex-wrap gap-2">
                                                {categoriasResumo.map((cat) => (
                                                    <span
                                                        key={cat.id}
                                                        className="d-inline-flex align-items-center gap-2 border rounded px-2 py-1"
                                                        style={{
                                                            backgroundColor: cat.cor ? `${cat.cor}22` : '#f8f9fa',
                                                            borderColor: cat.cor || '#dee2e6',
                                                            borderLeftWidth: 4,
                                                            borderLeftStyle: 'solid',
                                                            borderLeftColor: cat.cor || '#adb5bd',
                                                        }}
                                                        title={`${cat.count} transação(ões) · ${formatCurrency(cat.total)}`}
                                                    >
                                                        {cat.cor && (
                                                            <span
                                                                className="rounded-circle border"
                                                                style={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    backgroundColor: cat.cor,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                        <span className="fw-medium">{cat.nome}</span>
                                                        <span className="text-muted small">{cat.count}x</span>
                                                        <span className={`text-muted small ${VALOR_TEXT_CLASS}`}>{formatCurrency(cat.total)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {categoriasChart.series.length > 0 && (
                                <Row className="mt-4">
                                    <Col md={12} lg={7} xl={6}>
                                        <h6 className="mb-3">Distribuição por categoria</h6>
                                        <ReactApexChart
                                            type="pie"
                                            height={320}
                                            series={categoriasChart.series}
                                            options={{
                                                labels: categoriasChart.labels,
                                                colors: categoriasChart.colors,
                                                legend: {
                                                    position: 'bottom',
                                                    fontSize: '13px',
                                                },
                                                dataLabels: {
                                                    enabled: true,
                                                    formatter: (val: number) => `${Math.round(val)}%`,
                                                },
                                                tooltip: {
                                                    y: {
                                                        formatter: (val: number) => formatCurrency(val),
                                                    },
                                                },
                                                chart: {
                                                    toolbar: { show: false },
                                                },
                                                responsive: [{
                                                    breakpoint: 576,
                                                    options: {
                                                        chart: { height: 280 },
                                                        legend: { position: 'bottom' },
                                                    },
                                                }],
                                            }}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h5 className="card-title mb-1">Transações</h5>
                                    <small className="text-muted">
                                        Agrupadas por final do cartão. Em “Sem cartão identificado”, escolha o final na linha de cima da transação.
                                    </small>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    <Link
                                        to="/transacoes/add"
                                        state={{
                                            source: {
                                                fatura_id: Number(id),
                                                cartao_id: fatura.cartao_id,
                                                tipo: 'purchase',
                                                // Data no ciclo desta fatura → 1ª parcela cai aqui
                                                // (backend usa a data da compra, não o fatura_id, para ancorar o parcelamento)
                                                data: fatura.mes && fatura.ano
                                                    ? `${fatura.ano}-${String(fatura.mes).padStart(2, '0')}-01`
                                                    : undefined,
                                            },
                                            returnTo: `/faturas/view/${id}`,
                                        }}
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-circle-line align-middle me-1"></i>
                                        Nova compra
                                    </Link>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        outline
                                        onClick={handleExportCsv}
                                        disabled={exporting || transacoes.length === 0}
                                    >
                                        <i className="ri-file-download-line align-middle me-1"></i>
                                        {exporting ? 'Exportando...' : 'Exportar CSV/Excel'}
                                    </Button>
                                </div>
                            </div>
                            {gruposPorFinal.length > 1 && (
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        color={filtroFinalKey == null ? 'primary' : 'light'}
                                        className={filtroFinalKey == null ? '' : 'border'}
                                        onClick={() => setFiltroFinalKey(null)}
                                    >
                                        Todos ({transacoes.length})
                                    </Button>
                                    {gruposPorFinal.map((grupo) => (
                                        <Button
                                            key={`filtro_${grupo.key}`}
                                            type="button"
                                            size="sm"
                                            color={filtroFinalKey === grupo.key ? 'primary' : 'light'}
                                            className={filtroFinalKey === grupo.key ? '' : 'border'}
                                            onClick={() => setFiltroFinalKey(grupo.key)}
                                            title={formatCurrency(grupo.subtotal)}
                                        >
                                            {grupo.label}
                                            <span className="ms-1 opacity-75">({grupo.items.length})</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {transacoes.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    {isProcessing
                                        ? 'Nenhuma transação ainda. Clique em Reprocessar para processar a fatura.'
                                        : 'Nenhuma transação encontrada.'}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Data</th>
                                                <th>Estabelecimento</th>
                                                <th className={VALOR_TEXT_CLASS} style={{ minWidth: 150, maxWidth: 50 }}>Valor</th>
                                                <th style={{ width: 90 }}>Parcelas</th>
                                                <th>Tipo</th>
                                                <th>Origem</th>
                                                <th style={{ minWidth: 160 }}>Categoria</th>
                                                <th style={{ minWidth: 160 }}>Subcategoria</th>
                                                <th style={{ minWidth: 250 }}>Observação</th>
                                                <th style={{ width: 90 }} title="Responsável">Resp.</th>
                                                <th style={{ width: 90 }}>Compra</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gruposVisiveis.map((grupo) => (
                                                <React.Fragment key={grupo.key}>
                                                    <tr className="table-secondary">
                                                        <td colSpan={11} className="py-2">
                                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                                                <span className="fw-semibold">
                                                                    {grupo.label}
                                                                    <span className="text-muted fw-normal ms-2 small">
                                                                        {grupo.items.length} lançamento{grupo.items.length === 1 ? '' : 's'}
                                                                    </span>
                                                                </span>
                                                                <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>
                                                                    {formatCurrency(grupo.subtotal)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {grupo.items.map((tx, idx) => {
                                                        const subOptions = tx.categoria_id
                                                            ? (subcategoriasByCategoria[tx.categoria_id] ?? [])
                                                            : []
                                                        const showResponsavelNome = !isMeuResponsavel(tx.responsavel_id)
                                                        const responsavelNome =
                                                            tx.responsavel_nome
                                                            ?? responsaveisLookup.find((r) => Number(r.id) === Number(tx.responsavel_id))?.nome
                                                            ?? responsaveisOptions.find((o) => Number(o.value) === Number(tx.responsavel_id))?.label
                                                        const isSemCartaoGrupo = grupo.key === SEM_CARTAO_KEY
                                                        const finalSalvo = tx.id != null && finalSelecionados[tx.id] !== undefined
                                                            ? finalSelecionados[tx.id]
                                                            : (tx.cartao_numero_id ?? tx.cartao_numero?.id ?? null)
                                                        const selectFinalValue = finalSalvo ?? ''
                                                        const rowKey = tx.id ?? `${grupo.key}_${idx}`
                                                        const compraTo = compraDestinoDaFatura(tx, fatura.mes, fatura.ano)
                                                        return (
                                                        <React.Fragment key={rowKey}>
                                                        {isSemCartaoGrupo && (
                                                            <tr className="table-warning">
                                                                <td colSpan={11} className="py-2">
                                                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                                                        <span className="text-muted small text-nowrap">
                                                                            <i className="ri-bank-card-line me-1"></i>
                                                                            Final do cartão
                                                                        </span>
                                                                        {numerosLoading ? (
                                                                            <span className="text-muted small">Carregando...</span>
                                                                        ) : numerosOptions.length === 0 ? (
                                                                            <span className="text-muted small">Sem finais cadastrados nesta bandeira</span>
                                                                        ) : (
                                                                            <Input
                                                                                type="select"
                                                                                bsSize="sm"
                                                                                style={{ maxWidth: 320 }}
                                                                                value={selectFinalValue}
                                                                                disabled={!!savingIds[tx.id!]}
                                                                                className={finalSalvo == null ? 'border-warning' : undefined}
                                                                                title="Definir final do cartão"
                                                                                onChange={(e) => handleUpdateFinal(tx, e.target.value)}
                                                                            >
                                                                                <option value="">Definir final...</option>
                                                                                {numerosOptions.map((opt) => (
                                                                                    <option key={String(opt.value)} value={opt.value ?? ''}>
                                                                                        {opt.label}
                                                                                    </option>
                                                                                ))}
                                                                            </Input>
                                                                        )}
                                                                        {finalSalvo != null && (
                                                                            <span className="text-success small">
                                                                                Salvo — atualize a tela para redistribuir
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <td>{formatDateBr(tx.data)}</td>
                                                            <td className="text-start">
                                                                <div>{tx.estabelecimento_nome ?? tx.estabelecimento ?? '-'}</div>
                                                                {tx.loja_nome && (
                                                                    <div className="small text-muted">{tx.loja_nome}</div>
                                                                )}
                                                            </td>
                                                            <td className={VALOR_TEXT_CLASS}>
                                                                <Input
                                                                    type="number"
                                                                    bsSize="sm"
                                                                    className={VALOR_TEXT_CLASS}
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={tx.id != null ? (valorDrafts[tx.id] ?? '') : ''}
                                                                    disabled={!!savingIds[tx.id!]}
                                                                    onChange={(e) => {
                                                                        if (!tx.id) return
                                                                        setValorDrafts((prev) => ({
                                                                            ...prev,
                                                                            [tx.id!]: e.target.value,
                                                                        }))
                                                                    }}
                                                                    onBlur={() => handleValorBlur(tx)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.currentTarget.blur()
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="text-center text-nowrap">
                                                                {formatParcelas(tx.parcela_atual, tx.parcelas_total)}
                                                            </td>
                                                            <td>
                                                                <Badge color={tipoTransacaoColor[tx.tipo ?? ''] ?? 'secondary'}>
                                                                    {tipoTransacaoLabel[tx.tipo ?? ''] ?? tx.tipo}
                                                                </Badge>
                                                            </td>
                                                            <td style={{ minWidth: 170 }}>
                                                                <Input
                                                                    type="select"
                                                                    bsSize="sm"
                                                                    value={tx.origem_compra ?? ''}
                                                                    disabled={!!savingIds[tx.id!]}
                                                                    onChange={(e) => handleUpdateOrigem(tx, e.target.value)}
                                                                >
                                                                    <option value="">Selecionar...</option>
                                                                    {origensCompraOptions.map((opt) => (
                                                                        <option key={String(opt.value)} value={opt.value ?? ''}>
                                                                            {opt.label}
                                                                        </option>
                                                                    ))}
                                                                </Input>
                                                            </td>
                                                            <td style={{ minWidth: 160 }}>
                                                                <div className="d-flex gap-1 align-items-center">
                                                                    <Input
                                                                        type="select"
                                                                        bsSize="sm"
                                                                        value={tx.categoria_id ?? ''}
                                                                        disabled={!!savingIds[tx.id!]}
                                                                        onChange={(e) => handleUpdateSelect(tx, 'categoria_id', e.target.value)}
                                                                        style={
                                                                            tx.categoria_id
                                                                                ? (getCategoriaFieldStyle(
                                                                                    tx.categoria_cor
                                                                                    ?? categoriasLookup.find((c) => c.id === tx.categoria_id)?.cor
                                                                                ) ?? undefined)
                                                                                : undefined
                                                                        }
                                                                    >
                                                                        <option value="">Sem categoria</option>
                                                                        {categoriasOptions.map((opt) => (
                                                                            <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                                                        ))}
                                                                    </Input>
                                                                    <Button
                                                                        type="button"
                                                                        color="light"
                                                                        size="sm"
                                                                        className="border px-1"
                                                                        title="Nova categoria"
                                                                        disabled={!!savingIds[tx.id!]}
                                                                        onClick={() => openCategoriaRapidoModal(tx)}
                                                                    >
                                                                        <i className="ri-add-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                            <td style={{ minWidth: 160 }}>
                                                                <div className="d-flex gap-1 align-items-center">
                                                                    <Input
                                                                        type="select"
                                                                        bsSize="sm"
                                                                        value={tx.subcategoria_id ?? ''}
                                                                        disabled={!tx.categoria_id || !!savingIds[tx.id!]}
                                                                        onChange={(e) => handleUpdateSelect(tx, 'subcategoria_id', e.target.value)}
                                                                    >
                                                                        <option value="">Sem subcategoria</option>
                                                                        {subOptions.map((opt) => (
                                                                            <option key={String(opt.value)} value={opt.value ?? ''}>{opt.label}</option>
                                                                        ))}
                                                                    </Input>
                                                                    <Button
                                                                        type="button"
                                                                        color="light"
                                                                        size="sm"
                                                                        className="border px-1"
                                                                        title={!tx.categoria_id ? 'Selecione uma categoria antes' : 'Nova subcategoria'}
                                                                        disabled={!tx.categoria_id || !!savingIds[tx.id!]}
                                                                        onClick={() => openSubcategoriaRapidoModal(tx)}
                                                                    >
                                                                        <i className="ri-add-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    type="text"
                                                                    bsSize="sm"
                                                                    placeholder="Observação..."
                                                                    value={tx.id != null ? (observacaoDrafts[tx.id] ?? '') : ''}
                                                                    disabled={!!savingIds[tx.id!]}
                                                                    onChange={(e) => {
                                                                        if (!tx.id) return
                                                                        setObservacaoDrafts((prev) => ({
                                                                            ...prev,
                                                                            [tx.id!]: e.target.value,
                                                                        }))
                                                                    }}
                                                                    onBlur={() => handleObservacaoBlur(tx)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.currentTarget.blur()
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                <Button
                                                                    type="button"
                                                                    color="light"
                                                                    size="sm"
                                                                    className="border"
                                                                    title={showResponsavelNome ? `Responsável: ${responsavelNome}` : 'Definir responsável'}
                                                                    disabled={!!savingIds[tx.id!]}
                                                                    onClick={() => openResponsavelModal(tx)}
                                                                >
                                                                    <i className="ri-user-line me-1"></i>
                                                                    {showResponsavelNome ? (
                                                                        <span className="small">{responsavelNome}</span>
                                                                    ) : (
                                                                        <span className="small text-muted">Eu</span>
                                                                    )}
                                                                </Button>
                                                            </td>
                                                            <td className="text-center">
                                                                {compraTo ? (
                                                                    <Link
                                                                        to={compraTo}
                                                                        state={{ from: `/faturas/view/${fatura.id}` }}
                                                                        className="btn btn-sm btn-soft-primary"
                                                                        title="Ver detalhes da compra"
                                                                    >
                                                                        <i className="ri-eye-line me-1"></i>
                                                                        Ver
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-muted">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        </React.Fragment>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <ResponsavelModal
                        isOpen={responsavelModalOpen}
                        toggle={() => {
                            setResponsavelModalOpen(false)
                            setRowForResponsavel(null)
                        }}
                        responsaveis={responsaveisLookup}
                        currentResponsavelId={rowForResponsavel?.responsavel_id}
                        onResponsaveisChange={setResponsaveisLookup}
                        onConfirm={handleConfirmResponsavel}
                    />

                    <CategoriaRapidoModal
                        isOpen={categoriaRapidoOpen}
                        toggle={() => {
                            setCategoriaRapidoOpen(false)
                            setRowForCategoriaRapido(null)
                        }}
                        showPropagarGrupo={Boolean(rowForCategoriaRapido?.compra_grupo_id)}
                        onConfirm={handleConfirmCategoriaRapido}
                    />

                    <SubcategoriaRapidoModal
                        isOpen={subcategoriaRapidoOpen}
                        toggle={() => {
                            setSubcategoriaRapidoOpen(false)
                            setRowForSubcategoriaRapido(null)
                        }}
                        categoriaId={rowForSubcategoriaRapido?.categoria_id}
                        categoriaNome={
                            rowForSubcategoriaRapido?.categoria_nome
                            ?? categoriasLookup.find((c) => c.id === rowForSubcategoriaRapido?.categoria_id)?.nome
                        }
                        categoriaCor={
                            rowForSubcategoriaRapido?.categoria_cor
                            ?? categoriasLookup.find((c) => c.id === rowForSubcategoriaRapido?.categoria_id)?.cor
                        }
                        showPropagarGrupo={Boolean(rowForSubcategoriaRapido?.compra_grupo_id)}
                        onConfirm={handleConfirmSubcategoriaRapido}
                    />

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                <h5 className="card-title mb-0">Anexos da fatura</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {anexo.temPdf && (
                                        <Button
                                            color="danger"
                                            outline
                                            size="sm"
                                            onClick={() => handleDownloadAnexo('pdf')}
                                        >
                                            <i className="mdi mdi-file-pdf-box me-1"></i>
                                            Baixar PDF
                                        </Button>
                                    )}
                                    {anexo.temCsv && (
                                        <Button
                                            color="success"
                                            outline
                                            size="sm"
                                            onClick={() => handleDownloadAnexo('csv')}
                                        >
                                            <i className="las la-file-csv me-1"></i>
                                            Baixar CSV
                                        </Button>
                                    )}
                                    {anexo.temPdf && showPdfPreview && pdfBlobUrl && (
                                        <Button
                                            color="light"
                                            size="sm"
                                            className="border"
                                            onClick={() => {
                                                setShowPdfPreview(false)
                                                clearPdfBlobUrl()
                                            }}
                                        >
                                            <i className="ri-eye-off-line me-1"></i>
                                            Ocultar preview
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {anexo.temCsv && !anexo.temPdf ? (
                                <div className="text-center text-muted py-5">
                                    Arquivo <strong>CSV</strong> anexado. Use o botão acima para baixar.
                                    A pré-visualização está disponível apenas para PDF.
                                </div>
                            ) : anexo.temPdf ? (
                                showPdfPreview && pdfBlobUrl ? (
                                    <iframe
                                        src={pdfBlobUrl}
                                        title="PDF da Fatura"
                                        style={{ width: '100%', height: '600px', border: '1px solid #dee2e6' }}
                                    />
                                ) : (
                                    <div className="text-center py-5">
                                        <p className="text-muted mb-3">
                                            Há um PDF anexado. Clique no botão para carregar a pré-visualização.
                                        </p>
                                        <Button
                                            color="primary"
                                            disabled={loadingPdf}
                                            onClick={async () => {
                                                if (!id) return
                                                const ok = await loadPdf(id)
                                                if (ok) setShowPdfPreview(true)
                                            }}
                                        >
                                            {loadingPdf ? (
                                                <>
                                                    <Spinner size="sm" className="me-2" />
                                                    Carregando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-file-pdf-line me-1"></i>
                                                    Ver preview do PDF
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-muted py-5">
                                    Nenhum anexo disponível para visualização.
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default FaturasViewPage
