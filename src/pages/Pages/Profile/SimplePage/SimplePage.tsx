import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Col, Container, Nav, NavItem, NavLink, Row, Table, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';

import profileBg from '../../../../assets/images/profile-bg.jpg';
import { useAuthUser } from 'Components/Hooks/useAuthUser';
import { AuthService } from 'services/Auth';
import { formatCpfCnpj } from 'helpers/functions_helpers';

const dash = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : '—';
};

const SimplePage = () => {
    const { user, displayName, initials } = useAuthUser();
    const authServiceRef = useRef(new AuthService());

    useEffect(() => {
        authServiceRef.current.me().catch(() => {
            // 401: interceptor limpa sessão e redireciona
        });
    }, []);

    const cpfCnpj = user?.cpf_cnpj ? formatCpfCnpj(user.cpf_cnpj) : '—';

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
                                    <span className="avatar-title rounded-circle bg-light text-primary fs-22 img-thumbnail">
                                        {initials}
                                    </span>
                                </div>
                            </div>

                            <Col>
                                <div className="p-2">
                                    <h3 className="text-white mb-1">{displayName || 'Perfil'}</h3>
                                    <p className="text-white text-opacity-75 mb-0">{dash(user?.email)}</p>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <div>
                                <div className="d-flex">
                                    <Nav pills className="animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1" role="tablist">
                                        <NavItem className="fs-14">
                                            <NavLink href="#dados-pessoais-tab" className={classnames({ active: true })}>
                                                <i className="ri-airplay-fill d-inline-block d-md-none"></i>
                                                <span className="d-none d-md-inline-block">Dados Pessoais</span>
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <div className="flex-shrink-0">
                                        <Link to="/pages-profile-settings" className="btn btn-success">
                                            <i className="ri-edit-box-line align-bottom"></i> Editar
                                        </Link>
                                    </div>
                                </div>

                                <TabContent activeTab="1" className="pt-4">
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
                                                                        <td className="text-muted">{dash(user?.name)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Sobrenome:</th>
                                                                        <td className="text-muted">{dash(user?.sobrenome)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">Cpf/Cnpj:</th>
                                                                        <td className="text-muted">{cpfCnpj}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th className="ps-0" scope="row">E-mail :</th>
                                                                        <td className="text-muted">{dash(user?.email)}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
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
