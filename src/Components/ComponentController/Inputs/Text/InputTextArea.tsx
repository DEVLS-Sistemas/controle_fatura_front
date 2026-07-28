import { ValidatorForm } from "../../ValidatorForm/ValidatorForm"
import React from 'react'
import { FieldValue, FieldValues, Path, UseFormRegister } from 'react-hook-form'

interface InputTextAreaProps<T extends FieldValues> {
    field: Path<T>
    label?: string    
    value?: string | number 
    required?: ValidatorForm
    pattern?: string
    errors?: any
    register: UseFormRegister<T>
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    disabled?: boolean
    cols?: number
    rows?: number
}
export const InputTextArea = <T extends FieldValues>({ field, register, label, required, minLength, maxLength, rows, cols, errors, disabled }: InputTextAreaProps<T>) => {
    return (

        <div className="form-floating">
            <textarea
                {...register(field, { required, minLength, maxLength })}
                id={field}
                className={`form-control h-100 ${errors ? 'is-invalid' : ''}`}
                cols={cols ? cols : 100}
                rows={rows ? rows : 2}
                style={{ resize: 'none' }}
                disabled={disabled}

            />
            <label htmlFor={field} className='d-flex flex-row'>
                {label}
                {required && <div className="text-danger">&nbsp;*</div>}
            </label>
        </div>
    )
}
