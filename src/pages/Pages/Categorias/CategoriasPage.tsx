import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { CategoriasList, CategoriasSearch } from 'interfaces/Categorias/CategoriasInterface'
import { CategoriasService } from 'services/Categorias/CategoriasService'
import CategoriasFilter from './CategoriasFilter/CategoriasFilter'
import CategoriasTable from './CategoriasTable/CategoriasTable'

type CategoriasFilterContextType = {
    firstEntry: boolean
} & CategoriasSearch & PaginateSearch

export const CategoriasFilterContext = createContext<CategoriasFilterContextType>({} as CategoriasFilterContextType)

const CategoriasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const categoriasContext = useRef<CategoriasFilterContextType>({
        id: null,
        categoria_id: null,
        nome: null,
        ativo: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [categoriasList, setCategoriasList] = useState<PaginateInterface<CategoriasList>>()
    const categoriasService = new CategoriasService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteCategoriasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await categoriasService.listCategoriasPaginate({ ...data, perPage })
        categoriasContext.palavra_chave = data.palavra_chave
        categoriasContext.nome = data.nome
        categoriasContext.ativo = data.ativo
        categoriasContext.page = data.page
        categoriasContext.firstEntry = true
        if (list) setCategoriasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteCategoriasList(categoriasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <CategoriasFilterContext.Provider value={categoriasContext}>
                <div className="page-content">
                    <Container fluid>
                        <CategoriasFilter getRemoteCategoriasList={getRemoteCategoriasList} />
                        {display ? (
                            <CategoriasTable
                                filters={categoriasContext}
                                getData={getRemoteCategoriasList}
                                data={categoriasList}
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
            </CategoriasFilterContext.Provider>
        </React.Fragment>
    )
}

export default CategoriasPage
