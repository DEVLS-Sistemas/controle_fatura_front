import React, { createContext, useContext, useEffect, useState } from 'react'
import { Container, Spinner } from 'reactstrap'
import { SubmitHandler } from 'react-hook-form'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import {
  ProjecaoFaturasDefaultValues,
  ProjecaoFaturasSearch,
  ProjecaoFaturasView,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'
import { ProjecaoFaturasService } from 'services/ProjecaoFaturas/ProjecaoFaturasService'
import ProjecaoFaturasFilter from './ProjecaoFaturasFilter/ProjecaoFaturasFilter'
import ProjecaoFaturasTable from './ProjecaoFaturasTable/ProjecaoFaturasTable'

type ProjecaoFaturasFilterContextType = {
  firstEntry: boolean
} & ProjecaoFaturasSearch

export const ProjecaoFaturasFilterContext = createContext<ProjecaoFaturasFilterContextType>(
  {} as ProjecaoFaturasFilterContextType
)

const ProjecaoFaturasPage = () => {
  const [display, setDisplay] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const projecaoContext = useContext(ProjecaoFaturasFilterContext)
  const [projecaoData, setProjecaoData] = useState<ProjecaoFaturasView>()
  const [separarTitular, setSepararTitular] = useState(false)
  const projecaoFaturasService = new ProjecaoFaturasService()

  const now = new Date()
  const ProjecaoFaturasFilterContextValue: ProjecaoFaturasFilterContextType = {
    mes: ProjecaoFaturasDefaultValues.mes ?? now.getMonth() + 1,
    ano: ProjecaoFaturasDefaultValues.ano ?? now.getFullYear(),
    palavra_chave: null,
    firstEntry: false,
  }

  const getRemoteProjecaoFaturas: SubmitHandler<ProjecaoFaturasSearch> = async (data) => {
    setLoading(true)
    try {
      const mes = Number(data.mes) || now.getMonth() + 1
      const ano = Number(data.ano) || now.getFullYear()

      projecaoContext.mes = mes
      projecaoContext.ano = ano
      projecaoContext.firstEntry = true

      const result = await projecaoFaturasService.getProjecaoFaturas({ mes, ano })
      setProjecaoData(result)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar projeção de faturas')
      setProjecaoData(undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTimeout(() => setDisplay(true), 300)
  }, [])

  useEffect(() => {
    setActiveMenu('/projecao-faturas')
  }, [])

  return (
    <React.Fragment>
      <ProjecaoFaturasFilterContext.Provider value={ProjecaoFaturasFilterContextValue}>
        <div className="page-content">
          <Container fluid>
            <ProjecaoFaturasFilter
              getRemoteProjecaoFaturas={getRemoteProjecaoFaturas}
              defaultValues={{
                mes: ProjecaoFaturasFilterContextValue.mes,
                ano: ProjecaoFaturasFilterContextValue.ano,
              }}
              separarTitular={separarTitular}
              onSepararTitularChange={setSepararTitular}
            />
            {display && !loading ? (
              <ProjecaoFaturasTable data={projecaoData} separarTitular={separarTitular} />
            ) : (
              <div className="text-center py-5">
                <Spinner color="primary" />
              </div>
            )}
          </Container>
        </div>
      </ProjecaoFaturasFilterContext.Provider>
    </React.Fragment>
  )
}

export default ProjecaoFaturasPage
