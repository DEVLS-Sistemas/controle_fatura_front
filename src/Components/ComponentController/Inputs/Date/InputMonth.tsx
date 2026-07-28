
import { ValidatorForm } from "Components/ComponentController/ValidatorForm/ValidatorForm"
import { FieldValues, Path, UseFormRegister } from "react-hook-form"


interface DateInputProps<T extends FieldValues> {
    label: string
    field: Path<T>
    register: UseFormRegister<T>
    errors?: any
    required?: ValidatorForm
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    disabled?: boolean
    defaultValue?: string | number | readonly string[] | undefined

}

export const MonthInput = <T extends Partial<Record<keyof T, any>>>({ label, field, disabled, register, minLength, maxLength, required, errors, defaultValue }: DateInputProps<T>) => {
    return (
        <div className="form-floating">
            <input
                disabled={!!disabled}
                className={`form-control input-month ${errors ? 'is-invalid' : ''}`}
                type="month"
                defaultValue={defaultValue}
                {...register(field, { required, minLength, maxLength })}
            />
            <label className="d-flex flex-row" htmlFor={`input-${field}`}>{label} {required && <div className="text-danger">&nbsp;*</div>}</label>
            {errors && <div className="invalid-feedback text-danger ps-3">{errors.message}</div>}
        </div>
    )
}