import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import {
  AssinaturaAcao,
  AssinaturasListView,
  AssinaturasSearch,
  AssinaturasTotais,
} from 'interfaces/Assinaturas/AssinaturasInterface'
import { AssinaturasService } from 'services/Assinaturas/AssinaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import {
  idLookupToSelectOptions,
  lookupToSelectOptions,
  mensagemAcaoAssinatura,
  resolveAssinaturasSearch,
} from 'helpers/assinaturas_helpers'
import AssinaturasFilter, {
  AssinaturasFilterHandle,
} from './AssinaturasFilter/AssinaturasFilter'
import AssinaturasHero from './AssinaturasHero/AssinaturasHero'
import AssinaturasList from './AssinaturasList/AssinaturasList'

const DEFAULT_ORDENAR: SelectOptions[] = [
  { value: 'anual_desc', label: 'Maior gasto anual' },
]

const DEFAULT_PERIODICIDADE: SelectOptions[] = [
  { value: '', label: 'Todas' },
]

const AssinaturasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [listData, setListData] = useState<AssinaturasListView>()
  const [totais, setTotais] = useState<AssinaturasTotais>()
  const [statusFiltro, setStatusFiltro] = useState<string>('todas')
  const filterRef = useRef<AssinaturasFilterHandle>(null)
  const assinaturasService = new AssinaturasService()
  const transacoesService = new TransacoesService()

  const defaultValues: AssinaturasSearch = resolveAssinaturasSearch(searchParams)
  const lastFiltersRef = useRef<AssinaturasSearch>(defaultValues)

  const [ordenarOptions, setOrdenarOptions] = useState<SelectOptions[]>(DEFAULT_ORDENAR)
  const [periodicidadeOptions, setPeriodicidadeOptions] = useState<SelectOptions[]>(DEFAULT_PERIODICIDADE)
  const [cartoesOptions, setCartoesOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
  const [categoriasOptions, setCategoriasOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([{ value: '', label: 'Todos' }])

  const persistSearch = (filters: AssinaturasSearch) => {
    const next = new URLSearchParams()
    const status = String(filters.status || 'todas')
    if (status && status !== 'todas') next.set('status', status)
    if (filters.ordenar && filters.ordenar !== 'anual_desc') next.set('ordenar', String(filters.ordenar))
    if (filters.periodicidade) next.set('periodicidade', String(filters.periodicidade))
    const palavra = typeof filters.palavra_chave === 'string' ? filters.palavra_chave.trim() : ''
    if (palavra) next.set('palavra_chave', palavra)
    if (filters.cartao_id) next.set('cartao_id', String(filters.cartao_id))
    if (filters.responsavel_id) next.set('responsavel_id', String(filters.responsavel_id))
    if (filters.categoria_id) next.set('categoria_id', String(filters.categoria_id))
    setSearchParams(next, { replace: true })
  }

  const loadAssinaturas = async (filters: AssinaturasSearch) => {
    lastFiltersRef.current = filters
    setLoading(true)
    setLoadError(false)
    setStatusFiltro(String(filters.status || 'todas'))
    try {
      const result = await assinaturasService.listAssinaturas(filters)
      setListData(result)
      if (result?.totais) setTotais(result.totais)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar assinaturas')
      setListData(undefined)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const getRemoteAssinaturas: SubmitHandler<AssinaturasSearch> = async (data) => {
    const filters: AssinaturasSearch = {
      status: data.status || 'todas',
      periodicidade: data.periodicidade || null,
      palavra_chave: data.palavra_chave,
      ordenar: data.ordenar || 'anual_desc',
      cartao_id: data.cartao_id || null,
      responsavel_id: data.responsavel_id || null,
      categoria_id: data.categoria_id || null,
    }
    persistSearch(filters)
    await loadAssinaturas(filters)
  }

  const handleAcao = async (identificador: string, acao: AssinaturaAcao) => {
    if (acao === 'desfazer_confirmacao') {
      const ok = window.confirm('As cobranças deixam de ser assinatura. Continuar?')
      if (!ok) return
    }

    setActingId(identificador)
    try {
      let result: any
      if (acao === 'confirmar') {
        result = await assinaturasService.createAssinaturas({ identificador })
      } else if (acao === 'ignorar') {
        result = await assinaturasService.deleteAssinaturas(identificador)
      } else {
        result = await assinaturasService.editAssinaturas({ identificador, acao })
      }
      toast.success(mensagemAcaoAssinatura(acao, result?.message || result?.data?.message))
      await loadAssinaturas(lastFiltersRef.current)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar assinatura')
    } finally {
      setActingId(null)
    }
  }

  const loadLookups = async () => {
    try {
      const [assinaturasLookups, transacoesLookups] = await Promise.all([
        assinaturasService.getLookupsAssinaturas(),
        transacoesService.getLookupsTransacoes(),
      ])

      if (assinaturasLookups?.ordenar?.length) {
        setOrdenarOptions(lookupToSelectOptions(assinaturasLookups.ordenar))
      }
      if (assinaturasLookups?.periodicidades?.length) {
        setPeriodicidadeOptions(
          lookupToSelectOptions(assinaturasLookups.periodicidades, {
            includeAll: true,
            allLabel: 'Todas',
          })
        )
      }
      if (transacoesLookups) {
        const tx: any = transacoesLookups
        const txData = tx.cartoes || tx.categorias ? tx : tx.data
        setCartoesOptions(idLookupToSelectOptions(txData?.cartoes))
        setCategoriasOptions(idLookupToSelectOptions(txData?.categorias))
        setResponsaveisOptions(idLookupToSelectOptions(txData?.responsaveis))
      }
    } catch (error) {
      console.error('Erro ao carregar lookups de assinaturas:', error)
    }
  }

  useEffect(() => {
    loadLookups()
    setActiveMenu('/assinaturas')
  }, [])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <AssinaturasFilter
            ref={filterRef}
            getRemoteAssinaturas={getRemoteAssinaturas}
            defaultValues={defaultValues}
            ordenarOptions={ordenarOptions}
            periodicidadeOptions={periodicidadeOptions}
            cartoesOptions={cartoesOptions}
            categoriasOptions={categoriasOptions}
            responsaveisOptions={responsaveisOptions}
          />
          {statusFiltro !== 'ignorada' ? (
            <AssinaturasHero
              totais={totais}
              loading={loading && !totais}
              onRevisar={() => {
                document.getElementById('assinaturas-para-confirmar')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
            />
          ) : null}
          <AssinaturasList
            oficiais={listData?.assinaturas}
            candidatas={listData?.candidatas}
            ignoradas={listData?.ignoradas}
            loading={loading}
            error={loadError}
            statusFiltro={statusFiltro}
            actingId={actingId}
            onAcao={handleAcao}
            onRetry={() => loadAssinaturas(lastFiltersRef.current)}
          />
        </Container>
      </div>
    </React.Fragment>
  )
}

export default AssinaturasPage
