import BreadCrumb from 'Components/Common/BreadCrumb';
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react"
import { Container, Spinner } from 'reactstrap';
import UsuarioTable from './UsuarioTable/UsuarioTable';
import UsuarioFilter from './UsuarioFilter/UsuarioFilter';
import { UsuarioService } from 'services/UsuarioService';

import { UsuarioList, UsuarioSearch } from 'interfaces/UsuarioInterface';
import { SubmitHandler } from 'react-hook-form';
import { PaginateInterface, PaginateSearch } from 'interfaces/SystemInterfaces/PaginateInterface';

type UsuarioFilterContextType = {

} & UsuarioSearch & PaginateSearch

export const UsuarioFilterContext = createContext<UsuarioFilterContextType>({} as UsuarioFilterContextType)
const UsuarioFilterContextValue = {
    perPage: 5,
    input_text: null,
    input_date: null,
    select_list: null,
    async_select_list: null,
    multiple_select_list: null,
    checkbox_a: null,
    checkbox_b: null,
    checkbox_c: null,
    switch_checkbox: null,
    radio: null,
    palavra_chave: null,
}

const UsuarioPage = () => {
    // document.title = "Widgets | Velzon - React Admin & Dashboard Template";
    const [display, setDisplay] = useState<boolean>(false)
    const usuarioContext = useContext(UsuarioFilterContext)
    const usuarioService = new UsuarioService();
    const [usuarioList, setUsuariosList] = useState<PaginateInterface<UsuarioList>>()
    const [perPage, setPerPage] = useState<number>(5);
    const [page, setPage] = useState(1)

    const getRemoteUsuarioList: SubmitHandler<any> = async (data): Promise<void> => {
        Object.keys(data).reduce((acc, k) => (!data[k] && delete acc[k], acc), data)

        data.perPage = perPage
        // const list = await usuarioService.listUsuariosPaginate({ ...data, perPage: perPage })
        usuarioContext.page = data.page
        usuarioContext.perPage = data.perPage

        const data_example: any = {
            current_page: 2,
            total: 1,
            to: 5,
            per_page: perPage,
            prev_page_url: null,
            last_page: 9,
            from: 1,
            data: [
                {
                    id: 1,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Maysa Araujo da Conceição',
                    nascimento: "2000-11-25",
                    sexo: 1,
                    ativo: true,
                    progresso:19
                },
                {
                    id: 2,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Leonardo da Silva Ferreira',
                    nascimento: "1990-07-24",
                    sexo: 2,
                    ativo: true,
                    progresso:20
                },
                {
                    id: 3,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Maria Jailza da Silva',
                    nascimento: "1964-09-24",
                    sexo: 1,
                    ativo: true,
                    progresso:79
                },
                {
                    id: 4,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Franscisco Hélio da Silva',
                    nascimento: "1977-07-15",
                    sexo: 2,
                    ativo: false,
                    progresso:80
                },
                {
                    id: 5,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Joyce Gisele Correia da Silva',
                    nascimento: "2001-04-14",
                    sexo: 1,
                    ativo: true,
                    progresso:80
                },
                {
                    id: 6,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Jacqueline da Silva Ferreira',
                    nascimento: "1988-04-08",
                    sexo: 1,
                    ativo: true,
                    progresso:81
                },
                {
                    id: 7,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Jean Venancio da Silva',
                    nascimento: "1987-10-05",
                    sexo: 2,
                    ativo: true,
                    progresso:19
                },
                {
                    id: 8,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Andre Felipe Ferreia da Silva',
                    nascimento: "2018-11-19",
                    sexo: 2,
                    ativo: true,
                    progresso:21
                },
                {
                    id: 9,
                    avatar: 'assets/images/users/avatar-3.jpg',
                    image: "./assets/images/users/avatar-3.jpg",
                    nome: 'Antonella Beatriz Ferreira da Silva',
                    nascimento: "2021-09-04",
                    sexo: 1,
                    ativo: true,
                    progresso:95
                }
            ],
            links:
                [
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=1&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "&laquo; Anterior",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=1&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "1",
                        "active": true
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=2&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "2",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=3&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "3",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=4&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "4",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=5&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "5",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=6&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "6",
                        "active": false
                    },
                    {
                        "url": null,
                        "label": "...",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=8&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "8",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=9&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "9",
                        "active": false
                    },
                    {
                        "url": "http://localhost:8000/api-web/projetos/listar?page=3&perPage=5&url=http%3A%2F%2Flocalhost%3A8000%2Fapi-web%2Fprojetos%2Flistar&query%5Bpage%5D=2&query%5BperPage%5D=5",
                        "label": "Próximo &raquo;",
                        "active": false
                    }
                ]



        }


        // if (list) {
        setUsuariosList(data_example)
        // }
    }

    useEffect(() => {
        setTimeout(() => {
            setDisplay(true)
        }, 300);
    }, [])

    useEffect(() => {
        getRemoteUsuarioList(usuarioContext)
    }, [perPage])
    return (
        <React.Fragment>
            <UsuarioFilterContext.Provider value={UsuarioFilterContextValue}>
                <div className="page-content">
                    <Container fluid>
                        <UsuarioFilter getRemoteUsuarioList={getRemoteUsuarioList} />
                        {display ?
                            <UsuarioTable getData={getRemoteUsuarioList} data={usuarioList} setPerPage={setPerPage} perPage={perPage} setPage={setPage} page={page} />
                            : <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                    </Container>
                </div>
            </UsuarioFilterContext.Provider>
        </React.Fragment>
    );
};

export default UsuarioPage;
