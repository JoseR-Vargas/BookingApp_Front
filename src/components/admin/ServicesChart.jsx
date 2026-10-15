import { useMemo } from 'react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { getServiceCounts } from '../../utils/adminStats.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

const OPTIONS = {
  responsive: true,
  plugins: { legend: { position: 'bottom' } },
};

/** Bookings per service (legacy "Servicios Más Populares" chart). */
export default function ServicesChart({ bookings }) {
  const data = useMemo(() => {
    const { labels, data: counts } = getServiceCounts(bookings);
    const hasData = labels.length > 0;
    const slices = hasData ? labels : ['Sin datos'];
    return {
      labels: slices,
      datasets: [{
        data: hasData ? counts : [1],
        // The palette repeats when there are more services than colors (legacy left the extra slices unpainted).
        backgroundColor: slices.map((_, index) => PALETTE[index % PALETTE.length]),
      }],
    };
  }, [bookings]);

  return <Doughnut data={data} options={OPTIONS} />;
}
