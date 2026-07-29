import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { CartoesList, CartoesSearch } from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'
import CartoesFilter from './CartoesFilter/CartoesFilter'
import CartoesTable from './CartoesTable/CartoesTable'

type CartoesFilterContextType = {
    firstEntry: boolean
} & CartoesSearch & PaginateSearch

export const CartoesFilterContext = createContext<CartoesFilterContextType>({} as CartoesFilterContextType)

const CartoesPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const cartoesContext = useRef<CartoesFilterContextType>({
        id: null,
        cartao_id: null,
        nome: null,
        bandeira: null,
        banco: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [cartoesList, setCartoesList] = useState<PaginateInterface<CartoesList>>()
    const cartoesService = new CartoesService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteCartoesList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await cartoesService.listCartoesPaginate({ ...data, perPage })
        cartoesContext.palavra_chave = data.palavra_chave
        cartoesContext.nome = data.nome
        cartoesContext.bandeira = data.bandeira
        cartoesContext.banco = data.banco
        cartoesContext.page = data.page
        cartoesContext.firstEntry = true
        if (list) setCartoesList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteCartoesList(cartoesContext)
    }, [perPage])

    return (
        <React.Fragment>
            <CartoesFilterContext.Provider value={cartoesContext}>
                <div className="page-content">
                    <Container fluid>
                        <CartoesFilter getRemoteCartoesList={getRemoteCartoesList} />
                        {display ? (
                            <CartoesTable
                                filters={cartoesContext}
                                getData={getRemoteCartoesList}
                                data={cartoesList}
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
            </CartoesFilterContext.Provider>
        </React.Fragment>
    )
}

export default CartoesPage
