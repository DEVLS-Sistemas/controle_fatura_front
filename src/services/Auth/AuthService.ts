import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { AccessDeniedError } from '../../libs/api/exceptions/AccessDeniedError'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { ValidationError } from '../../libs/api/exceptions/ValidationError'

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

const SESSION_KEY = 'authUser'

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
        this.persistSession(payload)
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
        this.persistSession(payload)
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
      sessionStorage.removeItem(SESSION_KEY)
    }
  }

  async me(): Promise<AuthUser | undefined> {
    const response = await this.httpClient.get({ url: `${this.url}/me` })
    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response.body?.data
      case HttpStatusCode.unauthorized:
        throw new AccessDeniedError()
      default:
        throw new UnexpectedError()
    }
  }

  private persistSession(payload: AuthSession) {
    const stored = {
      token: payload.token,
      email: payload.user.email,
      username: payload.user.name,
      first_name: payload.user.name,
      last_name: '',
      data: {
        id: payload.user.id,
        first_name: payload.user.name,
        last_name: '',
        email: payload.user.email,
      },
      user: payload.user,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
  }
}
