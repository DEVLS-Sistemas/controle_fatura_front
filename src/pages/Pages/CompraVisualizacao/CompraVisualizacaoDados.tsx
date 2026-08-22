import React from 'react'
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap'
import {
  isResponsavelEu,
  ultimosDigitosCartao,
} from 'helpers/compra_visualizacao_helpers'
import { BandeiraChip } from 'helpers/cartao_helpers'
import {
  formatDateBr,
  getCategoriaFieldStyle,
  origemCompraColor,
} from 'helpers/fatura_helpers'
import { CompraVisualizacaoView } from 'interfaces/CompraVisualizacao/CompraVisualizacaoInterface'

interface CompraVisualizacaoDadosProps {
  compra: CompraVisualizacaoView
}

const DadoTile = ({
  icon,
  tone,
  label,
  value,
  extra,
  style,
}: {
  icon: string
  tone: string
  label: string
  value?: React.ReactNode
  extra?: React.ReactNode
  style?: React.CSSProperties
}) => {
  if (value == null || value === false || value === '') return null
  return (
    <Col xl={3} md={6}>
      <div className={`compra-dado-tile compra-dado-tile--${tone}`} style={style}>
        <span className="compra-dado-tile__icon">
          <i className={icon}></i>
        </span>
        <div className="compra-dado-tile__body">
          <span className="compra-dado-tile__label">{label}</span>
          <div className="compra-dado-tile__value">{value}</div>
          {extra ? <div className="compra-dado-tile__extra">{extra}</div> : null}
        </div>
      </div>
    </Col>
  )
}

const CompraVisualizacaoDados = ({ compra }: CompraVisualizacaoDadosProps) => {
  const estabelecimentoNome = compra.estabelecimento?.nome
  const lojaNome = compra.estabelecimento?.loja_nome
  const digitos = ultimosDigitosCartao(compra)
  const categoriaStyle = getCategoriaFieldStyle(compra.categoria?.cor)
  const origemLabel = compra.origem_compra_label || compra.origem_compra
  const origemTone = origemCompraColor[compra.origem_compra || ''] || 'secondary'
  const ehEu = isResponsavelEu(compra)
  const extrasNumero = [compra.cartao_numero?.apelido, compra.cartao_numero?.tipo_label || compra.cartao_numero?.tipo]
    .filter(Boolean)
    .join(' · ')
  const temCartao = Boolean(
    compra.cartao || compra.bandeira || digitos || compra.cartao_numero?.nome_no_cartao
  )

  return (
    <Card className="compra-dados">
      <CardHeader>
        <h5 className="card-title mb-0">Dados da compra</h5>
      </CardHeader>
      <CardBody>
        {temCartao ? (
          <div
            className="compra-dados-cartao mb-3"
            style={{
              backgroundColor: compra.cartao?.cor_fundo || '#4c1d95',
              color: compra.cartao?.cor_texto || '#ffffff',
            }}
          >
            <div className="compra-dados-cartao__top">
              <div>
                <span className="compra-dados-cartao__kicker">Cartão</span>
                <div className="compra-dados-cartao__nome">{compra.cartao?.nome || 'Cartão'}</div>
                {compra.cartao?.banco ? (
                  <div className="compra-dados-cartao__banco">{compra.cartao.banco}</div>
                ) : null}
              </div>
              {compra.bandeira?.nome ? (
                <span className="compra-dados-cartao__bandeira">
                  <BandeiraChip
                    cor_principal={compra.bandeira.cor_principal}
                    cor_secundaria={compra.bandeira.cor_secundaria}
                    nome={compra.bandeira.nome}
                    label={compra.bandeira.nome}
                  />
                </span>
              ) : null}
            </div>
            <div className="compra-dados-cartao__numero">
              {digitos ? `**** ${digitos}` : '****'}
            </div>
            <div className="compra-dados-cartao__bottom">
              <div>
                <span className="compra-dados-cartao__kicker">Nome no cartão</span>
                <div className="compra-dados-cartao__titular">
                  {compra.cartao_numero?.nome_no_cartao || '—'}
                </div>
              </div>
              {extrasNumero ? (
                <span className="compra-dados-cartao__meta">{extrasNumero}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <Row className="g-3">
          <DadoTile
            icon="ri-calendar-event-line"
            tone="primary"
            label="Data da compra"
            value={compra.data_compra ? formatDateBr(compra.data_compra) : null}
          />
          <DadoTile
            icon="ri-store-2-line"
            tone="warning"
            label="Estabelecimento"
            value={estabelecimentoNome}
            extra={lojaNome ? `Loja: ${lojaNome}` : null}
          />
          {!estabelecimentoNome && lojaNome ? (
            <DadoTile icon="ri-building-2-line" tone="warning" label="Loja" value={lojaNome} />
          ) : null}
          <DadoTile
            icon={ehEu ? 'ri-user-star-line' : 'ri-user-3-line'}
            tone={ehEu ? 'success' : 'info'}
            label="Responsável"
            value={compra.responsavel?.nome}
          />
          <DadoTile
            icon="ri-price-tag-3-line"
            tone="secondary"
            label="Categoria"
            value={compra.categoria?.nome}
            extra={compra.subcategoria?.nome}
            style={categoriaStyle || undefined}
          />
          {!compra.categoria?.nome && compra.subcategoria?.nome ? (
            <DadoTile
              icon="ri-price-tag-2-line"
              tone="secondary"
              label="Subcategoria"
              value={compra.subcategoria.nome}
            />
          ) : null}
          <DadoTile
            icon="ri-compass-3-line"
            tone={origemTone}
            label="Origem"
            value={origemLabel}
          />
        </Row>

        {compra.observacoes ? (
          <div className="compra-dados-obs mt-3">
            <span className="compra-dado-tile__label">Observação</span>
            <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
              {compra.observacoes}
            </p>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

export default CompraVisualizacaoDados
