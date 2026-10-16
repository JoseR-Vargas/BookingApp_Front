import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// jsdom has no canvas: the chart wrappers are replaced with probes that expose their props.
vi.mock('react-chartjs-2', () => ({
  Line: (props) => (
    <div data-testid="line-chart" data-config={JSON.stringify({ data: props.data, options: props.options })} />
  ),
  Doughnut: (props) => (
    <div data-testid="doughnut-chart" data-config={JSON.stringify({ data: props.data, options: props.options })} />
  ),
}));

import ReportsSection from './ReportsSection.jsx';

const YEAR = new Date().getFullYear();
const config = (testId) => JSON.parse(screen.getByTestId(testId).getAttribute('data-config'));

const sample = [
  { date: `${YEAR}-01-05`, service: { name: 'Corte' } },
  { date: `${YEAR}-01-20`, service: { name: 'Corte' } },
  { date: `${YEAR}-03-02`, service: { name: 'Barba' } },
  { date: `${YEAR - 1}-03-02`, service: { name: 'Corte' } },
];

describe('ReportsSection', () => {
  it('renders both cards with the legacy headings', () => {
    render(<ReportsSection bookings={sample} />);

    expect(screen.getByRole('heading', { name: 'Reservas por Mes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Servicios Más Populares' })).toBeInTheDocument();
  });

  it('feeds the line chart with per-month counts of the CURRENT year only', () => {
    render(<ReportsSection bookings={sample} />);

    const { data, options } = config('line-chart');
    expect(data.labels).toEqual(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']);
    expect(data.datasets).toHaveLength(1);
    expect(data.datasets[0]).toMatchObject({
      label: `Reservas ${YEAR}`,
      data: [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      tension: 0.4,
    });
    expect(options).toMatchObject({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    });
  });

  it('feeds the doughnut with per-service counts, the legacy palette and a bottom legend', () => {
    render(<ReportsSection bookings={sample} />);

    const { data, options } = config('doughnut-chart');
    expect(data.labels).toEqual(['Corte', 'Barba']);
    expect(data.datasets[0].data).toEqual([3, 1]);
    expect(data.datasets[0].backgroundColor).toEqual(['#007bff', '#28a745']);
    expect(options).toMatchObject({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    });
  });

  it('repeats the palette when there are more services than colors', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ date: `${YEAR}-01-01`, service: { name: `Servicio ${i}` } }));

    render(<ReportsSection bookings={many} />);

    const colors = config('doughnut-chart').data.datasets[0].backgroundColor;
    expect(colors).toHaveLength(7);
    expect(colors[6]).toBe(colors[0]);
  });

  it('falls back to a single "Sin datos" slice when there are no bookings', () => {
    render(<ReportsSection bookings={[]} />);

    const { data } = config('doughnut-chart');
    expect(data.labels).toEqual(['Sin datos']);
    expect(data.datasets[0].data).toEqual([1]);
    expect(data.datasets[0].backgroundColor).toEqual(['#007bff']);
    expect(config('line-chart').data.datasets[0].data).toEqual(Array(12).fill(0));
  });

  it('reflects new bookings on re-render (the legacy charts were built once)', () => {
    const { rerender } = render(<ReportsSection bookings={[]} />);

    rerender(<ReportsSection bookings={sample} />);

    expect(config('doughnut-chart').data.labels).toEqual(['Corte', 'Barba']);
    expect(config('line-chart').data.datasets[0].data[0]).toBe(2);
  });
});
