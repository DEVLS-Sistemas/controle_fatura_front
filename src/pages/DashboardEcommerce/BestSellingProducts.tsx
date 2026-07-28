import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { bestSellingProducts } from "../../common/data";

const BestSellingProducts = () => {
    return (
        <React.Fragment>
            <Col xl={6}>
                <Card>
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Serviços mais realizados</h4>
                        <div className="flex-shrink-0">
                            <UncontrolledDropdown className="card-header-dropdown">
                                <DropdownToggle tag="a" className="text-reset" role="button">
                                    <span className="fw-semibold text-uppercase fs-12">Classificar por: </span><span className="text-muted">Hoje<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem>Hoje</DropdownItem>
                                    <DropdownItem>Yesterday</DropdownItem>
                                    <DropdownItem>Last 7 Days</DropdownItem>
                                    <DropdownItem>Last 30 Days</DropdownItem>
                                    <DropdownItem>This Month</DropdownItem>
                                    <DropdownItem>Last Month</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                <tbody>
                                    {/* {(bestSellingProducts || []).map((item, key) => ( */}
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">Corte + Barba</Link></h5>   
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 40</h5>
                                                <span className="text-muted">Preço</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">36</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 1.440</h5>
                                                <span className="text-muted">Total</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">Corte Degrade</Link></h5>                                                 
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 25</h5>
                                                <span className="text-muted">Preço</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">29</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 725</h5>
                                                <span className="text-muted">Total</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">Corte Infantil</Link></h5>   
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 25</h5>
                                                <span className="text-muted">Preço</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">12</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 300</h5>
                                                <span className="text-muted">Total</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">Barba</Link></h5>   
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 15</h5>
                                                <span className="text-muted">Preço</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">10</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 150</h5>
                                                <span className="text-muted">Total</span>
                                            </td>
                                        </tr>
     

                                        <tr>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">Reflexo</Link></h5>   
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 75</h5>
                                                <span className="text-muted">Preço</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">2</h5>
                                                <span className="text-muted">Serviços</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">R$ 150</h5>
                                                <span className="text-muted">Total</span>
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

export default BestSellingProducts;