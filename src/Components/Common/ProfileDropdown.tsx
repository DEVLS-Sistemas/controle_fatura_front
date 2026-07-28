import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ModalBody, Row } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import CustomModal from 'Components/ComponentController/Modal/CustomModal';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";
import avatar2 from "../../assets/images/users/avatar-2.jpg";
import loginImg from "../../assets/images/modals/login.png";

const ProfileDropdown = () => {


    const profiledropdownData = createSelector(
        (state: any) => state.Profile.user,
        (user) => user
    );
    // Inside your component
    const user = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("Admin");

    useEffect(() => {
        const authUSer: any = sessionStorage.getItem("authUser");
        if (authUSer) {
            const obj: any = JSON.parse(authUSer);
            setUserName(process.env.REACT_APP_DEFAULTAUTH === "fake" ? obj.username === undefined ? user.first_name ? user.first_name : obj.data.first_name : "Admin" || "Admin" :
                process.env.REACT_APP_DEFAULTAUTH === "firebase" ? obj.email && obj.email : "Admin"
            );
        }
    }, [userName, user]);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState<boolean>(false);
    const [isEmpresaDropdown, setIsEmpresaDropdown] = useState<boolean>(false);
    const toggleProfileDropdown = (drop: string) => {
        if (drop == 'usuario') {
            setIsProfileDropdown(!isProfileDropdown);
        }
        else if (drop == 'empresa') {
            setIsEmpresaDropdown(!isEmpresaDropdown);
        }
    };
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const toggleModal = () => {
        setModalIsOpen(!modalIsOpen);
    };
    const [modal_loginModals, setmodal_loginModals] = useState<boolean>(false);
    function tog_loginModals() {
        setmodal_loginModals(!modal_loginModals);
    }

    return (
        <React.Fragment>
            <Dropdown isOpen={isEmpresaDropdown} toggle={() => toggleProfileDropdown('empresa')} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={avatar1}
                            alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">Will Barbearia</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">Matriz - Abreu e Lima</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Matriz - Abreu e Lima</h6>
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Perfil Empresa</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/apps-chat" className="dropdown-item">
                            <i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Mensagens</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile-settings" className="dropdown-item">
                            <span
                                className="badge bg-success-subtle text-success mt-1 float-end">New</span><i
                                    className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span
                                        className="align-middle">Config.</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    <DropdownItem className='' style={{padding: '0'}}>
                        <button type="button" onClick={toggleModal} className="btn btn-primary w-100"> Logar Empresa </button>
                        <CustomModal
                            isOpen={modalIsOpen}
                            toggle={toggleModal}
                            position="right"
                            size="sm"
                            body={
                                <>
                                    <div className='login-modal p-3' style={{ margin: '-20px' }}>
                                        <h5 className="text-white fs-20">Login</h5>
                                        <p className="text-white-50 mb-4">Don't have an account? <Link to="/#" className="text-white">Sign Up.</Link></p>
                                        <div className="vstack gap-2 justify-content-center">
                                            <button className="btn btn-light"><i className="ri-google-fill align-bottom text-danger"></i> Google</button>
                                            <button className="btn btn-info"><i className="ri-facebook-fill align-bottom"></i> Facebook</button>
                                        </div>
                                    </div>
                                    <div className="p-3" style={{ margin: '-20px' }}>
                                        <h5 className="mb-3 mt-3">Login with Email</h5>
                                        <form>
                                            <div className="mb-2">
                                                <input type="email" className="form-control" id="exampleInputEmail1" placeholder="Enter your email/username" />
                                            </div>
                                            <div className="mb-3">
                                                <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Enter your password" />
                                                <div className="mt-1 text-end">
                                                    <Link to="/auth-pass-reset-basic">Forgot password ?</Link>
                                                </div>
                                            </div>
                                            <button type="submit" className="btn btn-primary w-100">Submit</button>
                                        </form>
                                    </div>
                                </>
                            }
                        />
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            <Dropdown isOpen={isProfileDropdown} toggle={() => toggleProfileDropdown('usuario')} className="ms-sm-1 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={avatar1}
                            alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{userName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">Administrador</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Bem vindo {userName}!</h6>
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Perfil</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/apps-chat" className="dropdown-item">
                            <i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Mensagens</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-faqs" className="dropdown-item">
                            <i
                                className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">Help</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile-settings" className="dropdown-item">
                            <span
                                className="badge bg-success-subtle text-success mt-1 float-end">New</span><i
                                    className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span
                                        className="align-middle">Config.</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/auth-lockscreen-basic" className="dropdown-item">
                            <i
                                className="mdi mdi-lock text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Bloquear</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i
                                className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle" data-key="t-logout">Sair</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;