import UiContent from "Components/Common/UiContent";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Breadcrumb, BreadcrumbItem, Button, ButtonGroup, Card, CardHeader, Col, Collapse, DropdownItem, DropdownMenu, DropdownToggle, Form, Input, Label, Modal, ModalBody, ModalHeader, Row, UncontrolledDropdown } from "reactstrap";
import { UsuarioModel, UsuarioSearch } from "interfaces/UsuarioInterface";
import { InputTextControlled } from "Components/ComponentController/Inputs/Text/InputTextControlled";
import { InputDate } from "Components/ComponentController/Inputs/Date/InputDate";
import { SelectListControlled } from "Components/ComponentController/Selects/Select/SelectListControlled";
import { SelectOptions } from "interfaces/SystemInterfaces/SelectInterface";
// import { AsyncSelectListControlled } from "Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled";
import { UsuarioService } from "services/UsuarioService";
import { AsyncSelectListControlled } from "Components/ComponentController/Selects/AsyncSelect/AsyncSelectListControlled";
import { InputCheckbox } from "Components/ComponentController/Inputs/Checkbox/InputCheckbox";
import { InputRadio } from "Components/ComponentController/Inputs/Radio/InputRadio";
import CustomModal from "Components/ComponentController/Modal/CustomModal";


export interface UsuarioFilterProps {
    getRemoteUsuarioList: (data: any) => void
}

const UsuarioFilter = ({ getRemoteUsuarioList }: UsuarioFilterProps) => {

    const { handleSubmit, control, setValue, register, watch } = useForm<UsuarioSearch>({ defaultValues: {} })
    const usuarioService = new UsuarioService();
    // Exibe menu de filtros
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const handleShowFilter = () => {
        setShowFilter(!showFilter);
    };

    const callbackFuncion = async (inputValue: string): Promise<SelectOptions[]> => {
        // const list = await usuarioService.AsyncListUsuarios({ palavra_chave: inputValue})

        const optSelectList = [
            { id: 1, nome: 'Opção A' },
            { id: 2, nome: 'Opção B' },
            { id: 3, nome: 'Opção C' },
            { id: 4, nome: 'Opção D' },
            { id: 5, nome: 'Opção E' },
            { id: 6, nome: 'Opção F' },
            { id: 7, nome: 'Opção G' },
            { id: 8, nome: 'Opção H' },
            { id: 9, nome: 'Opção I' },
            { id: 10, nome: 'Opção J' },
            { id: 11, nome: 'Opção K' },
            { id: 12, nome: 'Opção L' },
            { id: 13, nome: 'Opção M' },
            { id: 14, nome: 'Opção N' },
            { id: 15, nome: 'Opção O' },
            { id: 16, nome: 'Opção P' },
            { id: 17, nome: 'Opção Q' },
            { id: 18, nome: 'Opção R' },
            { id: 19, nome: 'Opção S' },
            { id: 19, nome: 'Opção T' },
            { id: 20, nome: 'Opção U' },
            { id: 21, nome: 'Opção V' },
            { id: 22, nome: 'Opção X' }
        ];


        let opt = new Array
        opt.push({ value: '', label: 'Selecione' })
        if (optSelectList) {
            optSelectList.map((item: UsuarioModel) => {
                opt.push({ value: item.id, label: item.nome })
            });
        }
        return opt
    }

    const optRadio = [
        { value: 0, label: 'Radio Opção A' },
        { value: 1, label: 'Radio Opção B' },
        { value: 3, label: 'Radio Opção C' }
    ]

    const optSelectList: SelectOptions[] = [
        { value: 1, label: 'Opção A' },
        { value: 2, label: 'Opção B' },
        { value: 3, label: 'Opção C' }
    ]

    const [modalIsOpen, setModalIsOpen] = useState(false);

    const toggleModal = () => {
        setModalIsOpen(!modalIsOpen);
    };

    return (
        <React.Fragment>
            <UiContent />
            {/* Breadcrumb */}
            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <div className='d-sm-flex align-items-center justify-content-between'>
                            <Link to="/dashboard"> <i className="bx bx-arrow-back bx-sm"></i> </Link>
                            <h4 className="mb-sm-0 ms-3">Usuários</h4>
                        </div>
                        <Breadcrumb pageTitle="" listClassName='mb-sm-0 pt-1 py-2'>
                            <BreadcrumbItem> <Link to="/dashboard"> <i className="ri-home-5-fill"></i> </Link> </BreadcrumbItem>
                            <BreadcrumbItem active> Usuários </BreadcrumbItem>
                        </Breadcrumb>
                    </div>
                </Col>
            </Row>
            {/* Filter */}
            <Row>
                <Col xs={12}>
                    <div className="d-flex flex-row justify-content-end align-items-center mb-4" >
                        <div className="mt-3 mt-lg-0">
                            <div className="col-auto">
                                <Link to="add" type="button" className="btn btn-primary"><i className="ri-add-circle-line align-middle me-1"></i> Adicionar Usuário</Link>
                            </div>
                        </div>
                        <div className="mt-3 mt-lg-0 ms-3 me-3">
                            <ButtonGroup>
                                <UncontrolledDropdown>
                                    <DropdownToggle tag="button" className="btn btn-secondary">
                                        Imprimir <i className="mdi mdi-chevron-down"></i>
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem>PDF</DropdownItem>
                                        <DropdownItem>XLS</DropdownItem>
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </ButtonGroup>
                        </div>
                        <div className="mt-3 mt-lg-0 ms-3 me-3">
                            <div>
                                <Button onClick={toggleModal} color="dark" style={{ cursor: "pointer" }} className=""> Abrir Modal </Button>
                                <CustomModal
                                    isOpen={modalIsOpen}
                                    toggle={toggleModal}
                                    title="Título do Modal"
                                    // position="bottom-right"
                                    // centered={true}
                                    // fullScreen={true}
                                    // size="md"
                                    // static={true}
                                    body={
                                        <div>
                                            <h5 className="fs-15">Teste de Conteudo Modal</h5>
                                            <p className="text-muted">One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.</p>
                                        </div>
                                    }
                                />
                            </div>

                        </div>

                    </div>
                </Col>
                <Col xl={12}>
                    <Card>
                        <CardHeader>
                            <div className="gap-2 flex-wrap">
                                <Row>
                                    <Col md={4}>
                                        <Button onClick={handleShowFilter} color="primary" style={{ cursor: "pointer" }} className="mb-1"> Filtros </Button>
                                    </Col>
                                    {!showFilter &&
                                        <Col md={8}>
                                            <form onSubmit={handleSubmit(getRemoteUsuarioList)} >
                                                <div className="input-group">
                                                    <input {...register("palavra_chave")} type="text" className="form-control" placeholder="Buscar..." />
                                                    <button className="btn btn-success" type="submit" id="button-addon2"><i className="ri-search-line align-middle me-1"></i> Buscar</button>
                                                </div>
                                            </form>
                                        </Col>
                                    }
                                </Row>
                            </div>
                            {/* {showFilter && */}
                            <Row>
                                <Col>
                                    <Collapse isOpen={showFilter} id="multiCollapseExample2" className="multi-collapse mt-3">
                                        <div className="">
                                            <form className="px-0 my-0 m-2" id="form-search" name="form-search" onSubmit={handleSubmit(getRemoteUsuarioList)}>
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="firstNameinput" className="form-label">Input Text</Label>
                                                            <InputTextControlled<UsuarioSearch> field={"input_text"} control={control} placeholder="Input Text" />
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="lastNameinput" className="form-label">Input Date</Label>
                                                            <InputDate<UsuarioSearch> field={"input_date"} register={register} />
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="ForminputState" className="form-label">Select List</Label>
                                                            <SelectListControlled<UsuarioSearch> options={optSelectList} field={"select_list"} control={control} />
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="ForminputState" className="form-label">Async Select List</Label>
                                                            <AsyncSelectListControlled<UsuarioSearch> callback={callbackFuncion} field={"async_select_list"} control={control}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="ForminputState" className="form-label">Multiple Select List</Label>
                                                            <SelectListControlled<UsuarioSearch> options={optSelectList} field={"multiple_select_list"} control={control} isMulti={true} />
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label className="form-check-label">Checkbox Option</Label>
                                                        </div>
                                                        <div className="form-check">
                                                            <Label className="form-check-label" htmlFor="checkbox_a">Checkbox Option A</Label>
                                                            <InputCheckbox<UsuarioSearch> field='checkbox_a' register={register} />
                                                        </div>
                                                        <div className="form-check">
                                                            <Label className="form-check-label" htmlFor="checkbox_b">Checkbox Option B</Label>
                                                            <InputCheckbox<UsuarioSearch> field='checkbox_b' register={register} />
                                                        </div>
                                                        <div className="form-check">
                                                            <Label className="form-check-label" htmlFor="checkbox_c">Checkbox Option C</Label>
                                                            <InputCheckbox<UsuarioSearch> field='checkbox_c' register={register} />
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label className="form-check-label">Switch Checkbox Option</Label>
                                                        </div>
                                                        <div className="form-check form-switch">
                                                            <Label className="form-check-label" htmlFor="switch_checkbox">Switch Checkbox Option</Label>
                                                            <InputCheckbox<UsuarioSearch> field='switch_checkbox' register={register} role="switch" />
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="mb-3">
                                                            <Label className="form-check-label">Radio</Label>
                                                        </div>
                                                        <div className="form-check">
                                                            <InputRadio<UsuarioSearch> options={optRadio} field="radio" register={register} />
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <br />
                                                <Row>
                                                    <div className="d-flex flex-row justify-content-end align-items-center" >
                                                        <Col md={6}>
                                                            <div className="ms-4 ">
                                                                <InputTextControlled<UsuarioSearch> field={"palavra_chave"} control={control} placeholder="Buscar..." />
                                                            </div>
                                                        </Col>
                                                        <Col md={2} className="me-3">
                                                            <button className="btn btn-success form-control ms-3" type="submit" id="button-addon2">Buscar</button>
                                                        </Col>
                                                    </div>
                                                </Row>
                                            </form>
                                        </div>
                                    </Collapse>
                                </Col>
                            </Row>
                            {/* } */}
                        </CardHeader>
                    </Card>
                </Col>
            </Row>
        </React.Fragment >
    )
}

export default UsuarioFilter;     