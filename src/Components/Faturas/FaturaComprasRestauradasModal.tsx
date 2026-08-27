import React from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { formatCurrency, formatDateBr } from 'helpers/fatura_helpers'
import { labelPrecisaConciliar, pathVisualizacaoCompra } from 'helpers/cadastro_manual_compra_helpers'
import { textoStubsExcluidos } from 'helpers/fatura_anexo_remover_helpers'
import {
    ImpactoRemoverAnexoCompra,
    RemoverAnexoResult,
    TipoRemoverAnexo,
} from 'interfaces/Faturas/FaturasInterface'

export type FaturaComprasRestauradasModalProps = {
    isOpen: boolean
    result: RemoverAnexoResult | null
    tipo?: TipoRemoverAnexo | null
    onClose: () => void
}

const introArquivo = (tipo?: TipoRemoverAnexo | null): { arquivo: string; quando: string } => {
    if (tipo === 'csv') return { arquivo: 'O CSV foi removido', quando: 'quando o arquivo certo existir' }
    if (tipo === 'ambos') return { arquivo: 'O anexo foi removido', quando: 'quando o arquivo certo existir' }
    return { arquivo: 'O PDF foi removido', quando: 'quando o PDF certo existir' }
}

const CompraRestauradaCard = ({ compra }: { compra: ImpactoRemoverAnexoCompra }) => {
    const detalhe = [
        formatCurrency(compra.valor),
        formatDateBr(compra.data),
        Number(compra.parcelas_total ?? 0) > 1
            ? `${compra.parcela_atual ?? 1}/${compra.parcelas_total}`
            : null,
    ].filter(Boolean).join(' · ')
    const path = compra.id != null ? pathVisualizacaoCompra(String(compra.id)) : null
    const badge = labelPrecisaConciliar(compra)

    return (
        <div className="border rounded p-3">
            <div className="fw-semibold">{compra.texto_compra}</div>
            <div className="small text-muted">{detalhe}</div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                <Badge
                    color="warning"
                    className="fw-normal"
                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
                >
                    <i className="ri-alert-line me-1"></i>
                    {badge}
                </Badge>
                {path && (
                    <Link to={path} className="btn btn-sm btn-soft-primary">
                        Ver compra
                    </Link>
                )}
            </div>
        </div>
    )
}

const FaturaComprasRestauradasModal = ({
    isOpen,
    result,
    tipo = null,
    onClose,
}: FaturaComprasRestauradasModalProps) => {
    const compras = result?.compras_que_voltaram_a_conciliar ?? []
    const stubs = (result?.faturas_stub_excluidas ?? [])
        .map((item) => (typeof item === 'number' ? String(item) : item.competencia))
        .filter(Boolean)
    const avisoStubs = textoStubsExcluidos(stubs)
    const intro = introArquivo(tipo)

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered size="lg" scrollable fullscreen="sm">
            <ModalHeader toggle={onClose}>
                Compras que voltaram a precisar de conciliação
            </ModalHeader>
            <ModalBody>
                <p className="mb-3">
                    {intro.arquivo}. As compras abaixo estavam conciliadas com aquele extrato e{' '}
                    <strong>voltaram ao estado original</strong>: continuam cadastradas, mas outra vez
                    como compra que ainda precisa ser conciliada {intro.quando}.
                </p>
                <div className="d-flex flex-column gap-2">
                    {compras.map((compra) => (
                        <CompraRestauradaCard key={compra.id} compra={compra} />
                    ))}
                </div>
                {avisoStubs && (
                    <p className="small text-muted mt-3 mb-0">{avisoStubs}</p>
                )}
            </ModalBody>
            <ModalFooter>
                <Button type="button" color="primary" onClick={onClose}>
                    Entendi
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaComprasRestauradasModal
