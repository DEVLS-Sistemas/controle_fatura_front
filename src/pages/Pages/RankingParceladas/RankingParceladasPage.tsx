import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  RankingParceladasSearch,
  RankingParceladasView,
  RankingParceladasVisualizacao,
} from 'interfaces/RankingParceladas/RankingParceladasInterface'
import { RankingParceladasService } from 'services/RankingParceladas/RankingParceladasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { corCategoria } from 'helpers/cores_tema_helpers'
import {
  buildTotaisRanking,
  enriquecerRankingView,
  estaVisivelNoRanking,
  isApenasAbertas,
  ordenarPorMenorPercentual,
  persistRankingSearch,
  persistVisualizacaoRanking,
  readVisualizacaoRanking,
  resolveRankingSearchDefaults,
} from 'helpers/ranking_parceladas_helpers'
import RankingParceladasFilter, {
  RankingParceladasFilterHandle,
} from './RankingParceladasFilter/RankingParceladasFilter'
import RankingParceladasList from './RankingParceladasList/RankingParceladasList'
import RankingParceladasTimeline from './RankingParceladasTimeline/RankingParceladasTimeline'

const buildSelectOptions = (
  items:
    | {
        id?: number
        nome?: string
        cor?: string | null
        cor_fundo?: string | null
        cor_texto?: string | null
      }[]
    | undefined,
  allLabel = 'Todos'
): SelectOptions[] => {
  const opts: SelectOptions[] = [{ value: '', label: allLabel }]
  items?.forEach((item) => {
    if (item.id != null) {
      opts.push({
        value: item.id,
        label: item.nome ?? `#${item.id}`,
        cor: item.cor ?? null,
        cor_fundo: item.cor_fundo ?? null,
        cor_texto: item.cor_texto ?? null,
      })
    }
  })
  return opts
}

const RankingParceladasPage = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState<boolean>(true)
  const [rankingData, setRankingData] = useState<RankingParceladasView>()
  const [visualizacao, setVisualizacao] = useState<RankingParceladasVisualizacao>('lista')
  const filterRef = useRef<RankingParceladasFilterHandle>(null)
  const rankingService = new RankingParceladasService()
  const transacoesService = new TransacoesService()

  const defaultValues: RankingParceladasSearch = resolveRankingSearchDefaults(searchParams)

  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])
  const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Todos' },
  ])

  const applyRankingView = (
    result: RankingParceladasView | undefined,
    filters: RankingParceladasSearch
  ): RankingParceladasView | undefined => {
    if (!result) return result

    const mes = Number(filters.mes) || new Date().getMonth() + 1
    const ano = Number(filters.ano) || new Date().getFullYear()
    const enriched = enriquecerRankingView(result, mes, ano)
    let itens = [...(enriched.itens ?? [])]

    if (isApenasAbertas(filters.apenas_abertas)) {
      itens = itens.filter((item) => estaVisivelNoRanking(item, mes, ano))
    }

    itens = ordenarPorMenorPercentual(itens)

    return {
      ...enriched,
      itens,
      totais: buildTotaisRanking(itens),
    }
  }

  const getRemoteRankingParceladas: SubmitHandler<RankingParceladasSearch> = async (data) => {
    setLoading(true)
    try {
      const filters: RankingParceladasSearch = {
        mes: Number(data.mes) || new Date().getMonth() + 1,
        ano: Number(data.ano) || new Date().getFullYear(),
        cartao_id: data.cartao_id || null,
        responsavel_id: data.responsavel_id || null,
        categoria_id: data.categoria_id || null,
        apenas_abertas: data.apenas_abertas,
        ordenar: 'percentual_asc',
        palavra_chave: data.palavra_chave,
      }
      persistRankingSearch(filters)
      const result = await rankingService.getRankingParceladas(filters)
      setRankingData(applyRankingView(result, filters))
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar ranking de parceladas')
      setRankingData(undefined)
    } finally {
      setLoading(false)
    }
  }

  const handleVisualizacaoChange = (view: RankingParceladasVisualizacao) => {
    setVisualizacao(view)
    persistVisualizacaoRanking(view)
  }

  const loadLookups = async () => {
    try {
      const result = await transacoesService.getLookupsTransacoes()
      if (result) {
        setCartoesOptions(buildSelectOptions(result.cartoes))
        setCategoriasOptions(
          buildSelectOptions(result.categorias).map((opt) =>
            opt.value === ''
              ? opt
              : { ...opt, cor: corCategoria({ cor: opt.cor, categoria_id: Number(opt.value) }) }
          )
        )
        setResponsaveisOptions(buildSelectOptions(result.responsaveis))
      }
    } catch (error) {
      console.error('Erro ao carregar lookups do ranking de parceladas:', error)
    }
  }

  useEffect(() => {
    setVisualizacao(readVisualizacaoRanking())
    loadLookups()
    setActiveMenu('/parceladas')
  }, [])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <RankingParceladasFilter
            ref={filterRef}
            getRemoteRankingParceladas={getRemoteRankingParceladas}
            defaultValues={defaultValues}
            cartoesOptions={cartoesOptions}
            categoriasOptions={categoriasOptions}
            responsaveisOptions={responsaveisOptions}
            visualizacao={visualizacao}
            onVisualizacaoChange={handleVisualizacaoChange}
          />
          {visualizacao === 'competencias' ? (
            <RankingParceladasTimeline
              data={rankingData}
              loading={loading}
              onShiftCompetencia={(delta) => filterRef.current?.shiftCompetencia(delta)}
              onGoToday={() => filterRef.current?.goToday()}
            />
          ) : (
            <RankingParceladasList data={rankingData} loading={loading} />
          )}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default RankingParceladasPage
