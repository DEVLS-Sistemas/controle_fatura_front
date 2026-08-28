import React, { createContext, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    ResponsavelLookup,
    TransacoesList,
    TransacoesSearch,
} from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { origemCompraLabel, tipoTransacaoLabel } from 'helpers/fatura_helpers'
import { corCategoria } from 'helpers/cores_tema_helpers'
import TransacoesFilter from './TransacoesFilter/TransacoesFilter'
import TransacoesTable from './TransacoesTable/TransacoesTable'

type TransacoesFilterContextType = {
    firstEntry: boolean
} & TransacoesSearch & PaginateSearch

export const TransacoesFilterContext = createContext<TransacoesFilterContextType>({} as TransacoesFilterContextType)

const defaultTiposOptions: SelectOptions[] = [
    { value: '', label: 'Todos' },
    ...Object.entries(tipoTransacaoLabel).map(([value, label]) => ({ value, label })),
]

const defaultOrigensCompraOptions: SelectOptions[] = [
    { value: '', label: 'Todos' },
    ...Object.entries(origemCompraLabel).map(([value, label]) => ({ value, label })),
]

const defaultStatusConciliacaoOptions: SelectOptions[] = [
    { value: '', label: 'Todos' },
    { value: 'nao_conciliada', label: 'Não conciliada' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'conciliada', label: 'Conciliada' },
    { value: 'rejeitada', label: 'Rejeitada' },
]

const buildSelectOptions = (
    items: {
        id?: number
        nome?: string
        cor?: string | null
        cor_fundo?: string | null
        cor_texto?: string | null
    }[] | undefined,
    allLabel = 'Todos'
): SelectOptions[] => {
    const opts: SelectOptions[] = [{ value: '', label: allLabel }]
    items?.forEach((item) => {
        if (item.id != null) {
            opts.push({
                value: item.id,
                label: item.nome ?? `#${item.id}`,
                cor: item.cor ?? null,
                cor_fundo: item.cor_fundo ?? null,
                cor_texto: item.cor_texto ?? null,
            })
        }
    })
    return opts
}

const parseQueryNumber = (value: string | null): number | string | null => {
    if (value == null || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : value
}

const TransacoesPage = () => {
    const [searchParams] = useSearchParams()
    const [display, setDisplay] = useState<boolean>(false)
    const transacoesContext = useRef<TransacoesFilterContextType>({
        id: null,
        transacao_id: null,
        data_inicio: searchParams.get('data_inicio'),
        data_fim: searchParams.get('data_fim'),
        cartao_id: parseQueryNumber(searchParams.get('cartao_id')),
        categoria_id: parseQueryNumber(searchParams.get('categoria_id')),
        subcategoria_id: parseQueryNumber(searchParams.get('subcategoria_id')),
        estabelecimento_id: parseQueryNumber(searchParams.get('estabelecimento_id')),
        responsavel_id: parseQueryNumber(searchParams.get('responsavel_id')),
        fatura_id: parseQueryNumber(searchParams.get('fatura_id')),
        tipo: searchParams.get('tipo'),
        origem_compra: searchParams.get('origem_compra'),
        eh_assinatura: searchParams.get('eh_assinatura'),
        status_conciliacao: searchParams.get('status_conciliacao'),
        mes: parseQueryNumber(searchParams.get('mes')),
        ano: parseQueryNumber(searchParams.get('ano')),
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: Boolean(
            searchParams.get('responsavel_id')
            || searchParams.get('tipo')
            || searchParams.get('categoria_id')
            || searchParams.get('subcategoria_id')
            || searchParams.get('estabelecimento_id')
            || searchParams.get('data_inicio')
            || searchParams.get('data_fim')
            || searchParams.get('origem_compra')
            || searchParams.get('eh_assinatura')
        ),
    }).current

    const [transacoesList, setTransacoesList] = useState<PaginateInterface<TransacoesList>>()
    const transacoesService = new TransacoesService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [tiposOptions, setTiposOptions] = useState<SelectOptions[]>(defaultTiposOptions)
    const [origensCompraOptions, setOrigensCompraOptions] = useState<SelectOptions[]>(defaultOrigensCompraOptions)
    const [statusConciliacaoOptions, setStatusConciliacaoOptions] = useState<SelectOptions[]>(defaultStatusConciliacaoOptions)
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])
    const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)

    const syncContext = (data: TransacoesSearch & PaginateSearch) => {
        transacoesContext.palavra_chave = data.palavra_chave
        transacoesContext.data_inicio = data.data_inicio
        transacoesContext.data_fim = data.data_fim
        transacoesContext.cartao_id = data.cartao_id
        transacoesContext.categoria_id = data.categoria_id
        transacoesContext.subcategoria_id = data.subcategoria_id
        transacoesContext.estabelecimento_id = data.estabelecimento_id
        transacoesContext.responsavel_id = data.responsavel_id
        transacoesContext.fatura_id = data.fatura_id
        transacoesContext.tipo = data.tipo
        transacoesContext.origem_compra = data.origem_compra
        transacoesContext.eh_assinatura = data.eh_assinatura
        transacoesContext.status_conciliacao = data.status_conciliacao
        transacoesContext.mes = data.mes
        transacoesContext.ano = data.ano
        transacoesContext.page = data.page
        transacoesContext.firstEntry = true
    }

    const getRemoteTransacoesList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await transacoesService.listTransacoesPaginate({ ...data, perPage })
        syncContext(data)
        if (list) setTransacoesList(list)
    }

    const loadLookups = async () => {
        try {
            const result = await transacoesService.getLookupsTransacoes()
            if (result) {
                setCartoesOptions(buildSelectOptions(result.cartoes))
                setCategoriasOptions(
                    buildSelectOptions(result.categorias).map((opt) =>
                        opt.value === ''
                            ? opt
                            : {
                                ...opt,
                                cor: corCategoria({ cor: opt.cor, categoria_id: Number(opt.value) }),
                            }
                    )
                )
                setResponsaveisOptions(buildSelectOptions(result.responsaveis))
                setResponsaveisLookup(result.responsaveis ?? [])
                setDefaultResponsavelId(result.default_responsavel_id ?? null)
                if (result.tipos?.length) {
                    setTiposOptions([
                        { value: '', label: 'Todos' },
                        ...result.tipos.map((t) => ({
                            value: t.value ?? '',
                            label: t.label ?? t.value ?? '',
                        })),
                    ])
                }
                if (result.origens_compra?.length) {
                    setOrigensCompraOptions([
                        { value: '', label: 'Todos' },
                        ...result.origens_compra.map((o) => ({
                            value: o.value ?? '',
                            label: o.label ?? o.value ?? '',
                        })),
                    ])
                }
                if (result.status_conciliacao?.length) {
                    setStatusConciliacaoOptions([
                        { value: '', label: 'Todos' },
                        ...result.status_conciliacao.map((s) => ({
                            value: s.value ?? '',
                            label: s.label ?? s.value ?? '',
                        })),
                    ])
                }
            }
        } catch (error) {
            console.error('Erro ao carregar lookups de transações:', error)
        }
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
        loadLookups()
    }, [])

    useEffect(() => {
        getRemoteTransacoesList(transacoesContext)
    }, [perPage])

    return (
        <React.Fragment>
            <TransacoesFilterContext.Provider value={transacoesContext}>
                <div className="page-content">
                    <Container fluid>
                        <TransacoesFilter
                            getRemoteTransacoesList={getRemoteTransacoesList}
                            cartoesOptions={cartoesOptions}
                            categoriasOptions={categoriasOptions}
                            responsaveisOptions={responsaveisOptions}
                            tiposOptions={tiposOptions}
                            origensCompraOptions={origensCompraOptions}
                            statusConciliacaoOptions={statusConciliacaoOptions}
                            filtersRef={transacoesContext}
                            onAfterVincularLoja={() => getRemoteTransacoesList(transacoesContext)}
                        />
                        {display ? (
                            <TransacoesTable
                                filters={transacoesContext}
                                getData={getRemoteTransacoesList}
                                data={transacoesList}
                                setPerPage={setPerPage}
                                perPage={perPage}
                                setPage={setPage}
                                page={page}
                                responsaveisLookup={responsaveisLookup}
                                defaultResponsavelId={defaultResponsavelId}
                                onResponsaveisChange={setResponsaveisLookup}
                                onRowsChange={setTransacoesList}
                                origensCompraOptions={origensCompraOptions}
                            />
                        ) : (
                            <div className="text-center">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        )}
                    </Container>
                </div>
            </TransacoesFilterContext.Provider>
        </React.Fragment>
    )
}

export default TransacoesPage
