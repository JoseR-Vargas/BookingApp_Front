// Centered title + subtitle shared by the three booking steps (legacy `h4` + `p.text-muted`).
export default function StepHeading({ title, subtitle }) {
  return (
    <div className="mb-6 text-center">
      <h4 className="mb-2 text-[length:calc(1.275rem+0.3vw)] leading-tight xl:text-xl lte-sm:text-[1.3rem]">
        {title}
      </h4>
      <p className="mb-4 leading-loose text-text-secondary lte-sm:text-[0.9rem]">{subtitle}</p>
    </div>
  );
}
