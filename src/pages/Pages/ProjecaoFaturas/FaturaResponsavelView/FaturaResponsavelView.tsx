import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Row,
    Spinner,
    Table,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import {
    formatCurrency,
    formatDateBr,
    getCategoriaFieldStyle,
    origemCompraLabel,
    statusRepasseBadgeClass,
    statusRepasseLabel,
    tipoTransacaoColor,
    tipoTransacaoLabel,
    VALOR_TEXT_CLASS,
} from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { ResponsaveisView } from 'interfaces/Responsaveis/ResponsaveisInterface'
import {
    CategoriaLookup,
    ResponsavelLookup,
    TransacoesList,
} from 'interfaces/Transacoes/TransacoesInterface'
import { ResponsaveisService } from 'services/Responsaveis/ResponsaveisService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import ResponsavelModal from 'pages/Pages/Transacoes/ResponsavelModal/ResponsavelModal'
import CategoriaRapidoModal, { CategoriaRapidoConfirm } from 'pages/Pages/Transacoes/CategoriaRapidoModal/CategoriaRapidoModal'
import SubcategoriaRapidoModal, { SubcategoriaRapidoConfirm } from 'pages/Pages/Transacoes/SubcategoriaRapidoModal/SubcategoriaRapidoModal'
import RepasseModal, { RepasseModalContext } from '../RepasseModal/RepasseModal'
import { RepasseCelula } from 'interfaces/Repasses/RepassesInterface'

const SEM_CARTAO_KEY = '__sem_cartao__'
const SEM_FINAL_KEY = '__sem_final__'

export type FaturaResponsavelLocationState = {
    nome?: string
    tipo?: string
    realizado?: number
    projetado?: number
    total?: number
}

const formatParcelas = (atual?: number, total?: number) => {
    if (!total || total <= 1) return 'À vista'
    return `${atual ?? 1}/${total}`
}

const formatPeriodo = (mes?: number, ano?: number) => {
    if (!mes || !ano) return '-'
    return `${String(mes).padStart(2, '0')}/${ano}`
}

const shiftCompetencia = (mes: number, ano: number, delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1)
    return { mes: d.getMonth() + 1, ano: d.getFullYear() }
}

const getTxUltimosDigitos = (tx: TransacoesList): string | null => {
    const digitos = tx.ultimos_digitos ?? tx.cartao_numero?.ultimos_digitos ?? null
    if (!digitos) return null
    return String(digitos).replace(/\D/g, '').slice(-4) || null
}

const getTxNumeroKey = (tx: TransacoesList): string => {
    if (tx.cartao_numero_id != null) return `numero_${tx.cartao_numero_id}`
    if (tx.cartao_numero?.id != null) return `numero_${tx.cartao_numero.id}`
    const digitos = getTxUltimosDigitos(tx)
    return digitos ? `digitos_${digitos}` : SEM_FINAL_KEY
}

const getTxNumeroLabel = (tx: TransacoesList): string => {
    const digitos = getTxUltimosDigitos(tx)
    if (!digitos) return 'Sem cartão identificado'
    const nomeNoCartao =
        tx.cartao_numero_nome_no_cartao?.trim()
        || tx.cartao_numero?.nome_no_cartao?.trim()
        || null
    if (nomeNoCartao) return `•••• ${digitos} · ${nomeNoCartao}`
    const tipo = tx.cartao_numero?.tipo ?? tx.cartao_numero_tipo
    const apelido = tx.cartao_numero?.apelido ?? tx.cartao_numero_apelido
    const extras = [apelido || tipo].filter(Boolean).join(' · ')
    return extras ? `•••• ${digitos} · ${extras}` : `•••• ${digitos}`
}

type FinalGrupo = {
    key: string
    label: string
    digitos: string | null
    items: TransacoesList[]
    subtotal: number
}

type CartaoGrupo = {
    key: string
    cartaoId: number | null
    cartaoNome: string
    corFundo?: string | null
    corTexto?: string | null
    bandeira?: string | null
    faturaId: number | null
    items: TransacoesList[]
    subtotal: number
    finais: FinalGrupo[]
}

const groupByFinal = (rows: TransacoesList[]): FinalGrupo[] => {
    const map = new Map<string, FinalGrupo>()
    rows.forEach((tx) => {
        const key = getTxNumeroKey(tx)
        const current = map.get(key)
        if (current) {
            current.items.push(tx)
            current.subtotal += Number(tx.valor ?? 0)
            return
        }
        map.set(key, {
            key,
            digitos: getTxUltimosDigitos(tx),
            label: getTxNumeroLabel(tx),
            items: [tx],
            subtotal: Number(tx.valor ?? 0),
        })
    })
    return Array.from(map.values()).sort((a, b) => {
        if (a.key === SEM_FINAL_KEY) return 1
        if (b.key === SEM_FINAL_KEY) return -1
        if (a.digitos == null) return 1
        if (b.digitos == null) return -1
        return a.digitos.localeCompare(b.digitos, 'pt-BR')
    })
}

const groupByCartao = (rows: TransacoesList[]): CartaoGrupo[] => {
    const map = new Map<string, CartaoGrupo>()
    rows.forEach((tx) => {
        const cartaoId = tx.cartao_id != null ? Number(tx.cartao_id) : null
        const key = cartaoId != null ? `cartao_${cartaoId}` : SEM_CARTAO_KEY
        const current = map.get(key)
        if (current) {
            current.items.push(tx)
            current.subtotal += Number(tx.valor ?? 0)
            if (current.faturaId == null && tx.fatura_id != null) {
                current.faturaId = Number(tx.fatura_id)
            }
            return
        }
        map.set(key, {
            key,
            cartaoId,
            cartaoNome: tx.cartao_nome?.trim() || (cartaoId != null ? `Cartão #${cartaoId}` : 'Sem cartão'),
            corFundo: tx.cartao_cor_fundo,
            corTexto: tx.cartao_cor_texto,
            bandeira: tx.cartao_bandeira,
            faturaId: tx.fatura_id != null ? Number(tx.fatura_id) : null,
            items: [tx],
            subtotal: Number(tx.valor ?? 0),
            finais: [],
        })
    })

    return Array.from(map.values())
        .map((grupo) => ({
            ...grupo,
            finais: groupByFinal(grupo.items),
        }))
        .sort((a, b) => {
            if (a.key === SEM_CARTAO_KEY) return 1
            if (b.key === SEM_CARTAO_KEY) return -1
            return a.cartaoNome.localeCompare(b.cartaoNome, 'pt-BR')
        })
}

const FaturaResponsavelView = () => {
    const { responsavelId } = useParams<{ responsavelId: string }>()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { voltarParaRotaAnterior } = useNavegacao()

    const locationState = (location.state || {}) as FaturaResponsavelLocationState

    const mes = Number(searchParams.get('mes')) || new Date().getMonth() + 1
    const ano = Number(searchParams.get('ano')) || new Date().getFullYear()
    const cartaoIdFiltro = searchParams.get('cartao_id')
        ? Number(searchParams.get('cartao_id'))
        : null

    const responsaveisService = useRef(new ResponsaveisService()).current
    const transacoesService = useRef(new TransacoesService()).current
    const subcategoriasService = useRef(new SubcategoriasService()).current
    const loadedSubcategoriasRef = useRef<Set<number>>(new Set())

    const [responsavel, setResponsavel] = useState<ResponsaveisView | null>(null)
    const [transacoes, setTransacoes] = useState<TransacoesList[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [palavraChave, setPalavraChave] = useState('')
    const [palavraChaveDebounced, setPalavraChaveDebounced] = useState('')
    const [filtroCartaoId, setFiltroCartaoId] = useState<number | null>(cartaoIdFiltro)

    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([])
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [subcategoriasByCategoria, setSubcategoriasByCategoria] = useState<Record<number, SelectOptions[]>>({})
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([])
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [cartoesFiltroOptions, setCartoesFiltroOptions] = useState<SelectOptions[]>([])
    const [origensCompraOptions, setOrigensCompraOptions] = useState<SelectOptions[]>(
        () => Object.entries(origemCompraLabel).map(([value, label]) => ({ value, label }))
    )
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
    const [repasseModalOpen, setRepasseModalOpen] = useState(false)
    const [repasseModalContext, setRepasseModalContext] = useState<RepasseModalContext | null>(null)

    const projetadoInfo = Number(locationState.projetado ?? 0)

    const goCompetencia = useCallback((nextMes: number, nextAno: number) => {
        if (!responsavelId) return
        const next = new URLSearchParams(searchParams)
        next.set('mes', String(nextMes))
        next.set('ano', String(nextAno))
        navigate(
            `/projecao-faturas/responsaveis/${responsavelId}/fatura?${next.toString()}`,
            { state: location.state }
        )
    }, [responsavelId, searchParams, navigate, location.state])

    const anterior = shiftCompetencia(mes, ano, -1)
    const proxima = shiftCompetencia(mes, ano, 1)

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

    const loadLookups = useCallback(async () => {
        try {
            const lookups = await transacoesService.getLookupsTransacoes()
            if (!lookups) return
            setCategoriasLookup(lookups.categorias ?? [])
            setCategoriasOptions(
                (lookups.categorias ?? []).map((c) => ({
                    value: c.id!,
                    label: c.nome ?? `#${c.id}`,
                }))
            )
            setResponsaveisLookup(lookups.responsaveis ?? [])
            setResponsaveisOptions(
                (lookups.responsaveis ?? []).map((r) => ({
                    value: r.id!,
                    label: r.nome ?? `#${r.id}`,
                }))
            )
            setCartoesFiltroOptions(
                (lookups.cartoes ?? []).map((c) => ({
                    value: c.id!,
                    label: c.nome ?? `#${c.id}`,
                }))
            )
            if (lookups.default_responsavel_id != null) {
                setDefaultResponsavelId(Number(lookups.default_responsavel_id))
            }
            if (lookups.origens_compra?.length) {
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

    const loadAllTransacoes = useCallback(async () => {
        if (!responsavelId) return []
        const all: TransacoesList[] = []
        let page = 1
        const perPage = 200
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const response = await transacoesService.listTransacoesPaginate({
                responsavel_id: responsavelId,
                mes,
                ano,
                tipo: 'purchase',
                cartao_id: filtroCartaoId ?? undefined,
                palavra_chave: palavraChaveDebounced || undefined,
                perPage,
                page,
            } as any)
            const rows = response?.data ?? []
            all.push(...rows)
            const lastPage = Number((response as any)?.last_page ?? 1)
            if (page >= lastPage || rows.length < perPage) break
            page += 1
        }
        return all
    }, [responsavelId, mes, ano, filtroCartaoId, palavraChaveDebounced, transacoesService])

    const loadData = useCallback(async () => {
        if (!responsavelId) return
        setLoading(true)
        try {
            const [viewResult, rowsResult] = await Promise.allSettled([
                responsaveisService.getViewResponsaveis({ id: responsavelId }),
                loadAllTransacoes(),
            ])

            if (viewResult.status === 'fulfilled') {
                setResponsavel(viewResult.value ?? null)
            } else {
                console.error(viewResult.reason)
                setResponsavel(null)
            }

            if (rowsResult.status === 'fulfilled') {
                const rows = rowsResult.value
                setTransacoes(rows)
                const draftsValor: Record<number, string> = {}
                const draftsObs: Record<number, string> = {}
                rows.forEach((tx) => {
                    if (tx.id == null) return
                    draftsValor[tx.id] = Number(tx.valor ?? 0).toFixed(2)
                    draftsObs[tx.id] = tx.observacoes ?? ''
                    if (tx.categoria_id) loadSubcategoriasForCategoria(Number(tx.categoria_id))
                })
                setValorDrafts(draftsValor)
                setObservacaoDrafts(draftsObs)
            } else {
                console.error(rowsResult.reason)
                toast.error('Erro ao carregar compras do responsável')
                setTransacoes([])
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error?.message || 'Erro ao carregar fatura do responsável')
            setResponsavel(null)
            setTransacoes([])
        } finally {
            setLoading(false)
        }
    }, [responsavelId, loadAllTransacoes, responsaveisService, loadSubcategoriasForCategoria])

    useEffect(() => {
        setActiveMenu('/projecao-faturas')
        loadLookups()
    }, [loadLookups])

    useEffect(() => {
        const t = setTimeout(() => setPalavraChaveDebounced(palavraChave.trim()), 350)
        return () => clearTimeout(t)
    }, [palavraChave])

    useEffect(() => {
        setFiltroCartaoId(cartaoIdFiltro)
    }, [cartaoIdFiltro])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
                return
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                goCompetencia(anterior.mes, anterior.ano)
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                goCompetencia(proxima.mes, proxima.ano)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [anterior.mes, anterior.ano, proxima.mes, proxima.ano, goCompetencia])

    const isMeuResponsavel = (id?: number | null) => {
        if (id == null) return true
        if (defaultResponsavelId != null) return Number(id) === Number(defaultResponsavelId)
        const nome = responsaveisLookup.find((r) => Number(r.id) === Number(id))?.nome
            ?? responsaveisOptions.find((o) => Number(o.value) === Number(id))?.label
        return (nome ?? '').trim().toLowerCase() === 'eu'
    }

    const gruposPorCartao = useMemo(() => groupByCartao(transacoes), [transacoes])

    const totalValor = useMemo(
        () => transacoes.reduce((acc, tx) => acc + Number(tx.valor ?? 0), 0),
        [transacoes]
    )

    const totalRepassado = useMemo(
        () => transacoes.reduce((acc, tx) => acc + Number(tx.valor_pago_repasse ?? 0), 0),
        [transacoes]
    )

    const totalAbertoRepasse = useMemo(
        () => transacoes.reduce((acc, tx) => {
            if (tx.valor_aberto_repasse != null) return acc + Number(tx.valor_aberto_repasse)
            const devido = Number(tx.valor ?? 0)
            const pago = Number(tx.valor_pago_repasse ?? 0)
            return acc + Math.max(devido - pago, 0)
        }, 0),
        [transacoes]
    )

    const temDadosRepasse = useMemo(
        () => transacoes.some((tx) =>
            tx.status_repasse != null
            || tx.valor_pago_repasse != null
            || tx.valor_aberto_repasse != null
        ),
        [transacoes]
    )

    const repassesPath = useMemo(() => {
        if (!responsavelId) return '/projecao-faturas'
        const qs = new URLSearchParams({ mes: String(mes), ano: String(ano) })
        if (filtroCartaoId != null) qs.set('cartao_id', String(filtroCartaoId))
        return `/projecao-faturas/responsaveis/${responsavelId}/repasses?${qs.toString()}`
    }, [responsavelId, mes, ano, filtroCartaoId])

    const openRepasseModal = (tx: TransacoesList) => {
        if (!tx.id) return
        const devido = Number(tx.valor ?? 0)
        const pago = Number(tx.valor_pago_repasse ?? 0)
        const aberto = tx.valor_aberto_repasse != null
            ? Number(tx.valor_aberto_repasse)
            : Math.max(devido - pago, 0)
        const status = (tx.status_repasse
            || (pago <= 0 ? 'pendente' : aberto <= 0 ? 'pago' : 'parcial')) as RepasseCelula['status_repasse']
        const celula: RepasseCelula = {
            transacao_id: tx.id,
            fatura_id: tx.fatura_id ?? null,
            parcela_atual: tx.parcela_atual ?? null,
            parcelas_total: tx.parcelas_total ?? null,
            valor_devido: devido,
            valor_pago: pago,
            valor_aberto: aberto,
            status_repasse: status,
            data_ultimo_pagamento: tx.data_ultimo_repasse ?? null,
            qtd_repasses: undefined,
        }
        setRepasseModalContext({
            estabelecimento: tx.estabelecimento_nome ?? tx.estabelecimento,
            observacoes: tx.observacoes,
            competenciaLabel: formatPeriodo(mes, ano),
            celula,
        })
        setRepasseModalOpen(true)
    }

    const nomeResponsavel =
        responsavel?.nome
        || locationState.nome
        || `#${responsavelId}`

    const tipoResponsavel = responsavel?.tipo || locationState.tipo

    const handleFiltroCartao = (value: string) => {
        if (!responsavelId) return
        const parsed = value === '' ? null : Number(value)
        setFiltroCartaoId(parsed)
        const next = new URLSearchParams(searchParams)
        next.set('mes', String(mes))
        next.set('ano', String(ano))
        if (parsed == null) next.delete('cartao_id')
        else next.set('cartao_id', String(parsed))
        navigate(
            `/projecao-faturas/responsaveis/${responsavelId}/fatura?${next.toString()}`,
            { replace: true, state: location.state }
        )
    }

    const handleExportCsv = async () => {
        if (!responsavelId) return
        setExporting(true)
        try {
            const blob = await transacoesService.exportCsv({
                responsavel_id: responsavelId,
                mes,
                ano,
                tipo: 'purchase',
                cartao_id: filtroCartaoId ?? undefined,
                palavra_chave: palavraChaveDebounced || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fatura_responsavel_${responsavelId}_${String(mes).padStart(2, '0')}_${ano}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Exportação concluída')
        } catch (error) {
            console.error(error)
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
            const nextResponsavelId = patch.responsavel_id !== undefined
                ? patch.responsavel_id
                : (tx.responsavel_id ?? null)
            const { propagar_grupo: propagarGrupo, ...rowPatch } = patch

            await transacoesService.editTransacoes({
                id: tx.id,
                transacao_id: tx.id,
                cartao_id: tx.cartao_id ?? null,
                fatura_id: tx.fatura_id ?? null,
                estabelecimento_id: tx.estabelecimento_id ?? null,
                estabelecimento: tx.estabelecimento_id ? undefined : (tx.estabelecimento ?? null),
                valor: valor ?? null,
                valor_parcela: valor ?? null,
                data: tx.data ?? null,
                tipo: tx.tipo ?? null,
                origem_compra: origemCompra,
                categoria_id: categoriaId,
                subcategoria_id: subcategoriaId,
                responsavel_id: nextResponsavelId,
                observacoes: patch.observacoes !== undefined ? patch.observacoes : (tx.observacoes ?? null),
                propagar_grupo: propagarGrupo || undefined,
            })

            // Se mudou o responsável desta tela, recarrega a lista
            if (
                patch.responsavel_id !== undefined
                && Number(patch.responsavel_id) !== Number(responsavelId)
            ) {
                toast.success('Responsável atualizado')
                await loadData()
                return
            }

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
                        const responsavelItem =
                            responsaveisLookup.find((r) => Number(r.id) === Number(rowPatch.responsavel_id))
                            ?? null
                        const fromOptions = responsaveisOptions.find((o) => Number(o.value) === rowPatch.responsavel_id)
                        next.responsavel_nome = responsavelItem?.nome ?? fromOptions?.label
                        next.responsavel_tipo = responsavelItem?.tipo ?? next.responsavel_tipo
                    }
                    return next
                })
            )
            if (patch.valor !== undefined && tx.id) {
                setValorDrafts((prev) => ({ ...prev, [tx.id!]: Number(patch.valor).toFixed(2) }))
            }
            if (patch.observacoes !== undefined && tx.id) {
                setObservacaoDrafts((prev) => ({ ...prev, [tx.id!]: patch.observacoes ?? '' }))
            }
        } catch (error) {
            toast.error('Erro ao atualizar transação')
            await loadData()
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
        field: 'categoria_id' | 'subcategoria_id',
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
            prev.map((item) => (item.id === tx.id ? { ...item, [field]: parsed } : item))
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

    const handleValorBlur = async (tx: TransacoesList) => {
        if (!tx.id) return
        const raw = (valorDrafts[tx.id] ?? '').replace(',', '.').trim()
        const parsed = Number(raw)
        if (raw === '' || Number.isNaN(parsed)) {
            toast.warning('Informe um valor válido')
            setValorDrafts((prev) => ({ ...prev, [tx.id!]: Number(tx.valor ?? 0).toFixed(2) }))
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

    const handleConfirmResponsavel = async (resp: ResponsavelLookup) => {
        if (!rowForResponsavel?.id) return
        setResponsaveisLookup((prev) => {
            if (prev.some((r) => Number(r.id) === Number(resp.id))) return prev
            return [...prev, resp]
        })
        setResponsaveisOptions((prev) => {
            if (prev.some((o) => Number(o.value) === Number(resp.id))) return prev
            return [...prev, { value: resp.id!, label: resp.nome ?? `#${resp.id}` }]
        })
        await saveTransacao(rowForResponsavel, { responsavel_id: resp.id ?? null })
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

    if (loading) {
        return (
            <div className="page-content text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        )
    }

    if (!responsavelId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="alert alert-danger">Responsável inválido.</div>
                    <button type="button" className="btn btn-soft-success" onClick={() => navigate('/projecao-faturas')}>
                        Voltar à Projeção
                    </button>
                </Container>
            </div>
        )
    }

    const competenciaLabel = formatPeriodo(mes, ano)

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <Link to="/projecao-faturas" className="me-2">
                                        <i className="bx bx-arrow-back bx-sm"></i>
                                    </Link>
                                    <h4 className="mb-0">Fatura do Responsável</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem>
                                        <Link to="/dashboard"><i className="ri-home-5-fill"></i></Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem>
                                        <Link to="/projecao-faturas">Projeção</Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem active>Fatura do responsável</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>

                    <div
                        className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 sticky-top py-2 bg-body"
                        style={{ zIndex: 10 }}
                    >
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            title={`Competência anterior (${formatPeriodo(anterior.mes, anterior.ano)})`}
                            onClick={() => goCompetencia(anterior.mes, anterior.ano)}
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Anterior
                            <span className="ms-1 text-muted">{formatPeriodo(anterior.mes, anterior.ano)}</span>
                        </Button>
                        <div className="text-center small text-muted d-none d-md-block">
                            {[nomeResponsavel, tipoResponsavel, competenciaLabel].filter(Boolean).join(' · ')}
                        </div>
                        <Button
                            type="button"
                            color="light"
                            className="border"
                            title={`Próxima competência (${formatPeriodo(proxima.mes, proxima.ano)})`}
                            onClick={() => goCompetencia(proxima.mes, proxima.ano)}
                        >
                            <span className="me-1 text-muted">{formatPeriodo(proxima.mes, proxima.ano)}</span>
                            Próxima
                            <i className="ri-arrow-right-line ms-1"></i>
                        </Button>
                    </div>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                <div className="min-w-0">
                                    <div className="fw-bold text-truncate" style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                                        Fatura · {nomeResponsavel}
                                    </div>
                                    {tipoResponsavel && (
                                        <div className="mt-1">
                                            <span
                                                className="badge bg-primary-subtle text-primary-emphasis"
                                                style={{ fontSize: '0.95rem', fontWeight: 600 }}
                                            >
                                                {String(tipoResponsavel).charAt(0).toUpperCase() + String(tipoResponsavel).slice(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-md-end">
                                    <div className="text-muted text-uppercase small fw-semibold mb-1">Competência</div>
                                    <div
                                        className="fw-bold text-primary"
                                        style={{ fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '0.02em' }}
                                    >
                                        {competenciaLabel}
                                    </div>
                                </div>
                            </div>

                            <hr className="my-3" />

                            <div className="bg-light rounded p-3 mb-3">
                                <Row className="g-3 text-center text-md-start">
                                    <Col xs={6} md={temDadosRepasse ? 3 : 4}>
                                        <small className="text-muted text-uppercase d-block">Total devido</small>
                                        <span
                                            className={`fw-semibold text-primary ${VALOR_TEXT_CLASS} d-block`}
                                            style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                        >
                                            {formatCurrency(totalValor)}
                                        </span>
                                    </Col>
                                    {temDadosRepasse && (
                                        <>
                                            <Col xs={6} md={3}>
                                                <small className="text-muted text-uppercase d-block">Já repassado</small>
                                                <span
                                                    className={`fw-semibold text-success ${VALOR_TEXT_CLASS} d-block`}
                                                    style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                                >
                                                    {formatCurrency(totalRepassado)}
                                                </span>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <small className="text-muted text-uppercase d-block">Em aberto (responsável)</small>
                                                <span
                                                    className={`fw-semibold text-danger ${VALOR_TEXT_CLASS} d-block`}
                                                    style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                                >
                                                    {formatCurrency(totalAbertoRepasse)}
                                                </span>
                                            </Col>
                                        </>
                                    )}
                                    <Col xs={6} md={temDadosRepasse ? 3 : 4}>
                                        <small className="text-muted text-uppercase d-block">Lançamentos</small>
                                        <span
                                            className="fw-semibold d-block"
                                            style={{ fontSize: '1.5rem', lineHeight: 1.2 }}
                                        >
                                            {transacoes.length}
                                        </span>
                                        {projetadoInfo > 0 && (
                                            <span className="badge bg-info-subtle text-info mt-1">
                                                + {formatCurrency(projetadoInfo)} projetado (projeção)
                                            </span>
                                        )}
                                    </Col>
                                    {!temDadosRepasse && (
                                        <Col xs={12} md={4}>
                                            <small className="text-muted text-uppercase d-block">Realizado nesta tela</small>
                                            <span className={`fw-semibold ${VALOR_TEXT_CLASS} d-block`}>
                                                {formatCurrency(totalValor)}
                                            </span>
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            <div className="d-flex flex-wrap gap-2 justify-content-end">
                                <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                    Voltar
                                </button>
                                <Link
                                    to={repassesPath}
                                    state={{ nome: nomeResponsavel, tipo: tipoResponsavel }}
                                    className="btn btn-soft-warning"
                                >
                                    <i className="ri-exchange-dollar-line me-1"></i>
                                    Controle de repasses
                                </Link>
                                <Link to="/projecao-faturas" className="btn btn-soft-primary">
                                    Ir à Projeção
                                </Link>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <h5 className="card-title mb-1">Compras</h5>
                                    <small className="text-muted">
                                        Agrupadas por cartão e, dentro, por final. Todas as bandeiras desta competência.
                                    </small>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        color="secondary"
                                        outline
                                        onClick={handleExportCsv}
                                        disabled={exporting || transacoes.length === 0}
                                    >
                                        <i className="ri-file-download-line align-middle me-1"></i>
                                        {exporting ? 'Exportando...' : 'Exportar CSV'}
                                    </Button>
                                </div>
                            </div>

                            <Row className="g-2 mb-3">
                                <Col md={4}>
                                    <Input
                                        type="text"
                                        placeholder="Buscar estabelecimento, observação..."
                                        value={palavraChave}
                                        onChange={(e) => setPalavraChave(e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Input
                                        type="select"
                                        value={filtroCartaoId ?? ''}
                                        onChange={(e) => handleFiltroCartao(e.target.value)}
                                    >
                                        <option value="">Todos os cartões</option>
                                        {cartoesFiltroOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                </Col>
                            </Row>

                            {transacoes.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    <p className="mb-3">
                                        Nenhuma compra deste responsável em {competenciaLabel}.
                                    </p>
                                    <Link to="/projecao-faturas" className="btn btn-soft-primary">
                                        Voltar à Projeção
                                    </Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Data</th>
                                                <th>Estabelecimento</th>
                                                <th className={VALOR_TEXT_CLASS} style={{ minWidth: 130 }}>Valor</th>
                                                <th style={{ width: 90 }}>Parcelas</th>
                                                <th style={{ minWidth: 110 }}>Repasse</th>
                                                <th>Tipo</th>
                                                <th>Origem</th>
                                                <th style={{ minWidth: 150 }}>Categoria</th>
                                                <th style={{ minWidth: 150 }}>Subcategoria</th>
                                                <th style={{ minWidth: 200 }}>Observação</th>
                                                <th style={{ width: 90 }} title="Responsável">Resp.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gruposPorCartao.map((cartao) => (
                                                <React.Fragment key={cartao.key}>
                                                    <tr className="table-primary">
                                                        <td colSpan={11} className="py-2">
                                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                                                <span className="d-flex align-items-center gap-2 fw-semibold">
                                                                    {cartao.corFundo && (
                                                                        <CartaoChip
                                                                            cor_fundo={cartao.corFundo}
                                                                            cor_texto={cartao.corTexto}
                                                                            label={cartao.cartaoNome.slice(0, 1)}
                                                                        />
                                                                    )}
                                                                    <span>{cartao.cartaoNome}</span>
                                                                    {cartao.bandeira && (
                                                                        <span className="badge bg-light text-muted fw-normal">
                                                                            {cartao.bandeira}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-muted fw-normal small">
                                                                        {cartao.items.length} lançamento{cartao.items.length === 1 ? '' : 's'}
                                                                    </span>
                                                                    {cartao.faturaId != null && (
                                                                        <Link
                                                                            to={`/faturas/view/${cartao.faturaId}`}
                                                                            className="btn btn-sm btn-soft-primary ms-1"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            Abrir fatura do cartão
                                                                        </Link>
                                                                    )}
                                                                </span>
                                                                <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>
                                                                    {formatCurrency(cartao.subtotal)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {cartao.finais.map((final) => (
                                                        <React.Fragment key={`${cartao.key}_${final.key}`}>
                                                            <tr className="table-secondary">
                                                                <td colSpan={11} className="py-2">
                                                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                                                        <span className="fw-semibold">
                                                                            {final.label}
                                                                            <span className="text-muted fw-normal ms-2 small">
                                                                                {final.items.length} lançamento{final.items.length === 1 ? '' : 's'}
                                                                            </span>
                                                                        </span>
                                                                        <span className={`fw-semibold ${VALOR_TEXT_CLASS}`}>
                                                                            {formatCurrency(final.subtotal)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {final.items.map((tx, idx) => {
                                                                const subOptions = tx.categoria_id
                                                                    ? (subcategoriasByCategoria[tx.categoria_id] ?? [])
                                                                    : []
                                                                const showResponsavelNome = !isMeuResponsavel(tx.responsavel_id)
                                                                const responsavelNome =
                                                                    tx.responsavel_nome
                                                                    ?? responsaveisLookup.find((r) => Number(r.id) === Number(tx.responsavel_id))?.nome
                                                                    ?? responsaveisOptions.find((o) => Number(o.value) === Number(tx.responsavel_id))?.label
                                                                const rowKey = tx.id ?? `${final.key}_${idx}`
                                                                return (
                                                                    <tr key={rowKey}>
                                                                        <td>{formatDateBr(tx.data)}</td>
                                                                        <td>{tx.estabelecimento_nome ?? tx.estabelecimento ?? '-'}</td>
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
                                                                                    if (e.key === 'Enter') e.currentTarget.blur()
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td className="text-center text-nowrap">
                                                                            {formatParcelas(tx.parcela_atual, tx.parcelas_total)}
                                                                        </td>
                                                                        <td>
                                                                            <div className="d-flex flex-column align-items-start gap-1">
                                                                                {tx.status_repasse ? (
                                                                                    <span className={`badge ${statusRepasseBadgeClass[tx.status_repasse] ?? 'bg-secondary-subtle text-secondary'}`}>
                                                                                        {statusRepasseLabel[tx.status_repasse] ?? tx.status_repasse}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="badge bg-light text-muted">—</span>
                                                                                )}
                                                                                {Number(tx.valor_aberto_repasse ?? 0) > 0 && (
                                                                                    <span className={`small text-danger ${VALOR_TEXT_CLASS}`}>
                                                                                        Aberto {formatCurrency(tx.valor_aberto_repasse)}
                                                                                    </span>
                                                                                )}
                                                                                <Button
                                                                                    type="button"
                                                                                    color="success"
                                                                                    outline
                                                                                    size="sm"
                                                                                    className="px-1 py-0"
                                                                                    title="Registrar repasse"
                                                                                    disabled={!!savingIds[tx.id!]}
                                                                                    onClick={() => openRepasseModal(tx)}
                                                                                >
                                                                                    <i className="ri-exchange-dollar-line"></i>
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <Badge color={tipoTransacaoColor[tx.tipo ?? ''] ?? 'secondary'}>
                                                                                {tipoTransacaoLabel[tx.tipo ?? ''] ?? tx.tipo}
                                                                            </Badge>
                                                                        </td>
                                                                        <td style={{ minWidth: 150 }}>
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
                                                                                    if (e.key === 'Enter') e.currentTarget.blur()
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
                                                                    </tr>
                                                                )
                                                            })}
                                                        </React.Fragment>
                                                    ))}
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

                    <RepasseModal
                        isOpen={repasseModalOpen}
                        toggle={() => {
                            setRepasseModalOpen(false)
                            setRepasseModalContext(null)
                        }}
                        context={repasseModalContext}
                        onSaved={async () => {
                            await loadData()
                        }}
                    />
                </Container>
            </div>
        </React.Fragment>
    )
}

export default FaturaResponsavelView
