import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { ValidationError } from '../../libs/api/exceptions/ValidationError'
import { clearAuthSession, persistAuthSession } from '../../helpers/auth_session'

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
}
