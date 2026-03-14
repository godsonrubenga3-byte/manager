import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChart2DProps {
  data: { category: string; amount: number }[];
}

const COLORS = [
  '#800020',
  '#a52a2a',
  '#5c1010',
  '#911e1e',
  '#4d0013',
  '#66001b',
  '#b22222',
  '#dc143c',
  '#cd5c5c'
];

export default function PieChart2D({ data }: PieChart2DProps) {
  const total = data.reduce((sum, entry) => sum + entry.amount, 0);

  const chartData = data.map((entry) => ({
    ...entry,
    percentage: total > 0 ? Math.round((entry.amount / total) * 100) : 0,
  }));

  return (
    <div className="h-[400px] w-full glass rounded-2xl border-white/10 p-6 backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Spending Breakdown</h3>
        <div className="text-sm text-stone-400 font-mono">
          Total: {data.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} {localStorage.getItem('manager_currency') === 'TZS' ? 'TZS' : '₹'}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={40}
            dataKey="amount"
            nameKey="category"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            cornerRadius={6}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={3} stroke="rgba(255,255,255,0.15)" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(30,30,30,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}
            formatter={(value: number, name: string) => [
              `${name}: ${value.toLocaleString()}`,
              `${name}`
            ]}
            labelStyle={{ color: 'white' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 space-y-2">
        {chartData.slice(0, 6).map((entry, index) => (
          <div key={entry.category} className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="font-mono text-white font-medium">{entry.category}</span>
            <span className="ml-auto text-stone-400">{Math.round((entry.amount / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

