import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import withRouter from '../Components/Common/withRouter';
import { getAuthToken, isGuestPath } from 'helpers/auth_session';

//redux
import { useSelector } from "react-redux";
import { createSelector } from 'reselect';

const NonAuthLayout = ({ children } : any) => {
    const location = useLocation();
    const token = getAuthToken();

    const nonauthData = createSelector(
        (state) => state.Layout.layoutModeType,
        (layoutModeType) => layoutModeType
      );
    // Inside your component
    const layoutModeType = useSelector(nonauthData);

    useEffect(() => {
        if (layoutModeType === "dark") {
            document.body.setAttribute("data-bs-theme", "dark");
        } else {
            document.body.setAttribute("data-bs-theme", "light");
        }
        return () => {
            document.body.removeAttribute("data-bs-theme");
        };
    }, [layoutModeType]);

    if (token && location.pathname !== '/logout' && isGuestPath(location.pathname)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div>
            {children}
        </div>
    );
};

export default withRouter(NonAuthLayout);