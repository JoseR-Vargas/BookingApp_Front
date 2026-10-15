// Legacy `.section-header`: section title that stacks under the top bar at <= 768px.
export default function SectionHeader({ title }) {
  return (
    <div className="mb-8 flex items-center justify-between lte-md:flex-col lte-md:items-start lte-md:gap-4">
      <h2 className="m-0 font-display text-[1.75rem] font-bold text-text-primary">{title}</h2>
    </div>
  );
}
