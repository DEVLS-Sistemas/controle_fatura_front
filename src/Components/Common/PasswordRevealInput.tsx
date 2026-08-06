import React, { ChangeEvent, useState } from 'react'
import { Input } from 'reactstrap'

type PasswordRevealInputProps = {
    id?: string
    value?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    className?: string
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/** Input de senha com ícone de olho para revelar/ocultar (padrão do login). */
const PasswordRevealInput = ({
    id,
    className,
    ...rest
}: PasswordRevealInputProps) => {
    const [show, setShow] = useState(false)

    return (
        <div className="position-relative auth-pass-inputgroup">
            <Input
                id={id}
                type={show ? 'text' : 'password'}
                className={['form-control', 'pe-5', className].filter(Boolean).join(' ')}
                autoComplete="new-password"
                {...rest}
            />
            <button
                className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                type="button"
                tabIndex={-1}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShow((prev) => !prev)}
            >
                <i className="ri-eye-fill align-middle"></i>
            </button>
        </div>
    )
}

export default PasswordRevealInput
