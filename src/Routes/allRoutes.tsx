import { Navigate } from "react-router-dom";

//Dashboard
import DashboardNFT from "../pages/DashboardNFT";
import DashboardJob from "../pages/DashboardJob/";

//pages
import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage";
import Settings from "../pages/Pages/Profile/Settings/Settings";

//login
import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";

// Usuários
import UsuarioPage from "pages/Pages/Usuario/UsuarioPage";
import UsuarioForm from "pages/Pages/Usuario/UsuarioForm/UsuarioForm";

import DashboardsHome from "pages/Pages/Dashboards/DashboardHome/DashboardsHome";

const authProtectedRoutes = [
  { path: "/dashboard", component: <DashboardsHome /> },
  { path: "/dashboard-nft", component: <DashboardNFT /> },
  { path: "/dashboard-job", component: <DashboardJob /> },

  { path: "/usuarios", component: <UsuarioPage /> },
  { path: "/usuarios/add", component: <UsuarioForm /> },
  { path: "/usuarios/edit/:idUsuario", component: <UsuarioForm /> },

  { path: "/profile", component: <SimplePage /> },
  { path: "/pages-profile-settings", component: <Settings /> },

  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };
