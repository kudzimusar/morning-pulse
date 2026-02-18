import React from 'react';
import { useReader } from '../context/ReaderContext';
import { Type, Minimize2, Maximize2, Moon, Sun, Monitor } from 'lucide-react';

const AppearanceMenu: React.FC = () => {
    const { fontSize, setFontSize, compactMode, toggleCompactMode, theme, setTheme } = useReader();

    return (
        <div className="appearance-menu" style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            backgroundColor: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            width: '260px',
            zIndex: 1000
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Display Settings
            </h3>

            {/* Font Size */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Font Size</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{Math.round(fontSize * 100)}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f3f4f6', padding: '4px', borderRadius: '6px' }}>
                    <button
                        onClick={() => setFontSize(1)}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: fontSize === 1 ? '#fff' : 'transparent',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            boxShadow: fontSize === 1 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                        aria-label="Normal text"
                    >
                        <span style={{ fontSize: '14px' }}>A</span>
                    </button>
                    <button
                        onClick={() => setFontSize(1.1)}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: fontSize === 1.1 ? '#fff' : 'transparent',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            boxShadow: fontSize === 1.1 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                        aria-label="Large text"
                    >
                        <span style={{ fontSize: '18px' }}>A</span>
                    </button>
                    <button
                        onClick={() => setFontSize(1.25)}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: fontSize === 1.25 ? '#fff' : 'transparent',
                            borderRadius: '4px',
                            padding: '6px',
                            cursor: 'pointer',
                            boxShadow: fontSize === 1.25 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                        aria-label="Extra large text"
                    >
                        <span style={{ fontSize: '22px' }}>A</span>
                    </button>
                </div>
            </div>

            {/* Density */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Density</span>
                </div>
                <button
                    onClick={toggleCompactMode}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        background: compactMode ? '#eff6ff' : '#fff',
                        color: compactMode ? '#1d4ed8' : '#374151',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {compactMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    {compactMode ? 'Switch to Comfortable' : 'Switch to Compact'}
                </button>
            </div>

            {/* Theme (Optional/Placeholder for now) */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Theme</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setTheme('light')}
                        style={{ flex: 1, padding: '6px', border: theme === 'light' ? '2px solid #000' : '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                        aria-label="Light mode"
                    >
                        <Sun size={16} style={{ display: 'block', margin: '0 auto' }} />
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        style={{ flex: 1, padding: '6px', border: theme === 'dark' ? '2px solid #000' : '1px solid #e5e7eb', borderRadius: '6px', background: '#1f2937', color: '#fff', cursor: 'pointer' }}
                        aria-label="Dark mode"
                    >
                        <Moon size={16} style={{ display: 'block', margin: '0 auto' }} />
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        style={{ flex: 1, padding: '6px', border: theme === 'system' ? '2px solid #000' : '1px solid #e5e7eb', borderRadius: '6px', background: '#f3f4f6', cursor: 'pointer' }}
                        aria-label="System theme"
                    >
                        <Monitor size={16} style={{ display: 'block', margin: '0 auto' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppearanceMenu;
