jest.mock('axios', () => {
    const instance = {
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        defaults: { headers: { common: {} } },
    }
    return {
        __esModule: true,
        default: {
            create: () => instance,
            defaults: { headers: { common: {} } },
        },
    }
})

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'react-toastify'
import FaturasViewPage from './FaturasView'
import { FaturasService } from 'services/Faturas/FaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { SubcategoriasService } from 'services/Subcategorias/SubcategoriasService'

jest.mock('react-apexcharts', () => () => null)

jest.mock('helpers/functions_helpers', () => ({
    useNavegacao: () => ({ voltarParaRotaAnterior: jest.fn() }),
}))

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
    },
}))

const mockUploadPdf = jest.fn()
const mockGetViewFaturas = jest.fn()

jest.mock('services/Faturas/FaturasService', () => ({
    FaturasService: jest.fn(),
}))

jest.mock('services/Transacoes/TransacoesService', () => ({
    TransacoesService: jest.fn(),
}))

jest.mock('services/Cartoes/CartoesService', () => ({
    CartoesService: jest.fn(),
}))

jest.mock('services/Subcategorias/SubcategoriasService', () => ({
    SubcategoriasService: jest.fn(),
}))

const faturaAberta = {
    id: 10,
    status: 'processada',
    cartao_id: 1,
    cartao_nome: 'Nubank',
    mes: 10,
    ano: 2026,
    tem_pdf: false,
    tem_csv: false,
    importacao_pdf_homologada: true,
    parser_homologado: true,
}

const renderView = () => render(
    <MemoryRouter initialEntries={['/faturas/view/10']}>
        <Routes>
            <Route path="/faturas/view/:id" element={<FaturasViewPage />} />
        </Routes>
    </MemoryRouter>,
)

const anexo = () => new File(['data,valor'], 'fatura.csv', { type: 'text/csv' })

beforeEach(() => {
    mockUploadPdf.mockReset()
    mockGetViewFaturas.mockReset()
    ;(toast.error as jest.Mock).mockReset()
    ;(toast.success as jest.Mock).mockReset()
    mockGetViewFaturas.mockResolvedValue(faturaAberta)
    ;(FaturasService as unknown as jest.Mock).mockImplementation(() => ({
        getViewFaturas: (...args: unknown[]) => mockGetViewFaturas(...args),
        getFaturaGrupos: jest.fn().mockResolvedValue({ grupos_por_cartao: [] }),
        getFaturaQuitacao: jest.fn().mockResolvedValue({
            pago: true,
            valor_pago: 0,
            valor_restante: 0,
            pagamentos_total: 0,
            pagamentos_abatido_anterior: 0,
            pagamentos_antecipado: 0,
        }),
        getFaturaConferencia: jest.fn().mockResolvedValue({
            valor_extrato: 0,
            valor_nao_conciliado: 0,
            valor_total_com_pendencias: 0,
            tem_compras_nao_conciliadas: false,
            conferencia: null,
        }),
        getLookupsFaturas: jest.fn().mockResolvedValue({ cartoes: [], parsers_homologados: [] }),
        uploadPdf: (...args: unknown[]) => mockUploadPdf(...args),
        listFaturasPaginate: jest.fn().mockResolvedValue({ data: [] }),
    }))
    ;(TransacoesService as unknown as jest.Mock).mockImplementation(() => ({
        listTransacoesPaginate: jest.fn().mockResolvedValue({ data: [] }),
        getLookupsTransacoes: jest.fn().mockResolvedValue({}),
    }))
    ;(CartoesService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListNumeros: jest.fn().mockResolvedValue([]),
    }))
    ;(SubcategoriasService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListSubcategorias: jest.fn().mockResolvedValue([]),
    }))
})

describe('Envio de anexo na fatura aberta', () => {
    it('mostra loading até a API responder e impede um segundo envio', async () => {
        const user = userEvent.setup()
        let rejectUpload: (error: Error) => void = () => undefined
        mockUploadPdf.mockImplementation(() => new Promise((_resolve, reject) => {
            rejectUpload = reject
        }))

        renderView()
        const input = await screen.findByLabelText(/Anexo da fatura/i)
        await user.upload(input, anexo())

        const envio = user.click(screen.getByRole('button', { name: 'Enviar arquivo' }))
        const enviando = await screen.findByRole('button', { name: /Enviando/ })
        expect(enviando).toBeDisabled()
        expect(enviando).toHaveAttribute('aria-busy', 'true')
        expect(input).toBeDisabled()
        expect(mockUploadPdf).toHaveBeenCalledTimes(1)

        await user.click(enviando).catch(() => undefined)
        expect(mockUploadPdf).toHaveBeenCalledTimes(1)

        rejectUpload(new Error('Falha ao enviar o anexo'))
        await envio.catch(() => undefined)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Enviar arquivo' })).toBeEnabled()
        })
        expect(toast.error).toHaveBeenCalledWith('Falha ao enviar o anexo')
        expect(input).toBeEnabled()
    })

    it('tira o loading no sucesso e usa a mensagem da API', async () => {
        const user = userEvent.setup()
        let resolveUpload: (value: unknown) => void = () => undefined
        mockUploadPdf.mockImplementation(() => new Promise((resolve) => {
            resolveUpload = resolve
        }))

        renderView()
        const input = await screen.findByLabelText(/Anexo da fatura/i)
        await user.upload(input, anexo())

        const envio = user.click(screen.getByRole('button', { name: 'Enviar arquivo' }))
        expect(await screen.findByRole('button', { name: /Enviando/ })).toBeDisabled()

        resolveUpload({
            message: 'Anexo recebido',
            data: { id: 10, tem_csv: true, status: 'processada' },
        })
        await envio

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Enviar arquivo' })).toBeEnabled()
        })
        expect(toast.success).toHaveBeenCalledWith('Anexo recebido')
    })
})
