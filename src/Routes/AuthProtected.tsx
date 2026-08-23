import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch } from "react-redux";

import { useProfile } from "../Components/Hooks/UserHooks";

import { logoutUser } from "../slices/auth/login/thunk";
import { AuthService } from "services/Auth";
import { shouldValidateSession } from "helpers/auth_session";

const AuthProtected = (props : any) =>{
  const dispatch : any = useDispatch();
  const { userProfile, loading, token } = useProfile();
  
  useEffect(() => {
    if (userProfile && !loading && token) {
      setAuthorization(token);
      if (shouldValidateSession(token)) {
        const authService = new AuthService();
        authService.me().catch(() => {
          // 401: interceptor limpa sessão e redireciona
        });
      }
    } else if (!userProfile && loading && !token) {
      dispatch(logoutUser());
    }
  }, [token, userProfile, loading, dispatch]);

  /*
    Navigate is un-auth access protected routes via url
    */

  if (!userProfile && loading && !token) {
    return (
      <Navigate to={{ pathname: "/login"}} />
    );
  }

  return <>{props.children}</>;
};


export default AuthProtected;