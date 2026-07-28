import { getChartColorsArray } from 'helpers/dashboards_helpers';
import React from 'react';
import ReactApexChart from 'react-apexcharts';

interface Props {
  series: number[];
  dataLabelText: string[]; 
  dataColors: string;
}

const ProjectsStatusChart: React.FC<Props> = ({ series, dataColors, dataLabelText }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels: dataLabelText,
    chart: { type: 'donut', height: 230 },
    plotOptions: {
      pie: {
        size: 100,
        donut: { size: '90%', labels: { show: false } },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { lineCap: 'round', width: 0 },
    colors,
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={230}
      className="apex-charts"
      dir="ltr"
    />
  );
};

export default ProjectsStatusChart;
