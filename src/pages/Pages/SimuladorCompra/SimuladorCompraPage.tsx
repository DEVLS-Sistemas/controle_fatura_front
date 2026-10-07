import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, Button, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AccessDeniedError } from 'libs/api/exceptions/AccessDeniedError'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import UiContent from 'Components/Common/UiContent'
import { setActiveMenu } from 'helpers/system_helpers'
import { centavosToBr, isMeuResponsavelDisplay, splitValorEmParcelas, toCentavos } from 'helpers/fatura_helpers'
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
import {
  SimulacaoLoteItem,
  SimuladorCompraFormValues,
  SimuladorOverlayResult,
  SimuladorParcela,
  SimuladorVeredito,
} from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import {
  bandeiraEscolhida,
  bandeirasAtivasDoCartao,
  BandeiraAtiva,
  bloqueioTamanhoLote,
  cartaoExigeBandeira,
  concluirEstaHabilitado,
  DestinoFaturaCartao,
  destinosFaturaDoLote,
  indiceErroLote,
  MENSAGEM_BANDEIRA_FATURA,
  mensagemSucessoLote,
  montarPayloadLote,
  primeiroIndiceSemBandeira,
  textoConfirmacaoLote,
} from 'helpers/simulador_lote_helpers'
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
  LinhaCompraVeredito,
  SimuladorCompraVereditoSkeleton,
} from './SimuladorCompraVeredito/SimuladorCompraVeredito'
import SimuladorListaSomadas from './SimuladorListaSomadas/SimuladorListaSomadas'

const BANDEIRAS_VAZIAS: BandeiraAtiva[] = []

type CartaoForm = {
  id: number
  nome: string
  cor_fundo?: string | null
  cor_texto?: string | null
  dia_limite_fatura?: number | null
  dia_vencimento_fatura?: number | null
  pessoa_id?: number | null
  pessoa_nome?: string | null
  bandeiras: BandeiraAtiva[]
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
    bandeiras: bandeirasAtivasDoCartao(raw.bandeiras),
  }
}

const chaveNomeCartao = (nome: string): string => nome.trim().toLocaleLowerCase('pt-BR')

const mergeCartoes = (listas: Array<CartaoForm[] | undefined>): CartaoForm[] => {
  const byId = new Map<number, CartaoForm>()
  const byNome = new Map<string, number>()
  listas.forEach((lista) => {
    (lista || []).forEach((c) => {
      const chave = chaveNomeCartao(c.nome)
      const idPeloNome = chave ? byNome.get(chave) : undefined
      const prev = byId.get(c.id) ?? (idPeloNome != null ? byId.get(idPeloNome) : undefined)
      if (!prev) {
        byId.set(c.id, c)
        if (chave) byNome.set(chave, c.id)
        return
      }
      const merged: CartaoForm = {
        ...prev,
        ...c,
        id: prev.id,
        nome: prev.nome || c.nome,
        pessoa_id: c.pessoa_id ?? prev.pessoa_id ?? null,
        pessoa_nome: c.pessoa_nome || prev.pessoa_nome,
        dia_limite_fatura: c.dia_limite_fatura ?? prev.dia_limite_fatura ?? null,
        cor_fundo: c.cor_fundo || prev.cor_fundo,
        cor_texto: c.cor_texto || prev.cor_texto,
        bandeiras: c.bandeiras.length > 0 ? c.bandeiras : prev.bandeiras,
      }
      byId.set(prev.id, merged)
      if (c.id !== prev.id) byId.delete(c.id)
      if (chave) byNome.set(chave, prev.id)
    })
  })
  return Array.from(byId.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

const mesclarOverlays = (partes: SimuladorOverlayResult[]): SimuladorOverlayResult => {
  const n = Math.max(0, ...partes.map((parte) => parte.deltas.length))
  const deltas = Array.from({ length: n }, (_, indice) =>
    partes.reduce((acc, parte) => acc + Number(parte.deltas[indice] || 0), 0)
  )
  const parcelas = partes.flatMap((parte) => parte.parcelas)
  const ordenadas = [...parcelas].sort((a, b) => a.ano - b.ano || a.mes - b.mes || a.parcela - b.parcela)
  const fora = parcelas.filter((parcela) => !parcela.na_janela).length
  return {
    deltas,
    parcelas,
    parcelas_na_janela: parcelas.length - fora,
    parcelas_fora_da_janela: fora,
    primeira: ordenadas[0] || null,
    ultima: ordenadas[ordenadas.length - 1] || null,
    totais_batem: true,
  }
}

const unirVereditos = (vereditos: SimuladorVeredito[]): SimuladorVeredito | null => {
  if (!vereditos.length) return null
  if (vereditos.length === 1) return vereditos[0]
  const peso = { baixo: 0, moderado: 1, alto: 2 }
  const pior = vereditos.reduce((atual, proximo) => (peso[proximo.nivel] > peso[atual.nivel] ? proximo : atual))
  const porIndice = new Map<number, SimuladorVeredito['meses'][number]>()
  vereditos.forEach((veredito) => {
    veredito.meses.forEach((mes) => {
      const previo = porIndice.get(mes.indice)
      if (!previo || mes.score > previo.score) porIndice.set(mes.indice, mes)
    })
  })
  return {
    ...pior,
    meses: Array.from(porIndice.values()).sort((a, b) => a.indice - b.indice),
  }
}

const SimuladorCompraPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { register, control, watch, setValue, getValues } = useForm<SimuladorCompraFormValues>({
    defaultValues: {
      pessoa_id: null,
      cartao_id: parseQueryNumber(searchParams.get('cartao_id')),
      cartao_bandeira_id: null,
      responsavel_id: parseQueryNumber(searchParams.get('responsavel_id')),
      valor_compra: parseValorQuery(searchParams.get('valor')),
      parcelas_total: parseQueryNumber(searchParams.get('parcelas')) || 1,
      data: searchParams.get('data') || todayISO(),
      observacoes: '',
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
  const [responsaveis, setResponsaveis] = useState<ResponsavelLookup[]>([])
  const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
  const [parcelasValores, setParcelasValores] = useState<string[]>([])
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
  const [dataAberta, setDataAberta] = useState(false)
  const [verTodos, setVerTodos] = useState(false)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [itensLote, setItensLote] = useState<SimulacaoLoteItem[]>([])
  const [indiceInvalido, setIndiceInvalido] = useState<number | null>(null)
  const [mensagemIndiceInvalido, setMensagemIndiceInvalido] = useState<string | null>(null)
  const [observacoesInvalida, setObservacoesInvalida] = useState(false)
  const [bandeiraInvalida, setBandeiraInvalida] = useState(false)
  const [confirmacaoLoteAberta, setConfirmacaoLoteAberta] = useState(false)
  const [gravandoLote, setGravandoLote] = useState(false)
  const [modalSimulacaoAberto, setModalSimulacaoAberto] = useState(false)
  const [indiceEdicao, setIndiceEdicao] = useState<number | null>(null)
  const [destinosFatura, setDestinosFatura] = useState<DestinoFaturaCartao[] | null>(null)

  const defaultsApplied = useRef(false)
  const skipTitularEffect = useRef(true)
  const restaurandoItem = useRef(false)
  const parcelasRestauradas = useRef<string[] | null>(null)
  const cartaoRestaurado = useRef<number | null>(null)
  const pessoasDetalheCache = useRef<Map<number, PessoaListItem>>(new Map())

  const pessoasService = useRef(new PessoasService()).current
  const cartoesService = useRef(new CartoesService()).current
  const projecaoService = useRef(new ProjecaoFaturasService()).current
  const transacoesService = useRef(new TransacoesService()).current

  const pessoaId = watch('pessoa_id')
  const cartaoId = watch('cartao_id')
  const bandeiraId = watch('cartao_bandeira_id')
  const responsavelId = watch('responsavel_id')
  const valorCompra = watch('valor_compra')
  const parcelasTotal = watch('parcelas_total')
  const dataCompra = watch('data')
  const observacoes = watch('observacoes')

  const nParcelas = Math.max(1, Math.min(36, Number(parcelasTotal) || 1))
  const valorCentavos = toCentavos(valorCompra)
  const totaisBatem =
    nParcelas <= 1 || somaParcelasBate(parcelasValores.map((v) => toCentavos(v)), valorCentavos)

  const titular = pessoas.find((p) => Number(pessoaIdOf(p)) === Number(pessoaId))
  const showTitular = pessoas.length > 1

  const cartaoSel = cartoesCatalogo.find((c) => Number(c.id) === Number(cartaoId))
  const bandeirasDoCartao = (id: number): readonly BandeiraAtiva[] =>
    cartoesCatalogo.find((cartao) => Number(cartao.id) === Number(id))?.bandeiras ?? []
  const bandeirasDoForm = cartaoSel?.bandeiras ?? BANDEIRAS_VAZIAS
  const exibeBandeira = cartaoExigeBandeira(bandeirasDoForm)
  const bandeiraOptions: SelectOptions[] = bandeirasDoForm.map((bandeira) => ({
    value: bandeira.id,
    label: bandeira.bandeira,
    cor_principal: bandeira.cor_principal,
    cor_secundaria: bandeira.cor_secundaria,
  }))
  const responsavelSel = responsaveis.find((r) => Number(r.id) === Number(responsavelId))
  const ehEu = isMeuResponsavelDisplay({
    responsavelId: responsavelId != null ? Number(responsavelId) : null,
    responsavelNome: responsavelSel?.nome,
    defaultResponsavelId,
  })

  const pessoasOptions: SelectOptions[] = pessoas.map(toPessoaSelectOption)
  const cartoesOptions: SelectOptions[] = cartoesCatalogo.map((c) => ({
    value: c.id,
    label: c.nome,
    cor_fundo: c.cor_fundo ?? null,
    cor_texto: c.cor_texto ?? null,
  }))

  const podeSimular =
    Number(cartaoId) > 0 &&
    Number(responsavelId) > 0 &&
    valorCentavos > 0 &&
    nParcelas >= 1 &&
    totaisBatem

  const entradasLote = useMemo(() => {
    const colunas = projecaoBase?.colunas || []
    return itensLote.map((item) => ({
      item,
      parcelas: montarParcelasSimuladas({
        valorCentavos: toCentavos(item.valor_compra),
        nParcelas: item.parcelas_total,
        valoresManuaisCentavos:
          item.parcelas && item.parcelas.length === item.parcelas_total
            ? item.parcelas.map((parcela) => toCentavos(parcela.valor))
            : undefined,
        dataISO: item.data,
        diaLimite: item.dia_limite_fatura ?? null,
        colunas,
      }),
    }))
  }, [itensLote, projecaoBase])

  const overlayConjunto = useMemo(
    () => (entradasLote.length ? mesclarOverlays(entradasLote.map((entrada) => entrada.parcelas)) : null),
    [entradasLote]
  )

  const projecaoOverlay = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !entradasLote.length) return undefined
    return entradasLote.reduce((view, entrada) => {
      const respId = entrada.item.responsavel_id != null ? Number(entrada.item.responsavel_id) : 0
      return aplicarOverlaySimulacao(view, {
        cartaoId: entrada.item.cartao_id,
        responsavelId: respId,
        responsavelNome: entrada.item.responsavel_nome || (respId ? `Responsável #${respId}` : 'Eu'),
        ehEu: isMeuResponsavelDisplay({
          responsavelId: entrada.item.responsavel_id ?? null,
          responsavelNome: entrada.item.responsavel_nome,
          defaultResponsavelId,
        }),
        deltas: entrada.parcelas.deltas,
      })
    }, projecaoBase)
  }, [resultadoVisivel, projecaoBase, entradasLote, defaultResponsavelId])

  const foco = itensLote[0]
  const focoResponsavelId = foco?.responsavel_id != null ? Number(foco.responsavel_id) : 0
  const focoCartaoId = foco ? Number(foco.cartao_id) : 0
  const ehEuFoco = foco
    ? isMeuResponsavelDisplay({
        responsavelId: foco.responsavel_id ?? null,
        responsavelNome: foco.responsavel_nome,
        defaultResponsavelId,
      })
    : false

  const impacto = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !foco || !overlayConjunto) return null
    const deltasPessoa = mesclarOverlays(
      entradasLote
        .filter((entrada) => Number(entrada.item.responsavel_id) === focoResponsavelId)
        .map((entrada) => entrada.parcelas)
    ).deltas
    const deltasCartao = mesclarOverlays(
      entradasLote
        .filter((entrada) => Number(entrada.item.cartao_id) === focoCartaoId)
        .map((entrada) => entrada.parcelas)
    ).deltas
    const doCartao = calcularImpactoSimulacao({
      base: projecaoBase,
      overlay: projecaoOverlay,
      cartaoId: focoCartaoId,
      responsavelId: focoResponsavelId,
      deltas: deltasCartao,
      primeira: overlayConjunto.primeira,
    })
    const daPessoa = calcularImpactoSimulacao({
      base: projecaoBase,
      overlay: projecaoOverlay,
      cartaoId: focoCartaoId,
      responsavelId: focoResponsavelId,
      deltas: deltasPessoa,
      primeira: overlayConjunto.primeira,
    })
    return {
      ...doCartao,
      geral_responsavel: daPessoa.geral_responsavel,
      soma_janela_geral: daPessoa.soma_janela_geral,
    }
  }, [
    resultadoVisivel,
    projecaoBase,
    projecaoOverlay,
    foco,
    focoCartaoId,
    focoResponsavelId,
    overlayConjunto,
    entradasLote,
  ])

  const veredito = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !entradasLote.length) return null
    const grupos = new Map<number, typeof entradasLote>()
    entradasLote.forEach((entrada) => {
      const lista = grupos.get(entrada.item.cartao_id) || []
      lista.push(entrada)
      grupos.set(entrada.item.cartao_id, lista)
    })
    const vereditos = Array.from(grupos.values())
      .map((grupo) => {
        const overlayGrupo = mesclarOverlays(grupo.map((entrada) => entrada.parcelas))
        const valor = grupo.reduce((acc, entrada) => acc + toCentavos(entrada.item.valor_compra), 0) / 100
        const calculado = calcularVereditoCompra({
          base: projecaoBase,
          overlay: projecaoOverlay,
          cartaoId: grupo[0].item.cartao_id,
          cartaoNome: grupo[0].item.cartao_nome || '',
          nParcelas: Math.max(...grupo.map((entrada) => entrada.item.parcelas_total)),
          valorCompra: valor,
          overlayInput: overlayGrupo,
        })
        return calculado
      })
      .filter((item): item is SimuladorVeredito => Boolean(item))
    return unirVereditos(vereditos)
  }, [resultadoVisivel, projecaoBase, projecaoOverlay, entradasLote])

  const idxBreakdown =
    overlayConjunto?.primeira?.indice_coluna ??
    projecaoBase?.colunas.findIndex((c) => c.referencia) ??
    0
  const breakdown = useMemo(() => {
    if (!resultadoVisivel || !projecaoBase || !projecaoOverlay || !foco) return []
    return breakdownResponsavelPorCartao({
      overlay: projecaoOverlay,
      base: projecaoBase,
      responsavelId: focoResponsavelId,
      cartaoSimuladoId: focoCartaoId,
      cartoesSimulados: itensLote.map((item) => item.cartao_id),
      indice: idxBreakdown >= 0 ? idxBreakdown : 0,
    })
  }, [
    resultadoVisivel,
    projecaoBase,
    projecaoOverlay,
    foco,
    focoResponsavelId,
    focoCartaoId,
    itensLote,
    idxBreakdown,
  ])

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
    if (!defaultsApplied.current) return
    if (skipTitularEffect.current) {
      skipTitularEffect.current = false
      return
    }
    if (restaurandoItem.current) {
      restaurandoItem.current = false
      return
    }
    cartaoRestaurado.current = null
    resolveDefaultResponsavel(titular).then((id) => setValue('responsavel_id', id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pessoaId])

  useEffect(() => {
    if (!defaultsApplied.current) return
    if (cartaoId == null || cartaoId === '') return
    if (cartaoRestaurado.current != null) {
      const restaurado = cartoesCatalogo.find((c) => Number(c.id) === cartaoRestaurado.current)
      if (restaurado) {
        setValue('cartao_id', restaurado.id)
        cartaoRestaurado.current = null
      }
      return
    }
    const atualOk = cartoesCatalogo.some((c) => Number(c.id) === Number(cartaoId))
    if (atualOk) return
    const qCartao = parseQueryNumber(searchParams.get('cartao_id'))
    const preferido =
      qCartao != null ? cartoesCatalogo.find((c) => Number(c.id) === qCartao) : undefined
    setValue('cartao_id', (preferido || cartoesCatalogo[0])?.id ?? null)
  }, [cartoesCatalogo, cartaoId, searchParams, setValue])

  useEffect(() => {
    if (nParcelas <= 1) {
      setParcelasValores([])
      return
    }
    if (parcelasRestauradas.current && parcelasRestauradas.current.length === nParcelas) {
      setParcelasValores(parcelasRestauradas.current)
      parcelasRestauradas.current = null
      return
    }
    setParcelasValores(splitValorEmParcelas(valorCentavos, nParcelas))
  }, [valorCentavos, nParcelas])

  useEffect(() => {
    if (String(observacoes || '').trim()) setObservacoesInvalida(false)
  }, [observacoes])

  useEffect(() => {
    if (bandeiraEscolhida(bandeirasDoForm, bandeiraId)) setBandeiraInvalida(false)
  }, [bandeiraId, bandeirasDoForm])

  useEffect(() => {
    if (!cartaoExigeBandeira(bandeirasDoForm)) {
      if (bandeiraId != null && bandeiraId !== '') setValue('cartao_bandeira_id', null)
      setBandeiraInvalida(false)
      return
    }
    if (bandeiraId != null && bandeiraId !== '' && !bandeiraEscolhida(bandeirasDoForm, bandeiraId)) {
      setValue('cartao_bandeira_id', null)
    }
  }, [cartaoId, bandeirasDoForm, bandeiraId, setValue])

  const marcarIndiceInvalido = (indice: number | null, message: string | null) => {
    setIndiceInvalido(indice)
    setMensagemIndiceInvalido(
      indice != null && message === MENSAGEM_BANDEIRA_FATURA ? `${message}. Use Editar.` : message
    )
  }

  const faltaBandeiraNoForm = (): boolean =>
    cartaoExigeBandeira(bandeirasDoForm) && bandeiraEscolhida(bandeirasDoForm, getValues('cartao_bandeira_id')) == null

  const handleSimular = async () => {
    if (!String(getValues('observacoes') || '').trim()) {
      setObservacoesInvalida(true)
      return
    }
    if (faltaBandeiraNoForm()) {
      setBandeiraInvalida(true)
      return
    }
    if (!podeSimular) {
      toast.warning('Preencha cartão, responsável, valor e parcelas para ver se a compra cabe.')
      return
    }
    const item = itemDaVez()
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
      setItensLote([item])
      marcarIndiceInvalido(null, null)
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
    resultadoVisivel && focoResponsavelId && (impacto?.competencia || overlayConjunto?.primeira)
      ? `/projecao-faturas/responsaveis/${focoResponsavelId}/fatura?mes=${
          overlayConjunto?.primeira?.mes || impacto?.competencia?.mes
        }&ano=${overlayConjunto?.primeira?.ano || impacto?.competencia?.ano}`
      : undefined
  const visualizarPath =
    resultadoVisivel && focoResponsavelId && (impacto?.competencia || overlayConjunto?.primeira)
      ? buildResponsavelVisualizarPath(
          focoResponsavelId,
          overlayConjunto?.primeira?.mes || impacto?.competencia?.mes || new Date().getMonth() + 1,
          overlayConjunto?.primeira?.ano || impacto?.competencia?.ano || new Date().getFullYear()
        )
      : undefined

  const esconderVeredito = () => {
    setResultadoVisivel(false)
    setProjecaoBase(undefined)
    setVerTodos(false)
    setDetalhesAbertos(false)
    setModalSimulacaoAberto(false)
    setIndiceEdicao(null)
  }

  const limparCamposForm = async () => {
    cartaoRestaurado.current = null
    parcelasRestauradas.current = null
    setValue('observacoes', '')
    setValue('valor_compra', '')
    setValue('parcelas_total', 1)
    setValue('data', todayISO())
    setDataAberta(false)
    setObservacoesInvalida(false)
    const principal = titularPrincipal(pessoas)
    if (principal && Number(pessoaIdOf(principal)) !== Number(pessoaId)) {
      restaurandoItem.current = true
      setValue('pessoa_id', pessoaIdOf(principal))
    }
    const resp = await resolveDefaultResponsavel(principal)
    setValue('responsavel_id', resp)
    setValue('cartao_id', null)
    setValue('cartao_bandeira_id', null)
    setBandeiraInvalida(false)
  }

  const resetarFormDaVez = async () => {
    esconderVeredito()
    await limparCamposForm()
  }

  const itemDaVez = (): SimulacaoLoteItem => {
    const iguais = splitValorEmParcelas(valorCentavos, nParcelas)
    const ajustadas =
      nParcelas > 1 &&
      parcelasValores.length === nParcelas &&
      parcelasValores.some((valor, idx) => toCentavos(valor) !== toCentavos(iguais[idx]))
    const item: SimulacaoLoteItem = {
      observacoes: String(getValues('observacoes') || '').trim(),
      valor_compra: centavosToBr(valorCentavos),
      data: dataCompra || todayISO(),
      cartao_id: Number(cartaoId),
      cartao_nome: cartaoSel?.nome,
      pessoa_id: pessoaId != null && pessoaId !== '' ? Number(pessoaId) : null,
      dia_limite_fatura: cartaoSel?.dia_limite_fatura ?? null,
      responsavel_nome: responsavelSel?.nome || null,
      parcelas_total: nParcelas,
      responsavel_id: responsavelId ? Number(responsavelId) : null,
    }
    const escolhida = bandeiraEscolhida(bandeirasDoForm, getValues('cartao_bandeira_id'))
    if (escolhida) {
      item.cartao_bandeira_id = escolhida.id
      item.bandeira_nome = escolhida.bandeira
    }
    if (ajustadas) {
      item.parcelas = parcelasValores.map((valor, idx) => ({
        parcela: idx + 1,
        valor,
      }))
    }
    return item
  }

  const podeIncluir = itensLote.length < 20
  const acaoHabilitada = concluirEstaHabilitado(gravandoLote, veredito?.nivel)

  const preencherForm = (item: SimulacaoLoteItem) => {
    if (Number(item.pessoa_id) !== Number(pessoaId)) restaurandoItem.current = true
    cartaoRestaurado.current = item.cartao_id
    parcelasRestauradas.current =
      item.parcelas && item.parcelas.length === item.parcelas_total
        ? item.parcelas.map((parcela) => String(parcela.valor))
        : null
    setValue('pessoa_id', item.pessoa_id ?? null)
    setValue('cartao_id', item.cartao_id)
    setValue('cartao_bandeira_id', item.cartao_bandeira_id ?? null)
    setValue('responsavel_id', item.responsavel_id ?? null)
    setValue('valor_compra', item.valor_compra)
    setValue('parcelas_total', item.parcelas_total)
    setValue('data', item.data)
    setValue('observacoes', item.observacoes)
    setDataAberta(true)
    setObservacoesInvalida(false)
    setBandeiraInvalida(false)
  }

  const abrirIncluir = () => {
    if (!podeIncluir || gravandoLote) return
    setIndiceEdicao(null)
    setObservacoesInvalida(false)
    setBandeiraInvalida(false)
    setModalSimulacaoAberto(true)
    void limparCamposForm()
  }

  const abrirEdicao = (indice: number) => {
    const item = itensLote[indice]
    if (!item || gravandoLote) return
    preencherForm(item)
    const bandeiras = bandeirasDoCartao(item.cartao_id)
    setBandeiraInvalida(
      cartaoExigeBandeira(bandeiras) && bandeiraEscolhida(bandeiras, item.cartao_bandeira_id) == null
    )
    setIndiceEdicao(indice)
    setModalSimulacaoAberto(true)
  }

  const fecharModalSimulacao = () => {
    if (gravandoLote) return
    setModalSimulacaoAberto(false)
    setIndiceEdicao(null)
    setObservacoesInvalida(false)
    setBandeiraInvalida(false)
  }

  const salvarModal = () => {
    if (!String(getValues('observacoes') || '').trim()) {
      setObservacoesInvalida(true)
      return
    }
    if (faltaBandeiraNoForm()) {
      setBandeiraInvalida(true)
      return
    }
    if (!podeSimular) {
      toast.warning('Preencha cartão, responsável, valor e parcelas para ver se a compra cabe.')
      return
    }
    const item = itemDaVez()
    if (indiceEdicao != null) {
      setItensLote((atual) => atual.map((existente, idx) => (idx === indiceEdicao ? item : existente)))
    } else {
      if (itensLote.length >= 20) {
        toast.error(bloqueioTamanhoLote(21) || '')
        return
      }
      setItensLote((atual) => [...atual, item])
    }
    marcarIndiceInvalido(null, null)
    setModalSimulacaoAberto(false)
    setIndiceEdicao(null)
    setObservacoesInvalida(false)
    setBandeiraInvalida(false)
  }

  const removerItemLote = (indice: number) => {
    const proximos = itensLote.filter((_, idx) => idx !== indice)
    setItensLote(proximos)
    marcarIndiceInvalido(null, null)
    if (!proximos.length) {
      setResultadoVisivel(false)
      setProjecaoBase(undefined)
      setModalSimulacaoAberto(false)
      setIndiceEdicao(null)
    }
  }

  const abrirConfirmacaoLote = () => {
    if (gravandoLote) return
    const bloqueio = bloqueioTamanhoLote(itensLote.length)
    if (bloqueio) {
      toast.error(bloqueio)
      return
    }
    const semBandeira = primeiroIndiceSemBandeira(itensLote, bandeirasDoCartao)
    if (semBandeira) {
      toast.error(semBandeira.message)
      marcarIndiceInvalido(semBandeira.indice, semBandeira.message)
      return
    }
    if (faltaBandeiraNoForm() && modalSimulacaoAberto) {
      setBandeiraInvalida(true)
      return
    }
    setConfirmacaoLoteAberta(true)
  }

  const limparConjunto = () => {
    setItensLote([])
    marcarIndiceInvalido(null, null)
    setObservacoesInvalida(false)
    setBandeiraInvalida(false)
    setConfirmacaoLoteAberta(false)
    setModalSimulacaoAberto(false)
    setIndiceEdicao(null)
    void resetarFormDaVez()
  }

  const confirmarLote = async () => {
    if (gravandoLote) return
    const paraGravar = [...itensLote]
    const bloqueio = bloqueioTamanhoLote(paraGravar.length)
    if (bloqueio) {
      toast.error(bloqueio)
      setConfirmacaoLoteAberta(false)
      return
    }
    const semBandeira = primeiroIndiceSemBandeira(paraGravar, bandeirasDoCartao)
    if (semBandeira) {
      toast.error(semBandeira.message)
      setConfirmacaoLoteAberta(false)
      marcarIndiceInvalido(semBandeira.indice, semBandeira.message)
      return
    }
    try {
      setGravandoLote(true)
      const body = await transacoesService.cadastrarLote(
        montarPayloadLote(paraGravar, bandeirasDoCartao).compras
      )
      const gravadas = Array.isArray(body?.compras) ? body.compras.length : paraGravar.length
      toast.success(mensagemSucessoLote(gravadas))
      setConfirmacaoLoteAberta(false)
      setDestinosFatura(destinosFaturaDoLote(body))
    } catch (error: unknown) {
      if (error instanceof AccessDeniedError) {
        setConfirmacaoLoteAberta(false)
        return
      }
      if (error instanceof ValidationError) {
        const indice = indiceErroLote(error.errors)
        toast.error(error.message)
        setConfirmacaoLoteAberta(false)
        marcarIndiceInvalido(indice, error.message)
        if (
          indice != null &&
          error.message === MENSAGEM_BANDEIRA_FATURA &&
          indiceEdicao === indice
        ) {
          setBandeiraInvalida(true)
        }
        return
      }
      const message = error instanceof Error ? error.message : 'Erro ao finalizar as compras.'
      toast.error(message)
    } finally {
      setGravandoLote(false)
    }
  }

  const iniciarNovaSimulacao = () => {
    setDestinosFatura(null)
    limparConjunto()
  }

  const abrirFaturaDoCartao = (destino: DestinoFaturaCartao) => {
    navigate(`/faturas/view/${destino.faturaId}`)
  }

  const idxParcela =
    overlayConjunto?.primeira?.indice_coluna != null && overlayConjunto.primeira.indice_coluna >= 0
      ? overlayConjunto.primeira.indice_coluna
      : 0
  const valorParcela =
    overlayConjunto?.deltas[idxParcela] ??
    overlayConjunto?.primeira?.valor ??
    0
  const competenciaMes = overlayConjunto?.primeira?.mes ?? impacto?.competencia?.mes
  const competenciaAno = overlayConjunto?.primeira?.ano ?? impacto?.competencia?.ano
  const competenciaLabel =
    competenciaMes && competenciaAno ? labelCompetenciaCompleta(competenciaMes, competenciaAno) : ''
  const competenciaCurta =
    competenciaMes && competenciaAno ? labelCompetencia(competenciaMes, competenciaAno) : ''
  const linhasCompras: LinhaCompraVeredito[] =
    entradasLote.length > 1
      ? entradasLote.map((entrada) => {
          const idx = overlayConjunto?.primeira?.indice_coluna
          const entra =
            idx != null && idx >= 0
              ? Number(entrada.parcelas.deltas[idx] || 0)
              : Number(entrada.parcelas.primeira?.valor || 0)
          const parcelas = entrada.item.parcelas_total > 1 ? `${entrada.item.parcelas_total}x` : 'à vista'
          const cartao = entrada.item.cartao_nome || ''
          return {
            descricao: entrada.item.observacoes || '—',
            detalhe: cartao ? `${parcelas} · ${cartao}` : parcelas,
            valor: toCentavos(entrada.item.valor_compra) / 100,
            entra,
          }
        })
      : []

  const renderForm = (aoSimular: () => void) => (
    <SimuladorCompraForm
      register={register}
      control={control}
      showTitular={showTitular}
      pessoasOptions={pessoasOptions}
      cartoesOptions={cartoesOptions}
      exibeBandeira={exibeBandeira}
      bandeiraOptions={bandeiraOptions}
      bandeiraInvalida={bandeiraInvalida}
      semCartoes={!loadingLookups && cartoesCatalogo.length === 0}
      compact={false}
      responsavelNome={responsavelSel?.nome || ''}
      isMeuResponsavel={ehEu}
      dataAberta={dataAberta}
      onToggleData={() => setDataAberta((v) => !v)}
      onTrocarResponsavel={() => setResponsavelModalOpen(true)}
      onSimular={aoSimular}
      podeSimular={podeSimular}
      simulando={simulando}
      observacoesInvalida={observacoesInvalida}
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
              <Row className="justify-content-center">
                <Col lg={7} xl={6}>
                  {simulando ? (
                    <SimuladorCompraVereditoSkeleton />
                  ) : veredito ? (
                    <SimuladorCompraVeredito
                      veredito={veredito}
                      valorParcela={valorParcela}
                      competenciaLabel={competenciaLabel}
                      linhas={linhasCompras}
                    />
                  ) : null}
                  {!simulando && resultadoVisivel && (
                    <>
                      <SimuladorCompraImpacto
                        impacto={impacto}
                        valorParcela={valorParcela}
                        competenciaCurta={competenciaCurta}
                        responsavelNome={foco?.responsavel_nome || ''}
                        ehEu={ehEuFoco}
                      />
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {podeIncluir && (
                          <button type="button" className="btn btn-primary" disabled={!acaoHabilitada} onClick={abrirIncluir}>
                            Incluir outra simulação
                          </button>
                        )}
                        {itensLote.length > 0 && (
                          <button type="button" className="btn btn-outline-primary" disabled={!acaoHabilitada} onClick={abrirConfirmacaoLote}>
                            Finalizar
                          </button>
                        )}
                      </div>
                      <SimuladorListaSomadas
                        itens={itensLote}
                        indiceInvalido={indiceInvalido}
                        mensagemInvalida={mensagemIndiceInvalido}
                        onEditar={abrirEdicao}
                        onRemover={removerItemLote}
                      />
                    </>
                  )}
                </Col>
              </Row>
              {!simulando && resultadoVisivel && overlayConjunto && (
                <SimuladorCompraDetalhes
                  aberto={detalhesAbertos}
                  onToggle={() => setDetalhesAbertos((v) => !v)}
                  impacto={impacto}
                  cartaoNome={foco?.cartao_nome || ''}
                  competenciaLabel={competenciaLabel}
                  valorParcela={valorParcela}
                  alertaLimite={Number(impacto?.fatura_cartao.percentual_em_uso_depois) > 80}
                  parcelasFora={overlayConjunto.parcelas_fora_da_janela}
                  labelFimJanela={
                    projecaoBase?.colunas?.[projecaoBase.colunas.length - 1]?.label || 'o fim da janela'
                  }
                  parcelas={overlayConjunto.parcelas}
                  onSelectParcela={scrollToColuna}
                  verTodos={verTodos}
                  onVerTodos={setVerTodos}
                  overlay={projecaoOverlay}
                  cartaoId={focoCartaoId || null}
                  responsavelId={focoResponsavelId || null}
                  ehEu={ehEuFoco}
                  responsavelNome={foco?.responsavel_nome || ''}
                  breakdown={breakdown}
                  faturaPath={faturaPath}
                  visualizarPath={visualizarPath}
                />
              )}
            </>
          ) : (
            <Row className="justify-content-center">
              <Col lg={7} xl={6}>
                {renderForm(handleSimular)}
                <p className="text-muted text-center fs-13 mt-4 mb-0">
                  Escolha o cartão, o responsável, o valor e as parcelas para ver se a compra
                  cabe.
                </p>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      <Modal
        isOpen={confirmacaoLoteAberta}
        toggle={gravandoLote ? undefined : () => setConfirmacaoLoteAberta(false)}
        centered
        backdrop="static"
      >
        <ModalHeader toggle={gravandoLote ? undefined : () => setConfirmacaoLoteAberta(false)}>
          Finalizar
        </ModalHeader>
        <ModalBody>
          <p className="fs-5 mb-0">{textoConfirmacaoLote(itensLote)}</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" color="light" className="border" disabled={gravandoLote} onClick={() => setConfirmacaoLoteAberta(false)}>
            Cancelar
          </Button>
          <Button type="button" color="primary" disabled={gravandoLote} onClick={confirmarLote}>
            {gravandoLote ? 'Gravando…' : 'Confirmar'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={destinosFatura != null} centered backdrop="static">
        <ModalHeader>Compras registradas</ModalHeader>
        <ModalBody>
          <p className="mb-3">Deseja iniciar uma nova simulação ou ver as compras na fatura?</p>
          {destinosFatura && destinosFatura.length > 0 && (
            <div className="d-flex flex-column gap-2">
              <div className="text-muted fs-13">Cartões usados</div>
              {destinosFatura.map((destino) => {
                const competencia = destino.mes && destino.ano ? labelCompetencia(destino.mes, destino.ano) : ''
                return (
                  <Button
                    key={destino.faturaId}
                    type="button"
                    color="light"
                    className="border text-start"
                    onClick={() => abrirFaturaDoCartao(destino)}
                  >
                    {destino.cartaoNome}
                    {competencia ? ` · ${competencia}` : ''}
                  </Button>
                )
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" color="primary" onClick={iniciarNovaSimulacao}>
            Iniciar nova simulação
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modalSimulacaoAberto} toggle={fecharModalSimulacao} centered size="lg" backdrop="static">
        <ModalHeader toggle={fecharModalSimulacao}>
          {indiceEdicao != null ? 'Editar simulação' : 'Incluir outra simulação'}
        </ModalHeader>
        <ModalBody>{renderForm(salvarModal)}</ModalBody>
        <ModalFooter>
          <Button type="button" color="light" className="border" onClick={fecharModalSimulacao}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

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
