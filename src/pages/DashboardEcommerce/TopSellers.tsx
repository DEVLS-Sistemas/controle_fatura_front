import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { topSellers } from "../../common/data";

const TopSellers = () => {
    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Retorno de Clientes</h4>
                        <div className="flex-shrink-0">
                            {/* <UncontrolledDropdown className="card-header-dropdown" >
                                <DropdownToggle tag="a" className="text-reset dropdown-btn" role="button">
                                    <span className="text-muted">Report<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu dropdown-menu-end">
                                    <DropdownItem>Download Report</DropdownItem>
                                    <DropdownItem>Export</DropdownItem>
                                    <DropdownItem>Import</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown> */}
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-centered table-hover align-middle table-nowrap mb-0">
                                <tbody>
                                    {/* {topSellers.map((item, key) => ( */}
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-sm p-2" />
                                                    </div> */}
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium"><Link to="/apps-ecommerce-seller-details" className="text-reset">Leonardo Silva</Link></h5>                                                
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">27</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">23/05/2025</h5>
                                                <span className="text-muted">Última Visita</span>                                            
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">7 dias</h5>
                                                <span className="text-muted">Última Visita</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-sm p-2" />
                                                    </div> */}
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium"><Link to="/apps-ecommerce-seller-details" className="text-reset">Emerson Ferreira</Link></h5>                                                
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">23</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">24/04/2025</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">6 dias</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-sm p-2" />
                                                    </div> */}
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium"><Link to="/apps-ecommerce-seller-details" className="text-reset">Robsonvaldo Araújo</Link></h5>                                                
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">19</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">25/05/2025</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">5 dias</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-sm p-2" />
                                                    </div> */}
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium"><Link to="/apps-ecommerce-seller-details" className="text-reset">João Pedro</Link></h5>                                                
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">14</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">26/05/2025</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">4 dias</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* <div className="flex-shrink-0 me-2">
                                                        <img src={item.img} alt="" className="avatar-sm p-2" />
                                                    </div> */}
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium"><Link to="/apps-ecommerce-seller-details" className="text-reset">João Gomes</Link></h5>                                                
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">13</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">27/05/2025</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">3 dias</h5>
                                                <span className="text-muted">Ultima Visita</span>
                                            </td>
                                        </tr>
                                    {/* ))} */}
                                </tbody>
                            </table>
                        </div>
                        <div className="align-items-center mt-4 pt-2 justify-content-between row text-center text-sm-start">
                            <div className="col-sm">
                                <div className="text-muted">Showing <span className="fw-semibold">5</span> of <span className="fw-semibold">25</span> Results
                                </div>
                            </div>
                            <div className="col-sm-auto mt-3 mt-sm-0">
                                <ul className="pagination pagination-separated pagination-sm mb-0 justify-content-center">
                                    <li className="page-item disabled">
                                        <Link to="#" className="page-link">←</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">1</Link>
                                    </li>
                                    <li className="page-item active">
                                        <Link to="#" className="page-link">2</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">3</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">→</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>

        </React.Fragment>
    );
};

export default TopSellers;