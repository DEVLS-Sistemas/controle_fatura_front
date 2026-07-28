import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNavegacao } from 'helpers/functions_helpers';

import { setActiveMenu } from 'helpers/system_helpers';
import { UsuarioDefaultValues, UsuarioModel } from 'interfaces/UsuarioInterface';
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap';
import { SubmitHandler, useForm } from 'react-hook-form';
import { UsuarioService } from 'services/UsuarioService';
import { InputTextControlled } from 'Components/ComponentController/Inputs/Text/InputTextControlled';
import { InputDate } from 'Components/ComponentController/Inputs/Date/InputDate';
import { InputCheckbox } from 'Components/ComponentController/Inputs/Checkbox/InputCheckbox';
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled';
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface';
import ButtonToTop from 'Components/ComponentController/Buttons/ButtonToTop/ButtonToTop';

const UsuarioForm = () => {
    const { state } = useLocation();
    const [usuario] = useState<UsuarioModel>(state ? state.source : UsuarioDefaultValues);
    const { register, handleSubmit, control, getValues, setValue, formState: { errors } } = useForm<UsuarioModel>({
        defaultValues: usuario
    });

    const { voltarParaRotaAnterior } = useNavegacao();
    const [display, setDisplay] = useState<boolean>(false);
    const navigate = useNavigate();
    const usuarioService = new UsuarioService();

    const optSexo: SelectOptions[] = [
        { value: 1, label: 'Feminino' },
        { value: 2, label: 'Masculino' },
        { value: 3, label: 'Outros' }
    ];

    const onSubmit: SubmitHandler<UsuarioModel> = async data => {
        try {
            if (usuario.id) {
                await usuarioService.editUsuario(data);
            } else {
                const id = await usuarioService.createUsuario(data);
                setValue('id', id);
            }
            navigate(`/usuarios/${getValues('id')}`);
        } catch (error: any) {
            throw error;
        }
    };

    useEffect(() => {
        setTimeout(() => {
            setDisplay(true);
        }, 300);
    }, []);

    useEffect(() => {
        setActiveMenu('/usuarios');
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className='d-sm-flex align-items-center justify-content-between'>
                                    <Link to="/usuarios"> <i className="bx bx-arrow-back bx-sm"></i> </Link>
                                    <h4 className="mb-sm-0 ms-3">Adicionar Usuário</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName='mb-sm-0 pt-1 py-2'>
                                    <BreadcrumbItem> <Link to="/dashboard"> <i className="ri-home-5-fill"></i> </Link> </BreadcrumbItem>
                                    <BreadcrumbItem> <Link to="/usuarios"> Usuários </Link> </BreadcrumbItem>
                                    <BreadcrumbItem active> Adicionar Usuário </BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <div className="">
                                        <form onSubmit={handleSubmit(onSubmit)}>
                                            <Row>
                                                <Col md={12} className='d-flex flex-row justify-content-end align-items-center'>
                                                    <div className="form-check form-switch form-switch-md mb-3 form-check-right mb-2">
                                                        <Label className="me-3" htmlFor="ativo">Ativo</Label>
                                                        <InputCheckbox<UsuarioModel> field='ativo' register={register} role="switch" />
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="nome" className="form-label">Nome</Label>
                                                        <InputTextControlled<UsuarioModel> field={"nome"} control={control} placeholder="Nome" />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="nascimento" className="form-label">Nacimento</Label>
                                                        <InputDate<UsuarioModel> field={"nascimento"} register={register} />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="sexo" className="form-label">Sexo</Label>
                                                        <SelectListControlled<UsuarioModel> options={optSexo} field={"sexo"} control={control} />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <br />
                                            <Row>
                                                <Col md={12}>
                                                    <div className="hstack gap-2 justify-content-end">
                                                        <button type="submit" className="btn btn-primary">Salvar</button>
                                                        <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>Voltar</button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </form>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            {display && <ButtonToTop />}
        </React.Fragment>
    );
};

export default UsuarioForm;
