import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardBody, Container } from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatDateBr } from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  GastosPorCategoriaSearch,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import { GastosPorCategoriaService } from 'services/GastosPorCategoria/GastosPorCategoriaService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import {
  buildGastosPorCategoriaSearchParams,
  buildSelectOptions,
  persistGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSearch,
} from 'helpers/gastos_por_categoria_helpers'
import GastosPorCategoriaHeader from './GastosPorCategoriaHeader/GastosPorCategoriaHeader'
import GastosPorCategoriaHero from './GastosPorCategoriaHero/GastosPorCategoriaHero'
import GastosPorCategoriaTipos from './GastosPorCategoriaTipos/GastosPorCategoriaTipos'
import GastosPorCategoriaLista from './GastosPorCategoriaLista/GastosPorCategoriaLista'
import GastosPorCategoriaEvolucao from './GastosPorCategoriaEvolucao/GastosPorCategoriaEvolucao'
import GastosPorCategoriaSemCategoria from './GastosPorCategoriaSemCategoria/GastosPorCategoriaSemCategoria'

const GastosPorCategoriaPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<GastosPorCategoriaView>()
  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])
  const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todas' },
  ])

  const defaultValues = resolveGastosPorCategoriaSearch(searchParams)
  const lastFiltersRef = useRef<GastosPorCategoriaSearch>(defaultValues)
  const lastKeyRef = useRef('')
  const gastosService = useRef(new GastosPorCategoriaService()).current
  const transacoesService = useRef(new TransacoesService()).current

  const persistUrl = (filters: GastosPorCategoriaSearch) => {
    const next = buildGastosPorCategoriaSearchParams(filters)
    const nextQs = next.toString()
    const currentQs = new URLSearchParams(window.location.search).toString()
    if (nextQs === currentQs) return
    setSearchParams(next, { replace: true })
  }

  const loadGastos = async (filters: GastosPorCategoriaSearch, opts?: { force?: boolean }) => {
    const next = resolveGastosPorCategoriaSearch(buildGastosPorCategoriaSearchParams(filters))
    const key = JSON.stringify(next)
    if (!opts?.force && lastKeyRef.current === key) return
    lastKeyRef.current = key
    lastFiltersRef.current = next
    persistGastosPorCategoriaSearch(next)
    persistUrl(next)
    setLoading(true)
    setLoadError(null)
    try {
      const result = await gastosService.getGastosPorCategoria(next)
      setData(result)
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar gastos por categoria'
      toast.error(message)
      setData(undefined)
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }

  const loadLookups = async () => {
    try {
      const result = await transacoesService.getLookupsTransacoes()
      if (result) {
        setCartoesOptions(buildSelectOptions(result.cartoes))
        setResponsaveisOptions(buildSelectOptions(result.responsaveis))
        setCategoriasOptions(buildSelectOptions(result.categorias, 'Todas'))
      }
    } catch (error) {
      console.error('Erro ao carregar lookups de gastos por categoria:', error)
    }
  }

  const handleHeaderChange = (filters: GastosPorCategoriaSearch) => {
    loadGastos({
      ...filters,
      origem_compra: lastFiltersRef.current.origem_compra,
    })
  }

  const handleOrigem = (origem: string | null) => {
    loadGastos({
      ...lastFiltersRef.current,
      origem_compra: origem,
    })
  }

  useEffect(() => {
    loadLookups()
    loadGastos(defaultValues, { force: true })
    setActiveMenu('/gastos-por-categoria')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const compras = Number(data?.totais?.compras ?? 0)
  const empty = !loading && !loadError && compras === 0
  const periodoInicio = data?.periodo?.inicio ? formatDateBr(data.periodo.inicio) : null
  const periodoFim = data?.periodo?.fim ? formatDateBr(data.periodo.fim) : null
  const skeleton = loading && !data

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <GastosPorCategoriaHeader
            defaultValues={defaultValues}
            cartoesOptions={cartoesOptions}
            responsaveisOptions={responsaveisOptions}
            categoriasOptions={categoriasOptions}
            periodoLabel={data?.periodo?.label}
            periodoInicio={periodoInicio}
            periodoFim={periodoFim}
            valorTotal={data?.totais?.valor_total}
            variacaoPercentual={data?.totais?.variacao_valor_percentual}
            periodoAnteriorLabel={data?.periodo_anterior?.label}
            onChange={handleHeaderChange}
          />

          {loadError ? (
            <Card>
              <CardBody className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-24">
                    <i className="ri-error-warning-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Não foi possível carregar os gastos por categoria.</h5>
                <p className="text-muted mb-3">{loadError}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => loadGastos(lastFiltersRef.current, { force: true })}
                >
                  Tentar novamente
                </button>
              </CardBody>
            </Card>
          ) : empty ? (
            <Card>
              <CardBody className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                    <i className="ri-inbox-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Sem compras neste período.</h5>
                <p className="text-muted mb-3">Importe uma fatura ou altere o filtro.</p>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Link to="/faturas" className="btn btn-soft-primary btn-sm">
                    Ver faturas
                  </Link>
                  <Link to="/transacoes" className="btn btn-soft-secondary btn-sm">
                    Ver transações
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <GastosPorCategoriaHero data={data} loading={skeleton} />
              {skeleton ? <GastosPorCategoriaLista loading /> : null}
              {data ? (
                <>
                  <GastosPorCategoriaTipos
                    itens={data.por_origem}
                    origemAtiva={lastFiltersRef.current.origem_compra}
                    onFiltrar={handleOrigem}
                  />
                  <GastosPorCategoriaLista categorias={data.categorias} />
                  <GastosPorCategoriaEvolucao
                    meses={data.evolucao?.por_mes}
                    porCategoria={data.evolucao?.por_categoria}
                  />
                  <GastosPorCategoriaSemCategoria data={data} />
                </>
              ) : null}
            </>
          )}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default GastosPorCategoriaPage
