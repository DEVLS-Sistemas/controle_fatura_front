import React, { useState } from 'react';
import {
  Row, Col, CardBody, Card, Alert, Container, Input, Label, Form, FormFeedback, Button, Spinner
} from 'reactstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import logoLight from '../../assets/images/logo-light.png';
import ParticlesAuth from '../AuthenticationInner/ParticlesAuth';
import { AuthService } from 'services/Auth';

const Register = () => {
  const history = useNavigate();
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authService = new AuthService();

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: '',
      name: '',
      password: '',
      confirm_password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('E-mail inválido').required('Informe o e-mail'),
      name: Yup.string().required('Informe o nome'),
      password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Informe a senha'),
      confirm_password: Yup.string()
        .oneOf([Yup.ref('password')], 'Senhas não conferem')
        .required('Confirme a senha'),
    }),
    onSubmit: async (values) => {
      setLoader(true);
      setError(null);
      try {
        await authService.register({
          name: values.name,
          email: values.email,
          password: values.password,
        });
        toast.success('Conta criada com sucesso!');
        history('/dashboard');
      } catch (e: any) {
        const message = e?.message || 'Falha ao cadastrar';
        setError(message);
        toast.error(message);
      } finally {
        setLoader(false);
      }
    },
  });

  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content mt-lg-5">
          <Container>
            <Row>
              <Col lg={12}>
                <div className="text-center mt-sm-5 mb-4 text-white-50">
                  <Link to="/" className="d-inline-block auth-logo">
                    <img src={logoLight} alt="" height="80" />
                  </Link>
                  <p className="mt-3 fs-15 fw-medium">Controle de Faturas</p>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="mt-4">
                  <CardBody className="p-4">
                    <div className="text-center mt-2">
                      <h5 className="text-primary">Criar conta</h5>
                      <p className="text-muted">Cadastre-se para começar.</p>
                    </div>
                    {error ? <Alert color="danger">{error}</Alert> : null}
                    <div className="p-2 mt-4">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                        }}
                      >
                        <div className="mb-3">
                          <Label className="form-label">Nome</Label>
                          <Input
                            name="name"
                            type="text"
                            placeholder="Seu nome"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.name}
                            invalid={!!(validation.touched.name && validation.errors.name)}
                          />
                          {validation.touched.name && validation.errors.name ? (
                            <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label className="form-label">E-mail</Label>
                          <Input
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.email}
                            invalid={!!(validation.touched.email && validation.errors.email)}
                          />
                          {validation.touched.email && validation.errors.email ? (
                            <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label className="form-label">Senha</Label>
                          <Input
                            name="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.password}
                            invalid={!!(validation.touched.password && validation.errors.password)}
                          />
                          {validation.touched.password && validation.errors.password ? (
                            <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label className="form-label">Confirmar senha</Label>
                          <Input
                            name="confirm_password"
                            type="password"
                            placeholder="Repita a senha"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.confirm_password}
                            invalid={!!(validation.touched.confirm_password && validation.errors.confirm_password)}
                          />
                          {validation.touched.confirm_password && validation.errors.confirm_password ? (
                            <FormFeedback type="invalid">{validation.errors.confirm_password}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <Button color="success" className="w-100" type="submit" disabled={loader}>
                            {loader && <Spinner size="sm" className="me-2">...</Spinner>}
                            Cadastrar
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </CardBody>
                </Card>

                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Já tem conta?{' '}
                    <Link to="/login" className="fw-semibold text-primary text-decoration-underline">
                      Entrar
                    </Link>
                  </p>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default Register;
