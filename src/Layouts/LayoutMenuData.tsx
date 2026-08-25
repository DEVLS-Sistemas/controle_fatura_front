import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const pathIn = (path: string, prefixes: string[]) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const Navdata = () => {
    const history = useNavigate();
    const location = useLocation();

    const [isAnalises, setIsAnalises] = useState<boolean>(false);
    const [isPlanejamento, setIsPlanejamento] = useState<boolean>(false);
    const [isLancamentos, setIsLancamentos] = useState<boolean>(false);
    const [isCadastros, setIsCadastros] = useState<boolean>(false);
    const [iscurrentState, setIscurrentState] = useState("Dashboard");

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
        const path = location.pathname;

        if (pathIn(path, ["/raio-x", "/gastos-criticos", "/relatorios"])) {
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
    }, [location.pathname]);

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
                { id: "raio-x", label: "Raio-X Financeiro", link: "/raio-x", parentId: "analises" },
                { id: "gastos-criticos", label: "Gastos críticos", link: "/gastos-criticos", parentId: "analises" },
                { id: "relatorios", label: "Relatórios", link: "/relatorios", parentId: "analises" },
            ],
        },
        {
            id: "planejamento",
            label: "Planejamento",
            icon: "ri-calendar-check-line",
            link: "/#",
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
                { id: "projecao-faturas", label: "Projeção", link: "/projecao-faturas", parentId: "planejamento" },
                { id: "simulador", label: "Posso comprar?", link: "/simulador", parentId: "planejamento" },
                { id: "parceladas", label: "Parceladas", link: "/parceladas", parentId: "planejamento" },
                { id: "assinaturas", label: "Assinaturas", link: "/assinaturas", parentId: "planejamento" },
            ],
        },
        {
            id: "lancamentos",
            label: "Lançamentos",
            icon: "ri-file-list-3-line",
            link: "/#",
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
                { id: "cartoes", label: "Cartões", link: "/cartoes", parentId: "lancamentos" },
                { id: "faturas", label: "Faturas", link: "/faturas", parentId: "lancamentos" },
                { id: "transacoes", label: "Transações", link: "/transacoes", parentId: "lancamentos" },
            ],
        },
        {
            id: "cadastros",
            label: "Cadastros",
            icon: "ri-folder-settings-line",
            link: "/#",
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
                { id: "categorias", label: "Categorias", link: "/categorias", parentId: "cadastros" },
                { id: "subcategorias", label: "Subcategorias", link: "/subcategorias", parentId: "cadastros" },
                { id: "estabelecimentos", label: "Estabelecimentos", link: "/estabelecimentos", parentId: "cadastros" },
                { id: "lojas", label: "Lojas", link: "/lojas", parentId: "cadastros" },
                { id: "pessoas", label: "Pessoas", link: "/pessoas", parentId: "cadastros" },
                { id: "responsaveis", label: "Responsáveis", link: "/responsaveis", parentId: "cadastros" },
            ],
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
