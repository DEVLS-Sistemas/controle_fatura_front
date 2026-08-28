import { Navigate } from "react-router-dom";

import DashboardNFT from "../pages/DashboardNFT";
import DashboardJob from "../pages/DashboardJob/";

import Settings from "../pages/Pages/Profile/Settings/Settings";
import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage";

import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import RecuperarSenha from "../pages/Authentication/RecuperarSenha";
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
import ResponsaveisVisualizarPage from "pages/Pages/Responsaveis/ResponsaveisVisualizar/ResponsaveisVisualizarPage";

import PessoasPage from "pages/Pages/Pessoas/PessoasPage";
import PessoasForm from "pages/Pages/Pessoas/PessoasForm/PessoasForm";

import FaturasPage from "pages/Pages/Faturas/FaturasPage";
import FaturasForm from "pages/Pages/Faturas/FaturasForm/FaturasForm";
import FaturasView from "pages/Pages/Faturas/FaturasView/FaturasView";

import TransacoesPage from "pages/Pages/Transacoes/TransacoesPage";
import TransacoesForm from "pages/Pages/Transacoes/TransacoesForm/TransacoesForm";

import EstabelecimentosPage from "pages/Pages/Estabelecimentos/EstabelecimentosPage";
import EstabelecimentosForm from "pages/Pages/Estabelecimentos/EstabelecimentosForm/EstabelecimentosForm";
import EstabelecimentosViewPage from "pages/Pages/Estabelecimentos/EstabelecimentosView/EstabelecimentosView";

import LojasPage from "pages/Pages/Lojas/LojasPage";
import LojasForm from "pages/Pages/Lojas/LojasForm/LojasForm";
import LojasViewPage from "pages/Pages/Lojas/LojasView/LojasView";

import SubcategoriasPage from "pages/Pages/Subcategorias/SubcategoriasPage";
import SubcategoriasForm from "pages/Pages/Subcategorias/SubcategoriasForm/SubcategoriasForm";

import PlataformasPage from "pages/Pages/Plataformas/PlataformasPage";
import PlataformasForm from "pages/Pages/Plataformas/PlataformasForm/PlataformasForm";
import PlataformasViewPage from "pages/Pages/Plataformas/PlataformasView/PlataformasView";

import RelatoriosPage from "pages/Pages/Relatorios/RelatoriosPage";
import ProjecaoFaturasPage from "pages/Pages/ProjecaoFaturas/ProjecaoFaturasPage";
import SimuladorCompraPage from "pages/Pages/SimuladorCompra/SimuladorCompraPage";
import RankingParceladasPage from "pages/Pages/RankingParceladas/RankingParceladasPage";
import GastosCriticosPage from "pages/Pages/GastosCriticos/GastosCriticosPage";
import GastosPorCategoriaPage from "pages/Pages/GastosPorCategoria/GastosPorCategoriaPage";
import RaioXPage from "pages/Pages/RaioX/RaioXPage";
import AssinaturasPage from "pages/Pages/Assinaturas/AssinaturasPage";
import AssinaturasDetalhePage from "pages/Pages/Assinaturas/AssinaturasDetalhe/AssinaturasDetalhePage";
import CompraVisualizacaoPage from "pages/Pages/CompraVisualizacao/CompraVisualizacaoPage";
import FaturaResponsavelView from "pages/Pages/ProjecaoFaturas/FaturaResponsavelView/FaturaResponsavelView";
import RepassesResponsavelView from "pages/Pages/ProjecaoFaturas/RepassesResponsavelView/RepassesResponsavelView";

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
  { path: "/responsaveis/view/:id", component: <ResponsaveisVisualizarPage /> },
  { path: "/responsaveis/:id", component: <ResponsaveisVisualizarPage /> },

  { path: "/pessoas", component: <PessoasPage /> },
  { path: "/pessoas/add", component: <PessoasForm /> },
  { path: "/pessoas/edit/:id", component: <PessoasForm /> },
  { path: "/pessoas/view/:id", component: <PessoasForm /> },

  { path: "/faturas", component: <FaturasPage /> },
  { path: "/faturas/add", component: <FaturasForm /> },
  { path: "/faturas/edit/:id", component: <FaturasForm /> },
  { path: "/faturas/view/:id", component: <FaturasView /> },

  { path: "/transacoes", component: <TransacoesPage /> },
  { path: "/transacoes/add", component: <TransacoesForm /> },
  { path: "/transacoes/edit/:id", component: <TransacoesForm /> },

  { path: "/estabelecimentos", component: <EstabelecimentosPage /> },
  { path: "/estabelecimentos/add", component: <EstabelecimentosForm /> },
  { path: "/estabelecimentos/edit/:id", component: <EstabelecimentosForm /> },
  { path: "/estabelecimentos/view/:id", component: <EstabelecimentosViewPage /> },

  { path: "/lojas", component: <LojasPage /> },
  { path: "/lojas/add", component: <LojasForm /> },
  { path: "/lojas/edit/:id", component: <LojasForm /> },
  { path: "/lojas/view/:id", component: <LojasViewPage /> },

  { path: "/subcategorias", component: <SubcategoriasPage /> },
  { path: "/subcategorias/add", component: <SubcategoriasForm /> },
  { path: "/subcategorias/edit/:id", component: <SubcategoriasForm /> },

  { path: "/plataformas", component: <PlataformasPage /> },
  { path: "/plataformas/add", component: <PlataformasForm /> },
  { path: "/plataformas/edit/:id", component: <PlataformasForm /> },
  { path: "/plataformas/view/:id", component: <PlataformasViewPage /> },

  { path: "/relatorios", component: <RelatoriosPage /> },
  { path: "/raio-x", component: <RaioXPage /> },
  { path: "/gastos-criticos", component: <GastosCriticosPage /> },
  { path: "/gastos-por-categoria", component: <GastosPorCategoriaPage /> },
  { path: "/parceladas", component: <RankingParceladasPage /> },
  { path: "/assinaturas/:identificador", component: <AssinaturasDetalhePage /> },
  { path: "/assinaturas", component: <AssinaturasPage /> },
  { path: "/compras/:identificador", component: <CompraVisualizacaoPage /> },
  { path: "/projecao-faturas/responsaveis/:responsavelId/fatura", component: <FaturaResponsavelView /> },
  { path: "/projecao-faturas/responsaveis/:responsavelId/repasses", component: <RepassesResponsavelView /> },
  { path: "/projecao-faturas", component: <ProjecaoFaturasPage /> },
  { path: "/simulador", component: <SimuladorCompraPage /> },

  { path: "/perfil", component: <SimplePage /> },
  { path: "/profile", component: <Navigate to="/perfil" /> },
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
  { path: "/recuperar-senha", component: <RecuperarSenha /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };
