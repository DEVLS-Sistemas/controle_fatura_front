import React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';

interface CustomModalProps {
    isOpen: boolean;
    toggle: () => void;
    title?: string;
    body: React.ReactNode;
    position?: string;
    centered?: boolean;
    fullScreen?: boolean;
    size?: string;
    static?: boolean;
    delete?: boolean;
    required?: boolean;
    onConfirmDelete?: () => void;
}
interface DeleteModalProps {
    show?: boolean;
    onDeleteClick?: () => void;
    onCloseClick?: () => void;
    recordId?: string;
}

const CustomModal = ({ isOpen, toggle, title, body, position, centered, fullScreen, size, static: isStatic, delete: isDelete = false, required: isRequired = false,onConfirmDelete, }: CustomModalProps) => {

    return (
        <Modal isOpen={isOpen} toggle={toggle}
            centered={isDelete? true: centered}
            size={size}
            scrollable={true}
            backdrop={isStatic ? 'static' : true}
            modalClassName='flip'
            className={`${fullScreen ? 'modal-fullscreen' : ''} modal-dialog-${position}`}
        >
            {title && (
                <ModalHeader className="modal-title" toggle={toggle}>{title}</ModalHeader>
            )}

            {isDelete ? (
                <ModalBody className="py-3 px-5">
                    <div className="mt-2 text-center">
                        <i className="ri-delete-bin-line display-5 text-danger"></i>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Tem certeza ?</h4>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button color="btn w-sm btn-light" onClick={toggle}>
                            Fechar
                        </Button>
                        <Button
                            color="btn w-sm btn-danger"
                            onClick={() => {
                                if (onConfirmDelete) onConfirmDelete();
                                toggle();
                            }}
                        >
                            Sim, tenho certeza!
                        </Button>
         
                    </div>
                </ModalBody>
            ) :isRequired ? (
                <ModalBody className="py-3 px-5">
                    <div className="mt-2 text-center">
                        <i className="ri-delete-bin-line display-5 text-danger"></i>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Tem certeza ?</h4>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <Button color="btn w-sm btn-light" onClick={toggle}>
                            Fechar
                        </Button>
                        <Button
                            color="btn w-sm btn-danger"
                            onClick={() => {
                                if (onConfirmDelete) onConfirmDelete();
                                toggle();
                            }}
                        >
                            Sim, tenho certeza!
                        </Button>
         
                    </div>
                </ModalBody>
            ) : (
                <ModalBody className=''>{body}
                    <div className="modal-footer">
                        <Button color="btn btn-success" onClick={toggle}>
                            Fechar
                        </Button>
                        <Button color="primary">Save changes</Button>
                    </div>
                </ModalBody>
            )}
        </Modal >
    );
};

export default CustomModal;
