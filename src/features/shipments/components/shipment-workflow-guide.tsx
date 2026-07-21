type ShipmentWorkflowGuideProps = {
  steps: Array<{
    description: string;
    label: string;
  }>;
  title: string;
};

export function ShipmentWorkflowGuide({ steps, title }: ShipmentWorkflowGuideProps) {
  return (
    <section aria-label={title} className="border-border bg-surface rounded-lg border p-4 sm:p-5">
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        {title}
      </p>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li className="flex min-w-0 gap-3" key={step.label}>
            <span className="bg-primary text-primary-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
