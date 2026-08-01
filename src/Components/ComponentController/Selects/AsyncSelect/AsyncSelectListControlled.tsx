import { ValidatorForm } from 'Components/ComponentController/ValidatorForm/ValidatorForm'
import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface'
import { Path, Controller, FieldValues, Control } from 'react-hook-form'
import { AsyncSelectList } from './AsyncSelectList'


export interface AsyncSelectListInterface {
    callback: (inputValue: string) => Promise<SelectOptions[]>;
    onChange: (...event: any[]) => void;
    placeholder: string;
    className: string;
    style: string;
    errors: any;
    required?: boolean | ValidatorForm;
    disabled?: boolean;
    defaultValue?: SelectOptions;
    isLoading?: boolean;
    defaultOptions?: SelectOptions[];
    value?: SelectOptions;
}

export type AsyncSelectListProps<T extends FieldValues> = {
    field: Path<T>
    control?: Control<T>
    callback: (inputValue: string) => Promise<SelectOptions[]>;
    placeholder?: string;
    className?: string;
    style?: string;
    required?: boolean | ValidatorForm;
    disabled?: boolean;
    defaultValue?: SelectOptions;
    isLoading?: boolean;
    defaultOptions?: SelectOptions[];
}

export const AsyncSelectListControlled = <T extends FieldValues>({ field, control, ...props }: AsyncSelectListProps<T>) => {
    return (
        <div>
            <Controller
                name={field}
                control={control}
                rules={{ required: props.required }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <AsyncSelectList
                        callback={props.callback}
                        placeholder={props.placeholder || "Selecione"}
                        className={props.className || ""}
                        style={props.style || ""}
                        onChange={onChange}
                        errors={error}
                        disabled={props.disabled}
                        required={props.required}
                        defaultValue={props.defaultValue}
                        defaultOptions={props.defaultOptions}
                        value={value ? { value: value, label: '' } : undefined}
                    />
                )}
            />

        </div>

    )
}