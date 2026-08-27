import React from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
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
    /** Etapa 3: PDF novo ainda está no job */
    processing?: boolean
    /** `trocar` muda o texto — o arquivo anterior saiu, o novo está (ou vai) processar */
    contexto?: 'remover' | 'trocar'
    onClose: () => void
}

const introArquivo = (
    tipo?: TipoRemoverAnexo | null,
    contexto: 'remover' | 'trocar' = 'remover',
    processing = false,
): { titulo: string; corpo: React.ReactNode } => {
    if (processing) {
        return {
            titulo: 'Compras desfeitas; processando o PDF certo…',
            corpo: (
                <>
                    O extrato anterior foi desfeito. As compras abaixo voltaram ao estado original
                    enquanto o arquivo novo é lido. Isso pode levar alguns segundos.
                </>
            ),
        }
    }
    if (contexto === 'trocar') {
        return {
            titulo: 'Compras que voltaram a precisar de conciliação',
            corpo: (
                <>
                    O PDF anterior foi desfeito. As compras abaixo estavam conciliadas com aquele
                    extrato e <strong>voltaram ao estado original</strong>: continuam cadastradas,
                    de novo como compra que ainda precisa ser conciliada no arquivo certo.
                </>
            ),
        }
    }
    const arquivo = tipo === 'csv'
        ? 'O CSV foi removido'
        : tipo === 'ambos'
            ? 'O anexo foi removido'
            : 'O PDF foi removido'
    const quando = tipo === 'pdf' || !tipo
        ? 'quando o PDF certo existir'
        : 'quando o arquivo certo existir'
    return {
        titulo: 'Compras que voltaram a precisar de conciliação',
        corpo: (
            <>
                {arquivo}. As compras abaixo estavam conciliadas com aquele extrato e{' '}
                <strong>voltaram ao estado original</strong>: continuam cadastradas, mas outra vez
                como compra que ainda precisa ser conciliada {quando}.
            </>
        ),
    }
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
    processing = false,
    contexto = 'remover',
    onClose,
}: FaturaComprasRestauradasModalProps) => {
    const compras = result?.compras_que_voltaram_a_conciliar ?? []
    const stubs = (result?.faturas_stub_excluidas ?? [])
        .map((item) => (typeof item === 'number' ? String(item) : item.competencia))
        .filter(Boolean)
    const avisoStubs = textoStubsExcluidos(stubs)
    const intro = introArquivo(tipo, contexto, processing)

    return (
        <Modal
            isOpen={isOpen}
            toggle={processing ? undefined : onClose}
            centered
            size="lg"
            scrollable
            fullscreen="sm"
        >
            <ModalHeader toggle={processing ? undefined : onClose}>
                {intro.titulo}
            </ModalHeader>
            <ModalBody>
                {processing && (
                    <div className="text-center py-3">
                        <Spinner color="primary" />
                        <div className="text-muted mt-2">Processando o PDF correto…</div>
                    </div>
                )}
                <p className="mb-3">{intro.corpo}</p>
                {compras.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                        {compras.map((compra) => (
                            <CompraRestauradaCard key={compra.id} compra={compra} />
                        ))}
                    </div>
                ) : processing ? (
                    <p className="text-muted mb-0">Nenhuma compra manual precisou ser restaurada.</p>
                ) : null}
                {avisoStubs && (
                    <p className="small text-muted mt-3 mb-0">{avisoStubs}</p>
                )}
            </ModalBody>
            <ModalFooter>
                {processing ? (
                    <span className="text-muted small">Aguarde o processamento terminar.</span>
                ) : (
                    <Button type="button" color="primary" onClick={onClose}>
                        Entendi
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    )
}

export default FaturaComprasRestauradasModal
