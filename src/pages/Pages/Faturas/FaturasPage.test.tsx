import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import FaturasPage from './FaturasPage'
import { FaturasService } from 'services/Faturas/FaturasService'

const mockListFaturasPaginate = jest.fn()
const mockGetLookupsFaturas = jest.fn()

jest.mock('services/Faturas/FaturasService', () => ({
    FaturasService: jest.fn(),
}))

jest.mock('./FaturasTable/FaturasTable', () => (props: { loading?: boolean }) => {
    const React = require('react')
    return React.createElement(
        'div',
        { role: 'status' },
        props.loading ? 'Carregando faturas' : 'Lista de faturas',
    )
})

jest.mock('./FaturasFilter/FaturasFilter', () => {
    const React = require('react')
    const { Link } = require('react-router-dom')
    return {
        __esModule: true,
        default: () => React.createElement(Link, { to: '/faturas/add' }, 'Adicionar Fatura'),
    }
})

jest.mock('helpers/functions_helpers', () => ({
    AnosSelect: () => [{ value: '', label: 'Todos' }, { value: 2026, label: '2026' }],
}))

const respostaLista = {
    data: [],
    current_page: 1,
    per_page: 5,
    total: 0,
    filtros: { mes: 10, ano: 2026, mes_atual_ativo: true },
    competencia_atual: { mes: 10, ano: 2026, label: '10/2026' },
}

const adiarLista = () => {
    let resolveList: (value: unknown) => void = () => undefined
    const promise = new Promise((resolve) => {
        resolveList = resolve
    })
    mockListFaturasPaginate.mockImplementation(() => promise)
    return () => resolveList(respostaLista)
}

const renderPagina = () => {
    window.history.pushState({}, '', '/faturas')
    return render(
        <BrowserRouter>
            <Routes>
                <Route path="/faturas" element={<FaturasPage />} />
                <Route path="/faturas/add" element={<h1>Cadastro de fatura</h1>} />
            </Routes>
        </BrowserRouter>
    )
}

beforeEach(() => {
    mockListFaturasPaginate.mockReset()
    mockGetLookupsFaturas.mockReset()
    ;(FaturasService as unknown as jest.Mock).mockImplementation(() => ({
        listFaturasPaginate: (...args: unknown[]) => mockListFaturasPaginate(...args),
        getLookupsFaturas: (...args: unknown[]) => mockGetLookupsFaturas(...args),
    }))
    mockGetLookupsFaturas.mockResolvedValue({
        competencia_atual: { mes: 10, ano: 2026, label: '10/2026' },
        anos: [{ value: 2026, label: '2026' }],
        cartoes: [],
    })
})

afterEach(() => {
    window.history.pushState({}, '', '/')
})

describe('Adicionar fatura enquanto a lista carrega', () => {
    it('permanece em /faturas/add quando a listagem responde depois do clique', async () => {
        const liberarLista = adiarLista()
        renderPagina()

        await userEvent.click(await screen.findByRole('link', { name: /adicionar fatura/i }))
        expect(screen.getByRole('heading', { name: 'Cadastro de fatura' })).toBeInTheDocument()
        expect(window.location.pathname).toBe('/faturas/add')

        liberarLista()

        await waitFor(() => {
            expect(mockListFaturasPaginate).toHaveBeenCalled()
        })
        expect(window.location.pathname).toBe('/faturas/add')
        expect(screen.getByRole('heading', { name: 'Cadastro de fatura' })).toBeInTheDocument()
    })

    it('grava a competência na URL quando a lista termina ainda em /faturas', async () => {
        mockListFaturasPaginate.mockResolvedValue(respostaLista)
        renderPagina()

        await waitFor(() => {
            expect(window.location.pathname).toBe('/faturas')
            expect(window.location.search).toContain('mes=10')
            expect(window.location.search).toContain('ano=2026')
        })
    })

    it('mostra filtros e a área da lista antes das linhas', async () => {
        const liberarLista = adiarLista()
        renderPagina()

        expect(await screen.findByRole('link', { name: /adicionar fatura/i })).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent('Carregando faturas')
        expect(screen.queryByText('Lista de faturas')).not.toBeInTheDocument()

        liberarLista()

        expect(await screen.findByText('Lista de faturas')).toBeInTheDocument()
        expect(screen.queryByText('Carregando faturas')).not.toBeInTheDocument()
    })

    it('busca a lista sem esperar os lookups', async () => {
        let resolveLookups: (value: unknown) => void = () => undefined
        mockGetLookupsFaturas.mockImplementation(() => new Promise((resolve) => {
            resolveLookups = resolve
        }))
        mockListFaturasPaginate.mockResolvedValue(respostaLista)
        renderPagina()

        await waitFor(() => {
            expect(mockListFaturasPaginate).toHaveBeenCalled()
        })
        await act(async () => {
            resolveLookups({
                competencia_atual: { mes: 10, ano: 2026, label: '10/2026' },
                anos: [{ value: 2026, label: '2026' }],
                cartoes: [],
            })
        })
    })
})
