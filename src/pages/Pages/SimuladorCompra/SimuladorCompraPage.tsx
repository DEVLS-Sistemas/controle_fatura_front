import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, Col, Container, Row, Spinner } from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import UiContent from 'Components/Common/UiContent'
import { setActiveMenu } from 'helpers/system_helpers'
import { formatCurrency, isMeuResponsavelDisplay, splitValorEmParcelas, toCentavos } from 'helpers/fatura_helpers'
import { removeMask } from 'helpers/functions_helpers'
import { CartaoChip } from 'helpers/cartao_helpers'
import { buildResponsavelVisualizarPath } from 'helpers/responsavel_visualizar_helpers'
import {
  aplicarOverlaySimulacao,
  breakdownResponsavelPorCartao,
  calcularImpactoSimulacao,
  cartoesDoTitular,
  montarParcelasSimuladas,
  parseQueryNumber,
  parseValorQuery,
  responsavelPadraoDoTitular,
  somaParcelasBate,
  titularPrincipal,
  todayISO,
} from 'helpers/simulador_compra_helpers'
import { pessoaIdOf, PessoaListItem, toPessoaSelectOption } from 'interfaces/Pessoas/PessoasInterface'
import { ProjecaoFaturasView } from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { SimuladorCompraFormValues, SimuladorParcela } from 'interfaces/SimuladorCompra/SimuladorCompraInterface'
import { ResponsavelLookup } from 'interfaces/Transacoes/TransacoesInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { PessoasService } from 'services/Pessoas/PessoasService'
import { ProjecaoFaturasService } from 'services/ProjecaoFaturas/ProjecaoFaturasService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import ProjecaoFaturasTable from 'pages/Pages/ProjecaoFaturas/ProjecaoFaturasTable/ProjecaoFaturasTable'
import ResponsavelModal from 'pages/Pages/Transacoes/ResponsavelModal/ResponsavelModal'
import SimuladorCompraForm from './SimuladorCompraForm/SimuladorCompraForm'
import SimuladorCompraImpacto from './SimuladorCompraImpacto/SimuladorCompraImpacto'
import SimuladorCompraTimeline from './SimuladorCompraTimeline/SimuladorCompraTimeline'

const SimuladorCompraPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const now = new Date()

  const { register, control, watch, setValue } = useForm<SimuladorCompraFormValues>({
    defaultValues: {
      pessoa_id: null,
      cartao_id: null,
      responsavel_id: null,
      valor_compra: parseValorQuery(searchParams.get('valor')),
      parcelas_total: parseQueryNumber(searchParams.get('parcelas')) || 1,
      data: searchParams.get('data') || todayISO(),
      mes: now.getMonth() + 1,
      ano: now.getFullYear(),
    },
  })

  const [loadingLookups, setLoadingLookups] = useState(true)
  const [loadingProjecao, setLoadingProjecao] = useState(true)
  const [projecaoBase, setProjecaoBase] = useState<ProjecaoFaturasView>()
  const [pessoas, setPessoas] = useState<PessoaListItem[]>([])
  const [responsaveis, setResponsaveis] = useState<ResponsavelLookup[]>([])
  const [defaultResponsavelId, setDefaultResponsavelId] = useState<number | null>(null)
  const [parcelasValores, setParcelasValores] = useState<string[]>([])
  const [parcelasOpen, setParcelasOpen] = useState(false)
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false)
  const [verTodos, setVerTodos] = useState(false)
  const [overlayTick, setOverlayTick] = useState(0)

  const defaultsApplied = useRef(false)
  const skipTitularEffect = useRef(true)
  const pessoasDetalheCache = useRef<Map<number, PessoaListItem>>(new Map())

  const pessoasService = useRef(new PessoasService()).current
  const projecaoService = useRef(new ProjecaoFaturasService()).current
  const transacoesService = useRef(new TransacoesService()).current

  const pessoaId = watch('pessoa_id')
  const cartaoId = watch('cartao_id')
  const responsavelId = watch('responsavel_id')
  const valorCompra = watch('valor_compra')
  const parcelasTotal = watch('parcelas_total')
  const dataCompra = watch('data')
  const mes = watch('mes')
  const ano = watch('ano')

  const nParcelas = Math.max(1, Math.min(36, Number(parcelasTotal) || 1))
  const valorCentavos = toCentavos(valorCompra)
  const totaisBatem = nParcelas <= 1 || somaParcelasBate(
    parcelasValores.map((v) => toCentavos(v)),
    valorCentavos
  )

  const titular = pessoas.find((p) => Number(pessoaIdOf(p)) === Number(pessoaId))
  const cartoesTitular = useMemo(
    () => cartoesDoTitular(projecaoBase?.por_cartao, pessoaId != null ? Number(pessoaId) : null, Boolean(titular?.eh_principal)),
    [projecaoBase, pessoaId, titular]
  )
  const cartaoSel = cartoesTitular.find((c) => Number(c.cartao_id) === Number(cartaoId))
  const responsavelSel = responsaveis.find((r) => Number(r.id) === Number(responsavelId))
  const ehEu = isMeuResponsavelDisplay({
    responsavelId: responsavelId != null ? Number(responsavelId) : null,
    responsavelNome: responsavelSel?.nome,
    defaultResponsavelId,
  })

  const pessoasOptions: SelectOptions[] = pessoas.map(toPessoaSelectOption)
  const cartoesOptions: SelectOptions[] = cartoesTitular.map((c) => ({
    value: c.cartao_id,
    label: [
      c.nome,
      c.dia_limite_fatura != null ? `Fecha dia ${c.dia_limite_fatura}` : null,
      c.dia_vencimento_fatura != null ? `Vence dia ${c.dia_vencimento_fatura}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    cor_fundo: c.cor_fundo ?? null,
    cor_texto: c.cor_texto ?? null,
  }))

  const overlayInput = useMemo(
    () => montarParcelasSimuladas({
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
    // overlayTick força o debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overlayTick, projecaoBase, cartaoSel?.dia_limite_fatura]
  )

  const temOverlay =
    valorCentavos > 0 &&
    totaisBatem &&
    overlayInput.totais_batem &&
    Number(cartaoId) > 0 &&
    Number(responsavelId) > 0 &&
    overlayInput.parcelas_na_janela + overlayInput.parcelas_fora_da_janela > 0

  const projecaoOverlay = useMemo(() => {
    if (!projecaoBase) return undefined
    if (!temOverlay) return projecaoBase
    return aplicarOverlaySimulacao(projecaoBase, {
      cartaoId: Number(cartaoId),
      responsavelId: Number(responsavelId),
      responsavelNome: responsavelSel?.nome || (ehEu ? 'Eu' : `Responsável #${responsavelId}`),
      ehEu,
      deltas: overlayInput.deltas,
    })
  }, [projecaoBase, temOverlay, cartaoId, responsavelId, responsavelSel, ehEu, overlayInput.deltas])

  const impacto = useMemo(() => {
    if (!projecaoBase || !projecaoOverlay || !cartaoId || !responsavelId) return null
    return calcularImpactoSimulacao({
      base: projecaoBase,
      overlay: projecaoOverlay,
      cartaoId: Number(cartaoId),
      responsavelId: Number(responsavelId),
      deltas: temOverlay ? overlayInput.deltas : overlayInput.deltas.map(() => 0),
      primeira: overlayInput.primeira,
    })
  }, [projecaoBase, projecaoOverlay, cartaoId, responsavelId, temOverlay, overlayInput])

  const idxBreakdown = overlayInput.primeira?.indice_coluna ?? projecaoBase?.colunas.findIndex((c) => c.referencia) ?? 0
  const breakdown = useMemo(() => {
    if (!projecaoBase || !projecaoOverlay || !responsavelId || !cartaoId) return []
    return breakdownResponsavelPorCartao({
      overlay: projecaoOverlay,
      base: projecaoBase,
      responsavelId: Number(responsavelId),
      cartaoSimuladoId: Number(cartaoId),
      indice: idxBreakdown >= 0 ? idxBreakdown : 0,
    })
  }, [projecaoBase, projecaoOverlay, responsavelId, cartaoId, idxBreakdown])

  const resolveDefaultResponsavel = useCallback(
    async (pessoa: PessoaListItem | undefined): Promise<number | null> => {
      if (!pessoa) return defaultResponsavelId
      const id = pessoaIdOf(pessoa)
      let detalhe = pessoa
      if (!pessoa.eh_principal && id != null && pessoa.responsavel_id == null) {
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
            // segue com match por nome
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

  const applyCartaoEResponsavel = useCallback(
    async (pessoa: PessoaListItem | undefined, preferCartaoId?: number | null, preferRespId?: number | null) => {
      const lista = cartoesDoTitular(
        projecaoBase?.por_cartao,
        pessoaIdOf(pessoa),
        Boolean(pessoa?.eh_principal)
      )
      const cartaoPreferido = preferCartaoId
        ? lista.find((c) => Number(c.cartao_id) === Number(preferCartaoId))
        : undefined
      const proximoCartao = cartaoPreferido || lista[0]
      setValue('cartao_id', proximoCartao?.cartao_id ?? null)

      const respDefault = await resolveDefaultResponsavel(pessoa)
      const respExiste = preferRespId != null && responsaveis.some((r) => Number(r.id) === Number(preferRespId))
      if (preferRespId != null && !respExiste) {
        toast.error('Responsável não encontrado. Voltando ao padrão do titular.')
      }
      setValue('responsavel_id', respExiste ? preferRespId : respDefault)
    },
    [projecaoBase, resolveDefaultResponsavel, responsaveis, setValue]
  )

  useEffect(() => {
    setActiveMenu('/simulador')
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoadingLookups(true)
      try {
        const [pessoasList, lookups] = await Promise.all([
          pessoasService.AsyncListPessoas(),
          transacoesService.getLookupsTransacoes(),
        ])
        setPessoas(pessoasList || [])
        if (lookups?.responsaveis) setResponsaveis(lookups.responsaveis)
        if (lookups?.default_responsavel_id != null) {
          setDefaultResponsavelId(lookups.default_responsavel_id)
        }
      } catch (error: any) {
        toast.error(error?.message || 'Erro ao carregar dados do simulador')
      } finally {
        setLoadingLookups(false)
      }
    }
    load()
  }, [pessoasService, transacoesService])

  useEffect(() => {
    const mesN = Number(mes) || now.getMonth() + 1
    const anoN = Number(ano) || now.getFullYear()
    let cancelled = false
    const load = async () => {
      setLoadingProjecao(true)
      try {
        const result = await projecaoService.getProjecaoFaturas({ mes: mesN, ano: anoN })
        if (!cancelled) setProjecaoBase(result)
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.message || 'Erro ao carregar projeção de faturas')
          setProjecaoBase(undefined)
        }
      } finally {
        if (!cancelled) setLoadingProjecao(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, ano])

  useEffect(() => {
    if (defaultsApplied.current) return
    if (loadingLookups || loadingProjecao || !projecaoBase || pessoas.length === 0) return

    const run = async () => {
      const qPessoa = parseQueryNumber(searchParams.get('pessoa_id'))
      const qCartao = parseQueryNumber(searchParams.get('cartao_id'))
      const qResp = parseQueryNumber(searchParams.get('responsavel_id'))

      let pessoa = qPessoa != null
        ? pessoas.find((p) => Number(pessoaIdOf(p)) === qPessoa)
        : undefined

      if (!pessoa && qCartao != null) {
        const cartao = (projecaoBase.por_cartao || []).find((c) => Number(c.cartao_id) === qCartao)
        if (cartao?.pessoa_id != null) {
          pessoa = pessoas.find((p) => Number(pessoaIdOf(p)) === Number(cartao.pessoa_id))
        }
      }
      if (!pessoa) pessoa = titularPrincipal(pessoas)
      if (qPessoa != null && !pessoa) {
        toast.error('Titular não encontrado. Usando o principal.')
        pessoa = titularPrincipal(pessoas)
      }

      setValue('pessoa_id', pessoaIdOf(pessoa))
      await applyCartaoEResponsavel(pessoa, qCartao, qResp)
      defaultsApplied.current = true
    }
    run()
  }, [
    loadingLookups,
    loadingProjecao,
    projecaoBase,
    pessoas,
    searchParams,
    setValue,
    applyCartaoEResponsavel,
  ])

  useEffect(() => {
    if (!defaultsApplied.current) return
    if (skipTitularEffect.current) {
      skipTitularEffect.current = false
      return
    }
    applyCartaoEResponsavel(titular)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pessoaId])

  useEffect(() => {
    if (nParcelas <= 1) {
      setParcelasValores([])
      return
    }
    setParcelasValores(splitValorEmParcelas(valorCentavos, nParcelas))
  }, [valorCentavos, nParcelas])

  useEffect(() => {
    const t = setTimeout(() => setOverlayTick((n) => n + 1), 300)
    return () => clearTimeout(t)
  }, [pessoaId, cartaoId, responsavelId, valorCompra, nParcelas, dataCompra, parcelasValores, projecaoBase])

  const handleParcelaChange = (index: number, raw: string) => {
    const digits = removeMask(raw)
    setParcelasValores((prev) => prev.map((v, i) => (i === index ? digits : v)))
  }

  const scrollToColuna = (parcela: SimuladorParcela) => {
    const el = document.getElementById(`proj-cartao-col-${parcela.chave}`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const faturaPath =
    responsavelId && (impacto?.competencia || overlayInput.primeira)
      ? `/projecao-faturas/responsaveis/${responsavelId}/fatura?mes=${
          overlayInput.primeira?.mes || impacto?.competencia?.mes
        }&ano=${overlayInput.primeira?.ano || impacto?.competencia?.ano}`
      : undefined
  const visualizarPath =
    responsavelId && (impacto?.competencia || overlayInput.primeira)
      ? buildResponsavelVisualizarPath(
          Number(responsavelId),
          overlayInput.primeira?.mes || impacto?.competencia?.mes || Number(mes),
          overlayInput.primeira?.ano || impacto?.competencia?.ano || Number(ano)
        )
      : undefined

  const registrarCompra = () => {
    if (!totaisBatem || valorCentavos <= 0 || !cartaoId) {
      toast.warning('Preencha valor, cartão e parcelas válidas antes de registrar.')
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

  const loading = loadingLookups || loadingProjecao

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <UiContent />
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Link to="/projecao-faturas" className="me-2">
                    <i className="bx bx-arrow-back bx-sm"></i>
                  </Link>
                  <div>
                    <h4 className="mb-0">Simulador de compra</h4>
                    <p className="text-muted mb-0 fs-13">
                      Impacto mês a mês antes de registrar — não grava transação
                    </p>
                  </div>
                </div>
                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                  <BreadcrumbItem>
                    <Link to="/dashboard">
                      <i className="ri-home-5-fill"></i>
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <Link to="/projecao-faturas">Projeção</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem active>Simulador</BreadcrumbItem>
                </Breadcrumb>
              </div>
            </Col>
          </Row>

          <SimuladorCompraForm
            register={register}
            control={control}
            pessoasOptions={pessoasOptions}
            cartoesOptions={cartoesOptions}
            semCartoes={!loading && cartoesTitular.length === 0 && pessoaId != null}
            overlay={overlayInput}
            valorCentavos={valorCentavos}
            nParcelas={nParcelas}
            parcelasValores={parcelasValores}
            totaisBatem={totaisBatem}
            diaLimite={cartaoSel?.dia_limite_fatura ?? null}
            cartaoNome={cartaoSel?.nome || ''}
            responsavelNome={responsavelSel?.nome || ''}
            isMeuResponsavel={ehEu}
            parcelasOpen={parcelasOpen}
            onToggleParcelas={() => setParcelasOpen((v) => !v)}
            onParcelaChange={handleParcelaChange}
            onTrocarResponsavel={() => setResponsavelModalOpen(true)}
          />

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <SimuladorCompraImpacto
                impacto={impacto}
                temOverlay={Boolean(temOverlay)}
                responsavelNome={responsavelSel?.nome || ''}
                ehEu={ehEu}
                cartaoNome={cartaoSel?.nome || ''}
                qtdParcelasJanela={overlayInput.parcelas_na_janela}
                faturaPath={faturaPath}
                visualizarPath={visualizarPath}
              />

              {overlayInput.parcelas_fora_da_janela > 0 && (
                <div className="alert alert-warning">
                  {overlayInput.parcelas_fora_da_janela} parcela
                  {overlayInput.parcelas_fora_da_janela === 1 ? '' : 's'} caem depois de{' '}
                  {projecaoBase?.colunas?.[projecaoBase.colunas.length - 1]?.label || 'o fim da janela'}.
                  Troque a referência ou registre a compra para ver o restante na Projeção.
                </div>
              )}

              {temOverlay && (
                <SimuladorCompraTimeline parcelas={overlayInput.parcelas} onSelect={scrollToColuna} />
              )}

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="ver-todos-simulador"
                    checked={verTodos}
                    onChange={(e) => setVerTodos(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="ver-todos-simulador">
                    Ver todos os cartões / responsáveis
                  </label>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Link to="/projecao-faturas" className="btn btn-soft-primary">
                    Projeção (sem overlay)
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={registrarCompra}
                    disabled={!temOverlay}
                  >
                    <i className="ri-save-3-line me-1"></i>
                    Registrar esta compra
                  </button>
                </div>
              </div>

              {breakdown.length > 1 && temOverlay && impacto?.competencia && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="mb-3">
                      {impacto.competencia.label} · {ehEu ? 'Eu' : responsavelSel?.nome} por cartão
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {breakdown.map((item) => (
                        <div
                          key={item.cartao_id}
                          className="d-flex flex-wrap align-items-center justify-content-between gap-2"
                        >
                          <span className="d-flex align-items-center gap-2">
                            <CartaoChip
                              cor_fundo={item.cor_fundo}
                              cor_texto={item.cor_texto}
                              label={item.nome.slice(0, 1)}
                            />
                            <span>
                              {item.nome}
                              {item.eh_simulado && (
                                <span className="badge bg-primary-subtle text-primary ms-2">simulação</span>
                              )}
                            </span>
                          </span>
                          <span>
                            {formatCurrency(item.antes)}
                            {item.simulado > 0 && (
                              <>
                                {' + '}
                                {formatCurrency(item.simulado)} simulado = {formatCurrency(item.depois)}
                              </>
                            )}
                            {item.simulado <= 0 && <> = {formatCurrency(item.depois)}</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <ProjecaoFaturasTable
                data={projecaoOverlay}
                filtroCartaoId={verTodos ? null : cartaoId ? Number(cartaoId) : null}
                filtroResponsavelId={verTodos ? null : responsavelId ? Number(responsavelId) : null}
                destacarResponsavelId={responsavelId ? Number(responsavelId) : null}
                visoes={verTodos ? undefined : ['cartao', 'cruzamento', 'responsavel']}
                cruzamentoInline={!verTodos}
                hideRepasses
                tituloCartao="Cartão selecionado"
                tituloCruzamento="Neste cartão × responsável"
                tituloResponsavel={ehEu ? 'Meu total (todos os cartões)' : 'Responsável · todos os cartões'}
              />
            </>
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
