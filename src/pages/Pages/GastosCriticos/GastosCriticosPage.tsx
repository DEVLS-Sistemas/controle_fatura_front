import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, CardBody, Container } from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatDateBr } from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  GastosCriticosDimensao,
  GastosCriticosRankingCriterio,
  GastosCriticosSearch,
  GastosCriticosView,
} from 'interfaces/GastosCriticos/GastosCriticosInterface'
import { GastosCriticosService } from 'services/GastosCriticos/GastosCriticosService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import {
  buildSelectOptions,
  persistGastosCriticosSearch,
  persistRankingCriterio,
  readRankingCriterio,
  resolveGastosCriticosSearch,
} from 'helpers/gastos_criticos_helpers'
import GastosCriticosHeader from './GastosCriticosHeader/GastosCriticosHeader'
import GastosCriticosHero from './GastosCriticosHero/GastosCriticosHero'
import GastosCriticosAlertas from './GastosCriticosAlertas/GastosCriticosAlertas'
import GastosCriticosEvolucao from './GastosCriticosEvolucao/GastosCriticosEvolucao'
import GastosCriticosRankings from './GastosCriticosRankings/GastosCriticosRankings'
import GastosCriticosSemCategoria from './GastosCriticosSemCategoria/GastosCriticosSemCategoria'

const GastosCriticosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [data, setData] = useState<GastosCriticosView>()
  const [criterio, setCriterio] = useState<GastosCriticosRankingCriterio>('gasto')
  const [dimensao, setDimensao] = useState<GastosCriticosDimensao>('lojas')
  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])

  const defaultValues = resolveGastosCriticosSearch(searchParams)
  const lastFiltersRef = useRef<GastosCriticosSearch>(defaultValues)
  const gastosService = useRef(new GastosCriticosService()).current
  const transacoesService = useRef(new TransacoesService()).current

  const persistUrl = (filters: GastosCriticosSearch) => {
    const next = new URLSearchParams()
    if (filters.meses) next.set('meses', String(filters.meses))
    if (filters.cartao_id) next.set('cartao_id', String(filters.cartao_id))
    if (filters.responsavel_id) next.set('responsavel_id', String(filters.responsavel_id))
    setSearchParams(next, { replace: true })
  }

  const loadGastos = async (filters: GastosCriticosSearch) => {
    lastFiltersRef.current = filters
    persistGastosCriticosSearch(filters)
    persistUrl(filters)
    setLoading(true)
    setLoadError(false)
    try {
      const result = await gastosService.getGastosCriticos(filters)
      setData(result)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar gastos críticos')
      setData(undefined)
      setLoadError(true)
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
      }
    } catch (error) {
      console.error('Erro ao carregar lookups de gastos críticos:', error)
    }
  }

  const handleCriterioChange = (next: GastosCriticosRankingCriterio) => {
    setCriterio(next)
    persistRankingCriterio(next)
  }

  useEffect(() => {
    setCriterio(readRankingCriterio())
    loadLookups()
    loadGastos(defaultValues)
    setActiveMenu('/gastos-criticos')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const compras = Number(data?.totais?.compras ?? 0)
  const empty = !loading && !loadError && compras === 0
  const periodoInicio = data?.periodo?.inicio ? formatDateBr(data.periodo.inicio) : null
  const periodoFim = data?.periodo?.fim ? formatDateBr(data.periodo.fim) : null

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <GastosCriticosHeader
            defaultValues={defaultValues}
            cartoesOptions={cartoesOptions}
            responsaveisOptions={responsaveisOptions}
            periodoLabel={data?.periodo?.label}
            periodoInicio={periodoInicio}
            periodoFim={periodoFim}
            onChange={loadGastos}
          />

          {loadError ? (
            <Card>
              <CardBody className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-24">
                    <i className="ri-error-warning-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Não foi possível carregar os gastos críticos.</h5>
                <p className="text-muted mb-3">Tente de novo ou altere o período.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => loadGastos(lastFiltersRef.current)}
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
                <p className="text-muted mb-3">
                  Importe uma fatura ou altere o filtro.
                </p>
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
              <GastosCriticosHero data={data} loading={loading && !data} />
              {loading && !data ? (
                <Card className="mb-3">
                  <CardBody>
                    <div className="placeholder-glow">
                      <span className="placeholder col-4 mb-3"></span>
                      <span className="placeholder col-12 mb-2"></span>
                      <span className="placeholder col-10 mb-2"></span>
                      <span className="placeholder col-8"></span>
                    </div>
                  </CardBody>
                </Card>
              ) : null}
              {data ? (
                <>
                  <GastosCriticosAlertas alertas={data.alertas} />
                  <GastosCriticosEvolucao meses={data.evolucao?.por_mes} />
                  <GastosCriticosRankings
                    data={data}
                    criterio={criterio}
                    dimensao={dimensao}
                    onCriterioChange={handleCriterioChange}
                    onDimensaoChange={setDimensao}
                  />
                  <GastosCriticosSemCategoria data={data} />
                </>
              ) : null}
            </>
          )}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default GastosCriticosPage
