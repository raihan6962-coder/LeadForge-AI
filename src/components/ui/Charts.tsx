import { type ChartPoint } from '@/types';

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  fillOpacity?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  showDots?: boolean;
  showArea?: boolean;
}

export function LineChart({
  data, height = 200, color = '#06b6d4', fillOpacity = 0.15, showGrid = true, showAxis = true, showDots = false, showArea = true,
}: LineChartProps) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!data || data.length === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="12" fill="#6e7681">No data available</text>
      </svg>
    );
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {showGrid && Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = padding.top + (i / gridLines) * chartH;
        const val = Math.round(maxVal - (i / gridLines) * range);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            {showAxis && <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#6e7681">{val}</text>}
          </g>
        );
      })}

      {showArea && <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="transition-all hover:r-5" />
      ))}

      {showAxis && points.map((p, i) => (
        <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize="9" fill="#6e7681">{p.label}</text>
      ))}
    </svg>
  );
}

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
}

export function BarChart({ data, height = 200, color = '#06b6d4', horizontal = false, showValues = false }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="w-full text-center text-secondary text-xs py-8">No data available</div>;
  }
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className="w-full space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-secondary w-24 truncate flex-shrink-0">{d.label}</span>
            <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: color }}
              >
                {showValues && <span className="text-[10px] text-white font-medium">{d.value}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barWidth = chartW / data.length * 0.6;
  const gap = chartW / data.length * 0.4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {Array.from({ length: 5 }, (_, i) => {
        const y = padding.top + (i / 4) * chartH;
        const val = Math.round(maxVal - (i / 4) * maxVal);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#6e7681">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="3" fill={color} opacity="0.9" className="transition-all" />
            {showValues && <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#8b949e">{d.value}</text>}
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="9" fill="#6e7681">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: DonutChartProps) {
  if (!data || data.length === 0) {
    return <div className="w-full text-center text-secondary text-xs py-8">No data available</div>;
  }
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference;
            const segment = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-2xl font-bold text-primary tabular-nums">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-secondary">{d.label}</span>
            <span className="text-xs text-muted tabular-nums ml-auto">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HeatmapProps {
  data: number[][];
  xLabels?: string[];
  yLabels?: string[];
}

export function Heatmap({ data, xLabels, yLabels }: HeatmapProps) {
  if (!data || data.length === 0 || (data[0] && data[0].length === 0)) {
    return <div className="w-full text-center text-secondary text-xs py-8">No data available</div>;
  }
  const max = Math.max(...data.flat(), 1);
  const days = yLabels || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = xLabels || Array.from({ length: 24 }, (_, i) => `${i}`);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex">
          <div className="w-10 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-24 gap-0.5">
            {hours.map((h, i) => (
              <div key={i} className="text-[8px] text-muted text-center">{i % 3 === 0 ? h : ''}</div>
            ))}
          </div>
        </div>
        {data.map((row, dayIdx) => (
          <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-10 text-[10px] text-muted text-right pr-1">{days[dayIdx]}</span>
            <div className="flex-1 grid grid-cols-24 gap-0.5">
              {row.map((val, hourIdx) => {
                const intensity = val / max;
                return (
                  <div
                    key={hourIdx}
                    className="aspect-square rounded-sm transition-all hover:ring-1 hover:ring-accent-400"
                    style={{
                      backgroundColor: `rgba(6, 182, 212, ${0.05 + intensity * 0.85})`,
                    }}
                    title={`${days[dayIdx]} ${hours[hourIdx]}:00 — ${val} events`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
