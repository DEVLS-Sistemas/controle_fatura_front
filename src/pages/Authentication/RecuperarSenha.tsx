import React, { useEffect, useRef, useState } from 'react'
import {
  Alert, Button, Card, CardBody, Col, Container, FormFeedback, Input, Label, Row, Spinner,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'
import logoLight from '../../assets/images/logo-light.png'
import ParticlesAuth from '../AuthenticationInner/ParticlesAuth'
import { AuthService } from 'services/Auth'

type Passo = 'email' | 'codigo' | 'senha'

const MENSAGEM_GENERICA =
  'Se o e-mail informado estiver cadastrado, um código será enviado.'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const maskEmail = (value: string): string => {
  const [local, domain] = value.split('@')
  if (!local || !domain) return value
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***@${domain}`
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 6)

const emptyDigits = (): string[] => ['', '', '', '', '', '']

const RecuperarSenha = () => {
  const navigate = useNavigate()
  const authServiceRef = useRef(new AuthService())

  const [passo, setPasso] = useState<Passo>('email')
  const [email, setEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordShow, setPasswordShow] = useState(false)
  const [confirmPasswordShow, setConfirmPasswordShow] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [loader, setLoader] = useState(false)
  const [digits, setDigits] = useState<string[]>(emptyDigits())
  const digitRefs = useRef<Array<HTMLInputElement | null>>([])
  const verifyLock = useRef(false)

  useEffect(() => {
    if (passo === 'codigo') {
      digitRefs.current[0]?.focus()
    }
  }, [passo])

  const enviarCodigo = async (destino: string) => {
    const trimmed = destino.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Informe um e-mail válido')
      setError(null)
      return
    }

    setLoader(true)
    setError(null)
    setFieldError(null)
    try {
      const message = await authServiceRef.current.recuperarSenha({ email: trimmed })
      const aviso = message || MENSAGEM_GENERICA
      setEmail(trimmed)
      setInfo(aviso)
      toast.success(aviso)
      setDigits(emptyDigits())
      setCodigo('')
      setPasso('codigo')
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : 'Não foi possível enviar o código'
      setError(message)
      toast.error(message)
    } finally {
      setLoader(false)
    }
  }

  const verificarCodigo = async (codigoInformado: string) => {
    const codigoLimpo = onlyDigits(codigoInformado)
    if (verifyLock.current || codigoLimpo.length !== 6) return
    verifyLock.current = true
    setLoader(true)
    setError(null)
    try {
      await authServiceRef.current.verificarCodigo({ email, codigo: codigoLimpo })
      setCodigo(codigoLimpo)
      setInfo(null)
      setPasso('senha')
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : 'Código inválido ou expirado'
      setError(message)
      toast.error(message)
      setDigits(emptyDigits())
      setCodigo('')
      setTimeout(() => digitRefs.current[0]?.focus(), 0)
    } finally {
      setLoader(false)
      verifyLock.current = false
    }
  }

  const redefinirSenha = async () => {
    if (password.length < 6) {
      setFieldError('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setFieldError('Senhas não conferem')
      return
    }

    setLoader(true)
    setError(null)
    setFieldError(null)
    try {
      const session = await authServiceRef.current.redefinirSenha({
        email,
        codigo,
        password,
        password_confirmation: confirmPassword,
      })
      toast.success(session.message || 'Senha redefinida com sucesso!')
      navigate('/dashboard')
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : 'Não foi possível redefinir a senha'
      setError(message)
      toast.error(message)
      if (message.toLowerCase().includes('expirado') || message.toLowerCase().includes('inválido')) {
        setDigits(emptyDigits())
        setCodigo('')
        setPasso('codigo')
      }
    } finally {
      setLoader(false)
    }
  }

  const handleDigitChange = (index: number, raw: string) => {
    const extracted = onlyDigits(raw)
    if (extracted.length > 1) {
      const filled = [...extracted.split(''), ...emptyDigits()].slice(0, 6)
      setDigits(filled)
      if (filled.join('').length === 6) {
        verificarCodigo(filled.join(''))
      }
      digitRefs.current[Math.min(extracted.length, 5)]?.focus()
      return
    }

    const value = extracted.slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      const joined = next.join('')
      if (joined.length === 6) {
        verificarCodigo(joined)
      }
      return next
    })
    if (value && index < 5) {
      digitRefs.current[index + 1]?.focus()
    }
  }

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return
    event.preventDefault()
    setDigits((prev) => {
      const next = [...prev]
      if (next[index]) {
        next[index] = ''
        return next
      }
      if (index > 0) {
        next[index - 1] = ''
        digitRefs.current[index - 1]?.focus()
      }
      return next
    })
  }

  const handleDigitPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = onlyDigits(event.clipboardData.getData('text'))
    if (!pasted) return
    const filled = [...pasted.split(''), ...emptyDigits()].slice(0, 6)
    setDigits(filled)
    digitRefs.current[Math.min(pasted.length, 5)]?.focus()
    if (filled.join('').length === 6) {
      verificarCodigo(filled.join(''))
    }
  }

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
                    {passo === 'email' && (
                      <>
                        <div className="text-center mt-2">
                          <h5 className="text-primary">Recuperar senha</h5>
                          <p className="text-muted">Informe o e-mail da sua conta.</p>
                        </div>
                        {error ? <Alert color="danger">{error}</Alert> : null}
                        <div className="p-2 mt-4">
                          <div className="mb-3">
                            <Label className="form-label" htmlFor="recuperar-email">E-mail</Label>
                            <Input
                              id="recuperar-email"
                              name="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={emailInput}
                              invalid={!!fieldError}
                              onChange={(e) => {
                                setEmailInput(e.target.value)
                                setFieldError(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  enviarCodigo(emailInput)
                                }
                              }}
                            />
                            {fieldError ? <FormFeedback type="invalid">{fieldError}</FormFeedback> : null}
                          </div>
                          <div className="mt-4">
                            <Button
                              color="success"
                              className="w-100"
                              type="button"
                              disabled={loader}
                              onClick={() => enviarCodigo(emailInput)}
                            >
                              {loader && <Spinner size="sm" className="me-2">...</Spinner>}
                              Enviar código
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {passo === 'codigo' && (
                      <>
                        <div className="text-center mt-2">
                          <div className="avatar-lg mx-auto mb-3">
                            <div className="avatar-title bg-light text-primary display-5 rounded-circle">
                              <i className="ri-mail-line"></i>
                            </div>
                          </div>
                          <h5 className="text-primary">Informe o código</h5>
                          <p className="text-muted mb-0">
                            Enviamos um código de 6 dígitos para{' '}
                            <span className="fw-semibold">{maskEmail(email)}</span>
                          </p>
                        </div>
                        {info ? <Alert color="success" className="mt-3">{info}</Alert> : null}
                        {error ? <Alert color="danger" className="mt-3">{error}</Alert> : null}
                        <div className="p-2 mt-3">
                          <div className="d-flex justify-content-between gap-2">
                            {digits.map((digit, index) => (
                              <input
                                key={index}
                                id={`codigo-digito-${index}`}
                                ref={(el) => { digitRefs.current[index] = el }}
                                aria-label={`Dígito ${index + 1}`}
                                type="text"
                                inputMode="numeric"
                                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                maxLength={1}
                                className="form-control form-control-lg text-center px-0"
                                style={{ width: '3rem', flex: '1 1 0' }}
                                value={digit}
                                disabled={loader}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleDigitKeyDown(index, e)}
                                onPaste={handleDigitPaste}
                              />
                            ))}
                          </div>
                          <div className="mt-4">
                            <Button
                              color="success"
                              className="w-100"
                              type="button"
                              disabled={loader}
                              onClick={() => {
                                const joined = digits.join('')
                                if (joined.length !== 6) {
                                  setError('Informe o código de 6 dígitos')
                                  digitRefs.current[0]?.focus()
                                  return
                                }
                                verificarCodigo(joined)
                              }}
                            >
                              {loader && <Spinner size="sm" className="me-2">...</Spinner>}
                              Verificar
                            </Button>
                          </div>
                          <div className="mt-3 text-center">
                            <button
                              type="button"
                              className="btn btn-link text-decoration-underline p-0"
                              disabled={loader}
                              onClick={() => enviarCodigo(email)}
                            >
                              Reenviar código
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {passo === 'senha' && (
                      <>
                        <div className="text-center mt-2">
                          <h5 className="text-primary">Nova senha</h5>
                          <p className="text-muted">Defina uma senha com no mínimo 6 caracteres.</p>
                        </div>
                        {error ? <Alert color="danger">{error}</Alert> : null}
                        <div className="p-2 mt-4">
                          <div className="mb-3">
                            <Label className="form-label" htmlFor="nova-senha">Senha</Label>
                            <div className="position-relative auth-pass-inputgroup">
                              <Input
                                id="nova-senha"
                                name="password"
                                type={passwordShow ? 'text' : 'password'}
                                className="form-control pe-5"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                invalid={!!fieldError && password.length < 6}
                                onChange={(e) => {
                                  setPassword(e.target.value)
                                  setFieldError(null)
                                }}
                              />
                              <button
                                className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                type="button"
                                aria-label={passwordShow ? 'Ocultar senha' : 'Mostrar senha'}
                                onClick={() => setPasswordShow(!passwordShow)}
                              >
                                <i className="ri-eye-fill align-middle"></i>
                              </button>
                            </div>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label" htmlFor="confirmar-nova-senha">Confirmar senha</Label>
                            <div className="position-relative auth-pass-inputgroup">
                              <Input
                                id="confirmar-nova-senha"
                                name="confirm_password"
                                type={confirmPasswordShow ? 'text' : 'password'}
                                className="form-control pe-5"
                                placeholder="Repita a senha"
                                value={confirmPassword}
                                invalid={!!fieldError}
                                onChange={(e) => {
                                  setConfirmPassword(e.target.value)
                                  setFieldError(null)
                                }}
                              />
                              {fieldError ? <FormFeedback type="invalid">{fieldError}</FormFeedback> : null}
                              <button
                                className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                type="button"
                                aria-label={confirmPasswordShow ? 'Ocultar senha' : 'Mostrar senha'}
                                onClick={() => setConfirmPasswordShow(!confirmPasswordShow)}
                              >
                                <i className="ri-eye-fill align-middle"></i>
                              </button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              color="success"
                              className="w-100"
                              type="button"
                              disabled={loader}
                              onClick={redefinirSenha}
                            >
                              {loader && <Spinner size="sm" className="me-2">...</Spinner>}
                              Redefinir senha
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>

                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Lembrou a senha?{' '}
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
  )
}

export default RecuperarSenha
