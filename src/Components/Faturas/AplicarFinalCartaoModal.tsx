import React from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'

type AplicarFinalCartaoModalProps = {
    isOpen: boolean
    loading?: boolean
    onSim: () => void
    onNao: () => void
}

const AplicarFinalCartaoModal = ({
    isOpen,
    loading = false,
    onSim,
    onNao,
}: AplicarFinalCartaoModalProps) => (
    <Modal isOpen={isOpen} centered backdrop="static" keyboard={false}>
        <ModalHeader>Final do cartão</ModalHeader>
        <ModalBody>
            Esta compra é parcelada. Deseja aplicar o final a todas as parcelas?
        </ModalBody>
        <ModalFooter>
            <Button color="light" onClick={onNao} disabled={loading}>
                Não
            </Button>
            <Button color="primary" onClick={onSim} disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Sim'}
            </Button>
        </ModalFooter>
    </Modal>
)

export default AplicarFinalCartaoModal
