import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface PerformanceChartProps {
    title: string;
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
    type?: 'line' | 'area';
    height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
    title,
    data,
    xKey,
    yKey,
    color = '#4f46e5',
    type = 'area',
    height = 300
}) => {
    return (
        <div className="admin-card" style={{
            marginBottom: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827'
            }}>
                {title}
            </h3>

            <div style={{ height: height, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'area' ? (
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey={xKey}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={yKey}
                                stroke={color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorArea)"
                            />
                        </AreaChart>
                    ) : (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey={xKey}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={yKey}
                                stroke={color}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceChart;
