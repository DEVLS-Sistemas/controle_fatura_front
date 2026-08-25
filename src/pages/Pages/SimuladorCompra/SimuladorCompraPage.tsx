import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, Col, Container, Row } from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import UiContent from 'Components/Common/UiContent'
import { setActiveMenu } from 'helpers/system_helpers'
import { isMeuResponsavelDisplay, splitValorEmParcelas, toCentavos } from 'helpers/fatura_helpers'
import { buildResponsavelVisualizarPath } from 'helpers/responsavel_visualizar_helpers'
import { calcularVereditoCompra } from 'helpers/posso_comprar_helpers'
import {
  aplicarOverlaySimulacao,
  breakdownResponsavelPorCartao,
  calcularImpactoSimulacao,
  competenciaPrimeiraParcela,
  filtrarCartoesDoTitular,
  labelCompetencia,
  labelCompetenciaCompleta,
  montarParcelasSimuladas,
  parseQueryNumber,
  parseValorQuery,
  responsavelPadraoDoTitular,
  somaParcelasBate,
  titularPrincipal,
  todayISO,
} from 'helpers/simulador_compra_helpers'
import { pessoaIdOf, PessoaListItem, toPessoaSelectOption } from 'interfaces/Pessoas/PessoasInterface'
import { CartoesList } from 'interfaces/Cartoes/CartoesInterface'
import { ProjecaoFaturasView } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { SimuladorCompraFormValues, SimuladorParcela } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { CartaoLookup, ResponsavelLookup } from 'interfaces/Transacoes/TransacoesInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'
import { PessoasService } from 'services/Pessoas/PessoasService'
import { ProjecaoFaturasService } from 'services/ProjecaoFaturas/ProjecaoFaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import ResponsavelModal from 'pages/Pages/Transacoes/ResponsavelModal/ResponsavelModal'
import SimuladorCompraForm from './SimuladorCompraForm/SimuladorCompraForm'
import SimuladorCompraImpacto from './SimuladorCompraImpacto/SimuladorCompraImpacto'
import SimuladorCompraDetalhes from './SimuladorCompraDetalhes/SimuladorCompraDetalhes'
import SimuladorCompraVeredito, {
  SimuladorCompraVereditoSkeleton,
} from './SimuladorCompraVeredito/SimuladorCompraVeredito'

type CartaoForm = {
  id: number
  nome: string
  cor_fundo?: string | null
  cor_texto?: string | null
  dia_limite_fatura?: number | null
  dia_vencimento_fatura?: number | null
  pessoa_id?: number | null
  pessoa_nome?: string | null
}

const parsePessoaIdCartao = (c: Record<string, any>): number | null => {
  const raw = c?.pessoa_id ?? c?.pessoaId ?? c?.titular_id ?? c?.pessoa?.id ?? c?.pessoa?.pessoa_id
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const normalizeCartoesList = (body: unknown): Record<string, any>[] => {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    if (Array.isArray(record.data)) return record.data as Record<string, any>[]
    if (Array.isArray(record.cartoes)) return record.cartoes as Record<string, any>[]
  }
  return []
}

const toCartaoForm = (c: Record<string, any> | CartoesList | CartaoLookup | null | undefined): CartaoForm | null => {
  if (!c) return null
  const raw = c as Record<string, any>
  const id = Number(raw.id ?? raw.cartao_id ?? raw.value)
  if (!Number.isFinite(id) || id <= 0) return null
  const ativo = raw.ativo
  if (ativo === false || ativo === 0 || ativo === '0') return null
  return {
    id,
    nome: String(raw.nome ?? raw.label ?? `Cartão ${id}`),
    cor_fundo: raw.cor_fundo ?? null,
    cor_texto: raw.cor_texto ?? null,
    dia_limite_fatura: raw.dia_limite_fatura ?? null,
    dia_vencimento_fatura: raw.dia_vencimento_fatura ?? null,
    pessoa_id: parsePessoaIdCartao(raw),
    pessoa_nome: raw.pessoa_nome ?? raw.pessoa?.nome_completo ?? raw.pessoa?.nome ?? null,
  }
}

const mergeCartoes = (listas: Array<CartaoForm[] | undefined>): CartaoForm[] => {
  const byId = new Map<number, CartaoForm>()
  listas.forEach((lista) => {
    (lista || []).forEach((c) => {
      const prev = byId.get(c.id)
      if (!prev) {
        byId.set(c.id, c)
        return
      }
      byId.set(c.id, {
        ...prev,
        ...c,
        pessoa_id: c.pessoa_id ?? prev.pessoa_id ?? null,
        pessoa_nome: c.pessoa_nome || prev.pessoa_nome,
        dia_limite_fatura: c.dia_limite_fatura ?? prev.dia_limite_fatura ?? null,
        cor_fundo: c.cor_fundo || prev.cor_fundo,
        cor_texto: c.cor_texto || prev.cor_texto,
      })
    })
  })
  return Array.from(byId.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

const SimuladorCompraPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { register, control, watch, setValue } = useForm<SimuladorCompraFormValues>({
    defaultValues: {
      pessoa_id: null,
      cartao_id: parseQueryNumber(searchParams.get('cartao_id')),
      responsavel_id: parseQueryNumber(searchParams.get('responsavel_id')),
      valor_compra: parseValorQuery(searchParams.get('valor')),
      parcelas_total: parseQueryNumber(searchParams.get('parcelas')) || 1,
      data: searchParams.get('data') || todayISO(),
      mes: null,
      ano: null,
    },
  })

  const [loadingLookups, setLoadingLookups] = useState(true)
  const [simulando, setSimulando] = useState(false)
  const [resultadoVisivel, setResultadoVisivel] = useState(false)
  const [projecaoBase, setProjecaoBase] = useState<ProjecaoFaturasView>()
  const [pessoas, setPessoas] = useState<PessoaListItem[]>([])
  const [cartoesCatalogo, setCartoesCatalogo] = useState<CartaoForm[]>([])
  const [cartoesDoTitularApi, setCartoesDoTitularApi] = useState<CartaoForm[]>([])
  const [loadingCartoesTitular, setLoadingCartoesTitular] = useState(false)
  const [responsaveis, setResponsaveis] = useState<ResponsavelLookup[]>([])
  const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
  const [parcelasValores, setParcelasValores] = useState<string[]>([])
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
  const [dataAberta, setDataAberta] = useState(false)
  const [verTodos, setVerTodos] = useState(false)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)

  const defaultsApplied = useRef(false)
  const skipTitularEffect = useRef(true)
  const formKeySimulado = useRef<string | null>(null)
  const pessoasDetalheCache = useRef<Map<number, PessoaListItem>>(new Map())

  const pessoasService = useRef(new PessoasService()).current
  const cartoesService = useRef(new CartoesService()).current
  const projecaoService = useRef(new ProjecaoFaturasService()).current
  const transacoesService = useRef(new TransacoesService()).current

  const pessoaId = watch('pessoa_id')
  const cartaoId = watch('cartao_id')
  const responsavelId = watch('responsavel_id')
  const valorCompra = watch('valor_compra')
  const parcelasTotal = watch('parcelas_total')
  const dataCompra = watch('data')

  const nParcelas = Math.max(1, Math.min(36, Number(parcelasTotal) || 1))
  const valorCentavos = toCentavos(valorCompra)
  const totaisBatem =
    nParcelas <= 1 || somaParcelasBate(parcelasValores.map((v) => toCentavos(v)), valorCentavos)

  const titular = pessoas.find((p) => Number(pessoaIdOf(p)) === Number(pessoaId))
  const showTitular = pessoas.length > 1

  const cartoesFiltrados = useMemo(() => {
    const titularId = pessoaId != null && pessoaId !== '' ? Number(pessoaId) : null
    if (titularId == null || !Number.isFinite(titularId)) return []
    const ehPrincipal = Boolean(titular?.eh_principal)
    const doCatalogo = filtrarCartoesDoTitular(cartoesCatalogo, titularId, ehPrincipal)
    const daApi = filtrarCartoesDoTitular(cartoesDoTitularApi, titularId, ehPrincipal)
    const catalogoTemPessoa = cartoesCatalogo.some((c) => c.pessoa_id != null)
    const apiSoLegado =
      cartoesDoTitularApi.length > 0 && cartoesDoTitularApi.every((c) => c.pessoa_id == null)

    if (catalogoTemPessoa) {
      const idsCatalogo = new Set(doCatalogo.map((c) => c.id))
      const daApiDoTitular = daApi.filter(
        (c) => Number(c.pessoa_id) === titularId || idsCatalogo.has(c.id)
      )
      return mergeCartoes([doCatalogo, daApiDoTitular])
    }
    if (daApi.length) return mergeCartoes([daApi])
    if (apiSoLegado) {
      const idsApi = new Set(cartoesDoTitularApi.map((c) => c.id))
      const pareceListaInteira =
        cartoesCatalogo.length > 1 &&
        cartoesCatalogo.every((c) => idsApi.has(c.id)) &&
        cartoesDoTitularApi.length === cartoesCatalogo.length
      if (!pareceListaInteira) return mergeCartoes([cartoesDoTitularApi])
    }
    return doCatalogo
  }, [cartoesCatalogo, cartoesDoTitularApi, pessoaId, titular])

  const cartaoSel = cartoesFiltrados.find((c) => Number(c.id) === Number(cartaoId))
  const responsavelSel = responsaveis.find((r) => Number(r.id) === Number(responsavelId))
  const ehEu = isMeuResponsavelDisplay({
    responsavelId: responsavelId != null ? Number(responsavelId) : null,
    responsavelNome: responsavelSel?.nome,
    defaultResponsavelId,
  })

  const pessoasOptions: SelectOptions[] = pessoas.map(toPessoaSelectOption)
  const cartoesOptions: SelectOptions[] = cartoesFiltrados.map((c) => ({
    value: c.id,
    label: c.nome,
    cor_fundo: c.cor_fundo ?? null,
    cor_texto: c.cor_texto ?? null,
  }))

  const formKey = [
    cartaoId ?? '',
    responsavelId ?? '',
    valorCentavos,
    nParcelas,
    dataCompra ?? '',
    parcelasValores.join(','),
  ].join('|')

  const podeSimular =
    Number(cartaoId) > 0 &&
    Number(responsavelId) > 0 &&
    valorCentavos > 0 &&
    nParcelas >= 1 &&
    totaisBatem

  const overlayInput = useMemo(
    () =>
      montarParcelasSimuladas({
        valorCentavos,
        nParcelas,
        valoresManuaisCentavos:
          nParcelas > 1 && parcelasValores.length === nParcelas
            ? parcelasValores.map((v) => toCentavos(v))
            : undefined,
        dataISO: dataCompra,
        diaLimite: cartaoSel?.dia_limite_fatura ?? null,
        colunas: projecaoBase?.colunas || [],
      }),
    [valorCentavos, nParcelas, parcelasValores, dataCompra, cartaoSel?.dia_limite_fatura, projecaoBase]
  )

  const projecaoOverlay = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !podeSimular) return undefined
    return aplicarOverlaySimulacao(projecaoBase, {
      cartaoId: Number(cartaoId),
      responsavelId: Number(responsavelId),
      responsavelNome: responsavelSel?.nome || (ehEu ? 'Eu' : `Responsável #${responsavelId}`),
      ehEu,
      deltas: overlayInput.deltas,
    })
  }, [
    resultadoVisivel,
    projecaoBase,
    podeSimular,
    cartaoId,
    responsavelId,
    responsavelSel,
    ehEu,
    overlayInput.deltas,
  ])

  const impacto = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !cartaoId || !responsavelId) return null
    return calcularImpactoSimulacao({
      base: projecaoBase,
      overlay: projecaoOverlay,
      cartaoId: Number(cartaoId),
      responsavelId: Number(responsavelId),
      deltas: overlayInput.deltas,
      primeira: overlayInput.primeira,
    })
  }, [resultadoVisivel, projecaoBase, projecaoOverlay, cartaoId, responsavelId, overlayInput])

  const veredito = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !cartaoId) return null
    return calcularVereditoCompra({
      base: projecaoBase,
      overlay: projecaoOverlay,
      cartaoId: Number(cartaoId),
      cartaoNome: cartaoSel?.nome || '',
      nParcelas,
      valorCompra: valorCentavos / 100,
      overlayInput,
    })
  }, [
    resultadoVisivel,
    projecaoBase,
    projecaoOverlay,
    cartaoId,
    cartaoSel?.nome,
    nParcelas,
    valorCentavos,
    overlayInput,
  ])

  const idxBreakdown =
    overlayInput.primeira?.indice_coluna ?? projecaoBase?.colunas.findIndex((c) => c.referencia) ?? 0
  const breakdown = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !responsavelId || !cartaoId) return []
    return breakdownResponsavelPorCartao({
      overlay: projecaoOverlay,
      base: projecaoBase,
      responsavelId: Number(responsavelId),
      cartaoSimuladoId: Number(cartaoId),
      indice: idxBreakdown >= 0 ? idxBreakdown : 0,
    })
  }, [resultadoVisivel, projecaoBase, projecaoOverlay, responsavelId, cartaoId, idxBreakdown])

  const resolveDefaultResponsavel = useCallback(
    async (pessoa: PessoaListItem | undefined): Promise<number | null> => {
      if (!pessoa || pessoa.eh_principal) return defaultResponsavelId
      const id = pessoaIdOf(pessoa)
      let detalhe = pessoa
      if (id != null && pessoa.responsavel_id == null) {
        if (pessoasDetalheCache.current.has(id)) {
          detalhe = pessoasDetalheCache.current.get(id)!
        } else {
          try {
            const view = await pessoasService.getViewPessoas({ id })
            if (view) {
              detalhe = view
              pessoasDetalheCache.current.set(id, view)
            }
          } catch {
            // match por nome
          }
        }
      }
      return responsavelPadraoDoTitular({
        titular: pessoa,
        pessoasDetalhe: detalhe,
        defaultResponsavelId,
        responsaveis,
      })
    },
    [defaultResponsavelId, pessoasService, responsaveis]
  )

  useEffect(() => {
    setActiveMenu('/simulador')
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoadingLookups(true)
      try {
        const [pessoasList, lookups, cartoesList] = await Promise.all([
          pessoasService.AsyncListPessoas(),
          transacoesService.getLookupsTransacoes(),
          cartoesService.AsyncListCartoes({}),
        ])
        const pessoasNorm = pessoasList || []
        setPessoas(pessoasNorm)
        if (lookups?.responsaveis) setResponsaveis(lookups.responsaveis)
        if (lookups?.default_responsavel_id != null) {
          setDefaultResponsavelId(lookups.default_responsavel_id)
        }

        const fromList = normalizeCartoesList(cartoesList).map(toCartaoForm).filter((c): c is CartaoForm => c != null)
        const fromLookups = (lookups?.cartoes || []).map(toCartaoForm).filter((c): c is CartaoForm => c != null)
        setCartoesCatalogo(mergeCartoes([fromLookups, fromList]))
      } catch (error: any) {
        toast.error(error?.message || 'Erro ao carregar dados do simulador')
      } finally {
        setLoadingLookups(false)
      }
    }
    load()
  }, [pessoasService, transacoesService, cartoesService])

  useEffect(() => {
    if (defaultsApplied.current) return
    if (loadingLookups) return

    const run = async () => {
      const qPessoa = parseQueryNumber(searchParams.get('pessoa_id'))
      const qCartao = parseQueryNumber(searchParams.get('cartao_id'))
      const qResp = parseQueryNumber(searchParams.get('responsavel_id'))

      let pessoa =
        qPessoa != null ? pessoas.find((p) => Number(pessoaIdOf(p)) === qPessoa) : undefined
      if (!pessoa && qCartao != null) {
        const cartao = cartoesCatalogo.find((c) => Number(c.id) === qCartao)
        if (cartao?.pessoa_id != null) {
          pessoa = pessoas.find((p) => Number(pessoaIdOf(p)) === Number(cartao.pessoa_id))
        }
      }
      if (!pessoa) pessoa = titularPrincipal(pessoas)

      setValue('pessoa_id', pessoaIdOf(pessoa))

      const filtrada = filtrarCartoesDoTitular(
        cartoesCatalogo,
        pessoaIdOf(pessoa),
        Boolean(pessoa?.eh_principal)
      )
      const cartaoPreferido = qCartao ? filtrada.find((c) => Number(c.id) === qCartao) : undefined
      if (cartaoPreferido || filtrada[0]) {
        setValue('cartao_id', (cartaoPreferido || filtrada[0])?.id ?? null)
      }

      const respDefault = await resolveDefaultResponsavel(pessoa)
      const respExiste = qResp != null && responsaveis.some((r) => Number(r.id) === Number(qResp))
      if (qResp != null && !respExiste) {
        toast.error('Responsável não encontrado. Voltando ao padrão.')
      }
      if (!qResp || !respExiste) {
        setValue('responsavel_id', respExiste ? qResp : respDefault)
      }

      defaultsApplied.current = true
    }
    run()
  }, [
    loadingLookups,
    cartoesCatalogo,
    pessoas,
    responsaveis,
    searchParams,
    setValue,
    resolveDefaultResponsavel,
  ])

  useEffect(() => {
    const titularId = pessoaId != null && pessoaId !== '' ? Number(pessoaId) : null
    if (titularId == null || !Number.isFinite(titularId)) {
      setCartoesDoTitularApi([])
      setLoadingCartoesTitular(false)
      return
    }
    let cancelled = false
    setCartoesDoTitularApi([])
    setLoadingCartoesTitular(true)
    cartoesService
      .AsyncListCartoes({ pessoa_id: titularId })
      .then((list) => {
        if (cancelled) return
        const mapped = normalizeCartoesList(list)
          .map(toCartaoForm)
          .filter((c): c is CartaoForm => c != null)
        setCartoesDoTitularApi(mapped)
      })
      .catch(() => {
        if (!cancelled) setCartoesDoTitularApi([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCartoesTitular(false)
      })
    return () => {
      cancelled = true
    }
  }, [pessoaId, cartoesService])

  useEffect(() => {
    if (!defaultsApplied.current) return
    if (skipTitularEffect.current) {
      skipTitularEffect.current = false
      return
    }
    setValue('cartao_id', null)
    resolveDefaultResponsavel(titular).then((id) => setValue('responsavel_id', id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pessoaId])

  useEffect(() => {
    if (!defaultsApplied.current) return
    if (loadingCartoesTitular) return
    const atualOk = cartoesFiltrados.some((c) => Number(c.id) === Number(cartaoId))
    if (atualOk) return
    const qCartao = parseQueryNumber(searchParams.get('cartao_id'))
    const preferido =
      qCartao != null ? cartoesFiltrados.find((c) => Number(c.id) === qCartao) : undefined
    setValue('cartao_id', (preferido || cartoesFiltrados[0])?.id ?? null)
  }, [cartoesFiltrados, loadingCartoesTitular, cartaoId, searchParams, setValue])

  useEffect(() => {
    if (nParcelas <= 1) {
      setParcelasValores([])
      return
    }
    setParcelasValores(splitValorEmParcelas(valorCentavos, nParcelas))
  }, [valorCentavos, nParcelas])

  useEffect(() => {
    if (resultadoVisivel && formKeySimulado.current && formKeySimulado.current !== formKey) {
      setResultadoVisivel(false)
      setProjecaoBase(undefined)
    }
  }, [formKey, resultadoVisivel])

  const handleSimular = async () => {
    if (!podeSimular) {
      toast.warning('Preencha cartão, responsável, valor e parcelas para ver se a compra cabe.')
      return
    }
    const diaLimite = cartaoSel?.dia_limite_fatura ?? null
    const primeira = competenciaPrimeiraParcela(dataCompra, diaLimite)
    const now = new Date()
    const mes = primeira?.mes || now.getMonth() + 1
    const ano = primeira?.ano || now.getFullYear()

    setSimulando(true)
    try {
      const result = await projecaoService.getProjecaoFaturas({ mes, ano })
      const fromProj = (result?.por_cartao || []).find((c) => Number(c.cartao_id) === Number(cartaoId))
      if (fromProj?.dia_limite_fatura != null) {
        setCartoesCatalogo((prev) =>
          prev.map((c) =>
            Number(c.id) === Number(cartaoId)
              ? {
                  ...c,
                  dia_limite_fatura: fromProj.dia_limite_fatura ?? c.dia_limite_fatura,
                  dia_vencimento_fatura: fromProj.dia_vencimento_fatura ?? c.dia_vencimento_fatura,
                }
              : c
          )
        )
      }
      setProjecaoBase(result)
      formKeySimulado.current = formKey
      setResultadoVisivel(true)
      setVerTodos(false)
      setDetalhesAbertos(false)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao simular. Tente de novo.')
      setProjecaoBase(undefined)
      setResultadoVisivel(false)
    } finally {
      setSimulando(false)
    }
  }

  const scrollToColuna = (parcela: SimuladorParcela) => {
    const el = document.getElementById(`proj-cartao-col-${parcela.chave}`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const faturaPath =
    resultadoVisivel && responsavelId && (impacto?.competencia || overlayInput.primeira)
      ? `/projecao-faturas/responsaveis/${responsavelId}/fatura?mes=${
          overlayInput.primeira?.mes || impacto?.competencia?.mes
        }&ano=${overlayInput.primeira?.ano || impacto?.competencia?.ano}`
      : undefined
  const visualizarPath =
    resultadoVisivel && responsavelId && (impacto?.competencia || overlayInput.primeira)
      ? buildResponsavelVisualizarPath(
          Number(responsavelId),
          overlayInput.primeira?.mes || impacto?.competencia?.mes || new Date().getMonth() + 1,
          overlayInput.primeira?.ano || impacto?.competencia?.ano || new Date().getFullYear()
        )
      : undefined

  const registrarCompra = () => {
    if (!podeSimular || !cartaoId) {
      toast.warning('Simule a compra antes de registrar.')
      return
    }
    navigate('/transacoes/add', {
      state: {
        source: {
          cartao_id: Number(cartaoId),
          responsavel_id: responsavelId ? Number(responsavelId) : null,
          valor_compra: valorCompra,
          parcelas_total: nParcelas,
          data: dataCompra,
          parcelas:
            nParcelas > 1
              ? parcelasValores.map((valor, idx) => ({
                  parcela: idx + 1,
                  valor,
                }))
              : undefined,
        },
        returnTo: `/simulador${window.location.search || ''}`,
      },
    })
  }

  const novaSimulacao = () => {
    setResultadoVisivel(false)
    setProjecaoBase(undefined)
    setVerTodos(false)
    setDetalhesAbertos(false)
    formKeySimulado.current = null
  }

  const valorParcela = overlayInput.primeira?.valor ?? (nParcelas > 0 ? valorCentavos / 100 / nParcelas : 0)
  const competenciaMes = overlayInput.primeira?.mes ?? impacto?.competencia?.mes
  const competenciaAno = overlayInput.primeira?.ano ?? impacto?.competencia?.ano
  const competenciaLabel =
    competenciaMes && competenciaAno ? labelCompetenciaCompleta(competenciaMes, competenciaAno) : ''
  const competenciaCurta =
    competenciaMes && competenciaAno ? labelCompetencia(competenciaMes, competenciaAno) : ''

  const formEl = (
    <SimuladorCompraForm
      register={register}
      control={control}
      showTitular={showTitular}
      pessoasOptions={pessoasOptions}
      cartoesOptions={cartoesOptions}
      semCartoes={!loadingLookups && !loadingCartoesTitular && cartoesFiltrados.length === 0}
      compact={resultadoVisivel || simulando}
      responsavelNome={responsavelSel?.nome || ''}
      isMeuResponsavel={ehEu}
      dataAberta={dataAberta}
      onToggleData={() => setDataAberta((v) => !v)}
      onTrocarResponsavel={() => setResponsavelModalOpen(true)}
      onSimular={handleSimular}
      onNovaSimulacao={novaSimulacao}
      podeSimular={podeSimular}
      simulando={simulando}
    />
  )

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <UiContent />
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Link to="/dashboard" className="me-2">
                    <i className="bx bx-arrow-back bx-sm"></i>
                  </Link>
                  <div>
                    <h4 className="mb-0">Posso comprar?</h4>
                    <p className="text-muted mb-0 fs-13">
                      Informe o valor e as parcelas. O sistema olha as próximas faturas e diz se a
                      compra cabe.
                    </p>
                  </div>
                </div>
                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                  <BreadcrumbItem>
                    <Link to="/dashboard">
                      <i className="ri-home-5-fill"></i>
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active>Posso comprar?</BreadcrumbItem>
                </Breadcrumb>
              </div>
            </Col>
          </Row>

          {loadingLookups ? (
            <Row className="justify-content-center">
              <Col lg={7} xl={6}>
                <div className="card">
                  <div className="card-body p-4">
                    <div className="placeholder-glow">
                      <span className="placeholder col-4 mb-3"></span>
                      <span className="placeholder col-12 mb-2"></span>
                      <span className="placeholder col-12 mb-2"></span>
                      <span className="placeholder col-8 mb-2"></span>
                      <span className="placeholder col-5"></span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          ) : resultadoVisivel || simulando ? (
            <>
              {formEl}
              <Row className="justify-content-center">
                <Col lg={7} xl={6}>
                  {simulando ? (
                    <SimuladorCompraVereditoSkeleton />
                  ) : veredito ? (
                    <SimuladorCompraVeredito
                      veredito={veredito}
                      valorParcela={valorParcela}
                      competenciaLabel={competenciaLabel}
                    />
                  ) : null}
                  {!simulando && resultadoVisivel && (
                    <>
                      <SimuladorCompraImpacto
                        impacto={impacto}
                        valorParcela={valorParcela}
                        competenciaCurta={competenciaCurta}
                        responsavelNome={responsavelSel?.nome || ''}
                        ehEu={ehEu}
                      />
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        <button type="button" className="btn btn-outline-primary" onClick={registrarCompra}>
                          <i className="ri-save-3-line me-1"></i>
                          Registrar esta compra
                        </button>
                        <button type="button" className="btn btn-ghost-secondary" onClick={novaSimulacao}>
                          Nova simulação
                        </button>
                      </div>
                    </>
                  )}
                </Col>
              </Row>
              {!simulando && resultadoVisivel && (
                <SimuladorCompraDetalhes
                  aberto={detalhesAbertos}
                  onToggle={() => setDetalhesAbertos((v) => !v)}
                  impacto={impacto}
                  cartaoNome={cartaoSel?.nome || ''}
                  competenciaLabel={competenciaLabel}
                  valorParcela={valorParcela}
                  alertaLimite={Number(impacto?.fatura_cartao.percentual_em_uso_depois) > 80}
                  parcelasFora={overlayInput.parcelas_fora_da_janela}
                  labelFimJanela={
                    projecaoBase?.colunas?.[projecaoBase.colunas.length - 1]?.label || 'o fim da janela'
                  }
                  parcelas={overlayInput.parcelas}
                  onSelectParcela={scrollToColuna}
                  verTodos={verTodos}
                  onVerTodos={setVerTodos}
                  overlay={projecaoOverlay}
                  cartaoId={cartaoId}
                  responsavelId={responsavelId}
                  ehEu={ehEu}
                  responsavelNome={responsavelSel?.nome || ''}
                  breakdown={breakdown}
                  faturaPath={faturaPath}
                  visualizarPath={visualizarPath}
                />
              )}
            </>
          ) : (
            <Row className="justify-content-center">
              <Col lg={7} xl={6}>
                {formEl}
                <p className="text-muted text-center fs-13 mt-4 mb-0">
                  Escolha o cartão, o responsável, o valor e as parcelas para ver se a compra
                  cabe.
                </p>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      <ResponsavelModal
        isOpen={responsavelModalOpen}
        toggle={() => setResponsavelModalOpen(false)}
        responsaveis={responsaveis}
        currentResponsavelId={responsavelId}
        onConfirm={(responsavel) => {
          if (responsavel.id != null) setValue('responsavel_id', Number(responsavel.id))
          setResponsavelModalOpen(false)
        }}
        onResponsaveisChange={setResponsaveis}
      />
    </React.Fragment>
  )
}

export default SimuladorCompraPage
