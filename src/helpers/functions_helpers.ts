import { SelectOptions } from 'interfaces/SystemInterfaces/SelectInterface';
import { useNavigate } from 'react-router-dom';
import { toZonedTime, format } from 'date-fns-tz';

export const TIMEZONE = 'America/Sao_Paulo';

export const formatDateSQLForTimezone = (date: Date) => {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
};

// Função para voltar para a tela anterior
export const useNavegacao = () => {
    const navigate = useNavigate();

    const voltarParaRotaAnterior = () => {
        navigate(-1);
    };

    return { voltarParaRotaAnterior };
};



export const removeMask = (value: string) => {
    if (!value) {
        return value;
    }
    return value.replace(/\D+/g, "");
};

export const maskType = (opt: string) => {
    switch (opt) {
        case "cpf_cnpj":
            return "999.999.999-99" || "99.999.999/9999-99";
        case "tel":
            return "(99) 9999-9999";
        case "cep":
            return "99999-999";
        default:
            return "";
    }
};
export type maskOptions = 'cpf' | 'cnpj' | 'cpf_cnpj' | 'tel' | 'cep' | 'numero' | 'real' | 'preco' | 'percentual'

export const mask = (type: maskOptions, value: string | undefined) => {
    value == null || value == undefined ? (value = "") : (value = value);

    switch (type) {
        case "cpf_cnpj":
            let v1 = value.replace(/\D+/g, "");
            if (v1.length > 11) {
                v1 = v1.substring(0, 14);
                v1 = v1.replace(/^(\d{2})(\d)/, "$1.$2");
                v1 = v1.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                v1 = v1.replace(/\.(\d{3})(\d)/, ".$1/$2");
                v1 = v1.replace(/(\d{4})(\d)/, "$1-$2");
            } else {
                v1 = v1.replace(/(\d{3})(\d)/, "$1.$2");
                v1 = v1.replace(/(\d{3})(\d)/, "$1.$2");
                v1 = v1.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            }
            return v1;

        case "cpf":
            let cpf = value.replace(/\D+/g, "");
            cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
            cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
            cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            return cpf;
        case "cnpj":
            let cnpj = value.replace(/\D+/g, "");
            cnpj = cnpj.substring(0, 14);
            cnpj = cnpj.replace(/^(\d{2})(\d)/, "$1.$2");
            cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            cnpj = cnpj.replace(/\.(\d{3})(\d)/, ".$1/$2");
            cnpj = cnpj.replace(/(\d{4})(\d)/, "$1-$2");
            return cnpj;


        case "tel":
            if (value.length <= 14) {
                const regex = /^([0-9]{2})([0-9]{4,5})([0-9]{4})$/;
                var str = value.replace(/[^0-9]/g, "").slice(0, 11);
                return str.replace(regex, "($1) $2-$3");
            } else {
                return value;
            }

        case "cep":
            return value
                .replace(/\D+/g, "")
                .replace(/(\d{5})(\d)/, "$1-$2")
                .replace(/(-\d{3})\d+?$/, "$1");
        case "real":
        case "preco":
            if (typeof value == 'string') {

                const inputValue = value;

                // Se o valor estiver vazio, define para "0.00"
                if (!inputValue || Number(inputValue) == 0) {
                    return '0,00';
                }

                // Remove caracteres não numéricos
                const numericValue = inputValue.replace(/[^0-9]/g, '');

                // Remove zeros à esquerda antes dos dígitos inteiros
                const trimmedValue = numericValue.replace(/^0*(\d*)$/, '$1');

                // se value tiver menos que 3 length ele irá acrecentar um zero até ficar igual a 3
                let valor_trim = trimmedValue
                if (trimmedValue.length < 3) {
                    valor_trim = `0${trimmedValue}`;
                    if (valor_trim.length < 3) {
                        valor_trim = `0${valor_trim}`;
                    }
                }
                const valor_increment = valor_trim


                // Adiciona a vírgula antes dos últimos dois dígitos
                const formattedValue = valor_increment.replace(/(\d*)(\d{2})$/, (_, inteira, decimal) => {
                    return inteira ? `${inteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimal.padStart(2, '0') || '00'}` : '0,00';
                });

                return formattedValue
            }
            break
        case "percentual":
            if (typeof value == 'string') {
                const inputValue = value;

                // Se o valor estiver vazio, define para "0,00"
                if (!inputValue || Number(inputValue) == 0) {
                    return '0,00';
                }

                // Remove caracteres não numéricos
                const numericValue = inputValue.replace(/[^0-9]/g, '');

                // Remove zeros à esquerda antes dos dígitos inteiros
                const trimmedValue = numericValue.replace(/^0*(\d*)$/, '$1');

                // Se o valor tiver menos que 3 caracteres, acrescenta zeros à esquerda
                let valor_trim = trimmedValue;
                if (trimmedValue.length < 3) {
                    valor_trim = `0${trimmedValue}`;
                    if (valor_trim.length < 3) {
                        valor_trim = `0${valor_trim}`;
                    }
                }
                const valor_increment = valor_trim;

                // Adiciona a vírgula antes dos últimos dois dígitos
                let formattedValue = valor_increment.replace(/(\d*)(\d{2})$/, (_, inteira, decimal) => {
                    return inteira ? `${inteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimal.padStart(2, '0') || '00'}` : '0,00';
                });

                // Converte para número decimal para verificar os limites
                let decimalValue = parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));

                // Limita o valor a 100,00 no máximo e 0,00 no mínimo
                decimalValue = Math.min(Math.max(decimalValue, 0), 100);

                // Formata o valor dentro do limite com duas casas decimais
                formattedValue = decimalValue.toFixed(2).replace('.', ',');

                return formattedValue;
            }
            break;
        case "numero":
            if (typeof value == 'string') {
                const inputValue = value;

                // Remove caracteres não numéricos
                let numericValue = inputValue.replace(/[^0-9]/g, '');

                // Remove zeros à esquerda
                numericValue = numericValue.replace(/^0+/, '');

                // Retorna o valor numérico ou "0" se estiver vazio
                return numericValue || '0';
            }
            break;


        default:

            return value;
    }

};

// export const numberFormat = (value: number, decimals: number = 2, decimalSeparator: string = '.', thousandSeparator: string = ',') => {
//     const parts = value.toFixed(decimals).split('.');
//     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
//     return parts.join(decimalSeparator);
// }

export const numberFormat = (
    value: number | string,
    decimals: number = 2,
    decimalSeparator: string = '.',
    thousandSeparator: string = ','
): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const parts = numValue.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    return parts.join(decimalSeparator);
};

export const FormatToDaySQLDate = (): string => {
    let day = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
    });
    let month = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        month: "2-digit",
    });
    let year = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        year: "numeric",
    });
    return `${year}-${month}-${day}`;
};

export const FormatToDayFormateDate = (): string => {
    let day = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
    });
    let month = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        month: "2-digit",
    });
    let year = new Date().toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        year: "numeric",
    });
    return `${day}/${month}/${year}`;
};

export const formatDateSQL = (date: any) => date.toISOString().split('T')[0];
export const formatDateSQLForBR = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  export const formatDateTimeBR = (dateTime?: string): string => {
    if (!dateTime) return "";
  
    const [date, time] = dateTime.split("T");
    if (!date || !time) return "";
  
    const [year, month, day] = date.split("-");
    const [hour, minute] = time.split(":");
  
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };
  

export const diasMesSelect = () => {
    const optDiaVencimento: SelectOptions[] = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' },
        { value: 6, label: '6' },
        { value: 7, label: '7' },
        { value: 8, label: '8' },
        { value: 9, label: '9' },
        { value: 10, label: '10' },
        { value: 11, label: '11' },
        { value: 12, label: '12' },
        { value: 13, label: '13' },
        { value: 14, label: '14' },
        { value: 15, label: '15' },
        { value: 16, label: '16' },
        { value: 17, label: '17' },
        { value: 18, label: '18' },
        { value: 19, label: '19' },
        { value: 20, label: '20' },
        { value: 21, label: '21' },
        { value: 22, label: '22' },
        { value: 23, label: '23' },
        { value: 24, label: '24' },
        { value: 25, label: '25' },
        { value: 26, label: '26' },
        { value: 27, label: '27' },
        { value: 28, label: '28' },
        { value: 29, label: '29' },
        { value: 30, label: '30' },
        { value: 31, label: '31' }

    ];

    return optDiaVencimento;
}
export const UFEstadosSelect = () => {
    const optDiaVencimento: SelectOptions[] = [
        { value: "AC", label: 'AC' },
        { value: "AL", label: 'AL' },
        { value: "AP", label: 'AP' },
        { value: "AM", label: 'AM' },
        { value: "BA", label: 'BA' },
        { value: "CE", label: 'CE' },
        { value: "DF", label: 'DF' },
        { value: "ES", label: 'ES' },
        { value: "GO", label: 'GO' },
        { value: "MA", label: 'MA' },
        { value: "MT", label: 'MT' },
        { value: "MS", label: 'MS' },
        { value: "MG", label: 'MG' },
        { value: "PA", label: 'PA' },
        { value: "PB", label: 'PB' },
        { value: "PR", label: 'PR' },
        { value: "PE", label: 'PE' },
        { value: "PI", label: 'PI' },
        { value: "RJ", label: 'RJ' },
        { value: "RN", label: 'RN' },
        { value: "RS", label: 'RS' },
        { value: "RO", label: 'RO' },
        { value: "RR", label: 'RR' },
        { value: "SC", label: 'SC' },
        { value: "SP", label: 'SP' },
        { value: "SE", label: 'SE' },
        { value: "TO", label: 'TO' },

    ];

    return optDiaVencimento;
}
export const mesesSelect = () => {
    const optMesesAno: SelectOptions[] = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' },

    ];

    return optMesesAno;
}

export const buscarMesPorNumero = (numeroMes: number): any => {
    const meses = mesesSelect();

    const mes = meses.find((mes) => mes.value === numeroMes);
    return mes ? mes.label : null;
};

export const validarDiaMes = (dia: number, mes: number, ano: number): boolean => {
    // Definindo os dias máximos para cada mês (mês 2 é fevereiro)
    const diasPorMes: any = {
        1: 31, // Janeiro
        2: 29, // Fevereiro, considerando ano bissexto
        3: 31, // Março
        4: 30, // Abril
        5: 31, // Maio
        6: 30, // Junho
        7: 31, // Julho
        8: 31, // Agosto
        9: 30, // Setembro
        10: 31, // Outubro
        11: 30, // Novembro
        12: 31, // Dezembro
    };

    // Função para verificar se o ano é bissexto
    const isAnoBissexto = (ano: number): boolean => {
        return (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
    };

    // Se o mês for fevereiro (mes 2), considerar o ano bissexto
    if (mes === 2) {
        diasPorMes[2] = isAnoBissexto(ano) ? 29 : 28;
    }

    // Verifica se o dia é válido para o mês
    return dia >= 1 && dia <= diasPorMes[mes];
};

export const AnosSelect = (): SelectOptions[] => {
    const currentYear = new Date().getFullYear(); // Obtém o ano atual
    const optMesesAno: SelectOptions[] = Array.from({ length: 10 }, (_, i) => ({
        value: currentYear + i,
        label: (currentYear + i).toString(),
    }));

    return optMesesAno;
};

export const ajustaMoedaBanco = (valor: string): number => {
    if(valor){
        const numericValue = valor.replace(/[^0-9]/g, '');
        const valor_ajustado = parseFloat(numericValue) / 100;
        return valor_ajustado
    }
    return valor;

} 
export const formatarParaMoedaReal = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
//   export const formatarParaMoedaSemSimbolo = (valor: number): string => {
//     return valor.toLocaleString('pt-BR', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   export const formatarParaMoedaSemSimbolo = (valor: number | string): string => {
//     const numero = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  
//     return numero.toLocaleString('pt-BR', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

export const formatarParaMoedaSemSimbolo = (valor: number | string | undefined | null): string => {
    if (valor === undefined || valor === null || valor === '') return '0,00';
  
    const numero = typeof valor === 'string'
      ? parseFloat(valor.replace(',', '.'))
      : valor;
  
    if (isNaN(numero)) return '0,00';
  
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
export const NumeroSelect = (): SelectOptions[] => {
    const numeros: SelectOptions[] = [];

    for (let i = 1; i <= 50; i++) {
        numeros.push({ value: i.toString(), label: i.toString() });
    }

    return numeros;
}

export const formaPagamentoSelect = () => {
    const optFormasPagamento: SelectOptions[] = [
        { value: 1, label: 'Dinheiro' },
        { value: 2, label: 'Pix' },
        { value: 4, label: 'Cartão de Crédito' },
        { value: 3, label: 'Cartão de Débito' },
        // { value: 5, label: 'Crediário' },
        // { value: 6, label: 'Transferência Bancária' },
        // { value: 7, label: 'Cheque' },
        // { value: 8, label: 'Vale (funcionário ou cliente)' },
        // { value: 9, label: 'Outros' }

    ];

    return optFormasPagamento;
}

    export const formatTelefone = (numero: string): string => {
        const numeroLimpo = ("" + numero).replace(/\D/g, "");
        const tel_formatado = numeroLimpo.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    
        if (tel_formatado) {
            return `(${tel_formatado[1]}) ${tel_formatado[2]}-${tel_formatado[3]}`;
        }
    
        return numero;
    };

    export function sanitizeToNumber(valor: string | number | undefined): number {
        if (!valor) return 0;
        
        if (typeof valor === 'number') return valor;
      
        // Remove tudo que não for número ou ponto
        const cleaned = valor.replace(/[^0-9,.-]/g, '').replace(',', '.');
      
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
export const getChartColorsArray = (colors: string): string[] => {
    const parsedColors: string[] = JSON.parse(colors);
    return parsedColors.map(function (value: string) {
        var newValue = value.replace(" ", "");
        if (newValue.indexOf(",") === -1) {
            var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);

            if (color.indexOf("#") !== -1)
                color = color.replace(" ", "");
            if (color) return color;
            else return newValue;
        } else {
            var val = value.split(',');
            if (val.length === 2) {
                var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
                rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
                return rgbaColor;
            } else {
                return newValue;
            }
        }
    });
};
export const borderColorCategory = (tipoOrigem: number | string) => {
    const styleBorder: React.CSSProperties = {
      paddingLeft: "0.4rem"
    };

    switch (Number(tipoOrigem)) {
        case 1:
            styleBorder.borderLeft = "4px solid #0ab39c";
            break;
        case 3:
            styleBorder.borderLeft = "4px solid #f7b84b";
            break;
        case 4:
                styleBorder.borderLeft = "4px solid #2d98da";
            break;
        case 5:
            styleBorder.borderLeft = "4px solid #f06548";
            break;
        case 6:
            styleBorder.borderLeft = "4px solid #adb5bd";
            break;
        case 7:
            styleBorder.borderLeft = "4px solid #000";
            break;
        default:
            break;
    }
  
    return styleBorder;
  };
  export const empty = (params: any): boolean => {
    if (
        params === null ||
        params === undefined ||
        params.length === 0 ||
        params.length === undefined
    ) {
        return true;
    } else {
        return false;
    }
};


/**
 * Verifica se a string é CPF ou CNPJ
 * @param cpf_cnpj
 * @returns
 */
export const tipoPessoa = (cpf_cnpj: any): boolean => {
    let tipo = false;
    if (empty(cpf_cnpj)) {
        tipo = true;
    }
    else if (cpf_cnpj.replace(/\D/g, "").length === 11) {
        tipo = true;
    }
    return tipo;
};
/**
 * Formata CPf ou CNPJ
 * @param cpf_cnpj
 * @returns
 */
export const formatCpfCnpj = (cpf_cnpj: any): string => {
    if (!cpf_cnpj) {
        return cpf_cnpj;
    }
    if (tipoPessoa(cpf_cnpj)) {
        return cpf_cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else {
        return cpf_cnpj.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
        );
    }
};