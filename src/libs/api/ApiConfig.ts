import axios, { AxiosResponse } from 'axios';
import { getAuthToken, handleUnauthorizedSession, isPublicAuthUrl } from 'helpers/auth_session';

/** Resolve API base URL so LAN access uses the host IP, not 127.0.0.1. */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.REACT_APP_API_URL;
  const isLoopback =
    !fromEnv ||
    fromEnv.includes('127.0.0.1') ||
    fromEnv.includes('localhost');

  if (fromEnv && !isLoopback) {
    return fromEnv;
  }

  const host =
    typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';

  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      return `${u.protocol}//${host}${u.port ? `:${u.port}` : ''}${u.pathname}`;
    } catch {
      // fall through
    }
  }

  return `http://${host}:5000/api/v1/`;
}

export const ApiConfig = axios.create({
  baseURL: getApiBaseUrl(),
});

ApiConfig.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ApiConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    if (status === 401 && !isPublicAuthUrl(url)) {
      handleUnauthorizedSession();
    }
    return Promise.reject(error);
  }
);

type HttpRequest = {
  url: string
  method?: HttpMethod
  body?: any
  headers?: any
  params?: any
}

type HttpResponse<T = any> = {
  statusCode: HttpStatusCode
  body?: T
  message?: string
  errors?: Array<T>
}

export interface HttpClient<R = any> {
  request: (data: HttpRequest) => Promise<HttpResponse<R>>
  get: (data: HttpRequest) => Promise<HttpResponse<R>>
  post: (data: HttpRequest) => Promise<HttpResponse<R>>
  put: (data: HttpRequest) => Promise<HttpResponse<R>>
  delete: (data: HttpRequest) => Promise<HttpResponse<R>>
}

type HttpMethod = 'post' | 'get' | 'put' | 'delete'

export enum HttpStatusCode {
  ok = 200,
  created = 201,
  noContent = 204,
  badRequest = 400,
  invalidForm = 422,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  serverError = 500
}

export class AxiosHttpClient implements HttpClient {
  async get<T = any>({ url, method = 'get', body, headers }: HttpRequest): Promise<HttpResponse<T>> {
    return await this.request({ url, method, params: body, headers })
  }

  async post<T = any>({ url, method = 'post', body, headers }: HttpRequest): Promise<HttpResponse<T>> {
    return await this.request({ url, method, body, headers })
  }

  async put<T = any>({ url, method = 'put', body, headers }: HttpRequest): Promise<HttpResponse<T>> {
    return await this.request({ url, method, body, headers })
  }

  async delete<T = any>({ url, method = 'delete', body, headers }: HttpRequest): Promise<HttpResponse<T>> {
    return await this.request({ url, method, body, headers })
  }

  async request(data: HttpRequest): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse

    try {
      axiosResponse = await ApiConfig.request({
        url: data.url,
        method: data.method,
        data: data.body,
        headers: data.headers,
        params: data && data.params
      })
    } catch (error: any) {
      axiosResponse = error && error.response
      if (error && error.response && error.response.data) {
        if (axiosResponse?.data) {
          axiosResponse.data.data = error.response.data.errors;
        }
      }
      if (!axiosResponse) {
        return {
          statusCode: HttpStatusCode.serverError,
          body: undefined,
          message: error?.message || 'Erro de conexão com a API'
        }
      }
    }

    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data,
      message: axiosResponse.data?.message
    }
  }
}
