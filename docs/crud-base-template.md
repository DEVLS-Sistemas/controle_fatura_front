# CRUD Base Template — Frontend

> Baseado nos padrões definidos em `frontend-patterns.md`.  
> Substitua `{Entidade}` pelo nome real da entidade (ex: `Produtos`, `Marcas`, `Fornecedores`).  
> Substitua `{entidade}` pela versão em **camelCase/minúsculo** da rota (ex: `produtos`, `marcas`).  
> Substitua `{entidade_id}` pelo campo identificador (ex: `produto_id`, `marca_id`).

---

## ✅ Checklist de Criação

- [ ] Interface criada em `src/interfaces/{Entidade}/{Entidade}Interface.ts`
- [ ] Service criado em `src/services/{Entidade}/{Entidade}Service.ts`
- [ ] Index de export criado em `src/services/{Entidade}/index.ts`
- [ ] Página criada em `src/pages/Pages/{Entidade}/{Entidade}Page.tsx`
- [ ] Filter criado em `src/pages/Pages/{Entidade}/{Entidade}Filter/{Entidade}Filter.tsx`
- [ ] Table criada em `src/pages/Pages/{Entidade}/{Entidade}Table/{Entidade}Table.tsx`
- [ ] Form criado em `src/pages/Pages/{Entidade}/{Entidade}Form/{Entidade}Form.tsx`
- [ ] Rotas adicionadas em `src/Routes/allRoutes.tsx`
- [ ] Menu adicionado em `src/Layouts/LayoutMenuData.tsx`

---

## 1. Interface — `src/interfaces/{Entidade}/{Entidade}Interface.ts`

```typescript
export interface {Entidade}Search {
    id?: string | undefined | null
    {entidade_id}?: string | undefined | null
    descricao?: string | undefined | null
    palavra_chave?: string | null | undefined | unknown
}

export interface {Entidade}View {
    id?: number | undefined
    descricao?: string
    // ... campos de visualização
}

export interface {Entidade}List {
    id?: number | undefined
    descricao?: string
    // ... campos para listagem na tabela
}

export interface {Entidade}Model {
    id?: string | undefined | null
    {entidade_id}?: string | undefined | null
    descricao: string | undefined | null
    // ... demais campos do formulário
}

export interface Lookups{Entidade} {
    // ex: tipoOptions?: TipoModel[]
}

export interface {Entidade}Interface {
    getView{Entidade}(params: any): Promise<{Entidade}View | undefined>
    list{Entidade}Paginate(params: {Entidade}Search): Promise<any>
    AsyncList{Entidade}(params: {Entidade}Search): Promise<{Entidade}Model[] | undefined>
    create{Entidade}(params: {Entidade}Model): Promise<any>
    edit{Entidade}(params: {Entidade}Model): Promise<any>
    delete{Entidade}(id: number): Promise<any>
}

export const {Entidade}DefaultValues: {Entidade}Model = {
    id: null,
    {entidade_id}: null,
    descricao: null,
    // ... demais campos com valores padrão
}
```

---

## 2. Service — `src/services/{Entidade}/{Entidade}Service.ts`

```typescript
import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"
import { ValidationError } from "../../libs/api/exceptions/ValidationError"
import { PaginateInterface } from "interfaces/SystemInterfaces/PaginateInterface"
import {
    {Entidade}Interface,
    {Entidade}Model,
    {Entidade}Search,
    {Entidade}View,
} from "interfaces/{Entidade}/{Entidade}Interface"

export class {Entidade}Service implements {Entidade}Interface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = '{entidade}'          // ← URL base da API
        this.httpClient = new AxiosHttpClient()
    }

    async getView{Entidade}(params: any): Promise<{Entidade}View | undefined> {
        const response = await this.httpClient.get<{Entidade}View>({
            url: `${this.url}/listar/${params.id}`
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async list{Entidade}Paginate(params: {Entidade}Search): Promise<PaginateInterface<{Entidade}Search> | undefined> {
        try {
            const response = await this.httpClient.get<PaginateInterface<{Entidade}Search>>({
                url: this.url + '/listar',
                body: params
            })
            if (!response || !response.statusCode) throw new UnexpectedError()
            switch (response.statusCode) {
                case HttpStatusCode.ok: return response.body
                case HttpStatusCode.unauthorized: throw new AccessDeniedError()
                default: throw new UnexpectedError()
            }
        } catch (error) {
            console.error(`Erro ao buscar {entidade}:`, error)
            throw error
        }
    }

    async AsyncList{Entidade}(params: {Entidade}Search): Promise<{Entidade}Model[] | undefined> {
        const response = await this.httpClient.get<any>({
            url: this.url + '/{entidade}-list',
            body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

    async create{Entidade}(params: {Entidade}Model) {
        const response = await this.httpClient.post({
            url: this.url + '/cadastrar', body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }

    async edit{Entidade}(params: {Entidade}Model) {
        const response = await this.httpClient.put({
            url: this.url + '/editar', body: params
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }

    async delete{Entidade}(id: number) {
        const response = await this.httpClient.delete({
            url: this.url + '/excluir/' + id
        })
        switch (response.statusCode) {
            case HttpStatusCode.ok: return response
            case HttpStatusCode.noContent: return
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            case HttpStatusCode.invalidForm: throw new ValidationError(response.body)
            default: throw new UnexpectedError(response.message)
        }
    }
}
```

### Index de export — `src/services/{Entidade}/index.ts`

```typescript
export * from './{Entidade}Service'
```

---

## 3. Page — `src/pages/Pages/{Entidade}/{Entidade}Page.tsx`

```tsx
import React, { createContext, useContext, useEffect, useState } from "react"
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface'
import { {Entidade}List, {Entidade}Search } from 'interfaces/{Entidade}/{Entidade}Interface'
import { {Entidade}Service } from 'services/{Entidade}/{Entidade}Service'
import {Entidade}Filter from './{Entidade}Filter/{Entidade}Filter'
import {Entidade}Table from './{Entidade}Table/{Entidade}Table'

type {Entidade}FilterContextType = {
    firstEntry: boolean
} & {Entidade}Search & PaginateSearch

export const {Entidade}FilterContext = createContext<{Entidade}FilterContextType>({} as {Entidade}FilterContextType)

const {Entidade}Page = () => {
    const [display, setDisplay] = useState<boolean>(false)
    const {entidade}Context = useContext({Entidade}FilterContext)
    const [{entidade}List, set{Entidade}List] = useState<PaginateInterface<{Entidade}List>>()
    const {entidade}Service = new {Entidade}Service()

    const {Entidade}FilterContextValue: {Entidade}FilterContextType = {
        id: null,
        {entidade_id}: null,
        descricao: null,
        palavra_chave: null,
        page: 1,
        perPage: 5,
        showMoreFields: false,
        firstEntry: false,
    }

    const [perPage, setPerPage] = useState<number>(5)
    const [page, setPage] = useState(1)

    const getRemote{Entidade}List: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce((acc, k) => (!data[k] && delete acc[k], acc), data)
        data.perPage = perPage
        const list = await {entidade}Service.list{Entidade}Paginate({ ...data, perPage })
        {entidade}Context.palavra_chave = data.palavra_chave
        {entidade}Context.page = data.page
        {entidade}Context.firstEntry = true
        if (list) set{Entidade}List(list)
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getRemote{Entidade}List({entidade}Context)
    }, [perPage])

    return (
        <React.Fragment>
            <{Entidade}FilterContext.Provider value={{Entidade}FilterContextValue}>
                <div className="page-content">
                    <Container fluid>
                        <{Entidade}Filter getRemote{Entidade}List={getRemote{Entidade}List} />
                        {display ? (
                            <{Entidade}Table
                                filters={{entidade}Context}
                                getData={getRemote{Entidade}List}
                                data={{entidade}List}
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
            </{Entidade}FilterContext.Provider>
        </React.Fragment>
    )
}

export default {Entidade}Page
```

---

## 4. Filter — `src/pages/Pages/{Entidade}/{Entidade}Filter/{Entidade}Filter.tsx`

```tsx
import UiContent from "Components/Common/UiContent"
import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import {
    Breadcrumb, BreadcrumbItem, Button, Card, CardHeader, Col, Collapse, Row
} from "reactstrap"
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled"
import { {Entidade}Search } from "interfaces/{Entidade}/{Entidade}Interface"

export interface {Entidade}FilterProps {
    getRemote{Entidade}List: (data: any) => void
}

const {Entidade}Filter = ({ getRemote{Entidade}List }: {Entidade}FilterProps) => {
    const { handleSubmit, control, register } = useForm<{Entidade}Search>({ defaultValues: {} })
    const [showFilter, setShowFilter] = useState<boolean>(false)

    return (
        <React.Fragment>
            <UiContent />

            {/* Breadcrumb */}
            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <Link to="/dashboard" className="me-2">
                                <i className="bx bx-arrow-back bx-sm"></i>
                            </Link>
                            <h4 className="mb-0">{Entidade}</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                            <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                            <BreadcrumbItem active>{Entidade}</BreadcrumbItem>
                        </Breadcrumb>
                    </div>
                </Col>
            </Row>

            {/* Botão Adicionar + Filtros */}
            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-row justify-content-end align-items-center mb-4">
                        <Link to="add" className="btn btn-primary">
                            <i className="ri-add-circle-line align-middle me-1"></i> Add
                        </Link>
                    </div>
                </Col>
                <Col xl={12}>
                    <Card>
                        <CardHeader>
                            <div className="gap-2 flex-wrap">
                                <Row>
                                    <Col md={4}>
                                        <Button onClick={() => setShowFilter(!showFilter)} color="primary" className="mb-1">
                                            Filtros
                                        </Button>
                                    </Col>
                                    {!showFilter && (
                                        <Col md={8}>
                                            <form onSubmit={handleSubmit(getRemote{Entidade}List)}>
                                                <div className="input-group">
                                                    <input
                                                        {...register("palavra_chave")}
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Buscar..."
                                                    />
                                                    <button className="btn btn-success" type="submit">
                                                        <i className="ri-search-line align-middle me-1"></i> Buscar
                                                    </button>
                                                </div>
                                            </form>
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            {/* Filtros expandidos */}
                            <Row>
                                <Col>
                                    <Collapse isOpen={showFilter} className="multi-collapse mt-3">
                                        <form
                                            className="px-0 my-0 m-2"
                                            id="form-search"
                                            onSubmit={handleSubmit(getRemote{Entidade}List)}
                                        >
                                            <Row>
                                                {/* Adicione aqui os campos de filtro avançado */}
                                                {/* Exemplo:
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="descricao" className="form-label">Descrição</Label>
                                                        <InputTextControlled<{Entidade}Search>
                                                            field={"descricao"}
                                                            control={control}
                                                        />
                                                    </div>
                                                </Col>
                                                */}
                                            </Row>
                                            <Row className="mt-5">
                                                <div className="d-flex flex-row justify-content-end align-items-center">
                                                    <Col md={6}>
                                                        <InputTextControlled<{Entidade}Search>
                                                            field={"palavra_chave"}
                                                            control={control}
                                                            placeholder="Buscar..."
                                                        />
                                                    </Col>
                                                    <Col md={2} className="me-3">
                                                        <button className="btn btn-success form-control ms-3" type="submit">
                                                            Buscar
                                                        </button>
                                                    </Col>
                                                </div>
                                            </Row>
                                        </form>
                                    </Collapse>
                                </Col>
                            </Row>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default {Entidade}Filter
```

---

## 5. Table — `src/pages/Pages/{Entidade}/{Entidade}Table/{Entidade}Table.tsx`

```tsx
import UiContent from "Components/Common/UiContent"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    Button, ButtonGroup, Card, CardBody, Col, DropdownItem,
    DropdownMenu, DropdownToggle, Label, Row, UncontrolledDropdown
} from "reactstrap"
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface"
import CustomModal from "Components/ComponentController/Modal/CustomModal"
import { useNavegacao } from "helpers/functions_helpers"
import { {Entidade}List, {Entidade}Search } from "interfaces/{Entidade}/{Entidade}Interface"
import { {Entidade}Service } from "services/{Entidade}/{Entidade}Service"

export interface {Entidade}TableProps {
    data: PaginateInterface<{Entidade}List> | undefined
    getData: (data: PaginateSearch & {Entidade}Search) => void
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
    filters: any
}

export const {Entidade}Table = ({ data, getData, setPerPage, setPage, perPage, filters }: {Entidade}TableProps) => {
    const [optPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ])
    const {entidade}Service = new {Entidade}Service()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const { voltarParaRotaAnterior } = useNavegacao()

    const toggleModal = () => setModalIsOpen(!modalIsOpen)

    const handleRemoteDelete = async (id: number) => {
        try {
            await {entidade}Service.delete{Entidade}(id)
            if (data) await handleThisRoute(data.first_page_url)
            toggleModal()
        } catch (error) {
            console.error('Erro ao excluir:', error)
        }
    }

    const handleThisRoute = async (url: string) => {
        try {
            const new_url = new URL(url)
            await getData({
                page: Number(new_url.searchParams.get('page')),
                palavra_chave: new_url.searchParams.get('palavra_chave'),
                // Adicione demais parâmetros de filtro conforme necessário
            })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (data) handleThisRoute(data.first_page_url)
    }, [perPage])

    return (
        <React.Fragment>
            <UiContent />
            <Row>
                <Col xl={12}>
                    <Card>
                        <CardBody>
                            <div className="live-preview mt-1">
                                {data && data.total === 0 ? (
                                    <div className="bg-primary text-white border-0 alert alert-primary fade show text-center">
                                        INFORME OS FILTROS DESEJADOS E CLIQUE EM BUSCAR!
                                    </div>
                                ) : !data ? (
                                    <div className="bg-danger text-white border-0 alert alert-danger fade show text-center">
                                        NENHUM RESULTADO ENCONTRADO!
                                    </div>
                                ) : (
                                    <>
                                        {/* Seletor de itens por página */}
                                        <Row className="d-flex align-items-center g-3 text-center text-sm-start">
                                            <Col lg={12}>
                                                <Col lg={2}>
                                                    <div className="d-flex flex-row align-items-center">
                                                        <Label className="form-label me-3">Mostrar</Label>
                                                        <select
                                                            className="form-select d-flex ps-3 mb-3"
                                                            style={{ width: "100px" }}
                                                            value={perPage}
                                                            onChange={(e) => setPerPage(Number(e.target.value))}
                                                        >
                                                            {optPerPage.map((item) => (
                                                                <option key={item.value} value={item.value}>{item.label}</option>
                                                            ))}
                                                        </select>
                                                        <Label className="form-label ms-3">resultados</Label>
                                                    </div>
                                                </Col>
                                            </Col>
                                        </Row>

                                        {/* Tabela */}
                                        <Row>
                                            <Col xl={12}>
                                                <div className="table-responsive">
                                                    <table className="table align-middle table-nowrap table-striped-columns mb-0 text-center">
                                                        <thead className="table-light">
                                                            <tr>
                                                                {/* ↓ Ajuste os cabeçalhos conforme os campos da entidade */}
                                                                <th scope="col" className="text-start">Descrição</th>
                                                                <th scope="col" style={{ width: "150px" }}>Ação</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.data.map((row: any, index: number) => (
                                                                <tr key={row.id ?? index}>
                                                                    {/* ↓ Ajuste as células conforme os campos da entidade */}
                                                                    <td className="text-start">{row.descricao}</td>
                                                                    <td>
                                                                        <ButtonGroup>
                                                                            <UncontrolledDropdown direction="down">
                                                                                <DropdownToggle tag="button" className="btn">
                                                                                    <i className="ri-more-2-fill"></i>
                                                                                </DropdownToggle>
                                                                                <DropdownMenu style={{ zIndex: '999' }}>
                                                                                    <Link to={`/{entidade}/view/${row.id}`} state={{ source: row }}>
                                                                                        <DropdownItem>Visualizar</DropdownItem>
                                                                                    </Link>
                                                                                    <Link to={`/{entidade}/edit/${row.id}`} state={{ source: row }}>
                                                                                        <DropdownItem>Editar</DropdownItem>
                                                                                    </Link>
                                                                                    <DropdownItem
                                                                                        onClick={() => {
                                                                                            setSelectedId(row.id)
                                                                                            toggleModal()
                                                                                        }}
                                                                                    >
                                                                                        Excluir
                                                                                    </DropdownItem>
                                                                                    <CustomModal
                                                                                        isOpen={modalIsOpen}
                                                                                        toggle={toggleModal}
                                                                                        title="Confirmação de Exclusão"
                                                                                        delete={true}
                                                                                        body=""
                                                                                        onConfirmDelete={() => handleRemoteDelete(selectedId!)}
                                                                                    />
                                                                                </DropdownMenu>
                                                                            </UncontrolledDropdown>
                                                                        </ButtonGroup>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Paginação */}
                                        <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                            <Col sm="12">
                                                <div className="text-muted">
                                                    Exibindo <span className="fw-semibold ms-1">{data.per_page}</span> de
                                                    <span className="fw-semibold"> {data.total}</span> Resultados
                                                </div>
                                            </Col>
                                            {/* Desktop */}
                                            <Col sm="12" className="d-none d-sm-flex justify-content-end gap-2 flex-wrap">
                                                <ul className="pagination pagination-md mb-0">
                                                    <li className={data.current_page === 1 ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[0].url)}>Anterior</Link>
                                                    </li>
                                                </ul>
                                                <ul className="pagination pagination-md mb-0 flex-wrap">
                                                    {data.links.map((item: any, key: number) => {
                                                        if (key === 0 || key === data.links.length - 1) return null
                                                        return (
                                                            <li key={item.label} className={`page-item ${item.active ? 'active' : ''}`}>
                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>{item.label}</Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <ul className="pagination pagination-md mb-0">
                                                    <li className={data.current_page === data.last_page ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[data.links.length - 1].url)}>Próximo</Link>
                                                    </li>
                                                </ul>
                                            </Col>
                                            {/* Mobile */}
                                            <Col xs="12" className="d-block d-sm-none">
                                                <ul className="pagination pagination-md justify-content-center mb-2">
                                                    <li className={data.current_page === 1 ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[0].url)}>Anterior</Link>
                                                    </li>
                                                </ul>
                                                <ul className="pagination pagination-md justify-content-center mb-2 flex-wrap">
                                                    {data.links.map((item: any, key: number) => {
                                                        if (key === 0 || key === data.links.length - 1) return null
                                                        return (
                                                            <li key={item.label} className={`page-item ${item.active ? 'active' : ''}`}>
                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>{item.label}</Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <ul className="pagination pagination-md justify-content-center mb-0">
                                                    <li className={data.current_page === data.last_page ? "page-item disabled" : "page-item"}>
                                                        <Link to="#" className="page-link" onClick={() => handleThisRoute(data.links[data.links.length - 1].url)}>Próximo</Link>
                                                    </li>
                                                </ul>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <div className="hstack gap-2 justify-content-end">
                        <Link to="/dashboard" className="btn btn-soft-success">Voltar</Link>
                    </div>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default {Entidade}Table
```

---

## 6. Form — `src/pages/Pages/{Entidade}/{Entidade}Form/{Entidade}Form.tsx`

```tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import { required } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled'
import { {Entidade}DefaultValues, {Entidade}Model } from 'interfaces/{Entidade}/{Entidade}Interface'
import { {Entidade}Service } from 'services/{Entidade}/{Entidade}Service'

const {Entidade}Form = () => {
    const { state } = useLocation()
    const [record, setRecord] = useState<{Entidade}Model>(state ? state.source : {Entidade}DefaultValues)
    const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<{Entidade}Model>({
        defaultValues: record
    })
    const [display, setDisplay] = useState<boolean>(false)
    const { voltarParaRotaAnterior } = useNavegacao()
    const navigate = useNavigate()
    const {entidade}Service = new {Entidade}Service()

    // Opcional: carrega lookups (selects remotos)
    const getLookups = async (): Promise<void> => {
        // const lookups = await {entidade}Service.getLookups{Entidade}()
        // if (lookups) { ... preenche states de options }
    }

    const onSubmit: SubmitHandler<{Entidade}Model> = async (data: any) => {
        try {
            if (record.{entidade_id}) {
                await {entidade}Service.edit{Entidade}(data)
            } else {
                const id = await {entidade}Service.create{Entidade}(data)
                setValue('id', id)
            }
            navigate(`/{entidade}`)
        } catch (error: any) {
            throw error
        }
    }

    useEffect(() => {
        setTimeout(() => setDisplay(true), 300)
    }, [])

    useEffect(() => {
        getLookups()
    }, [])

    useEffect(() => {
        setActiveMenu('/{entidade}')
    }, [])

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/{entidade}"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">
                                        {record.{entidade_id} ? 'Editar' : 'Adicionar'} {Entidade}
                                    </h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/{entidade}">{Entidade}</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>
                                        {record.{entidade_id} ? 'Editar' : 'Adicionar'} {Entidade}
                                    </BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Row>
                                            {/* ↓ Adicione os campos do formulário aqui */}
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="descricao" className="form-label">Descrição</Label>
                                                    <InputTextControlled<{Entidade}Model>
                                                        field={"descricao"}
                                                        control={control}
                                                        rules={required}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row className="mt-5">
                                            <Col md={12}>
                                                <div className="hstack gap-2 justify-content-end">
                                                    <button type="submit" className="btn btn-primary">Salvar</button>
                                                    <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default {Entidade}Form
```

---

## 7. Rotas — `src/Routes/allRoutes.tsx`

Adicione dentro do array de rotas:

```tsx
// {Entidade}
{ path: "/{entidade}", component: <{Entidade}Page /> },
{ path: "/{entidade}/add", component: <{Entidade}Form /> },
{ path: "/{entidade}/edit/:{entidade_id}", component: <{Entidade}Form /> },
```

---

## 8. Menu Sidebar — `src/Layouts/LayoutMenuData.tsx`

⚠️ **Regras Importantes de Navegação em Menus:**

Sempre que criar componentes de menu ou menus expansíveis (com submenus), adicione `stateVariables` logo abaixo de `link` e adicione o `set` do estado correspondente dentro da função `click`.

Ao adicionar sua declaração, não use manipulação condicional de rotas nem injeção de classes no DOM.

**❌ PADRÃO INCORRETO:**
```typescript
         if (iscurrentState === 'Filamentos') {
             history("/cores"); // Redirecionar ao clicar na raiz ou apenas expandir, o comum no template é history e layout
             document.body.classList.add('twocolumn-panel');
         }
```

Use o padrão para desativar os outros states condicionalmente quando não estiver no menu atual. Certifique-se de que se `iscurrentState` não for o do seu menu, o estado dele reseta:

**✅ PADRÃO CORRETO (Regra no `useEffect` do LayoutMenuData):**
```typescript
        if (iscurrentState !== '{Entidade}') {
            setIs{Entidade}(false);
        }
```

### Exemplo de Menu com Submenus:

```tsx
{
    id: "{entidade}",
    label: "{Entidade}",
    icon: "ri-settings-line",
    link: "/#",
    stateVariables: is{Entidade}, // ← Adicionar sempre em caso de ter subitems
    click: function (e: any) {
        e.preventDefault();
        setIs{Entidade}(!is{Entidade}); // ← Usar o Setter de estado
        setIscurrentState('{Entidade}');
        updateIconSidebar(e);
    },
    subItems: [
        {
            id: "{entidade}-lista",
            label: "Lista",
            link: "/{entidade}",
            parentId: "{entidade}",
        }
    ]
},
```

### Sub-item (dentro de um menu pai existente):

```tsx
{
    id: "{entidade}-novo",
    label: "Novo {Entidade}",
    link: "/{entidade}/add",
    parentId: "id-do-menu-pai",
},
```
---

## 📌 Convenções de Nomenclatura

| Elemento           | Padrão                           | Exemplo                    |
|--------------------|----------------------------------|----------------------------|
| Pasta / Componente | PascalCase                       | `Produtos`, `ProdutosForm` |
| URL de rota        | kebab-case                       | `/tipos-produto`           |
| URL da API (url)   | kebab-case                       | `tipos-produto`            |
| Campos de interface| camelCase                        | `produto_id`, `descricao`  |
| Service class      | `{Entidade}Service`              | `ProdutosService`          |
| Context            | `{Entidade}FilterContext`        | `ProdutosFilterContext`    |

---

## 📌 Observações Importantes

1. **`palavra_chave`** deve sempre estar presente em `{Entidade}Search` — é o campo de busca rápida.
2. **`{entidade_id}`** é o identificador que diferencia **edição** de **criação** no Form.
3. O **estado** passado via `state={{ source: row }}` no `Link` de editar é como o Form recebe os dados atuais.
4. O **`setActiveMenu`** no Form garante que o item correto do sidebar fique ativo.
5. O **`handleThisRoute`** da Table usa a URL paginada do backend para recarregar os dados após exclusão ou mudança de página.
