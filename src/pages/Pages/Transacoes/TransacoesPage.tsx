import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
    CategoriaLookup,
    ResponsavelLookup,
    TransacoesList,
    TransacoesSearch,
} from 'interfaces/Transacoes/TransacoesInterface'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { tipoTransacaoLabel } from 'helpers/fatura_helpers'
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

const buildSelectOptions = (
    items: { id?: number; nome?: string }[] | undefined,
    allLabel = 'Todos'
): SelectOptions[] => {
    const opts: SelectOptions[] = [{ value: '', label: allLabel }]
    items?.forEach((item) => {
        if (item.id != null) {
            opts.push({ value: item.id, label: item.nome ?? `#${item.id}` })
        }
    })
    return opts
}

const TransacoesPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const transacoesContext = useRef<TransacoesFilterContextType>({
        id: null,
        transacao_id: null,
        data_inicio: null,
        data_fim: null,
        cartao_id: null,
        categoria_id: null,
        responsavel_id: null,
        fatura_id: null,
        tipo: null,
        mes: null,
        ano: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [transacoesList, setTransacoesList] = useState<PaginateInterface<TransacoesList>>()
    const transacoesService = new TransacoesService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
    const [tiposOptions, setTiposOptions] = useState<SelectOptions[]>(defaultTiposOptions)
    const [categoriasLookup, setCategoriasLookup] = useState<CategoriaLookup[]>([])
    const [responsaveisLookup, setResponsaveisLookup] = useState<ResponsavelLookup[]>([])

    const syncContext = (data: TransacoesSearch & PaginateSearch) => {
        transacoesContext.palavra_chave = data.palavra_chave
        transacoesContext.data_inicio = data.data_inicio
        transacoesContext.data_fim = data.data_fim
        transacoesContext.cartao_id = data.cartao_id
        transacoesContext.categoria_id = data.categoria_id
        transacoesContext.responsavel_id = data.responsavel_id
        transacoesContext.fatura_id = data.fatura_id
        transacoesContext.tipo = data.tipo
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
                setCategoriasOptions(buildSelectOptions(result.categorias))
                setResponsaveisOptions(buildSelectOptions(result.responsaveis))
                setCategoriasLookup(result.categorias ?? [])
                setResponsaveisLookup(result.responsaveis ?? [])
                if (result.tipos?.length) {
                    setTiposOptions([
                        { value: '', label: 'Todos' },
                        ...result.tipos.map((t) => ({
                            value: t.value ?? '',
                            label: t.label ?? t.value ?? '',
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
                            filtersRef={transacoesContext}
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
                                categoriasLookup={categoriasLookup}
                                responsaveisLookup={responsaveisLookup}
                                onRowsChange={setTransacoesList}
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
