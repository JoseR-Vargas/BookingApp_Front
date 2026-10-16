import { useMemo } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getMonthlyCounts } from '../../utils/adminStats.js';
import ChartFrame from './ChartFrame.jsx';

// Register only what a line chart needs (keeps the bundle small, unlike chart.js/auto).
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
};

/** Bookings per month of the current year (legacy "Reservas por Mes" chart). */
export default function BookingsChart({ bookings }) {
  const data = useMemo(() => {
    const year = new Date().getFullYear();
    return {
      labels: MONTHS,
      datasets: [{
        label: `Reservas ${year}`,
        data: getMonthlyCounts(bookings, year),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4,
      }],
    };
  }, [bookings]);

  return (
    <ChartFrame>
      <Line data={data} options={OPTIONS} />
    </ChartFrame>
  );
}
