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

        if (iscurrentState === "Usuarios") {
            history("/usuarios");
            document.body.classList.add("twocolumn-panel");
        }
    }, [history, iscurrentState, isDashboard]);

    const menuItems: any = [
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Dashboards",
            icon: "ri-dashboard-2-line",
            link: "/#",
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsDashboard(!isDashboard);
                setIscurrentState("Dashboard");
                updateIconSidebar(e);
            },
            subItems: [
                {
                    id: "dashboard-home",
                    label: "Principal",
                    link: "/dashboard",
                    parentId: "dashboard",
                },
                {
                    id: "nft",
                    label: "NFT",
                    link: "/dashboard-nft",
                    parentId: "dashboard",
                },
                {
                    id: "job",
                    label: "Job",
                    link: "/dashboard-job",
                    parentId: "dashboard",
                    badgeColor: "success",
                    badgeName: "New",
                },
            ],
        },
        {
            id: "usuarios",
            label: "Usuários",
            icon: "ri-user-line",
            link: "/usuarios",
            click: function (e: any) {
                e.preventDefault();
                setIscurrentState("Usuarios");
                updateIconSidebar(e);
            },
        },
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
