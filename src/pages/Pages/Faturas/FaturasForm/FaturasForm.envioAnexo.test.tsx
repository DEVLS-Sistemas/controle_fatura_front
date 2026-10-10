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
import FaturasForm from './FaturasForm'
import { FaturasService } from 'services/Faturas/FaturasService'
import { PessoasService } from 'services/Pessoas/PessoasService'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { PdfSenhaError } from 'libs/api/exceptions/PdfSenhaError'

jest.mock('helpers/functions_helpers', () => ({
    AnosSelect: () => [{ value: 2026, label: '2026' }],
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

const mockCreateFaturas = jest.fn()
const mockGetLookupsFaturas = jest.fn()
const mockAsyncListPessoas = jest.fn()

jest.mock('services/Faturas/FaturasService', () => ({
    FaturasService: jest.fn(),
}))

jest.mock('services/Pessoas/PessoasService', () => ({
    PessoasService: jest.fn(),
}))

jest.mock('services/Cartoes/CartoesService', () => ({
    CartoesService: jest.fn(),
}))

const renderForm = () => render(
    <MemoryRouter initialEntries={['/faturas/add']}>
        <Routes>
            <Route path="/faturas/add" element={<FaturasForm />} />
            <Route path="/faturas/view/:id" element={<h1>Fatura aberta</h1>} />
        </Routes>
    </MemoryRouter>,
)

const anexo = () => new File(['data,valor'], 'fatura.csv', { type: 'text/csv' })

beforeEach(() => {
    mockCreateFaturas.mockReset()
    mockGetLookupsFaturas.mockReset()
    mockAsyncListPessoas.mockReset()
    ;(toast.error as jest.Mock).mockReset()
    ;(toast.success as jest.Mock).mockReset()
    ;(FaturasService as unknown as jest.Mock).mockImplementation(() => ({
        getLookupsFaturas: (...args: unknown[]) => mockGetLookupsFaturas(...args),
        createFaturas: (...args: unknown[]) => mockCreateFaturas(...args),
        findFaturaNoPeriodo: jest.fn(),
    }))
    ;(PessoasService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListPessoas: (...args: unknown[]) => mockAsyncListPessoas(...args),
    }))
    ;(CartoesService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListBandeiras: jest.fn().mockResolvedValue([]),
    }))
    mockGetLookupsFaturas.mockResolvedValue({ cartoes: [], parsers_homologados: [] })
    mockAsyncListPessoas.mockResolvedValue([])
})

describe('Envio de anexo em adicionar fatura', () => {
    it('mostra loading até a API responder e impede um segundo envio', async () => {
        const user = userEvent.setup()
        let rejectCreate: (error: Error) => void = () => undefined
        mockCreateFaturas.mockImplementation(() => new Promise((_resolve, reject) => {
            rejectCreate = reject
        }))

        renderForm()
        const input = await screen.findByLabelText(/Anexo da fatura/i)
        await user.upload(input, anexo())

        const envio = user.click(screen.getByRole('button', { name: 'Cadastrar' }))
        const enviando = await screen.findByRole('button', { name: /Enviando/ })
        expect(enviando).toBeDisabled()
        expect(enviando).toHaveAttribute('aria-busy', 'true')
        expect(input).toBeDisabled()
        expect(mockCreateFaturas).toHaveBeenCalledTimes(1)

        await user.click(enviando).catch(() => undefined)
        expect(mockCreateFaturas).toHaveBeenCalledTimes(1)

        rejectCreate(new PdfSenhaError({
            message: 'Arquivo recusado pela API',
            codigo: 'pdf_senha_outro',
            precisa_senha_pdf: false,
            senha_pdf: { tem_senha_cadastrada: true },
        }))
        await envio.catch(() => undefined)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled()
        })
        expect(toast.error).toHaveBeenCalledWith('Arquivo recusado pela API')
        expect(input).toBeEnabled()
    })

    it('tira o loading no sucesso e usa a mensagem da API', async () => {
        const user = userEvent.setup()
        let resolveCreate: (value: unknown) => void = () => undefined
        mockCreateFaturas.mockImplementation(() => new Promise((resolve) => {
            resolveCreate = resolve
        }))

        renderForm()
        const input = await screen.findByLabelText(/Anexo da fatura/i)
        await user.upload(input, anexo())

        const envio = user.click(screen.getByRole('button', { name: 'Cadastrar' }))
        expect(await screen.findByRole('button', { name: /Enviando/ })).toBeDisabled()

        resolveCreate({
            message: 'Fatura cadastrada com o anexo',
            data: { id: 12, tem_csv: true, mes: 10, ano: 2026 },
        })
        await envio

        expect(await screen.findByRole('heading', { name: 'Fatura aberta' })).toBeInTheDocument()
        expect(toast.success).toHaveBeenCalledWith('PDF vinculado à fatura 10/2026.')
    })
})
