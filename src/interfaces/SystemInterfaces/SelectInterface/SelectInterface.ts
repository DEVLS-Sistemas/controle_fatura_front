import { MenuPlacement } from "react-select";

export type SelectOptions = {
    value: string | number | undefined | null;
    label: string | undefined;
    disabled?: boolean | undefined;
};

export type SelectProps = {
    options: SelectOptions[];
    placeholder?: string | null;
    value?: any;
    styles?: {};
    onChange: (val: any) => number | void;
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    isMulti?: boolean;
    errors?: any
    required?: any
    name?: string
    menuPlacement?: MenuPlacement
    closeMenuOnSelect?: boolean
};