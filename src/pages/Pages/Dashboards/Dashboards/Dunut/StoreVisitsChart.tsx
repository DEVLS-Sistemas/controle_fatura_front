import { getChartColorsArray } from 'helpers/dashboards_helpers';
import React from 'react';
import ReactApexChart from 'react-apexcharts';


interface Props {
  series: number[];
  dataLabelText: string[]; 
  dataColors: string;
}

const StoreVisitsChart: React.FC<Props> = ({ series, dataColors, dataLabelText }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels: dataLabelText,
    chart: { height: 333, type: 'donut' },
    legend: { position: 'bottom' },
    stroke: { show: false },
    dataLabels: { dropShadow: { enabled: false } },
    colors,
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={333}
      className="apex-charts"
      dir="ltr"
    />
  );
};

export default StoreVisitsChart;
