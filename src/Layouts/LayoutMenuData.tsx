import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { pathIn } from "./menuPath";

const Navdata = () => {
    const history = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    const [isAnalises, setIsAnalises] = useState<boolean>(false);
    const [isPlanejamento, setIsPlanejamento] = useState<boolean>(false);
    const [isLancamentos, setIsLancamentos] = useState<boolean>(false);
    const [isCadastros, setIsCadastros] = useState<boolean>(false);
    const [iscurrentState, setIscurrentState] = useState("Dashboard");

    const isDashboardActive = pathIn(path, ["/dashboard"]);
    const isAnalisesActive = pathIn(path, ["/raio-x", "/gastos-criticos", "/gastos-por-categoria", "/relatorios"]);
    const isPlanejamentoActive = pathIn(path, ["/projecao-faturas", "/simulador", "/parceladas", "/assinaturas", "/compras"]);
    const isLancamentosActive = pathIn(path, ["/cartoes", "/faturas", "/transacoes"]);
    const isCadastrosActive = pathIn(path, ["/categorias", "/subcategorias", "/estabelecimentos", "/lojas", "/pessoas", "/responsaveis"]);

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            if (!ul) return;
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement;
                if (getID) getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove("twocolumn-panel");

        if (pathIn(path, ["/raio-x", "/gastos-criticos", "/gastos-por-categoria", "/relatorios"])) {
            setIscurrentState("Analises");
            setIsAnalises(true);
            setIsPlanejamento(false);
            setIsLancamentos(false);
            setIsCadastros(false);
            return;
        }
        if (pathIn(path, ["/projecao-faturas", "/simulador", "/parceladas", "/assinaturas", "/compras"])) {
            setIscurrentState("Planejamento");
            setIsPlanejamento(true);
            setIsAnalises(false);
            setIsLancamentos(false);
            setIsCadastros(false);
            return;
        }
        if (pathIn(path, ["/cartoes", "/faturas", "/transacoes"])) {
            setIscurrentState("Lancamentos");
            setIsLancamentos(true);
            setIsAnalises(false);
            setIsPlanejamento(false);
            setIsCadastros(false);
            return;
        }
        if (pathIn(path, ["/categorias", "/subcategorias", "/estabelecimentos", "/lojas", "/pessoas", "/responsaveis"])) {
            setIscurrentState("Cadastros");
            setIsCadastros(true);
            setIsAnalises(false);
            setIsPlanejamento(false);
            setIsLancamentos(false);
            return;
        }
        setIscurrentState("Dashboard");
        setIsAnalises(false);
        setIsPlanejamento(false);
        setIsLancamentos(false);
        setIsCadastros(false);
    }, [path]);

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
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Dashboard");
                updateIconSidebar(e);
                history("/dashboard");
            },
        },
        {
            id: "analises",
            label: "Análises",
            icon: "ri-pulse-line",
            link: "/#",
            isActive: isAnalisesActive,
            click: function (e: any) {
                e.preventDefault();
                setIsAnalises(!isAnalises);
                setIsPlanejamento(false);
                setIsLancamentos(false);
                setIsCadastros(false);
                setIscurrentState("Analises");
                updateIconSidebar(e);
            },
            stateVariables: isAnalises,
            subItems: [
                { id: "raio-x", label: "Raio-X Financeiro", link: "/raio-x", parentId: "analises", isActive: pathIn(path, ["/raio-x"]) },
                { id: "gastos-criticos", label: "Gastos críticos", link: "/gastos-criticos", parentId: "analises", isActive: pathIn(path, ["/gastos-criticos"]) },
                { id: "gastos-por-categoria", label: "Gastos por categoria", link: "/gastos-por-categoria", parentId: "analises", isActive: pathIn(path, ["/gastos-por-categoria"]) },
                { id: "relatorios", label: "Relatórios", link: "/relatorios", parentId: "analises", isActive: pathIn(path, ["/relatorios"]) },
            ],
        },
        {
            id: "planejamento",
            label: "Planejamento",
            icon: "ri-calendar-check-line",
            link: "/#",
            isActive: isPlanejamentoActive,
            click: function (e: any) {
                e.preventDefault();
                setIsPlanejamento(!isPlanejamento);
                setIsAnalises(false);
                setIsLancamentos(false);
                setIsCadastros(false);
                setIscurrentState("Planejamento");
                updateIconSidebar(e);
            },
            stateVariables: isPlanejamento,
            subItems: [
                { id: "projecao-faturas", label: "Projeção", link: "/projecao-faturas", parentId: "planejamento", isActive: pathIn(path, ["/projecao-faturas"]) },
                { id: "simulador", label: "Posso comprar?", link: "/simulador", parentId: "planejamento", isActive: pathIn(path, ["/simulador"]) },
                { id: "parceladas", label: "Parceladas", link: "/parceladas", parentId: "planejamento", isActive: pathIn(path, ["/parceladas"]) },
                { id: "assinaturas", label: "Assinaturas", link: "/assinaturas", parentId: "planejamento", isActive: pathIn(path, ["/assinaturas", "/compras"]) },
            ],
        },
        {
            id: "lancamentos",
            label: "Lançamentos",
            icon: "ri-file-list-3-line",
            link: "/#",
            isActive: isLancamentosActive,
            click: function (e: any) {
                e.preventDefault();
                setIsLancamentos(!isLancamentos);
                setIsAnalises(false);
                setIsPlanejamento(false);
                setIsCadastros(false);
                setIscurrentState("Lancamentos");
                updateIconSidebar(e);
            },
            stateVariables: isLancamentos,
            subItems: [
                { id: "cartoes", label: "Cartões", link: "/cartoes", parentId: "lancamentos", isActive: pathIn(path, ["/cartoes"]) },
                { id: "faturas", label: "Faturas", link: "/faturas", parentId: "lancamentos", isActive: pathIn(path, ["/faturas"]) },
                { id: "transacoes", label: "Transações", link: "/transacoes", parentId: "lancamentos", isActive: pathIn(path, ["/transacoes"]) },
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
                setIsCadastros(!isCadastros);
                setIsAnalises(false);
                setIsPlanejamento(false);
                setIsLancamentos(false);
                setIscurrentState("Cadastros");
                updateIconSidebar(e);
            },
            stateVariables: isCadastros,
            subItems: [
                { id: "categorias", label: "Categorias", link: "/categorias", parentId: "cadastros", isActive: pathIn(path, ["/categorias"]) },
                { id: "subcategorias", label: "Subcategorias", link: "/subcategorias", parentId: "cadastros", isActive: pathIn(path, ["/subcategorias"]) },
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
