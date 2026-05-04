type DonutDatum = { val: number; color: string; label?: string };

export function DonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((s, d) => s + (Number(d.val) || 0), 0);
  const r = 44;
  const cx = 55;
  const cy = 55;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  // Don't render if total is 0 or NaN to avoid NaN attributes
  if (!total || !isFinite(total)) {
    return (
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="18" />
        <circle cx={cx} cy={cy} r="30" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      {data.map((d, i) => {
        const val = Number(d.val) || 0;
        const dash = (circ * val) / total;
        const offset = -cumulative + circ / 4;
        cumulative += dash;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="18"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r="30" fill="#fff" />
    </svg>
  );
}

export function SparkLine() {
  return (
    <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#sparkGradient)"
        points="0,80 0,60 30,50 60,52 90,35 120,38 150,22 180,15 200,10 200,80"
      />
      <polyline
        fill="none"
        stroke="#6c63ff"
        strokeWidth="2.5"
        points="0,60 30,50 60,52 90,35 120,38 150,22 180,15 200,10"
      />
    </svg>
  );
}
