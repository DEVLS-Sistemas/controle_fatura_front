import React, { useMemo, useState } from 'react';
import {
  Card, CardBody, Col, Container, Input, Label, Row, Button, Form, FormFeedback, Alert, Spinner
} from 'reactstrap';
import ParticlesAuth from '../AuthenticationInner/ParticlesAuth';
import { Link } from 'react-router-dom';
import withRouter from '../../Components/Common/withRouter';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import logoLight from '../../assets/images/logo-light.png';
import { AuthService } from 'services/Auth';
import { AUTH_LEMBRAR_EMAIL_KEY } from 'helpers/auth_session';
import { toast } from 'react-toastify';

const readLembrarEmail = (): string => {
  try {
    return localStorage.getItem(AUTH_LEMBRAR_EMAIL_KEY)?.trim() || '';
  } catch {
    return '';
  }
};

const persistLembrarEmail = (email: string, lembrar: boolean): void => {
  try {
    if (lembrar && email) {
      localStorage.setItem(AUTH_LEMBRAR_EMAIL_KEY, email);
      return;
    }
    localStorage.removeItem(AUTH_LEMBRAR_EMAIL_KEY);
  } catch {
    // ignore quota / private mode
  }
};

const Login = (props: any) => {
  const [passwordShow, setPasswordShow] = useState(false);
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authService = new AuthService();
  const rememberedEmail = useMemo(() => readLembrarEmail(), []);

  const validation = useFormik({
    enableReinitialize: false,
    initialValues: {
      email: rememberedEmail,
      password: '',
      lembrar_me: Boolean(rememberedEmail),
    },
    validationSchema: Yup.object({
      email: Yup.string().email('E-mail inválido').required('Informe o e-mail'),
      password: Yup.string().required('Informe a senha'),
    }),
    onSubmit: async (values) => {
      setLoader(true);
      setError(null);
      try {
        const email = values.email.trim();
        await authService.login({
          email,
          password: values.password,
          lembrar_me: Boolean(values.lembrar_me),
        });
        persistLembrarEmail(email, Boolean(values.lembrar_me));
        toast.success('Login realizado com sucesso!');
        props.router.navigate('/dashboard');
      } catch (e: any) {
        const message = e?.message || 'Falha ao autenticar';
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
                      <h5 className="text-primary">Bem-vindo!</h5>
                      <p className="text-muted">Entre para continuar.</p>
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
                          <Label htmlFor="email" className="form-label">E-mail</Label>
                          <Input
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.email || ''}
                            invalid={!!(validation.touched.email && validation.errors.email)}
                          />
                          {validation.touched.email && validation.errors.email ? (
                            <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <div className="float-end">
                            <Link to="/recuperar-senha" className="text-muted">Esqueci a senha</Link>
                          </div>
                          <Label className="form-label" htmlFor="password-input">Senha</Label>
                          <div className="position-relative auth-pass-inputgroup mb-3">
                            <Input
                              name="password"
                              value={validation.values.password || ''}
                              type={passwordShow ? 'text' : 'password'}
                              className="form-control pe-5"
                              placeholder="Senha"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={!!(validation.touched.password && validation.errors.password)}
                            />
                            {validation.touched.password && validation.errors.password ? (
                              <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                            ) : null}
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setPasswordShow(!passwordShow)}
                            >
                              <i className="ri-eye-fill align-middle"></i>
                            </button>
                          </div>
                        </div>

                        <div className="form-check mb-3">
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            id="lembrar_me"
                            name="lembrar_me"
                            checked={Boolean(validation.values.lembrar_me)}
                            onChange={validation.handleChange}
                          />
                          <Label className="form-check-label" htmlFor="lembrar_me">
                            Lembrar-me
                          </Label>
                        </div>

                        <div className="mt-4">
                          <Button color="success" disabled={loader} className="btn btn-success w-100" type="submit">
                            {loader && <Spinner size="sm" className="me-2">...</Spinner>}
                            Entrar
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </CardBody>
                </Card>

                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Não tem conta?{' '}
                    <Link to="/register" className="fw-semibold text-primary text-decoration-underline">
                      Cadastre-se
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

export default withRouter(Login);
