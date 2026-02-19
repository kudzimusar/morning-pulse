import React from 'react';
import '../../styles/megapage.css';

interface MegaGridProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * MegaGrid Component
 * The 12-column layout engine for the "Morning Pulse 2.0" design.
 * Wraps content in a max-width container and applies the 12-col grid.
 */
export const MegaGrid: React.FC<MegaGridProps> = ({ children, className = '' }) => {
    return (
        <div className={`mega-page-container ${className}`}>
            <div className="mega-grid-12">
                {children}
            </div>
        </div>
    );
};
