import { ValidatorForm } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { useEffect } from 'react'
import { Path, Controller, FieldValues, Control, Validate, PathValue } from 'react-hook-form'
import { SelectList } from './SelectList'

export type SelectListProps<T extends FieldValues> = {
    field: Path<T>
    control?: Control<T>
    closeMenuOnSelect?: boolean
    required?: ValidatorForm
    multiple?: boolean
    isMulti?: boolean;
    placeholder?: string
    disabled?: boolean
    menuPlacement?: 'auto' | 'top' | 'bottom'
    options: SelectOptions[]
    errors?: any
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
    name?: string
    isLoading?: boolean;
    validate?: any
    requiredPlaceholder?: boolean
    defaultValue?: any
}

export const SelectListControlled = <T extends FieldValues>({ field, control, ...props }: SelectListProps<T>) => {
    return (
        <div>
            <Controller
                name={field}
                control={control}
                rules={{
                    required: props.required,
                    validate: props.validate
                }}
                defaultValue={props.defaultValue}
                render={({ field: { onChange, value, name, ref } }) => (
                    // render={({ field: { onChange, value } }) => (
                    <SelectList  {...props}
                        onChange={onChange}
                        value={value}
                        name={name}
                        errors={props.errors}
                        menuPlacement={props.menuPlacement}
                        closeMenuOnSelect={props.closeMenuOnSelect}
                        // defaultValue={props.defaultValue}
                        isMulti={props.isMulti}
                        isDisabled={props.disabled}
                        required={!!props.required || props.requiredPlaceholder}
                    />
                )}
            />

        </div>

    )
}