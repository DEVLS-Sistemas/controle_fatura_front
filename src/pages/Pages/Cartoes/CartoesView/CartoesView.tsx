import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { setActiveMenu } from 'helpers/system_helpers'
import { useNavegacao } from 'helpers/functions_helpers'
import { CartaoChip, BandeiraChip, resolveCartaoCores } from 'helpers/cartao_helpers'
import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Label, Row } from 'reactstrap'
import { CartoesView, TIPOS_NUMERO_PADRAO } from 'interfaces/Cartoes/CartoesInterface'
import { CartoesService } from 'services/Cartoes/CartoesService'

const tipoLabel = (tipo?: string | null) =>
    TIPOS_NUMERO_PADRAO.find((t) => t.value === tipo)?.label ?? tipo ?? '-'

const CartoesViewPage = () => {
    const { state } = useLocation()
    const { id } = useParams()
    const [record, setRecord] = useState<CartoesView | null>(state?.source ?? null)
    const { voltarParaRotaAnterior } = useNavegacao()
    const cartoesService = new CartoesService()

    const loadRecord = async (recordId: string) => {
        try {
            const view = await cartoesService.getViewCartoes({ id: recordId })
            if (view) setRecord(view)
        } catch (error) {
            console.error('Erro ao carregar cartão:', error)
            toast.error('Erro ao carregar cartão.')
        }
    }

    useEffect(() => {
        setActiveMenu('/cartoes')
    }, [])

    useEffect(() => {
        if (id) {
            // Sempre carrega detalhe completo (listagem pode vir sem árvore)
            loadRecord(id)
        }
    }, [id])

    if (!record) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center py-5">Carregando...</div>
                </Container>
            </div>
        )
    }

    const qtdBandeiras = record.qtd_bandeiras ?? record.bandeiras?.length ?? 0
    const qtdNumeros = record.qtd_numeros
        ?? record.bandeiras?.reduce((acc, b) => acc + (b.numeros?.length ?? 0), 0)
        ?? 0
    const cores = resolveCartaoCores(record)

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <div className="d-sm-flex align-items-center justify-content-between">
                                    <Link to="/cartoes"><i className="bx bx-arrow-back bx-sm"></i></Link>
                                    <h4 className="mb-sm-0 ms-3">Visualizar Cartão</h4>
                                </div>
                                <Breadcrumb pageTitle="" listClassName="mb-sm-0 pt-1 py-2">
                                    <BreadcrumbItem><Link to="/dashboard"><i className="ri-home-5-fill"></i></Link></BreadcrumbItem>
                                    <BreadcrumbItem><Link to="/cartoes">Cartões de Crédito</Link></BreadcrumbItem>
                                    <BreadcrumbItem active>Visualizar Cartão</BreadcrumbItem>
                                </Breadcrumb>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col xxl={12}>
                            <Card>
                                <CardBody>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Nome</Label>
                                            <p className="mb-0">
                                                <CartaoChip
                                                    cor_fundo={cores.cor_fundo}
                                                    cor_texto={cores.cor_texto}
                                                    label={record.nome || 'Cartão'}
                                                />
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Banco</Label>
                                            <p className="text-muted mb-0">{record.banco || '-'}</p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Titular</Label>
                                            <p className="text-muted mb-0">
                                                {record.pessoa_nome
                                                    ? <><i className="ri-user-line me-1"></i>{record.pessoa_nome}</>
                                                    : '-'}
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Dia limite da fatura</Label>
                                            <p className="text-muted mb-0">
                                                {record.dia_limite_fatura != null
                                                    ? String(record.dia_limite_fatura).padStart(2, '0')
                                                    : '-'}
                                            </p>
                                            <small className="text-muted">
                                                Compras até este dia entram na fatura do mês
                                            </small>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Dia de vencimento</Label>
                                            <p className="text-muted mb-0">
                                                {record.dia_vencimento_fatura != null
                                                    ? String(record.dia_vencimento_fatura).padStart(2, '0')
                                                    : '-'}
                                            </p>
                                            <small className="text-muted">
                                                Data limite para pagamento
                                            </small>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Cores</Label>
                                            <p className="mb-0 d-flex align-items-center gap-2">
                                                <CartaoChip
                                                    cor_fundo={cores.cor_fundo}
                                                    cor_texto={cores.cor_texto}
                                                    label={record.nome || 'Cartão'}
                                                />
                                                <span className="text-muted small">
                                                    {cores.cor_fundo} / {cores.cor_texto}
                                                </span>
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Ativo</Label>
                                            <p className="mb-0">
                                                <span className={`badge bg-${record.ativo ? 'success' : 'danger'}`}>
                                                    {record.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </p>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Label className="form-label fw-semibold">Senha do PDF</Label>
                                            <p className="mb-0">
                                                <span className={`badge bg-${record.tem_senha_pdf ? 'success' : 'secondary'}`}>
                                                    {record.tem_senha_pdf ? 'Cadastrada' : 'Não cadastrada'}
                                                </span>
                                            </p>
                                            {(record.senha_pdf_regra_label || record.senha_pdf_regra) && (
                                                <small className="text-muted d-block mt-1">
                                                    Regra: {record.senha_pdf_regra_label || record.senha_pdf_regra}
                                                </small>
                                            )}
                                            {record.senha_pdf_orientacao && (
                                                <small className="text-muted d-block mt-1">
                                                    {record.senha_pdf_orientacao}
                                                </small>
                                            )}
                                        </Col>
                                        <Col md={12} className="mb-3">
                                            <Label className="form-label fw-semibold">Resumo</Label>
                                            <p className="text-muted mb-0">
                                                {qtdBandeiras} bandeira{qtdBandeiras === 1 ? '' : 's'}
                                                {' · '}
                                                {qtdNumeros} {qtdNumeros === 1 ? 'cartão' : 'cartões'}
                                            </p>
                                        </Col>
                                    </Row>

                                    <hr />
                                    <h6 className="text-muted text-uppercase mb-3">Bandeiras e cartões</h6>

                                    {(record.bandeiras ?? []).length === 0 ? (
                                        <p className="text-muted">Nenhuma bandeira cadastrada.</p>
                                    ) : (
                                        (record.bandeiras ?? []).map((bandeira) => (
                                            <div key={bandeira.id ?? bandeira.bandeira} className="border rounded mb-3 overflow-hidden">
                                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 bg-light">
                                                    <BandeiraChip
                                                        cor_principal={bandeira.cor_principal}
                                                        cor_secundaria={bandeira.cor_secundaria}
                                                        bandeira={bandeira.bandeira}
                                                        label={bandeira.bandeira}
                                                    />
                                                    <span className={`text-muted ${VALOR_TEXT_CLASS}`}>
                                                        Limite{' '}
                                                        {bandeira.limite_credito != null && Number(bandeira.limite_credito) > 0
                                                            ? formatCurrency(bandeira.limite_credito)
                                                            : 'Sem limite'}
                                                    </span>
                                                </div>
                                                <ul className="list-group list-group-flush">
                                                    {(bandeira.numeros ?? []).map((numero) => (
                                                        <li
                                                            key={numero.id ?? numero.ultimos_digitos}
                                                            className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2"
                                                        >
                                                            <div>
                                                                <span className="fw-medium me-2">
                                                                    •••• {numero.ultimos_digitos}
                                                                </span>
                                                                {numero.nome_no_cartao && (
                                                                    <span className="me-2">
                                                                        {numero.nome_no_cartao}
                                                                    </span>
                                                                )}
                                                                <span className="badge bg-light text-dark me-1">
                                                                    {tipoLabel(numero.tipo)}
                                                                </span>
                                                                {numero.apelido && (
                                                                    <span className="text-muted small">
                                                                        · {numero.apelido}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={`badge bg-${numero.ativo !== false ? 'success' : 'danger'}`}>
                                                                {numero.ativo !== false ? 'Ativo' : 'Inativo'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    )}

                                    <hr />
                                    <Row className="mt-3">
                                        <Col md={12}>
                                            <div className="hstack gap-2 justify-content-end">
                                                <Link to={`/cartoes/edit/${record.id}`} state={{ source: record }} className="btn btn-primary">
                                                    Editar
                                                </Link>
                                                <button type="button" className="btn btn-soft-success" onClick={voltarParaRotaAnterior}>
                                                    Voltar
                                                </button>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default CartoesViewPage
