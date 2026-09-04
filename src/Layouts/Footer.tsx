import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { VersaoService } from '../services/Versao/VersaoService';
import { textoRodape } from './footerTexto';

const Footer = () => {
    const [versao, setVersao] = useState<string | null>(null);
    const ano = new Date().getFullYear();

    useEffect(() => {
        let ativo = true;

        new VersaoService().obter()
            .then((dados) => {
                if (ativo) {
                    setVersao(dados.api_version);
                }
            })
            .catch(() => {
                if (ativo) {
                    setVersao(null);
                }
            });

        return () => {
            ativo = false;
        };
    }, []);

    return (
        <React.Fragment>
            <footer className="footer">
                <Container fluid>
                    <Row>
                        <Col sm={6}>
                            {textoRodape(ano, versao)}
                        </Col>
                    </Row>
                </Container>
            </footer>
        </React.Fragment>
    );
};

export default Footer;
