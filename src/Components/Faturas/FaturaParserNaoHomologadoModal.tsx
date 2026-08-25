import React from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { ParserHomologado } from 'interfaces/Cartoes/CartoesInterface'
import {
    formatParsersHomologadosLista,
    notasParsersHomologados,
} from 'helpers/parser_homologado_helpers'

export type FaturaParserNaoHomologadoModalProps = {
    isOpen: boolean
    cartaoNome?: string | null
    parsers?: ParserHomologado[] | null
    loading?: boolean
    showCadastrarSemAnexo?: boolean
    onAnexarMesmoAssim: () => void
    onCadastrarSemAnexo?: () => void
    onClose: () => void
}

const FaturaParserNaoHomologadoModal = ({
    isOpen,
    cartaoNome,
    parsers,
    loading = false,
    showCadastrarSemAnexo = true,
    onAnexarMesmoAssim,
    onCadastrarSemAnexo,
    onClose,
}: FaturaParserNaoHomologadoModalProps) => {
    const lista = formatParsersHomologadosLista(parsers)
    const notas = notasParsersHomologados(parsers)
    const nome = cartaoNome?.trim() || 'selecionado'

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered>
            <ModalHeader toggle={onClose}>Este cartão ainda não está homologado</ModalHeader>
            <ModalBody>
                <p className="mb-3">
                    Por enquanto o sistema lê com segurança faturas de{' '}
                    <strong>{lista || 'alguns bancos testados'}</strong>.
                </p>
                {notas.map((parser) => (
                    <p key={parser.chave} className="small text-muted mb-2">
                        {parser.label}: {parser.nota}
                    </p>
                ))}
                <p className="mb-0">
                    O cartão <strong>{nome}</strong> ainda não foi testado. Você pode anexar o
                    arquivo, mas <strong>o valor e as compras lidos podem não ser os corretos</strong>.
                </p>
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
                <Button type="button" color="light" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                {showCadastrarSemAnexo && onCadastrarSemAnexo && (
                    <Button
                        type="button"
                        color="secondary"
                        outline
                        onClick={onCadastrarSemAnexo}
                        disabled={loading}
                    >
                        Cadastrar sem anexo
                    </Button>
                )}
                <Button
                    type="button"
                    color="warning"
                    onClick={onAnexarMesmoAssim}
                    disabled={loading}
                >
                    Anexar mesmo assim
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default FaturaParserNaoHomologadoModal
