import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardBody, Container } from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatDateBr } from 'helpers/fatura_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  GastosPorCategoriaSearch,
  GastosPorCategoriaSelecao,
  GastosPorCategoriaSelecaoVazia,
  GastosPorCategoriaView,
} from 'interfaces/GastosPorCategoria/GastosPorCategoriaInterface'
import { GastosPorCategoriaService } from 'services/GastosPorCategoria/GastosPorCategoriaService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import {
  aplicarCliqueCategoria,
  aplicarCliqueSubcategoria,
  atalhoToPath,
  atalhoToPeriodoState,
  fatiasCategoria,
  fatiasOrigem,
  fatiasSubcategoria,
  barrasCategoria,
  barrasSubcategoria,
  buildPageSearchParams,
  buildSelectOptions,
  centroValorOrigem,
  encontrarCategoria,
  persistGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSearch,
  resolveGastosPorCategoriaSelecao,
  resolveKpis,
  resolvePorOrigemSelecao,
  tituloOrigem,
} from 'helpers/gastos_por_categoria_helpers'
import GastosPorCategoriaHeader from './GastosPorCategoriaHeader/GastosPorCategoriaHeader'
import GastosPorCategoriaHero from './GastosPorCategoriaHero/GastosPorCategoriaHero'
import GastosPorCategoriaKpis from './GastosPorCategoriaKpis/GastosPorCategoriaKpis'
import GastosPorCategoriaDashboards from './GastosPorCategoriaDashboards/GastosPorCategoriaDashboards'
import GastosPorCategoriaBarras from './GastosPorCategoriaBarras/GastosPorCategoriaBarras'
import GastosPorCategoriaLista from './GastosPorCategoriaLista/GastosPorCategoriaLista'
import GastosPorCategoriaEvolucao from './GastosPorCategoriaEvolucao/GastosPorCategoriaEvolucao'
import GastosPorCategoriaSemCategoria from './GastosPorCategoriaSemCategoria/GastosPorCategoriaSemCategoria'

const GastosPorCategoriaPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<GastosPorCategoriaView>()
  const [selecao, setSelecao] = useState<GastosPorCategoriaSelecao>(() =>
    resolveGastosPorCategoriaSelecao(searchParams)
  )
  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])

  const defaultValues = resolveGastosPorCategoriaSearch(searchParams)
  const lastFiltersRef = useRef<GastosPorCategoriaSearch>(defaultValues)
  const lastKeyRef = useRef('')
  const selecaoRef = useRef(selecao)
  const gastosService = useRef(new GastosPorCategoriaService()).current
  const transacoesService = useRef(new TransacoesService()).current

  selecaoRef.current = selecao

  const persistUrl = (filters: GastosPorCategoriaSearch, nextSelecao: GastosPorCategoriaSelecao) => {
    const next = buildPageSearchParams(filters, nextSelecao)
    const nextQs = next.toString()
    const currentQs = new URLSearchParams(window.location.search).toString()
    if (nextQs === currentQs) return
    setSearchParams(next, { replace: true })
  }

  const aplicarSelecao = (next: GastosPorCategoriaSelecao) => {
    setSelecao(next)
    persistUrl(lastFiltersRef.current, next)
  }

  const loadGastos = async (
    filters: GastosPorCategoriaSearch,
    opts?: { force?: boolean; keepSelecao?: boolean }
  ) => {
    const next = resolveGastosPorCategoriaSearch(buildPageSearchParams(filters))
    const key = JSON.stringify(next)
    if (!opts?.force && lastKeyRef.current === key) return
    lastKeyRef.current = key
    lastFiltersRef.current = next
    persistGastosPorCategoriaSearch(next)
    const nextSelecao = opts?.keepSelecao ? selecaoRef.current : { ...GastosPorCategoriaSelecaoVazia }
    if (!opts?.keepSelecao) setSelecao(nextSelecao)
    persistUrl(next, nextSelecao)
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
      }
    } catch (error) {
      console.error('Erro ao carregar lookups de gastos por categoria:', error)
    }
  }

  const handleHeaderChange = (filters: GastosPorCategoriaSearch) => {
    loadGastos(
      {
        ...filters,
        origem_compra: lastFiltersRef.current.origem_compra,
      },
      { force: true }
    )
  }

  const handleOrigem = (origem: string | null) => {
    loadGastos({
      ...lastFiltersRef.current,
      origem_compra: origem,
    })
  }

  const abrirAtalho = (atalho?: Parameters<typeof atalhoToPath>[0]) => {
    const path = atalhoToPath(atalho)
    if (!path) return
    navigate(path, { state: atalhoToPeriodoState(atalho) })
  }

  useEffect(() => {
    loadLookups()
    loadGastos(defaultValues, { force: true, keepSelecao: true })
    setActiveMenu('/gastos-por-categoria')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const compras = Number(data?.totais?.compras ?? 0)
  const empty = !loading && !loadError && compras === 0
  const periodoInicio = data?.periodo?.inicio ? formatDateBr(data.periodo.inicio) : null
  const periodoFim = data?.periodo?.fim ? formatDateBr(data.periodo.fim) : null
  const skeleton = loading && !data

  const kpis = useMemo(() => resolveKpis(data, selecao), [data, selecao])
  const categoriasChart = useMemo(() => fatiasCategoria(data), [data])
  const subcategoriasChart = useMemo(() => fatiasSubcategoria(data, selecao), [data, selecao])
  const categoriasBarras = useMemo(() => barrasCategoria(data), [data])
  const subcategoriasBarras = useMemo(() => barrasSubcategoria(data, selecao), [data, selecao])
  const porOrigem = useMemo(
    () => fatiasOrigem(resolvePorOrigemSelecao(data, selecao)),
    [data, selecao]
  )
  const categoriaSelecionada = useMemo(() => encontrarCategoria(data, selecao), [data, selecao])
  const origemCentro = useMemo(() => centroValorOrigem(data, selecao), [data, selecao])
  const tituloSubcategorias = selecao.categoria_chave
    ? `Subcategorias de ${categoriaSelecionada?.nome || 'categoria'}`
    : 'Subcategorias'
  const tituloOrigemCard = tituloOrigem(selecao.categoria_chave ? categoriaSelecionada?.nome : null)

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <GastosPorCategoriaHeader
            defaultValues={defaultValues}
            cartoesOptions={cartoesOptions}
            responsaveisOptions={responsaveisOptions}
            periodoLabel={data?.periodo?.label}
            periodoInicio={periodoInicio}
            periodoFim={periodoFim}
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
                  onClick={() => loadGastos(lastFiltersRef.current, { force: true, keepSelecao: true })}
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
              <GastosPorCategoriaKpis
                kpis={kpis}
                loading={skeleton}
                onVerCompras={kpis.atalho ? () => abrirAtalho(kpis.atalho) : undefined}
              />
              <GastosPorCategoriaDashboards
                categorias={categoriasChart}
                subcategorias={subcategoriasChart}
                origens={porOrigem}
                categoriaSelecionadaChave={selecao.categoria_chave}
                subcategoriaSelecionadaId={selecao.subcategoria_id}
                origemAtiva={lastFiltersRef.current.origem_compra}
                tituloSubcategorias={tituloSubcategorias}
                tituloOrigem={tituloOrigemCard}
                centroValor={kpis.valor_total}
                centroLabel={kpis.label}
                centroValorOrigem={origemCentro.valor}
                centroLabelOrigem={origemCentro.label}
                categoriaFiltrada={Boolean(selecao.categoria_chave)}
                loading={skeleton}
                onCliqueCategoria={(item) => aplicarSelecao(aplicarCliqueCategoria(selecao, item))}
                onCliqueSubcategoria={(item) => aplicarSelecao(aplicarCliqueSubcategoria(selecao, item))}
                onDuploCliqueCategoria={(item) => abrirAtalho(item.atalho)}
                onDuploCliqueSubcategoria={(item) => abrirAtalho(item.atalho)}
                onDuploCliqueOrigem={(item) => abrirAtalho(item.atalho)}
                onFiltrarOrigem={handleOrigem}
                onLimpar={() => aplicarSelecao({ ...GastosPorCategoriaSelecaoVazia })}
              />
              <GastosPorCategoriaBarras
                categorias={categoriasBarras}
                subcategorias={subcategoriasBarras}
                categoriaSelecionadaChave={selecao.categoria_chave}
                subcategoriaSelecionadaId={selecao.subcategoria_id}
                tituloSubcategorias={tituloSubcategorias}
                categoriaFiltrada={Boolean(selecao.categoria_chave)}
                loading={skeleton}
                onCliqueCategoria={(item) => aplicarSelecao(aplicarCliqueCategoria(selecao, item))}
                onCliqueSubcategoria={(item) => aplicarSelecao(aplicarCliqueSubcategoria(selecao, item))}
                onDuploCliqueCategoria={(item) => abrirAtalho(item.atalho)}
                onDuploCliqueSubcategoria={(item) => abrirAtalho(item.atalho)}
                onLimpar={() => aplicarSelecao({ ...GastosPorCategoriaSelecaoVazia })}
              />
              {skeleton ? <GastosPorCategoriaLista loading /> : null}
              {data ? (
                <>
                  <GastosPorCategoriaLista categorias={data.categorias} />
                  <GastosPorCategoriaEvolucao
                    meses={data.evolucao?.por_mes}
                    porCategoria={data.evolucao?.por_categoria}
                    categoriaId={selecao.categoria_id}
                    categoriaNome={categoriaSelecionada?.nome}
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
