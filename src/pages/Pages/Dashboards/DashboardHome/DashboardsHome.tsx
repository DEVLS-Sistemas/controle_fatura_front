import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";

const DashboardsHome = () => {
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100">
                <Row className="mb-3 pb-1">
                  <Col xs={12}>
                    <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                      <div className="flex-grow-1">
                        <h4 className="fs-16 mb-1">Controle de Faturas</h4>
                        <p className="text-muted mb-0">
                          Projeto pronto para implementação das novas regras de negócio.
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col xl={12}>
                    <Card>
                      <CardBody>
                        <h5 className="card-title mb-3">Bem-vindo</h5>
                        <p className="text-muted mb-0">
                          A base do sistema foi resetada. Utilize este dashboard como ponto de
                          partida para cadastrar módulos, rotas e integrações do controle de
                          faturas.
                        </p>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardsHome;
