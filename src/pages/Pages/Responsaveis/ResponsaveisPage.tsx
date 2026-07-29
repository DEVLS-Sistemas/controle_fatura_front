import React, { createContext, useContext, useEffect, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { ResponsaveisList, ResponsaveisSearch } from 'interfaces/Responsaveis/ResponsaveisInterface'
import { ResponsaveisService } from 'services/Responsaveis/ResponsaveisService'
import ResponsaveisFilter from './ResponsaveisFilter/ResponsaveisFilter'
import ResponsaveisTable from './ResponsaveisTable/ResponsaveisTable'

type ResponsaveisFilterContextType = {
    firstEntry: boolean
} & ResponsaveisSearch & PaginateSearch

export const ResponsaveisFilterContext = createContext<ResponsaveisFilterContextType>({} as ResponsaveisFilterContextType)

const ResponsaveisPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const responsaveisContext = useContext(ResponsaveisFilterContext)
    const [responsaveisList, setResponsaveisList] = useState<PaginateInterface<ResponsaveisList>>()
    const responsaveisService = new ResponsaveisService()

    const ResponsaveisFilterContextValue: ResponsaveisFilterContextType = {
        id: null,
        responsavel_id: null,
        nome: null,
        tipo: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }

    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteResponsaveisList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce((acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc), data)
        data.perPage = perPage
        const list = await responsaveisService.listResponsaveisPaginate({ ...data, perPage })
        responsaveisContext.palavra_chave = data.palavra_chave
        responsaveisContext.page = data.page
        responsaveisContext.firstEntry = true
        if (list) setResponsaveisList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteResponsaveisList(responsaveisContext)
    }, [perPage])

    return (
        <React.Fragment>
            <ResponsaveisFilterContext.Provider value={ResponsaveisFilterContextValue}>
                <div className="page-content">
                    <Container fluid>
                        <ResponsaveisFilter getRemoteResponsaveisList={getRemoteResponsaveisList} />
                        {display ? (
                            <ResponsaveisTable
                                filters={responsaveisContext}
                                getData={getRemoteResponsaveisList}
                                data={responsaveisList}
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
            </ResponsaveisFilterContext.Provider>
        </React.Fragment>
    )
}

export default ResponsaveisPage
