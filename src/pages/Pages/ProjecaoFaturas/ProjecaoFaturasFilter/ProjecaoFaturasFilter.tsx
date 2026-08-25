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
  separarTitular: boolean
  onSepararTitularChange: (value: boolean) => void
}

const ProjecaoFaturasFilter = ({
  getRemoteProjecaoFaturas,
  defaultValues = ProjecaoFaturasDefaultValues,
  separarTitular,
  onSepararTitularChange,
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
          <Card className="position-relative" style={{ zIndex: 10 }}>
            <CardHeader>
              <form id="form-search-projecao" onSubmit={handleSubmit(getRemoteProjecaoFaturas)}>
                <Row className="align-items-end g-3">
                  <Col md={2} sm={6}>
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
                  <Col md={2} sm={6}>
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
                  <Col md={2} sm={6}>
                    <Link to="/simulador" className="btn btn-outline-primary w-100">
                      <i className="ri-shopping-bag-3-line align-middle me-1"></i> Posso comprar?
                    </Link>
                  </Col>
                  <Col md={4} sm={12}>
                    <div className="mb-0">
                      <Label className="form-label">Cartões</Label>
                      <div className="btn-group w-100" role="group" aria-label="Visualização dos cartões">
                        <button
                          type="button"
                          className={`btn ${separarTitular ? 'btn-outline-primary' : 'btn-primary'}`}
                          onClick={() => onSepararTitularChange(false)}
                        >
                          Agrupado
                        </button>
                        <button
                          type="button"
                          className={`btn ${separarTitular ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => onSepararTitularChange(true)}
                        >
                          <i className="ri-user-line me-1" />
                          Por titular
                        </button>
                      </div>
                    </div>
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
