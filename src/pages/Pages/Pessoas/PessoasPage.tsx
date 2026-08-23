import React, { createContext, useContext, useEffect, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { PessoasList, PessoasSearch } from 'interfaces/Pessoas/PessoasInterface'
import { PessoasService } from 'services/Pessoas/PessoasService'
import PessoasFilter from './PessoasFilter/PessoasFilter'
import PessoasTable from './PessoasTable/PessoasTable'

type PessoasFilterContextType = {
    firstEntry: boolean
} & PessoasSearch & PaginateSearch

export const PessoasFilterContext = createContext<PessoasFilterContextType>({} as PessoasFilterContextType)

const PessoasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const pessoasContext = useContext(PessoasFilterContext)
    const [pessoasList, setPessoasList] = useState<PaginateInterface<PessoasList>>()
    const pessoasService = new PessoasService()

    const PessoasFilterContextValue: PessoasFilterContextType = {
        id: null,
        pessoa_id: null,
        nome: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }

    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemotePessoasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce((acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc), data)
        data.perPage = perPage
        const list = await pessoasService.listPessoasPaginate({ ...data, perPage })
        pessoasContext.palavra_chave = data.palavra_chave
        pessoasContext.page = data.page
        pessoasContext.firstEntry = true
        if (list) setPessoasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemotePessoasList(pessoasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <PessoasFilterContext.Provider value={PessoasFilterContextValue}>
                <div className="page-content">
                    <Container fluid>
                        <PessoasFilter getRemotePessoasList={getRemotePessoasList} />
                        {display ? (
                            <PessoasTable
                                filters={pessoasContext}
                                getData={getRemotePessoasList}
                                data={pessoasList}
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
            </PessoasFilterContext.Provider>
        </React.Fragment>
    )
}

export default PessoasPage
