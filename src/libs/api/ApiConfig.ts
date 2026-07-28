import axios, { AxiosResponse } from 'axios';
export const ApiConfig = axios.create({
  baseURL: 'http://10.0.0.164:5000/api/v1/',
});


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
      // console.log(data.url)

      axiosResponse = await ApiConfig.request({
        url: data.url,
        method: data.method,
        data: data.body,
        headers: data.headers,
        // params: data?.params
        params: data && data.params
      })
    } catch (error: any) {
      axiosResponse =  error && error.response
      if (error && error.response && error.response.data) {
        axiosResponse.data.data = error.response.data.errors;
      }
      // axiosResponse.data.data = error?.response?.data?.errors
    }

    return {
      statusCode: axiosResponse.status,
      body: axiosResponse.data,
      message: axiosResponse.data.message
    }
  }
}