import { AxiosHttpClient, getApiBaseUrl, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { ValidationError } from '../../libs/api/exceptions/ValidationError'
import { clearAuthSession, persistAuthSession } from '../../helpers/auth_session'

const joinApiUrl = (path: string): string => {
  const base = getApiBaseUrl().replace(/\/?$/, '/')
  return `${base}${path.replace(/^\//, '')}`
}

export interface AuthUser {
  id: number
  name: string
  email: string
}

export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthRegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  token_type?: string
  message?: string
}

export interface AuthRecuperarSenhaPayload {
  email: string
}

export interface AuthVerificarCodigoPayload {
  email: string
  codigo: string
}

export interface AuthRedefinirSenhaPayload {
  email: string
  codigo: string
  password: string
  password_confirmation: string
}

export class AuthService {
  private readonly url: string
  private readonly httpClient: AxiosHttpClient

  constructor() {
    this.url = 'auth'
    this.httpClient = new AxiosHttpClient()
  }

  async login(params: AuthLoginPayload): Promise<AuthSession> {
    const response = await this.httpClient.post({
      url: `${this.url}/login`,
      body: params,
    })

    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const payload = response.body?.auth?.data
        if (!payload?.token || !payload?.user) {
          throw new UnexpectedError('Resposta de login inválida')
        }
        persistAuthSession(payload)
        return payload
      }
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async register(params: AuthRegisterPayload): Promise<AuthSession> {
    const response = await this.httpClient.post({
      url: `${this.url}/register`,
      body: params,
    })

    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const payload = response.body?.auth?.data
        if (!payload?.token || !payload?.user) {
          throw new UnexpectedError('Resposta de registro inválida')
        }
        persistAuthSession(payload)
        return payload
      }
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async logout(): Promise<void> {
    try {
      await this.httpClient.post({ url: `${this.url}/logout`, body: {} })
    } catch {
      // limpa sessão mesmo se a API falhar
    } finally {
      clearAuthSession()
    }
  }

  async me(): Promise<AuthUser | undefined> {
    const response = await this.httpClient.get({ url: `${this.url}/me` })
    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const user = response.body?.auth?.data?.user ?? response.body?.data?.user
        return user
      }
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError()
    }
  }

  /**
   * Auth público com URL absoluta (aparece no Network como :5000/...).
   * Usa XHR nativo — independente do axios e do mock do Velzon.
   */
  private async postPublic<T = any>(path: string, body: unknown): Promise<{ statusCode: number; body?: T; message?: string }> {
    const url = joinApiUrl(path)

    const payload = await new Promise<{ statusCode: number; body?: T; message?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.onload = () => {
        let parsed: any
        try {
          parsed = xhr.responseText ? JSON.parse(xhr.responseText) : undefined
        } catch {
          parsed = undefined
        }
        resolve({
          statusCode: xhr.status,
          body: parsed,
          message: parsed?.message || parsed?.auth?.message,
        })
      }
      xhr.onerror = () => reject(new UnexpectedError('Erro de conexão com a API'))
      xhr.send(JSON.stringify(body))
    })

    return payload
  }

  async recuperarSenha(params: AuthRecuperarSenhaPayload): Promise<string> {
    const response = await this.postPublic(`${this.url}/recuperar-senha`, params)

    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        if (response.body?.auth?.status !== true && !response.body?.auth?.message) {
          throw new UnexpectedError('Resposta inválida da API de recuperar senha')
        }
        return (
          response.body?.auth?.message ||
          response.body?.message ||
          'Se o e-mail informado estiver cadastrado, um código será enviado.'
        )
      }
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async verificarCodigo(params: AuthVerificarCodigoPayload): Promise<void> {
    const response = await this.postPublic(`${this.url}/verificar-codigo`, params)

    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const data = response.body?.auth?.data
        if (data && data.codigo_valido === false) {
          throw new ValidationError({ message: 'Código inválido ou expirado' })
        }
        return
      }
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }

  async redefinirSenha(params: AuthRedefinirSenhaPayload): Promise<AuthSession> {
    const response = await this.postPublic(`${this.url}/redefinir-senha`, params)

    switch (response.statusCode) {
      case HttpStatusCode.ok: {
        const payload = response.body?.auth?.data
        if (!payload?.token || !payload?.user) {
          throw new UnexpectedError('Resposta de redefinição inválida')
        }
        persistAuthSession(payload)
        return {
          ...payload,
          message: response.body?.auth?.message || 'Senha redefinida com sucesso!',
        }
      }
      case HttpStatusCode.invalidForm:
        throw new ValidationError(response.body)
      default:
        throw new UnexpectedError(response.body?.message || response.message)
    }
  }
}
