import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';

import progileBg from '../../../../assets/images/profile-bg.jpg';
import { useAuthUser } from 'Components/Hooks/useAuthUser';
import { AuthService, AuthUser } from 'services/Auth';
import { PerfilForm } from 'interfaces/Perfil/PerfilInterface';
import { mask, removeMask } from 'helpers/functions_helpers';
import { ValidationError } from 'libs/api/exceptions/ValidationError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userToForm = (user?: AuthUser | null): PerfilForm => ({
    name: user?.name || '',
    sobrenome: user?.sobrenome || '',
    cpf_cnpj: user?.cpf_cnpj ? mask('cpf_cnpj', user.cpf_cnpj) || '' : '',
    email: user?.email || '',
});

const Settings = () => {
    const navigate = useNavigate();
    const { user, displayName, initials } = useAuthUser();
    const authServiceRef = useRef(new AuthService());
    const [activeTab] = useState('1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<PerfilForm>(() => userToForm(user));
    const [snapshot, setSnapshot] = useState<PerfilForm>(() => userToForm(user));

    const applyUser = (fresh: AuthUser) => {
        const values = userToForm(fresh);
        setForm(values);
        setSnapshot(values);
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const fresh = await authServiceRef.current.me();
                if (!cancelled && fresh) applyUser(fresh);
            } catch (error: unknown) {
                if (!cancelled) {
                    const message = error instanceof Error && error.message ? error.message : 'Erro ao carregar perfil';
                    toast.error(message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const onChange = (field: keyof PerfilForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setForm((current) => ({
            ...current,
            [field]: field === 'cpf_cnpj' ? mask('cpf_cnpj', value) || '' : value,
        }));
    };

    const validateClient = (data: PerfilForm): string | null => {
        const name = data.name.trim();
        const email = data.email.trim();
        if (!name || !email) return 'Nome e e-mail são obrigatórios';
        if (!EMAIL_REGEX.test(email)) return 'E-mail inválido';
        const digits = removeMask(data.cpf_cnpj || '') || '';
        if (digits && digits.length !== 11 && digits.length !== 14) return 'CPF/CNPJ inválido';
        return null;
    };

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;

        const clientError = validateClient(form);
        if (clientError) {
            toast.error(clientError);
            return;
        }

        setSaving(true);
        try {
            const result = await authServiceRef.current.updatePerfil({
                name: form.name.trim(),
                sobrenome: form.sobrenome.trim() || '',
                cpf_cnpj: removeMask(form.cpf_cnpj || '') || '',
                email: form.email.trim(),
            });
            applyUser(result.user);
            toast.success(result.message);
            navigate('/perfil');
        } catch (error: unknown) {
            const message =
                error instanceof ValidationError || error instanceof Error
                    ? error.message
                    : 'Erro ao salvar perfil';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const onCancel = () => {
        setForm(snapshot);
        navigate('/perfil');
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="position-relative mx-n4 mt-n4">
                        <div className="profile-wid-bg profile-setting-img">
                            <img src={progileBg} className="profile-wid-img" alt="" />
                        </div>
                    </div>
                    <Row>
                        <Col xxl={3}>
                            <Card className="mt-n5">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="profile-user position-relative d-inline-block mx-auto mb-4">
                                            <span className="rounded-circle avatar-xl img-thumbnail d-inline-flex align-items-center justify-content-center bg-light text-primary fs-22 user-profile-image">
                                                {initials}
                                            </span>
                                        </div>
                                        <h5 className="fs-16 mb-1">{displayName || 'Perfil'}</h5>
                                        <p className="text-muted mb-0">{form.email || user?.email || ''}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xxl={9}>
                            <Card className="mt-xxl-n5">
                                <CardHeader>
                                    <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                                        <NavItem>
                                            <NavLink className={classnames({ active: activeTab === '1' })}>
                                                <i className="fas fa-home"></i> Dados Pessoais
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId="1">
                                            <Form onSubmit={onSubmit}>
                                                <Row>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="firstnameInput" className="form-label">Nome</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="firstnameInput"
                                                                placeholder="Nome"
                                                                value={form.name}
                                                                onChange={onChange('name')}
                                                                disabled={loading || saving}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="lastnameInput" className="form-label">Sobrenome</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="lastnameInput"
                                                                placeholder="Sobrenome"
                                                                value={form.sobrenome}
                                                                onChange={onChange('sobrenome')}
                                                                disabled={loading || saving}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="cpfCnpjInput" className="form-label">CPF/CNPJ</Label>
                                                            <Input
                                                                type="text"
                                                                className="form-control"
                                                                id="cpfCnpjInput"
                                                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                                                value={form.cpf_cnpj}
                                                                onChange={onChange('cpf_cnpj')}
                                                                disabled={loading || saving}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="emailInput" className="form-label">E-mail</Label>
                                                            <Input
                                                                type="email"
                                                                className="form-control"
                                                                id="emailInput"
                                                                placeholder="E-mail"
                                                                value={form.email}
                                                                onChange={onChange('email')}
                                                                disabled={loading || saving}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <div className="hstack gap-2 justify-content-end">
                                                            <button type="submit" className="btn btn-primary" disabled={loading || saving}>
                                                                {saving && <Spinner size="sm" className="me-2">...</Spinner>}
                                                                Salvar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-soft-success"
                                                                onClick={onCancel}
                                                                disabled={loading || saving}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>
                                    </TabContent>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Settings;
