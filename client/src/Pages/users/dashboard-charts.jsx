import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { TrendingUp, Lightbulb } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md">
      <p className="text-[11px] font-bold text-foreground mb-1">{label}</p>
      <p className="text-[12px] font-bold text-primary">{payload[0].value} Deliveries</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md">
      <p className="text-[11px] font-bold text-foreground mb-1">{d.name}</p>
      <p className="text-[14px] font-black" style={{ color: d.color }}>{payload[0].value}</p>
    </div>
  );
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent <= 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold pointer-events-none">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DeliveryTrendChart({ data }) {
  if (!data?.length) {
    return <div className="flex items-center justify-center h-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No trend data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Line type="monotone" dataKey="count" name="Deliveries" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data, title }) {
  const hasData = data?.some(d => d.value > 0);
  if (!hasData) {
    return <div className="flex items-center justify-center h-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No data</div>;
  }
  return (
    <div className="flex flex-col h-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" label={renderPieLabel} labelLine={false}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <RechartsTooltip content={<PieTooltip />} cursor={{ fill: 'transparent' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-3 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyBarChart({ data }) {
  if (!data?.some(d => d.count > 0)) {
    return <div className="flex items-center justify-center h-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 600 }} dy={10} interval={0} />
        <YAxis hide={true} />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32} fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
}
