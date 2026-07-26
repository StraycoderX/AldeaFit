interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="display text-3xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {subtitle}
      </p>
    </header>
  );
}
