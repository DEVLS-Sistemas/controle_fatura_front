import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { PlataformasList, PlataformasSearch } from 'interfaces/Plataformas/PlataformasInterface'
import { PlataformasService } from 'services/Plataformas/PlataformasService'
import PlataformasFilter from './PlataformasFilter/PlataformasFilter'
import PlataformasTable from './PlataformasTable/PlataformasTable'

type PlataformasFilterContextType = {
    firstEntry: boolean
} & PlataformasSearch & PaginateSearch

export const PlataformasFilterContext = createContext<PlataformasFilterContextType>({} as PlataformasFilterContextType)

const PlataformasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const plataformasContext = useRef<PlataformasFilterContextType>({
        id: null,
        plataforma_id: null,
        nome: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [plataformasList, setPlataformasList] = useState<PaginateInterface<PlataformasList>>()
    const plataformasService = new PlataformasService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemotePlataformasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await plataformasService.listPlataformasPaginate({ ...data, perPage })
        plataformasContext.palavra_chave = data.palavra_chave
        plataformasContext.nome = data.nome
        plataformasContext.ativo = data.ativo
        plataformasContext.page = data.page
        plataformasContext.firstEntry = true
        if (list) setPlataformasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemotePlataformasList(plataformasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <PlataformasFilterContext.Provider value={plataformasContext}>
                <div className="page-content">
                    <Container fluid>
                        <PlataformasFilter getRemotePlataformasList={getRemotePlataformasList} />
                        {display ? (
                            <PlataformasTable
                                filters={plataformasContext}
                                getData={getRemotePlataformasList}
                                data={plataformasList}
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
            </PlataformasFilterContext.Provider>
        </React.Fragment>
    )
}

export default PlataformasPage
