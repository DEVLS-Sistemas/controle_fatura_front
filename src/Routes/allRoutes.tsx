import { Navigate } from "react-router-dom";

import DashboardNFT from "../pages/DashboardNFT";
import DashboardJob from "../pages/DashboardJob/";

import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage";
import Settings from "../pages/Pages/Profile/Settings/Settings";

import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";

import UsuarioPage from "pages/Pages/Usuario/UsuarioPage";
import UsuarioForm from "pages/Pages/Usuario/UsuarioForm/UsuarioForm";

import DashboardsHome from "pages/Pages/Dashboards/DashboardHome/DashboardsHome";

import CartoesPage from "pages/Pages/Cartoes/CartoesPage";
import CartoesForm from "pages/Pages/Cartoes/CartoesForm/CartoesForm";
import CartoesViewPage from "pages/Pages/Cartoes/CartoesView/CartoesView";

import CategoriasPage from "pages/Pages/Categorias/CategoriasPage";
import CategoriasForm from "pages/Pages/Categorias/CategoriasForm/CategoriasForm";
import CategoriasViewPage from "pages/Pages/Categorias/CategoriasView/CategoriasView";

import ResponsaveisPage from "pages/Pages/Responsaveis/ResponsaveisPage";
import ResponsaveisForm from "pages/Pages/Responsaveis/ResponsaveisForm/ResponsaveisForm";

import FaturasPage from "pages/Pages/Faturas/FaturasPage";
import FaturasForm from "pages/Pages/Faturas/FaturasForm/FaturasForm";
import FaturasView from "pages/Pages/Faturas/FaturasView/FaturasView";

import TransacoesPage from "pages/Pages/Transacoes/TransacoesPage";
import TransacoesForm from "pages/Pages/Transacoes/TransacoesForm/TransacoesForm";

const authProtectedRoutes = [
  { path: "/dashboard", component: <DashboardsHome /> },
  { path: "/dashboard-nft", component: <DashboardNFT /> },
  { path: "/dashboard-job", component: <DashboardJob /> },

  { path: "/usuarios", component: <UsuarioPage /> },
  { path: "/usuarios/add", component: <UsuarioForm /> },
  { path: "/usuarios/edit/:idUsuario", component: <UsuarioForm /> },

  { path: "/cartoes", component: <CartoesPage /> },
  { path: "/cartoes/add", component: <CartoesForm /> },
  { path: "/cartoes/edit/:id", component: <CartoesForm /> },
  { path: "/cartoes/view/:id", component: <CartoesViewPage /> },

  { path: "/categorias", component: <CategoriasPage /> },
  { path: "/categorias/add", component: <CategoriasForm /> },
  { path: "/categorias/edit/:id", component: <CategoriasForm /> },
  { path: "/categorias/view/:id", component: <CategoriasViewPage /> },

  { path: "/responsaveis", component: <ResponsaveisPage /> },
  { path: "/responsaveis/add", component: <ResponsaveisForm /> },
  { path: "/responsaveis/edit/:id", component: <ResponsaveisForm /> },
  { path: "/responsaveis/view/:id", component: <ResponsaveisForm /> },

  { path: "/faturas", component: <FaturasPage /> },
  { path: "/faturas/add", component: <FaturasForm /> },
  { path: "/faturas/edit/:id", component: <FaturasForm /> },
  { path: "/faturas/view/:id", component: <FaturasView /> },

  { path: "/transacoes", component: <TransacoesPage /> },
  { path: "/transacoes/add", component: <TransacoesForm /> },
  { path: "/transacoes/edit/:id", component: <TransacoesForm /> },

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
