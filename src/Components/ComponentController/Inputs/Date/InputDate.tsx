

import { ValidatorForm } from "Components/ComponentController/ValidatorForm/ValidatorForm"
import { FieldValues, Path, UseFormRegister } from "react-hook-form"

interface InputDateProps<T extends FieldValues> {
    field: Path<T>
    register: UseFormRegister<T>
    errors?: any
    required?: ValidatorForm,
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    validate?: any
    disabled?: boolean
    min?: any
    max?: any
}
export const InputDate = <T extends FieldValues>({ field, disabled, register, minLength, maxLength, required, validate, errors, min, max }: InputDateProps<T>) => {
    return (
        <>
            <input
                disabled={!!disabled}
                min={min}
                max={max}
                className={`form-control ${errors ? 'is-invalid' : ''}`}
                type="date"
                {...register(field, { required, minLength, maxLength, validate })}
            />
            {errors && <div className="invalid-feedback text-danger ps-3">{errors.message}</div>}
        </>
    )
}