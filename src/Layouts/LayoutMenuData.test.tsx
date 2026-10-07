import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navdata from './LayoutMenuData'

const Probe = () => {
  const items = (Navdata().props.children as any[]).filter((item) => !item.isHeader)
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <span data-testid={`label-${item.id}`}>{item.label}</span>
          {item.stateVariables != null && (
            <span data-testid={`${item.id}-open`}>{item.stateVariables ? 'aberto' : 'fechado'}</span>
          )}
          {item.isActive && <span data-testid={`${item.id}-active`}>ativo</span>}
          {item.subItems?.map((sub: any) => (
            <span key={sub.id} data-testid={`label-${sub.id}`}>
              {sub.label}
              {sub.isActive && <span data-testid={`${sub.id}-active`}>ativo</span>}
            </span>
          ))}
          {item.click && (
            <button type="button" onClick={item.click}>
              {`abrir-${item.id}`}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

const renderMenu = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Probe />
    </MemoryRouter>
  )

describe('menu do primeiro nível', () => {
  it('mostra as telas do dia a dia sem as pastas antigas', () => {
    renderMenu()
    const labels = [
      'dashboard',
      'faturas',
      'transacoes',
      'cartoes',
      'raio-x',
      'projecao-faturas',
      'simulador',
      'relatorios-menu',
      'gastos-criticos',
      'gastos-por-categoria',
      'relatorios',
      'recorrente',
      'parceladas',
      'assinaturas',
      'cadastros',
      'categorias',
      'subcategorias',
      'plataformas',
      'estabelecimentos',
      'lojas',
      'pessoas',
      'responsaveis',
    ].map((id) => screen.getByTestId(`label-${id}`).textContent)
    expect(labels).toEqual([
      'Dashboard',
      'Faturas',
      'Transações',
      'Cartões',
      'Raio-X',
      'Projeção',
      'Posso comprar?',
      'Relatórios',
      'Gastos críticos',
      'Gastos por categoria',
      'Relatórios',
      'Recorrente',
      'Parceladas',
      'Assinaturas',
      'Cadastros',
      'Categorias',
      'Subcategorias',
      'Plataformas',
      'Estabelecimentos',
      'Lojas',
      'Pessoas',
      'Responsáveis',
    ])
    expect(screen.queryByText('Análises')).not.toBeInTheDocument()
    expect(screen.queryByText('Planejamento')).not.toBeInTheDocument()
    expect(screen.queryByText('Lançamentos')).not.toBeInTheDocument()
    expect(screen.queryByText('Compras')).not.toBeInTheDocument()
    expect(screen.getByTestId('cadastros-open')).toHaveTextContent('fechado')
  })

  it('abrir Relatórios não fecha Recorrente', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'abrir-relatorios-menu' }))
    await user.click(screen.getByRole('button', { name: 'abrir-recorrente' }))
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('aberto')
  })

  it('marca Faturas em /faturas/add e Assinaturas em /compras', () => {
    const { unmount } = renderMenu('/faturas/add')
    expect(screen.getByTestId('faturas-active')).toBeInTheDocument()
    unmount()

    renderMenu('/compras/12')
    expect(screen.getByTestId('assinaturas-active')).toBeInTheDocument()
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('aberto')
  })

  it('marca Projeção na rota de responsável e abre Cadastros na rota de cadastro', () => {
    const { unmount } = renderMenu('/projecao-faturas/responsaveis/3')
    expect(screen.getByTestId('projecao-faturas-active')).toBeInTheDocument()
    unmount()

    renderMenu('/categorias')
    expect(screen.getByTestId('cadastros-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('categorias-active')).toBeInTheDocument()
  })
})
