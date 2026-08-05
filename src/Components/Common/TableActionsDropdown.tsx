import React, { ReactNode } from "react"
import {
    ButtonGroup,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown,
} from "reactstrap"

type TableActionsDropdownProps = {
    children: ReactNode
    /** Classes do botão toggle. Default: "btn" */
    toggleClassName?: string
}

/**
 * Menu de ações para tabelas com scroll/overflow.
 * Usa strategy="fixed" + portal no body para o dropdown não ser cortado.
 */
export const TableActionsDropdown = ({
    children,
    toggleClassName = "btn",
}: TableActionsDropdownProps) => (
    <ButtonGroup>
        <UncontrolledDropdown direction="down">
            <DropdownToggle tag="button" className={toggleClassName}>
                <i className="ri-more-2-fill"></i>
            </DropdownToggle>
            <DropdownMenu
                end
                strategy="fixed"
                container="body"
                style={{ zIndex: 1050 }}
            >
                {children}
            </DropdownMenu>
        </UncontrolledDropdown>
    </ButtonGroup>
)

export default TableActionsDropdown
