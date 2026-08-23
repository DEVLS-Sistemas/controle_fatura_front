import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useAuthUser } from 'Components/Hooks/useAuthUser';

const ProfileDropdown = () => {
    const { displayName, initials } = useAuthUser();
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);

    return (
        <Dropdown
            isOpen={isProfileDropdown}
            toggle={() => setIsProfileDropdown(!isProfileDropdown)}
            className="ms-sm-3 header-item topbar-user"
        >
            <DropdownToggle tag="button" type="button" className="btn">
                <span className="d-flex align-items-center">
                    <span
                        className="header-profile-user rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fs-13 fw-medium"
                        aria-hidden="true"
                    >
                        {initials}
                    </span>
                    <span className="text-start ms-2">
                        <span className="d-none d-sm-inline-block ms-1 fw-medium user-name-text">
                            {displayName || 'Conta'}
                        </span>
                    </span>
                </span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
                <h6 className="dropdown-header">
                    {displayName ? `Bem vindo, ${displayName}!` : 'Bem vindo!'}
                </h6>
                <DropdownItem className="p-0">
                    <Link to="/perfil" className="dropdown-item">
                        <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                        <span className="align-middle">Perfil</span>
                    </Link>
                </DropdownItem>
                <div className="dropdown-divider"></div>
                <DropdownItem className="p-0">
                    <Link to="/logout" className="dropdown-item">
                        <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>
                        <span className="align-middle" data-key="t-logout">Sair</span>
                    </Link>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ProfileDropdown;
