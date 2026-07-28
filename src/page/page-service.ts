import { PaginateInterface } from "../../interfaces/default"
import { PageInterface, PageList, PageSearch, PageView } from "../../interfaces/page"
import { AxiosHttpClient, HttpStatusCode } from "../../libs/api/ApiConfig"
import { AccessDeniedError } from "../../libs/api/exceptions/AccessDeniedError"
import { UnexpectedError } from "../../libs/api/exceptions/UnexpectedError"

export class PageService implements PageInterface {
    private readonly url: string
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.url = 'page'
        this.httpClient = new AxiosHttpClient()
    }

    async getViewPage(params: any): Promise<PageView | undefined> {
        const response = await this.httpClient.get<PageView>({
            url: `${this.url}/listar/${params.id}`
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }


    async listProjetosPaginate(params: PageSearch): Promise<PaginateInterface<PageList> | undefined> {
        const response = await this.httpClient.get<PaginateInterface<PageList>>({
            url: this.url + '/listar',
            body: params
        })

        switch (response.statusCode) {
            case HttpStatusCode.ok: return response.body
            case HttpStatusCode.unauthorized: throw new AccessDeniedError()
            default: throw new UnexpectedError()
        }
    }

}