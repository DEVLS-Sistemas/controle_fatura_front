import UiContent from "Components/Common/UiContent";
import { useNavegacao } from 'helpers/functions_helpers';
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ButtonGroup, Card, CardBody, Col, DropdownItem, DropdownMenu, DropdownToggle, Label, Row, UncontrolledDropdown } from "reactstrap";
import './UsuarioTableCss.css';
import { PaginateInterface, PaginateSearch, PerPageProps } from "interfaces/SystemInterfaces/PaginateInterface";
import { UsuarioList, UsuarioSearch } from "interfaces/UsuarioInterface";

export interface UsuarioTableProps {
    data: PaginateInterface<UsuarioList> | undefined,
    getData: (data: PaginateSearch & UsuarioSearch) => void,
    setPerPage: (perPage: number) => void
    setPage: (page: number) => void
    page: number
    perPage: number
}

export const UsuarioTable = ({ data, getData, setPerPage, setPage, perPage, }: UsuarioTableProps) => {
    const [optPerPage, setOptPerPage] = useState<PerPageProps[]>([
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 20, label: "20" },
        { value: 50, label: "50" },
        { value: 100, label: "100" },
    ]);

    const handleThisRoute = async (url: string) => {
        try {
            const new_url = new URL(url);

            await getData({
                nome: new_url.searchParams.get('nome'),
                nascimento: new_url.searchParams.get('nascimento'),
                sexo: Number(new_url.searchParams.get('sexo')),
                ativo: Boolean(new_url.searchParams.get('ativo')),
                page: Number(new_url.searchParams.get('page'))
            })
        } catch (error) {

        }
    }

    const hancdleCheckColorProgress = (value: number): any => {
        value = Number(value);

        if (value < 20) {
            return 'danger'
        } else if (value >= 20 && value < 80) {
            return 'warning'
        } else if (value >= 80) {
            return 'success'
        }
        else {
            return 'info'
        }
    };

    <i className="ri-checkbox-circle-line fs-17 align-middle"></i>

    useEffect(() => {
        if (data) {
            handleThisRoute(data.first_page_url)
        }
    }, [perPage])

    // Botão Voltar
    const { voltarParaRotaAnterior } = useNavegacao();
    const gotoPage = async (item: any) => {

    };

    return (
        <React.Fragment>
            <UiContent />
            <Row>
                <Col xl={12}>
                    <Card>
                        <CardBody>
                            <div className="live-preview mt-1">
                                {data && data.total == 0 ?
                                    <div className="bg-primary text-white border-0 alert alert-primary fade show text-center" >INFORME OS FILTROS DESEJADOS E CLIQUE EM BUSCAR!</div>
                                    :
                                    !data.data ?
                                        <div className="bg-danger text-white border-0 alert alert-danger fade show text-center" >NENHUM RESULTADO ENCONTRADO!</div>
                                        :
                                        <>
                                            <Row className="d-felx align-items-center g-3 text-center text-sm-start">
                                                <Col lg={12} >
                                                    <div className="col-sm ">
                                                        <Col lg={2}>
                                                            <div className="d-flex flex-row justify-content-betweencenter align-items-center">
                                                                <Label htmlFor="firstNameinput" className="form-label me-3">Mostrar</Label>
                                                                <select className="form-select d-flex ps-3 mb-3" style={{ width: "100px", }} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} >
                                                                    {optPerPage.map((item: any) => {
                                                                        return (<option key={item.value} value={item.value}>{item.label}</option>);

                                                                    })}
                                                                </select>
                                                                <Label htmlFor="firstNameinput" className="form-label ms-3 ">resultados</Label>
                                                            </div>
                                                        </Col>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col xl={12}>
                                                    <div className="table-responsive">
                                                        <table className="table align-middle table-nowrap table-striped-columns mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th scope="col" style={{ width: "46px" }}>
                                                                        <div className="form-check">
                                                                            <input className="form-check-input" type="checkbox" value="" id="cardtableCheck" />
                                                                            <label className="form-check-label" htmlFor="cardtableCheck"></label>
                                                                        </div>
                                                                    </th>
                                                                    <th scope="col">ID</th>
                                                                    <th scope="col">Nome</th>
                                                                    <th scope="col">Nascimento</th>
                                                                    <th scope="col">Sexo</th>
                                                                    <th scope="col">Status</th>
                                                                    <th scope="col">progresso</th>
                                                                    <th scope="col" style={{ width: "150px" }}>Ação</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data && data.data.map((row: any, index: number) => {
                                                                    console.log(row.avatar, 'assets/images/users/avatar-3.jpg')
                                                                    return (
                                                                        <tr>
                                                                            <td>
                                                                                <div className="form-check">
                                                                                    <input className="form-check-input" type="checkbox" value="" id="cardtableCheck01" />
                                                                                    <label className="form-check-label" htmlFor="cardtableCheck01"></label>
                                                                                </div>
                                                                            </td>
                                                                            <td><Link to="#" className="fw-medium">{row.id}</Link></td>
                                                                            <td>
                                                                                <div className="d-flex gap-2 align-items-center">
                                                                                    <div className="flex-shrink-0">
                                                                                        <img src={require(`assets/images/users/avatar-3.jpg`)} alt="" className="avatar-xs rounded-circle" />
                                                                                    </div>
                                                                                    <div className="flex-grow-1">
                                                                                        {row.nome}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td>{row.nascimento}</td>
                                                                            <td>{row.sexo}</td>
                                                                            <td><span className={`badge bg-${row.ativo ? 'success' : 'danger'}`}>{`${row.ativo ? 'Ativo' : 'Inativo'}`}</span></td>
                                                                            <td>
                                                                                <div className="progress progress-sm">
                                                                                    <div className={`progress-bar bg-${hancdleCheckColorProgress(row.progresso)}`} role="progressbar" style={{width: row.progresso}}></div>
                                                                                </div>
                                                                            </td>
                                                                            <td >
                                                                                <ButtonGroup>
                                                                                    <UncontrolledDropdown direction="down">
                                                                                        <DropdownToggle tag="button" className="btn"><i className="ri-more-2-fill"></i></DropdownToggle>
                                                                                        <DropdownMenu style={{ zIndex: '999' }}>
                                                                                            <Link to={`/usuarios/edit/${row.id}`} state={{ source: row }}><DropdownItem>Editar</DropdownItem></Link>
                                                                                            <Link to={`/usuarios/edit/${row.id}`} state={{ source: row }}><DropdownItem>Excluir</DropdownItem></Link>
                                                                                        </DropdownMenu>
                                                                                    </UncontrolledDropdown>
                                                                                </ButtonGroup>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                                <div className="col-sm">
                                                    <div className="text-muted">Exibindo<span className="fw-semibold ms-1">{data && data.per_page}</span> de <span className="fw-semibold">{data && data.total}</span> Resultados</div>
                                                </div>
                                                <div className="col-sm-auto">
                                                    <ul className="pagination pagination-separated pagination-md justify-content-start justify-content-sm-start mb-0  table-responsive">
                                                        {
                                                            data.links && data.links.map((item: any, key: number) => {
                                                                switch (key) {
                                                                    case 0:
                                                                        return (
                                                                            <li key={item.label} className={data.current_page == 1 ? "page-item disabled" : "page-item"}>
                                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>Anterior</Link>
                                                                            </li>
                                                                        )
                                                                    case data.links.length - 1:
                                                                        return (
                                                                            <li className={data.last_page == data.current_page ? "page-item disabled" : "page-item"}>
                                                                                <Link to="#" className="page-link" onClick={() => handleThisRoute(item.url)}>Próximo</Link>
                                                                            </li>
                                                                        )
                                                                    default:
                                                                        return (
                                                                            <li className={`${item.active ? 'page-item active' : 'page-item'}`}>
                                                                                <Link to="#" className={`page-link `} onClick={() => handleThisRoute(item.url)}>{item.active}{item.label}</Link>
                                                                            </li>
                                                                        )
                                                                }
                                                            })
                                                        }
                                                    </ul>
                                                </div>
                                            </Row>
                                        </>}
                            </div>
                        </CardBody>
                    </Card>
                </Col>

            </Row >
            <Row>
                <Col md={12}>
                    <div className="hstack gap-2 justify-content-end">
                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                    </div>
                </Col>
            </Row>
        </React.Fragment >
    )
}
export default UsuarioTable;
