import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { pathIn } from "./menuPath";

const RELATORIOS_PATHS = ["/gastos-criticos", "/gastos-por-categoria", "/relatorios"];
const RECORRENTE_PATHS = ["/parceladas", "/assinaturas", "/compras"];
const CADASTROS_PATHS = ["/categorias", "/subcategorias", "/plataformas", "/estabelecimentos", "/lojas", "/pessoas", "/responsaveis"];

const Navdata = () => {
    const location = useLocation();
    const path = location.pathname;

    const [isRelatorios, setIsRelatorios] = useState<boolean>(() => pathIn(path, RELATORIOS_PATHS));
    const [isRecorrente, setIsRecorrente] = useState<boolean>(() => pathIn(path, RECORRENTE_PATHS));
    const [isCadastros, setIsCadastros] = useState<boolean>(() => pathIn(path, CADASTROS_PATHS));

    const isDashboardActive = pathIn(path, ["/dashboard"]);
    const isFaturasActive = pathIn(path, ["/faturas"]);
    const isTransacoesActive = pathIn(path, ["/transacoes"]);
    const isCartoesActive = pathIn(path, ["/cartoes"]);
    const isRaioXActive = pathIn(path, ["/raio-x"]);
    const isProjecaoActive = pathIn(path, ["/projecao-faturas"]);
    const isSimuladorActive = pathIn(path, ["/simulador"]);
    const isRelatoriosActive = pathIn(path, RELATORIOS_PATHS);
    const isRecorrenteActive = pathIn(path, RECORRENTE_PATHS);
    const isCadastrosActive = pathIn(path, CADASTROS_PATHS);

    useEffect(() => {
        document.body.classList.remove("twocolumn-panel");
        if (isRelatoriosActive) setIsRelatorios(true);
        if (isRecorrenteActive) setIsRecorrente(true);
        if (isCadastrosActive) setIsCadastros(true);
    }, [path, isRelatoriosActive, isRecorrenteActive, isCadastrosActive]);

    const menuItems: any = [
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "ri-dashboard-2-line",
            link: "/dashboard",
            isActive: isDashboardActive,
        },
        {
            id: "faturas",
            label: "Faturas",
            icon: "ri-file-list-3-line",
            link: "/faturas",
            isActive: isFaturasActive,
        },
        {
            id: "transacoes",
            label: "Transações",
            icon: "ri-list-check-2",
            link: "/transacoes",
            isActive: isTransacoesActive,
        },
        {
            id: "cartoes",
            label: "Cartões",
            icon: "ri-bank-card-line",
            link: "/cartoes",
            isActive: isCartoesActive,
        },
        {
            id: "raio-x",
            label: "Raio-X",
            icon: "ri-pulse-line",
            link: "/raio-x",
            isActive: isRaioXActive,
        },
        {
            id: "projecao-faturas",
            label: "Projeção",
            icon: "ri-calendar-check-line",
            link: "/projecao-faturas",
            isActive: isProjecaoActive,
        },
        {
            id: "simulador",
            label: "Posso comprar?",
            icon: "ri-shopping-cart-2-line",
            link: "/simulador",
            isActive: isSimuladorActive,
        },
        {
            id: "relatorios-menu",
            label: "Relatórios",
            icon: "ri-pie-chart-2-line",
            link: "/#",
            isActive: isRelatoriosActive,
            click: function (e: any) {
                e.preventDefault();
                setIsRelatorios((open) => !open);
            },
            stateVariables: isRelatorios,
            subItems: [
                { id: "gastos-criticos", label: "Gastos críticos", link: "/gastos-criticos", parentId: "relatorios-menu", isActive: pathIn(path, ["/gastos-criticos"]) },
                { id: "gastos-por-categoria", label: "Gastos por categoria", link: "/gastos-por-categoria", parentId: "relatorios-menu", isActive: pathIn(path, ["/gastos-por-categoria"]) },
                { id: "relatorios", label: "Relatórios", link: "/relatorios", parentId: "relatorios-menu", isActive: pathIn(path, ["/relatorios"]) },
            ],
        },
        {
            id: "recorrente",
            label: "Recorrente",
            icon: "ri-refresh-line",
            link: "/#",
            isActive: isRecorrenteActive,
            click: function (e: any) {
                e.preventDefault();
                setIsRecorrente((open) => !open);
            },
            stateVariables: isRecorrente,
            subItems: [
                { id: "parceladas", label: "Parceladas", link: "/parceladas", parentId: "recorrente", isActive: pathIn(path, ["/parceladas"]) },
                { id: "assinaturas", label: "Assinaturas", link: "/assinaturas", parentId: "recorrente", isActive: pathIn(path, ["/assinaturas", "/compras"]) },
            ],
        },
        {
            id: "cadastros",
            label: "Cadastros",
            icon: "ri-folder-settings-line",
            link: "/#",
            isActive: isCadastrosActive,
            click: function (e: any) {
                e.preventDefault();
                setIsCadastros((open) => !open);
            },
            stateVariables: isCadastros,
            subItems: [
                { id: "categorias", label: "Categorias", link: "/categorias", parentId: "cadastros", isActive: pathIn(path, ["/categorias"]) },
                { id: "subcategorias", label: "Subcategorias", link: "/subcategorias", parentId: "cadastros", isActive: pathIn(path, ["/subcategorias"]) },
                { id: "plataformas", label: "Plataformas", link: "/plataformas", parentId: "cadastros", isActive: pathIn(path, ["/plataformas"]) },
                { id: "estabelecimentos", label: "Estabelecimentos", link: "/estabelecimentos", parentId: "cadastros", isActive: pathIn(path, ["/estabelecimentos"]) },
                { id: "lojas", label: "Lojas", link: "/lojas", parentId: "cadastros", isActive: pathIn(path, ["/lojas"]) },
                { id: "pessoas", label: "Pessoas", link: "/pessoas", parentId: "cadastros", isActive: pathIn(path, ["/pessoas"]) },
                { id: "responsaveis", label: "Responsáveis", link: "/responsaveis", parentId: "cadastros", isActive: pathIn(path, ["/responsaveis"]) },
            ],
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
