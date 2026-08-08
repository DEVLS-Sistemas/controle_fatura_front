import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { LojasList, LojasSearch } from 'interfaces/Lojas/LojasInterface'
import { LojasService } from 'services/Lojas/LojasService'
import LojasFilter from './LojasFilter/LojasFilter'
import LojasTable from './LojasTable/LojasTable'

type LojasFilterContextType = {
    firstEntry: boolean
} & LojasSearch & PaginateSearch

export const LojasFilterContext = createContext<LojasFilterContextType>({} as LojasFilterContextType)

const LojasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const lojasContext = useRef<LojasFilterContextType>({
        id: null,
        loja_id: null,
        nome: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [lojasList, setLojasList] = useState<PaginateInterface<LojasList>>()
    const lojasService = new LojasService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteLojasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await lojasService.listLojasPaginate({ ...data, perPage })
        lojasContext.palavra_chave = data.palavra_chave
        lojasContext.nome = data.nome
        lojasContext.ativo = data.ativo
        lojasContext.page = data.page
        lojasContext.firstEntry = true
        if (list) setLojasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteLojasList(lojasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <LojasFilterContext.Provider value={lojasContext}>
                <div className="page-content">
                    <Container fluid>
                        <LojasFilter getRemoteLojasList={getRemoteLojasList} />
                        {display ? (
                            <LojasTable
                                filters={lojasContext}
                                getData={getRemoteLojasList}
                                data={lojasList}
                                setPerPage={setPerPage}
                                perPage={perPage}
                                setPage={setPage}
                                page={page}
                            />
                        ) : (
                            <div className="text-center">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        )}
                    </Container>
                </div>
            </LojasFilterContext.Provider>
        </React.Fragment>
    )
}

export default LojasPage
