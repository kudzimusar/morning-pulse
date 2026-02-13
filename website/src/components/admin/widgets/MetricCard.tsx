import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number; // Percentage change
    trend?: 'up' | 'down' | 'neutral';
    icon: string | React.ReactNode;
    color: string;
    description?: string;
    onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    trend,
    icon,
    color,
    description,
    onClick
}) => {
    return (
        <div
            className="admin-card"
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (onClick) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                if (onClick) e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Decorative accent */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '4px',
                width: '100%',
                backgroundColor: color
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                }}>
                    {title}
                </h3>
                <div style={{
                    color: color,
                    backgroundColor: `${color}10`,
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                }}>
                    {icon}
                </div>
            </div>

            <div>
                <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#111827',
                    lineHeight: '1.2'
                }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {change !== undefined && (
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {Math.abs(change)}%
                        </span>
                    )}
                    {description && (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {description}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
