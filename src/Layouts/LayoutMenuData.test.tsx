import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
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

const Navegacao = () => {
  const navigate = useNavigate()
  return (
    <div>
      <button type="button" onClick={() => navigate('/relatorios')}>ir-relatorios</button>
      <button type="button" onClick={() => navigate('/parceladas')}>ir-parceladas</button>
      <button type="button" onClick={() => navigate('/faturas')}>ir-faturas</button>
      <button type="button" onClick={() => navigate('/cartoes')}>ir-cartoes</button>
      <Probe />
    </div>
  )
}

const renderMenu = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navegacao />
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

  it('fecha o grupo anterior ao mudar de tela e deixa só o da rota ativo', async () => {
    const user = userEvent.setup()
    renderMenu('/relatorios')
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('relatorios-menu-active')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ir-parceladas' }))
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('fechado')
    expect(screen.queryByTestId('relatorios-menu-active')).not.toBeInTheDocument()
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('recorrente-active')).toBeInTheDocument()
    expect(screen.getByTestId('parceladas-active')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ir-faturas' }))
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('fechado')
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('fechado')
    expect(screen.getByTestId('cadastros-open')).toHaveTextContent('fechado')
    expect(screen.queryByTestId('recorrente-active')).not.toBeInTheDocument()
    expect(screen.getByTestId('faturas-active')).toBeInTheDocument()
  })

  it('fecha grupos abertos na mão quando a rota muda', async () => {
    const user = userEvent.setup()
    renderMenu('/faturas')
    await user.click(screen.getByRole('button', { name: 'abrir-relatorios-menu' }))
    await user.click(screen.getByRole('button', { name: 'abrir-recorrente' }))
    await user.click(screen.getByRole('button', { name: 'abrir-cadastros' }))
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('aberto')
    expect(screen.getByTestId('cadastros-open')).toHaveTextContent('aberto')

    await user.click(screen.getByRole('button', { name: 'ir-cartoes' }))
    expect(screen.getByTestId('relatorios-menu-open')).toHaveTextContent('fechado')
    expect(screen.getByTestId('recorrente-open')).toHaveTextContent('fechado')
    expect(screen.getByTestId('cadastros-open')).toHaveTextContent('fechado')
    expect(screen.getByTestId('cartoes-active')).toBeInTheDocument()
    expect(screen.queryByTestId('relatorios-menu-active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recorrente-active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cadastros-active')).not.toBeInTheDocument()
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
