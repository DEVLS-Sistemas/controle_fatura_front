import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import { AuthService } from "services/Auth";

const Logout = () => {
  const [done, setDone] = React.useState(false);

  useEffect(() => {
    const run = async () => {
      const authService = new AuthService();
      // Logout só zera a sessão (token). O e-mail de “lembrar-me” fica no localStorage.
      await authService.logout();
      setDone(true);
    };
    run();
  }, []);

  if (done) {
    return <Navigate to="/login" />;
  }

  return <></>;
};

export default withRouter(Logout);
