// Fluid frame for Chart.js canvases. Chart.js sizes a responsive canvas from its container, so the
// container must be allowed to shrink (min-w-0 / max-w-full) and own the height: the aspect ratio
// lives in CSS (2:1 like Chart.js' default, a taller 5:4 on phones) and the charts run with
// `maintainAspectRatio: false`. A bare canvas would keep its 300px intrinsic width and push the
// grid wider than the viewport.
export default function ChartFrame({ children }) {
  return <div className="relative aspect-2/1 w-full max-w-full min-w-0 lte-sm:aspect-5/4">{children}</div>;
}
