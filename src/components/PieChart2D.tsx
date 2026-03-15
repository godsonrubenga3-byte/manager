import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChart2DProps {
  data: { category: string; amount: number }[];
  currency: string;
}

const COLORS = [
  '#800020', // Primary Burgundy
  '#059669', // Emerald
  '#d97706', // Amber
  '#2563eb', // Blue
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4b5563'  // Slate
];

export default function PieChart2D({ data, currency }: PieChart2DProps) {
  const total = data.reduce((sum, entry) => sum + entry.amount, 0);

  const chartData = data.map((entry) => ({
    ...entry,
    percentage: total > 0 ? Math.round((entry.amount / total) * 100) : 0,
  }));

  return (
    <div className="h-[450px] w-full glass rounded-3xl border-white/10 p-8 backdrop-blur-xl relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Spending Breakdown</h3>
          <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">Category Distribution</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-bold text-primary">
            {total.toLocaleString()} <span className="text-xs text-stone-500">{currency}</span>
          </div>
          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-tight">Total Period Spend</div>
        </div>
      </div>
      
      <div className="flex-1 relative mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              outerRadius="85%" 
              innerRadius="60%" 
              dataKey="amount"
              nameKey="category"
              paddingAngle={5}
              cornerRadius={8}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(20,20,20,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: 'white', fontWeight: 'bold' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} ${currency}`,
                `${name}`
              ]}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-2xl font-bold text-white">{total > 0 ? '100%' : '0%'}</div>
          <div className="text-[10px] text-stone-500 font-bold uppercase">Expenses</div>
        </div>
      </div>
    </div>
  );
}
