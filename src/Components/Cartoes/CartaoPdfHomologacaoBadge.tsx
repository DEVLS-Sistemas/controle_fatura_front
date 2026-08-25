import React from 'react'
import { UncontrolledTooltip } from 'reactstrap'
import { ParserHomologado } from 'interfaces/Cartoes/CartoesInterface'
import { CartaoHomologacaoResolvida } from 'helpers/parser_homologado_helpers'

const tooltipHomologado = (parser?: ParserHomologado | null): string => {
    const label = parser?.label
    const nota = parser?.nota?.trim()
    const base = label ? `PDF homologado — ${label}` : 'PDF homologado'
    return nota ? `${base}. ${nota}` : base
}

export const CartaoPdfHomologacaoBadge = ({
    homologacao,
    targetId,
    compact = false,
}: {
    homologacao: CartaoHomologacaoResolvida
    targetId: string
    compact?: boolean
}) => {
    if (homologacao.homologada) {
        return (
            <>
                <span
                    id={targetId}
                    className="badge bg-success-subtle text-success align-middle"
                >
                    <i className="ri-checkbox-circle-line me-1"></i>
                    {compact ? 'PDF' : 'PDF homologado'}
                </span>
                <UncontrolledTooltip placement="top" target={targetId}>
                    {tooltipHomologado(homologacao.parser)}
                </UncontrolledTooltip>
            </>
        )
    }

    return (
        <>
            <span
                id={targetId}
                className="badge bg-secondary-subtle text-muted align-middle"
            >
                {compact ? 'PDF' : 'PDF não homologado'}
            </span>
            <UncontrolledTooltip placement="top" target={targetId}>
                A leitura automática de PDF ainda não foi testada para este cartão.
                O cartão é válido — os valores da fatura podem não ser os corretos.
            </UncontrolledTooltip>
        </>
    )
}

export default CartaoPdfHomologacaoBadge
