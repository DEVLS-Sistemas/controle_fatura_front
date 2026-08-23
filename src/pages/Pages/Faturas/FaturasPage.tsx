import React, { createContext, useContext, useEffect, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { FaturasCartaoGroup, FaturasSearch } from 'interfaces/Faturas/FaturasInterface'
import { FaturasService } from 'services/Faturas/FaturasService'
import FaturasFilter from './FaturasFilter/FaturasFilter'
import FaturasTable from './FaturasTable/FaturasTable'

type FaturasFilterContextType = {
    firstEntry: boolean
} & FaturasSearch & PaginateSearch

export const FaturasFilterContext = createContext<FaturasFilterContextType>({} as FaturasFilterContextType)

const FaturasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const faturasContext = useContext(FaturasFilterContext)
    const [faturasList, setFaturasList] = useState<PaginateInterface<FaturasCartaoGroup>>()
    const faturasService = new FaturasService()

    const FaturasFilterContextValue: FaturasFilterContextType = {
        id: null,
        fatura_id: null,
        cartao_id: null,
        pessoa_id: null,
        mes: null,
        ano: null,
        status: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }

    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteFaturasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce((acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc), data)
        data.perPage = perPage
        const list = await faturasService.listFaturasPaginate({ ...data, perPage })
        faturasContext.palavra_chave = data.palavra_chave
        faturasContext.page = data.page
        faturasContext.firstEntry = true
        if (list) setFaturasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteFaturasList(faturasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <FaturasFilterContext.Provider value={FaturasFilterContextValue}>
                <div className="page-content">
                    <Container fluid>
                        <FaturasFilter getRemoteFaturasList={getRemoteFaturasList} />
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
