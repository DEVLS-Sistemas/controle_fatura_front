import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from 'reactstrap'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { persistAuthUser } from 'helpers/auth_session'
import {
  applyRaioXViewGuards,
  parsePositiveId,
  parseRendaMensal,
  persistRaioXCompetencia,
  resolveRaioXEmpty,
  resolveRaioXSearch,
} from 'helpers/raio_x_helpers'
import { RaioXSearch, RaioXView } from 'interfaces/RaioX/RaioXInterface'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { useAuthUser } from 'Components/Hooks/useAuthUser'
import { AuthService } from 'services/Auth'
import { RaioXService } from 'services/Dashboard/RaioXService'
import { TransacoesService } from 'services/Transacoes/TransacoesService'
import { ValidationError } from 'libs/api/exceptions/ValidationError'
import RaioXHeader from './RaioXHeader/RaioXHeader'
import RaioXSinais, { RaioXSinaisSkeleton } from './RaioXSinais/RaioXSinais'
import RaioXDiagnosticoBlock, { RaioXDiagnosticoSkeleton } from './RaioXDiagnostico/RaioXDiagnostico'
import RaioXAcoes from './RaioXAcoes/RaioXAcoes'
import RaioXRenda from './RaioXRenda/RaioXRenda'

const buildResponsaveisOptions = (
  items?: { id?: number; nome?: string }[]
): SelectOptions[] => {
  const opts: SelectOptions[] = [{ value: '', label: 'Conta inteira' }]
  items?.forEach((item) => {
    if (item.id != null) {
      opts.push({ value: item.id, label: item.nome ?? `#${item.id}` })
    }
  })
  return opts
}

const RaioXPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [savingRenda, setSavingRenda] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<RaioXView>()
  const [responsaveisOptions, setResponsaveisOptions] = useState<SelectOptions[]>([
    { value: '', label: 'Conta inteira' },
  ])

  const defaultValues = resolveRaioXSearch(searchParams)
  const lastFiltersRef = useRef<RaioXSearch>(defaultValues)
  const lastKeyRef = useRef<string>('')
  const raioXService = useRef(new RaioXService()).current
  const transacoesService = useRef(new TransacoesService()).current
  const authService = useRef(new AuthService()).current

  const persistUrl = (filters: RaioXSearch) => {
    const next = new URLSearchParams()
    next.set('mes', String(filters.mes))
    next.set('ano', String(filters.ano))
    if (filters.responsavel_id) next.set('responsavel_id', String(filters.responsavel_id))
    const nextQs = next.toString()
    const currentQs = new URLSearchParams(window.location.search).toString()
    if (nextQs === currentQs) return
    setSearchParams(next, { replace: true })
  }

  const loadRaioX = useCallback(
    async (filters: RaioXSearch, opts?: { force?: boolean }) => {
      const mes = Number(filters.mes)
      const ano = Number(filters.ano)
      const responsavelId = parsePositiveId(filters.responsavel_id)
      const next: RaioXSearch = { mes, ano, responsavel_id: responsavelId }
      const key = `${mes}-${ano}-${responsavelId || ''}`
      if (!opts?.force && lastKeyRef.current === key) {
        return
      }
      lastKeyRef.current = key
      lastFiltersRef.current = next
      persistRaioXCompetencia(mes, ano)
      persistUrl(next)
      setLoading(true)
      setLoadError(null)
      try {
        const result = await raioXService.getRaioX(next)
        setData(applyRaioXViewGuards(result))
      } catch (error: unknown) {
        const message = error instanceof Error && error.message ? error.message : 'Erro ao carregar o Raio-X'
        toast.error(message)
        setData(undefined)
        setLoadError(message)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const loadLookups = async () => {
    try {
      const result = await transacoesService.getLookupsTransacoes()
      if (result?.responsaveis) {
        setResponsaveisOptions(buildResponsaveisOptions(result.responsaveis))
      }
    } catch (error) {
      console.error('Erro ao carregar lookups do Raio-X:', error)
    }
  }

  const handleSaveRenda = async (rendaBr: string) => {
    if (!user) {
      toast.error('Faça login para salvar a renda.')
      return
    }
    setSavingRenda(true)
    try {
      const result = await authService.updatePerfil({
        name: user.name,
        sobrenome: user.sobrenome || '',
        cpf_cnpj: user.cpf_cnpj || '',
        email: user.email,
        renda_mensal: rendaBr,
      })
      const renda = parseRendaMensal(result.user.renda_mensal) ?? parseRendaMensal(rendaBr)
      persistAuthUser({ ...result.user, renda_mensal: renda })
      toast.success(result.message || 'Renda salva.')
      await loadRaioX(lastFiltersRef.current, { force: true })
    } catch (error: unknown) {
      const message =
        error instanceof ValidationError || error instanceof Error
          ? error.message
          : 'Erro ao salvar a renda'
      toast.error(message)
    } finally {
      setSavingRenda(false)
    }
  }

  useEffect(() => {
    loadLookups()
    setActiveMenu('/raio-x')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emptyKind =
    !loading && !loadError && data
      ? resolveRaioXEmpty(data, data.referencia.mes, data.referencia.ano)
      : null
  const rendaInformada = data?.renda?.informada === true

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <RaioXHeader
            defaultValues={defaultValues}
            responsaveisOptions={responsaveisOptions}
            onChange={loadRaioX}
          />

          <div className="py-3 py-md-4 px-1 px-md-2" style={{ maxWidth: 720 }}>
            {loadError ? (
              <div className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-24">
                    <i className="ri-error-warning-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Não foi possível ler este mês.</h5>
                <p className="text-muted mb-3">{loadError}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => loadRaioX(lastFiltersRef.current, { force: true })}
                >
                  Tentar de novo
                </button>
              </div>
            ) : loading ? (
              <>
                <RaioXSinaisSkeleton />
                <RaioXDiagnosticoSkeleton />
              </>
            ) : emptyKind === 'mes_futuro' ? (
              <div className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                    <i className="ri-calendar-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Ainda não há fatura nesta competência.</h5>
                <p className="text-muted mb-3">Volte ao mês atual para ver a leitura.</p>
                <Link to="/faturas" className="btn btn-soft-primary btn-sm">
                  Ver faturas
                </Link>
              </div>
            ) : emptyKind === 'vazio' ? (
              <div className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-24">
                    <i className="ri-scan-2-line"></i>
                  </span>
                </div>
                <h5 className="mb-1">Nada para ler neste mês.</h5>
                <p className="text-muted mb-3">
                  Importe uma fatura ou cadastre uma compra para o Raio-X ter o que ler.
                </p>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Link to="/faturas" className="btn btn-soft-primary btn-sm">
                    Faturas
                  </Link>
                  <Link to="/transacoes/add" className="btn btn-soft-secondary btn-sm">
                    Nova compra
                  </Link>
                </div>
              </div>
            ) : data ? (
              <>
                <RaioXSinais
                  sinais={data.sinais}
                  labelCurto={data.referencia?.label_curto}
                  label={data.referencia?.label}
                />
                <RaioXRenda
                  informada={rendaInformada}
                  saving={savingRenda}
                  onSave={handleSaveRenda}
                />
                {data.diagnostico ? <RaioXDiagnosticoBlock diagnostico={data.diagnostico} /> : null}
                <RaioXAcoes acoes={data.acoes} />
              </>
            ) : null}
          </div>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default RaioXPage
