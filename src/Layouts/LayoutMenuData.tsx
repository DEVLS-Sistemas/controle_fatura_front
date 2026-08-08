import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();

    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [iscurrentState, setIscurrentState] = useState("Dashboard");

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
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
        if (iscurrentState !== "Dashboard") {
            setIsDashboard(false);
        }
    }, [history, iscurrentState, isDashboard]);

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
            id: "projecao-faturas",
            label: "Projeção",
            icon: "ri-line-chart-line",
            link: "/projecao-faturas",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("ProjecaoFaturas");
                updateIconSidebar(e);
            },
        },
        {
            id: "cartoes",
            label: "Cartões",
            icon: "ri-bank-card-line",
            link: "/cartoes",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Cartoes");
                updateIconSidebar(e);
            },
        },
        {
            id: "faturas",
            label: "Faturas",
            icon: "ri-file-list-3-line",
            link: "/faturas",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Faturas");
                updateIconSidebar(e);
            },
        },
        {
            id: "transacoes",
            label: "Transações",
            icon: "ri-exchange-dollar-line",
            link: "/transacoes",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Transacoes");
                updateIconSidebar(e);
            },
        },
        {
            id: "categorias",
            label: "Categorias",
            icon: "ri-price-tag-3-line",
            link: "/categorias",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Categorias");
                updateIconSidebar(e);
            },
        },
        {
            id: "subcategorias",
            label: "Subcategorias",
            icon: "ri-node-tree",
            link: "/subcategorias",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Subcategorias");
                updateIconSidebar(e);
            },
        },
        {
            id: "estabelecimentos",
            label: "Estabelecimentos",
            icon: "ri-store-2-line",
            link: "/estabelecimentos",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Estabelecimentos");
                updateIconSidebar(e);
            },
        },
        {
            id: "lojas",
            label: "Lojas",
            icon: "ri-building-line",
            link: "/lojas",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Lojas");
                updateIconSidebar(e);
            },
        },
        {
            id: "responsaveis",
            label: "Responsáveis",
            icon: "ri-user-shared-line",
            link: "/responsaveis",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Responsaveis");
                updateIconSidebar(e);
            },
        },
        {
            id: "relatorios",
            label: "Relatórios",
            icon: "ri-bar-chart-grouped-line",
            link: "/relatorios",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Relatorios");
                updateIconSidebar(e);
            },
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
