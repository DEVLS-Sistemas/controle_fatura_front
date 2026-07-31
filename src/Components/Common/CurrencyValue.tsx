import { formatCurrency, VALOR_TEXT_CLASS } from 'helpers/fatura_helpers'

interface CurrencyValueProps {
  value?: number | string | null
  className?: string
  as?: 'span' | 'td' | 'th' | 'strong' | 'div'
}

export const CurrencyValue = ({
  value,
  className = '',
  as: Tag = 'span',
}: CurrencyValueProps) => (
  <Tag className={[VALOR_TEXT_CLASS, className].filter(Boolean).join(' ')}>
    {formatCurrency(value)}
  </Tag>
)
