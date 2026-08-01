import UiContent from 'Components/Common/UiContent'
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Breadcrumb, BreadcrumbItem, Card, CardHeader, Col, Label, Row } from 'reactstrap'
import { SelectListControlled } from 'Components/ComponentController/Selects/Select/SelectListControlled'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { mesesOptions } from 'helpers/fatura_helpers'
import { AnosSelect } from 'helpers/functions_helpers'
import {
  ProjecaoFaturasDefaultValues,
  ProjecaoFaturasSearch,
} from 'interfaces/ProjecaoFaturas/ProjecaoFaturasInterface'

export interface ProjecaoFaturasFilterProps {
  getRemoteProjecaoFaturas: (data: ProjecaoFaturasSearch) => void
  defaultValues?: ProjecaoFaturasSearch
}

const ProjecaoFaturasFilter = ({
  getRemoteProjecaoFaturas,
  defaultValues = ProjecaoFaturasDefaultValues,
}: ProjecaoFaturasFilterProps) => {
  const { handleSubmit, control, watch } = useForm<ProjecaoFaturasSearch>({
    defaultValues,
  })

  const mesWatch = watch('mes')
  const anoWatch = watch('ano')

  useEffect(() => {
    if (mesWatch && anoWatch) {
      getRemoteProjecaoFaturas({ mes: Number(mesWatch), ano: Number(anoWatch) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesWatch, anoWatch])

  const optAnos = AnosSelect()

  const optMeses: SelectOptions[] = mesesOptions.map((m) => ({
    value: m.value,
    label: m.label,
  }))

  return (
    <React.Fragment>
      <UiContent />

      <Row>
        <Col xs={12}>
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Link to="/dashboard" className="me-2">
                <i className="bx bx-arrow-back bx-sm"></i>
              </Link>
              <div>
                <h4 className="mb-0">Projeção de Faturas</h4>
                <p className="text-muted mb-0 fs-13">
                  Previsão de valores por cartão e responsável nos próximos meses
                </p>
              </div>
            </div>
            <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
              <BreadcrumbItem>
                <Link to="/dashboard">
                  <i className="ri-home-5-fill"></i>
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem active>Projeção</BreadcrumbItem>
            </Breadcrumb>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader>
              <form id="form-search-projecao" onSubmit={handleSubmit(getRemoteProjecaoFaturas)}>
                <Row className="align-items-end g-3">
                  <Col md={3} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="mes" className="form-label">
                        Mês de referência
                      </Label>
                      <SelectListControlled<ProjecaoFaturasSearch>
                        field="mes"
                        control={control}
                        options={optMeses}
                      />
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="mb-0">
                      <Label htmlFor="ano" className="form-label">
                        Ano de referência
                      </Label>
                      <SelectListControlled<ProjecaoFaturasSearch>
                        field="ano"
                        control={control}
                        options={optAnos}
                      />
                    </div>
                  </Col>
                  <Col md={2} sm={6}>
                    <button className="btn btn-success w-100" type="submit">
                      <i className="ri-search-line align-middle me-1"></i> Buscar
                    </button>
                  </Col>
                </Row>
              </form>
            </CardHeader>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default ProjecaoFaturasFilter
