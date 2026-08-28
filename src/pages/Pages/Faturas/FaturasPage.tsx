import React, { createContext, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    CompetenciaAtual,
    FaturasPaginate,
    FaturasSearch,
} from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import { AnosSelect } from 'helpers/functions_helpers'
import {
    anosLookupToOptions,
    buildFaturasListagemSearchParams,
    buildFaturasListarApiParams,
    extractCompetenciaAtual,
    extractFaturasListagemMeta,
    isMesAtualAtivo,
    parseAnoFiltro,
    parseFaturasListagemSearchParams,
    parseMesFiltro,
    resolveCompetenciaInicial,
} from 'helpers/fatura_listagem_helpers'
import FaturasFilter from './FaturasFilter/FaturasFilter'
import FaturasTable from './FaturasTable/FaturasTable'

type FaturasFilterContextType = {
    firstEntry: boolean
} & FaturasSearch & PaginateSearch

export const FaturasFilterContext = createContext<FaturasFilterContextType>({} as FaturasFilterContextType)

const parseUrlToContext = (searchParams: URLSearchParams): FaturasFilterContextType => {
    const url = parseFaturasListagemSearchParams(searchParams)
    return {
        id: null,
        fatura_id: null,
        cartao_id: url.cartao_id,
        pessoa_id: url.pessoa_id,
        cartao_bandeira_id: url.cartao_bandeira_id,
        mes: url.mes,
        ano: url.ano,
        status: url.status,
        palavra_chave: url.palavra_chave,
        page: url.page,
        perPage: 5,
        firstEntry: false,
    }
}

const FaturasPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [display, setDisplay] = useState<boolean>(false)
    const faturasContext = useRef<FaturasFilterContextType>(parseUrlToContext(searchParams)).current
    const [faturasList, setFaturasList] = useState<FaturasPaginate>()
    const faturasService = useRef(new FaturasService()).current
    const bootedRef = useRef(false)

    const [competenciaAtual, setCompetenciaAtual] = useState<CompetenciaAtual | null>(null)
    const competenciaAtualRef = useRef<CompetenciaAtual | null>(null)
    const [mesAtualAtivo, setMesAtualAtivo] = useState(false)
    const [appliedMes, setAppliedMes] = useState<number | null>(parseMesFiltro(faturasContext.mes))
    const [appliedAno, setAppliedAno] = useState<number | null>(parseAnoFiltro(faturasContext.ano))
    const [anosOptions, setAnosOptions] = useState<SelectOptions[]>(() => AnosSelect({ includeTodos: true }))
    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])

    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(faturasContext.page ?? 1)

    const persistUrl = (filters: FaturasSearch & PaginateSearch) => {
        const next = buildFaturasListagemSearchParams(filters)
        const nextQs = next.toString()
        const currentQs = new URLSearchParams(window.location.search).toString()
        if (nextQs === currentQs) return
        setSearchParams(next, { replace: true })
    }

    const syncContext = (data: FaturasSearch & PaginateSearch) => {
        faturasContext.palavra_chave = data.palavra_chave
        faturasContext.cartao_id = data.cartao_id
        faturasContext.pessoa_id = data.pessoa_id
        faturasContext.cartao_bandeira_id = data.cartao_bandeira_id
        faturasContext.status = data.status
        faturasContext.mes = parseMesFiltro(data.mes)
        faturasContext.ano = parseAnoFiltro(data.ano)
        faturasContext.page = data.page ?? 1
        faturasContext.perPage = data.perPage ?? perPage
        faturasContext.firstEntry = true
    }

    const applyListMeta = (
        list: FaturasPaginate | undefined,
        sent: FaturasSearch,
        competencia: CompetenciaAtual | null,
    ) => {
        const meta = extractFaturasListagemMeta(list)
        const nextCompetencia = meta.competencia_atual ?? competencia
        if (nextCompetencia) {
            competenciaAtualRef.current = nextCompetencia
            setCompetenciaAtual(nextCompetencia)
        }

        const mes = meta.filtros ? (meta.filtros.mes ?? null) : parseMesFiltro(sent.mes)
        const ano = meta.filtros ? (meta.filtros.ano ?? null) : parseAnoFiltro(sent.ano)
        const ativo = Boolean(meta.filtros?.mes_atual_ativo)
            || isMesAtualAtivo(mes, ano, nextCompetencia)

        setAppliedMes(mes)
        setAppliedAno(ano)
        setMesAtualAtivo(ativo)
        faturasContext.mes = mes
        faturasContext.ano = ano
    }

    const getRemoteFaturasList: SubmitHandler<any> = useCallback(async (data): Promise<void> => {
        const mesEnviado = parseMesFiltro(data.mes)
        const anoEnviado = parseAnoFiltro(data.ano)
        const usarAtalho = data.mes_atual === 1 || data.mes_atual === true
        syncContext({ ...data, mes: mesEnviado, ano: anoEnviado, perPage })
        const apiParams = buildFaturasListarApiParams({
            ...data,
            mes: mesEnviado,
            ano: anoEnviado,
            mes_atual: usarAtalho ? 1 : undefined,
            perPage,
            page: data.page ?? 1,
        })
        const list = await faturasService.listFaturasPaginate(apiParams)
        applyListMeta(list, apiParams, competenciaAtualRef.current)
        persistUrl({
            ...faturasContext,
            page: apiParams.page,
            perPage,
        })
        if (list) setFaturasList(list)
        setPage(apiParams.page ?? 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perPage])

    const boot = async () => {
        let competencia: CompetenciaAtual | null = null
        try {
            const lookups = await faturasService.getLookupsFaturas()
            competencia = extractCompetenciaAtual(lookups)
            if (competencia) {
                competenciaAtualRef.current = competencia
                setCompetenciaAtual(competencia)
            }
            if (lookups?.anos?.length) {
                setAnosOptions(anosLookupToOptions(lookups.anos))
            }
            if (lookups?.cartoes) {
                const opts: SelectOptions[] = [{ value: '', label: 'Todos' }]
                lookups.cartoes.forEach((c) => {
                    opts.push({
                        value: c.id!,
                        label: c.nome ?? `Cartão ${c.id}`,
                        cor_fundo: c.cor_fundo ?? null,
                        cor_texto: c.cor_texto ?? null,
                    })
                })
                setCartoesOptions(opts)
            }
        } catch (error) {
            console.error('Erro ao carregar lookups de faturas:', error)
        }

        const url = parseFaturasListagemSearchParams(searchParams)
        const resolved = resolveCompetenciaInicial(url, competencia)
        faturasContext.cartao_id = url.cartao_id
        faturasContext.pessoa_id = url.pessoa_id
        faturasContext.cartao_bandeira_id = url.cartao_bandeira_id
        faturasContext.status = url.status
        faturasContext.palavra_chave = url.palavra_chave
        faturasContext.mes = resolved.mes
        faturasContext.ano = resolved.ano
        faturasContext.page = url.page
        faturasContext.perPage = perPage
        setMesAtualAtivo(resolved.mesAtualAtivo)
        setAppliedMes(resolved.mes)
        setAppliedAno(resolved.ano)

        try {
            await getRemoteFaturasList({
                ...faturasContext,
                mes: resolved.mes,
                ano: resolved.ano,
                mes_atual: resolved.usarAtalhoMesAtual ? 1 : undefined,
                page: url.page,
                perPage,
            })
        } finally {
            bootedRef.current = true
        }
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
        boot()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!bootedRef.current) return
        getRemoteFaturasList({ ...faturasContext, page: 1, perPage })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perPage])

    return (
        <React.Fragment>
            <FaturasFilterContext.Provider value={faturasContext}>
                <div className="page-content">
                    <Container fluid>
                        <FaturasFilter
                            getRemoteFaturasList={getRemoteFaturasList}
                            filtersRef={faturasContext}
                            competenciaAtual={competenciaAtual}
                            mesAtualAtivo={mesAtualAtivo}
                            appliedMes={appliedMes}
                            appliedAno={appliedAno}
                            anosOptions={anosOptions}
                            cartoesOptions={cartoesOptions}
                        />
                        {display ? (
                            <FaturasTable
                                filters={faturasContext}
                                getData={getRemoteFaturasList}
                                data={faturasList}
                                setPerPage={setPerPage}
                                perPage={perPage}
                                setPage={setPage}
                                page={page}
                            />
                        ) : (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        )}
                    </Container>
                </div>
            </FaturasFilterContext.Provider>
        </React.Fragment>
    )
}

export default FaturasPage
