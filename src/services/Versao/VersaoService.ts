import { AxiosHttpClient, HttpStatusCode } from '../../libs/api/ApiConfig'
import { UnexpectedError } from '../../libs/api/exceptions/UnexpectedError'
import { VersaoApi } from '../../interfaces/Versao/VersaoInterface'

export class VersaoService {
    private readonly httpClient: AxiosHttpClient

    constructor() {
        this.httpClient = new AxiosHttpClient()
    }

    async obter(): Promise<VersaoApi> {
        const response = await this.httpClient.get<VersaoApi>({ url: '' })

        const body = response.body
        if (response.statusCode === HttpStatusCode.ok && body && body.api_version) {
            return body
        }

        throw new UnexpectedError()
    }
}
