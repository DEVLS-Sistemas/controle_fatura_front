import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, Input, Label, Nav, NavItem, NavLink, Pagination, PaginationItem, PaginationLink, Progress, Row, TabContent, Table, TabPane, UncontrolledCollapse, UncontrolledDropdown } from 'reactstrap';
import classnames from 'classnames';
import { Swiper, SwiperSlide } from "swiper/react";
import  { Autoplay } from "swiper/modules";

//Images
import profileBg from '../../../../assets/images/profile-bg.jpg';
import avatar1 from '../../../../assets/images/users/avatar-1.jpg';
import avatar2 from '../../../../assets/images/users/avatar-2.jpg';
import avatar3 from '../../../../assets/images/users/avatar-3.jpg';
import avatar4 from '../../../../assets/images/users/avatar-4.jpg';
import avatar5 from '../../../../assets/images/users/avatar-5.jpg';
import avatar6 from '../../../../assets/images/users/avatar-6.jpg';
import avatar7 from '../../../../assets/images/users/avatar-7.jpg';
import avatar8 from '../../../../assets/images/users/avatar-8.jpg';

import smallImage2 from '../../../../assets/images/small/img-2.jpg';
import smallImage3 from '../../../../assets/images/small/img-3.jpg';
import smallImage4 from '../../../../assets/images/small/img-4.jpg';
import smallImage5 from '../../../../assets/images/small/img-5.jpg';
import smallImage6 from '../../../../assets/images/small/img-6.jpg';
import smallImage7 from '../../../../assets/images/small/img-7.jpg';
import smallImage9 from '../../../../assets/images/small/img-9.jpg';

import { projects, documents } from '../../../../common/data';

const SimplePage = () => {
    // document.title = "Profile | Velzon - React Admin & Dashboard Template";

    

    const [activeTab, setActiveTab] = useState('1');
    const [activityTab, setActivityTab] = useState('1');

    const toggleTab = (tab : any) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const toggleActivityTab = (tab : any) => {
        if (activityTab !== tab) {
            setActivityTab(tab);
        }
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="profile-foreground position-relative mx-n4 mt-n4">
                        <div className="profile-wid-bg">
                            <img src={profileBg} alt="" className="profile-wid-img" />
                        </div>
                    </div>
                    <div className="pt-4 mb-4 mb-lg-3 pb-lg-4">
                        <Row className="g-4">
                            <div className="col-auto">
                                <div className="avatar-lg">
                                    <img src={avatar1} alt="user-img"
                                        className="img-thumbnail rounded-circle" />
                                </div>
                            </div>

                            <Col>
                                <div className="p-2">
                                    <h3 className="text-white mb-1">Salão da Maysa</h3>
                                    <p className="text-white text-opacity-75">Salão de Beleza</p>
                                    <div className="hstack text-white-50 gap-1">
                                        <div className="me-2"><i
                                            className="ri-map-pin-user-line me-1 text-white text-opacity-75 fs-16 align-middle"></i>Unidade Camaragibe</div>
                                        <div><i
                                            className="ri-building-line me-1 text-white text-opacity-75 fs-16 align-middle"></i>Matriz
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={12} className="col-lg-auto order-last order-lg-0">
                                <Row className="text text-white-50 text-center">
                                    <Col lg={6} xs={4}>
                                        <div className="p-2">
                                            <h4 className="text-white mb-1">24.3K</h4>
                                            <p className="fs-14 mb-0">Dados 1</p>
                                        </div>
                                    </Col>
                                    <Col lg={6} xs={4}>
                                        <div className="p-2">
                                            <h4 className="text-white mb-1">1.3K</h4>
                                            <p className="fs-14 mb-0">Dados 2</p>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <div>
                                <div className="d-flex">
                                    <Nav pills className="animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1"
                                        role="tablist">
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#dados-pessoais-tab"
                                                className={classnames({ active: activeTab === '1' })}
                                                onClick={() => { toggleTab('1'); }}
                                                
                                            >
                                                <i className="ri-airplay-fill d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">Dados Pessoais</span>
                                            </NavLink>
                                        </NavItem>
                                        <NavItem className="fs-14">
                                            <NavLink
                                                href="#expediente"
                                                className={classnames({ active: activeTab === '2' })}
                                                onClick={() => { toggleTab('2'); }}
                                                
                                            >
                                                <i className="ri-list-unordered d-inline-block d-md-none"></i> <span
                                                    className="d-none d-md-inline-block">Expediente</span>
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <div className="flex-shrink-0">
                                        <Link to="/pages-profile-settings" className="btn btn-success"><i
                                            className="ri-edit-box-line align-bottom"></i> Editar</Link>
                                    </div>
                                </div>

                                <TabContent activeTab={activeTab} className="pt-4">
                                    <TabPane tabId="1">
                                        <Row>
                                            <Col xxl={3}>
                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-3">Info</h5>
                                                        <div className="table-responsive">
                                                            <Table className="table-borderless mb-0">
                                                                <tbody>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Nome:</th>
                                                                        <td className="text-muted">Salão da Maysa</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Cpf/Cnpj:</th>
                                                                        <td className="text-muted">99.999.999-99</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Telefone :</th>
                                                                        <td className="text-muted">(81) 91234-5678</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">E-mail :</th>
                                                                        <td className="text-muted">salaomaysa@email.com</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Endereço :</th>
                                                                        <td className="text-muted">Rua Santana, 220D Santana - Camaragibe - PE - 54777-455
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-4">Portfolio</h5>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block" title="Site">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-20 bg-primary">
                                                                        <i className="ri-global-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block" title="Instagram">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-20 text-light bg-danger">
                                                                        <i className="ri-instagram-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div>
                                                                <Link to="#" className="avatar-xs d-block" title="Facebook">
                                                                    <span
                                                                        className="avatar-title rounded-circle fs-20 bg-ligh">
                                                                        <i className="ri-facebook-fill"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>

                                            </Col>
                                            <Col xxl={9}>
                                                <Card>
                                                    <CardBody>
                                                        <h5 className="card-title mb-3">Outros Dadosn</h5>
                                                        <p>Hi I'm Anna Adame, It will be as simple as Occidental; in
                                                            fact, it will be Occidental. To an English person, it will
                                                            seem like simplified English, as a skeptical Cambridge
                                                            friend of mine told me what Occidental is European languages
                                                            are members of the same family.</p>
                      
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </TabPane>
                                    <TabPane tabId="2">
                                        <Card>
                                            <CardBody>
                                                    <h5 className="card-title mb-5">Expediente</h5>
                                                    <p className='text-muted'>Segunda:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Terça:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Quarta:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Quinta:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Sexta:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Sábado:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                                    <p className='text-muted'>Domingo:<span className='me-2 ms-4' >08:00 ás 12:00</span></p>
                                            </CardBody>
                                        </Card>
                                    </TabPane>

                                </TabContent>
                            </div>
                        </Col>
                    </Row>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default SimplePage;