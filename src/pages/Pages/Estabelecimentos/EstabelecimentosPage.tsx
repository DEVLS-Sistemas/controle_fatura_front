import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { EstabelecimentosList, EstabelecimentosSearch } from 'interfaces/Estabelecimentos/EstabelecimentosInterface'
import { EstabelecimentosService } from 'services/Estabelecimentos/EstabelecimentosService'
import EstabelecimentosFilter from './EstabelecimentosFilter/EstabelecimentosFilter'
import EstabelecimentosTable from './EstabelecimentosTable/EstabelecimentosTable'

type EstabelecimentosFilterContextType = {
    firstEntry: boolean
} & EstabelecimentosSearch & PaginateSearch

export const EstabelecimentosFilterContext = createContext<EstabelecimentosFilterContextType>({} as EstabelecimentosFilterContextType)

const EstabelecimentosPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const estabelecimentosContext = useRef<EstabelecimentosFilterContextType>({
        id: null,
        estabelecimento_id: null,
        nome: null,
        ativo: null,
        categoria_padrao_id: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [estabelecimentosList, setEstabelecimentosList] = useState<PaginateInterface<EstabelecimentosList>>()
    const estabelecimentosService = new EstabelecimentosService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteEstabelecimentosList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await estabelecimentosService.listEstabelecimentosPaginate({ ...data, perPage })
        estabelecimentosContext.palavra_chave = data.palavra_chave
        estabelecimentosContext.nome = data.nome
        estabelecimentosContext.ativo = data.ativo
        estabelecimentosContext.page = data.page
        estabelecimentosContext.firstEntry = true
        if (list) setEstabelecimentosList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteEstabelecimentosList(estabelecimentosContext)
    }, [perPage])

    return (
        <React.Fragment>
            <EstabelecimentosFilterContext.Provider value={estabelecimentosContext}>
                <div className="page-content">
                    <Container fluid>
                        <EstabelecimentosFilter getRemoteEstabelecimentosList={getRemoteEstabelecimentosList} />
                        {display ? (
                            <EstabelecimentosTable
                                filters={estabelecimentosContext}
                                getData={getRemoteEstabelecimentosList}
                                data={estabelecimentosList}
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
            </EstabelecimentosFilterContext.Provider>
        </React.Fragment>
    )
}

export default EstabelecimentosPage
