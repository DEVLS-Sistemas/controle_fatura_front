import React from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import {
    AplicarSubcategoriaPergunta,
    textoAplicarSubcategoria,
} from 'helpers/aplicar_subcategoria_helpers'

type AplicarSubcategoriaModalProps = {
    isOpen: boolean
    pergunta: AplicarSubcategoriaPergunta | null
    loading?: boolean
    onAplicar: () => void
    onCancelar: () => void
}

const AplicarSubcategoriaModal = ({
    isOpen,
    pergunta,
    loading = false,
    onAplicar,
    onCancelar,
}: AplicarSubcategoriaModalProps) => (
    <Modal isOpen={isOpen} toggle={loading ? undefined : onCancelar} centered backdrop="static">
        <ModalHeader toggle={loading ? undefined : onCancelar}>
            {pergunta?.somente_categoria ? 'Aplicar categoria' : 'Aplicar subcategoria'}
        </ModalHeader>
        <ModalBody>
            {pergunta ? textoAplicarSubcategoria(pergunta) : null}
        </ModalBody>
        <ModalFooter>
            <Button color="light" onClick={onCancelar} disabled={loading}>
                Não aplicar
            </Button>
            <Button color="primary" onClick={onAplicar} disabled={loading || !pergunta}>
                {loading ? <Spinner size="sm" /> : 'Aplicar'}
            </Button>
        </ModalFooter>
    </Modal>
)

export default AplicarSubcategoriaModal
