import React, { createContext, useEffect, useRef, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { SubcategoriasList, SubcategoriasSearch } from 'interfaces/Subcategorias/SubcategoriasInterface'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'
import SubcategoriasFilter from './SubcategoriasFilter/SubcategoriasFilter'
import SubcategoriasTable from './SubcategoriasTable/SubcategoriasTable'

type SubcategoriasFilterContextType = {
    firstEntry: boolean
} & SubcategoriasSearch & PaginateSearch

export const SubcategoriasFilterContext = createContext<SubcategoriasFilterContextType>({} as SubcategoriasFilterContextType)

const SubcategoriasPage = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const subcategoriasContext = useRef<SubcategoriasFilterContextType>({
        id: null,
        subcategoria_id: null,
        nome: null,
        ativo: null,
        categoria_id: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        firstEntry: false,
    }).current

    const [subcategoriasList, setSubcategoriasList] = useState<PaginateInterface<SubcategoriasList>>()
    const subcategoriasService = new SubcategoriasService()
    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemoteSubcategoriasList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce(
            (acc, k) => (!data[k] && data[k] !== 0 && data[k] !== false && delete acc[k], acc),
            data
        )
        data.perPage = perPage
        const list = await subcategoriasService.listSubcategoriasPaginate({ ...data, perPage })
        subcategoriasContext.palavra_chave = data.palavra_chave
        subcategoriasContext.nome = data.nome
        subcategoriasContext.ativo = data.ativo
        subcategoriasContext.categoria_id = data.categoria_id
        subcategoriasContext.page = data.page
        subcategoriasContext.firstEntry = true
        if (list) setSubcategoriasList(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemoteSubcategoriasList(subcategoriasContext)
    }, [perPage])

    return (
        <React.Fragment>
            <SubcategoriasFilterContext.Provider value={subcategoriasContext}>
                <div className="page-content">
                    <Container fluid>
                        <SubcategoriasFilter getRemoteSubcategoriasList={getRemoteSubcategoriasList} />
                        {display ? (
                            <SubcategoriasTable
                                filters={subcategoriasContext}
                                getData={getRemoteSubcategoriasList}
                                data={subcategoriasList}
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
            </SubcategoriasFilterContext.Provider>
        </React.Fragment>
    )
}

export default SubcategoriasPage
