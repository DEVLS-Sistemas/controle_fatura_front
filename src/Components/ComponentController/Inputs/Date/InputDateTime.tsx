import { formatDateSQLForBR, verificaIntervaloDatas } from "@/helpers"
import { ValidatorForm } from "Components/ComponentController/ValidatorForm/ValidatorForm"
import { Control, FieldValues, Path, UseFormRegister } from "react-hook-form"

interface InputDateTimeProps<T extends FieldValues> {
    label?: string
    field: Path<T>
    register: UseFormRegister<T>
    errors?: any
    required?: ValidatorForm
    minLength?: ValidatorForm
    maxLength?: ValidatorForm
    disabled?: boolean
    validate?: any
    dateWatchReferencia?: string 
}

export const InputDateTime = <T extends FieldValues>({label, field, disabled, register, minLength, maxLength, required, errors, validate, dateWatchReferencia}: InputDateTimeProps<T>) => {
    
    return (
        <div className="">
            <input
                disabled={!!disabled}
                className={`form-control ${errors ? 'is-invalid' : ''}`}
                type="datetime-local"
                {...register(field, {
                    required,
                    minLength,
                    maxLength,
                    validate: (v: any) => {
                        if (!v) return;
                        if (validate) {
                            const customError = validate(v);
                            if (customError) return customError;
                        }
                    }
                })}
            />
            {errors && <div className="invalid-feedback text-danger ps-3">{errors.message}</div>}
        </div>
    )
}
