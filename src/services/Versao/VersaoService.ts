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

        if (response.statusCode === HttpStatusCode.ok && response.body?.api_version) {
            return response.body
        }

        throw new UnexpectedError()
    }
}
