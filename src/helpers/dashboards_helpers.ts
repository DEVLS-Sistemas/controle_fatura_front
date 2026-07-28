// export const getChartColorsArray = (colors: string): string[] => {
//     const parsedColors: string[] = JSON.parse(colors);
//     return parsedColors.map(function (value: string) {
//         var newValue = value.replace(" ", "");
//         if (newValue.indexOf(",") === -1) {
//             var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);

//             if (color.indexOf("#") !== -1)
//                 color = color.replace(" ", "");
//             if (color) return color;
//             else return newValue;
//         } else {
//             var val = value.split(',');
//             if (val.length === 2) {
//                 var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
//                 rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
//                 return rgbaColor;
//             } else {
//                 return newValue;
//             }
//         }
//     });
// };
export const getChartColorsArray = (colors: string): string[] => {
    const parsedColors: string[] = JSON.parse(colors);
  
    return parsedColors.map(function (value: string) {
      let newValue = value.replace(" ", "");
  
      // ✅ Se não começar com "--", assume que é cor simples como "info" e converte
      if (!newValue.startsWith("--")) {
        newValue = `--vz-${newValue}`;
      }
  
      if (newValue.indexOf(",") === -1) {
        let color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
  
        if (color.indexOf("#") !== -1) {
          color = color.replace(" ", "");
        }
  
        return color || newValue;
      } else {
        const val = newValue.split(',');
  
        if (val.length === 2) {
          let rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  };
  

export const mapColorNamesToCSSVars = (color: string): string => {
    return `--vz-${color}`;
  };
    
  export const formatColorNamesToChartArray = (colors: string[]): string => {
    const cssVars = colors.map(color => `--vz-${color}`);
    return JSON.stringify(cssVars);
  }
// Resultado:
// ["--vz-info", "--vz-success", "--vz-warning", "--vz-danger"]
