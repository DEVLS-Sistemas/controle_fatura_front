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
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

const mockGetViewFaturas = jest.fn()
const mockGetFaturaGrupos = jest.fn()
const mockGetFaturaQuitacao = jest.fn()
const mockGetFaturaConferencia = jest.fn()
const mockListTransacoesPaginate = jest.fn()

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
    competencia: '10/2026',
    mes: 10,
    ano: 2026,
    valor_total: 1500,
    tem_pdf: false,
    tem_csv: false,
    importacao_pdf_homologada: true,
    parser_homologado: true,
    total_transacoes: 2,
}

const adiar = <T,>() => {
    let resolve: (value: T) => void = () => undefined
    let reject: (error: unknown) => void = () => undefined
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

const renderView = () => render(
    <MemoryRouter initialEntries={['/faturas/view/10']}>
        <Routes>
            <Route path="/faturas/view/:id" element={<FaturasViewPage />} />
        </Routes>
    </MemoryRouter>,
)

beforeEach(() => {
    mockGetViewFaturas.mockReset()
    mockGetFaturaGrupos.mockReset()
    mockGetFaturaQuitacao.mockReset()
    mockGetFaturaConferencia.mockReset()
    mockListTransacoesPaginate.mockReset()
    mockGetViewFaturas.mockResolvedValue(faturaAberta)
    mockGetFaturaGrupos.mockResolvedValue({ grupos_por_cartao: [] })
    mockGetFaturaQuitacao.mockResolvedValue({
        pago: false,
        valor_pago: 0,
        valor_restante: 1500,
        pagamentos_total: 0,
        pagamentos_abatido_anterior: 0,
        pagamentos_antecipado: 0,
    })
    mockGetFaturaConferencia.mockResolvedValue({
        valor_extrato: 1500,
        valor_nao_conciliado: 0,
        valor_total_com_pendencias: 1500,
        tem_compras_nao_conciliadas: false,
        conferencia: { bate: true },
    })
    mockListTransacoesPaginate.mockResolvedValue({ data: [] })
    ;(FaturasService as unknown as jest.Mock).mockImplementation(() => ({
        getViewFaturas: (...args: unknown[]) => mockGetViewFaturas(...args),
        getFaturaGrupos: (...args: unknown[]) => mockGetFaturaGrupos(...args),
        getFaturaQuitacao: (...args: unknown[]) => mockGetFaturaQuitacao(...args),
        getFaturaConferencia: (...args: unknown[]) => mockGetFaturaConferencia(...args),
        getLookupsFaturas: jest.fn().mockResolvedValue({ cartoes: [], parsers_homologados: [] }),
        listFaturasPaginate: jest.fn().mockResolvedValue({ data: [] }),
    }))
    ;(TransacoesService as unknown as jest.Mock).mockImplementation(() => ({
        listTransacoesPaginate: (...args: unknown[]) => mockListTransacoesPaginate(...args),
        getLookupsTransacoes: jest.fn().mockResolvedValue({}),
    }))
    ;(CartoesService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListNumeros: jest.fn().mockResolvedValue([]),
    }))
    ;(SubcategoriasService as unknown as jest.Mock).mockImplementation(() => ({
        AsyncListSubcategorias: jest.fn().mockResolvedValue([]),
    }))
})

describe('Carregamento progressivo da fatura', () => {
    it('mostra o cabeçalho antes dos lançamentos e mantém a página se um bloco falha', async () => {
        const cabecalho = adiar<typeof faturaAberta>()
        const lancamentos = adiar<{ data: unknown[] }>()
        const grupos = adiar<{ grupos_por_cartao: unknown[] }>()
        mockGetViewFaturas.mockImplementation(() => cabecalho.promise)
        mockListTransacoesPaginate.mockImplementation(() => lancamentos.promise)
        mockGetFaturaGrupos.mockImplementation(() => grupos.promise)

        renderView()

        expect(screen.getByRole('heading', { name: 'Detalhe da Fatura' })).toBeInTheDocument()
        expect(screen.getByRole('status', { name: 'Carregando cabeçalho da fatura' })).toBeInTheDocument()
        expect(screen.queryByText('Nubank')).not.toBeInTheDocument()

        cabecalho.resolve(faturaAberta)

        expect(await screen.findByText('Nubank')).toBeInTheDocument()
        expect(screen.getByText('10/2026')).toBeInTheDocument()
        expect(screen.getByRole('status', { name: 'Carregando lançamentos' })).toBeInTheDocument()
        expect(screen.queryByRole('status', { name: 'Carregando cabeçalho da fatura' })).not.toBeInTheDocument()

        grupos.reject(new Error('grupos indisponíveis'))
        lancamentos.resolve({ data: [] })

        await waitFor(() => {
            expect(screen.queryByRole('status', { name: 'Carregando lançamentos' })).not.toBeInTheDocument()
        })
        expect(screen.getByText('Nubank')).toBeInTheDocument()
        expect(screen.getByText('Nenhuma transação encontrada.')).toBeInTheDocument()
        expect(screen.queryByRole('status', { name: 'Carregando grupos' })).not.toBeInTheDocument()
    })
})
