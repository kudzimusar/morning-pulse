import React, { useState, useEffect } from 'react';

interface StaffMember {
  name: string;
  role?: string;
  email?: string;
  bio?: string;
}

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditorialTeam, setShowEditorialTeam] = useState(false);

  useEffect(() => {
    // Check if we're on the editorial team section
    const hash = window.location.hash;
    if (hash.includes('#about') || hash.includes('editorial-team')) {
      setShowEditorialTeam(true);
    }

    // Fetch staff data
    const fetchStaff = async () => {
      try {
        // Try multiple possible paths for staff data
        const possiblePaths = [
          '/morning-pulse/data/staff.json',
          '/data/staff.json',
          './data/staff.json'
        ];

        let staffData: StaffMember[] = [];

        for (const path of possiblePaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const data = await response.json();
              // Handle both array and object formats
              if (Array.isArray(data)) {
                staffData = data;
              } else if (data.staff && Array.isArray(data.staff)) {
                staffData = data.staff;
              } else if (data.members && Array.isArray(data.members)) {
                staffData = data.members;
              } else if (data.editorial && Array.isArray(data.editorial)) {
                staffData = data.editorial;
              }
              break; // Successfully loaded, exit loop
            }
          } catch (err) {
            // Try next path
            continue;
          }
        }

        setStaff(staffData);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">About Us</h1>
      </div>
      
      <div className="page-content">
        <div className="content-section">
          <h2>Our Mission</h2>
          <p className="lead-text">
            Morning Pulse is more than a news site. We are a multi-dimensional ecosystem 
            that bridges the gap between local Zimbabwean stories and global trends via 
            Web, WhatsApp, and AI.
          </p>
          
          <p>
            Founded on the principle of accessible, timely, and comprehensive news coverage, 
            Morning Pulse delivers curated content across seven key dimensions: Local (Zim), 
            Business (Zim), African Focus, Global, Sports, Tech, and General News.
          </p>

          <h3>Our Approach</h3>
          <p>
            We leverage cutting-edge AI technology combined with traditional journalistic 
            standards to aggregate, curate, and deliver news that matters. Our multi-channel 
            distribution ensures that news reaches our audience wherever they are—whether on 
            the web, through WhatsApp, or on social media platforms.
          </p>

          <h3>Our Vision</h3>
          <p>
            To become the premier news aggregator for Zimbabwe and beyond, providing 
            comprehensive coverage that informs, engages, and empowers our readers to 
            make informed decisions in an increasingly connected world.
          </p>

          {/* Editorial Team Section */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            <h2>Editorial Team</h2>
            {loading ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Loading editorial team...</p>
            ) : staff.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                {staff.map((member, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h4 style={{ marginBottom: '0.5rem', color: '#1f2937', fontSize: '1.125rem' }}>
                      {member.name}
                    </h4>
                    {member.role && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        marginBottom: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {member.role}
                      </p>
                    )}
                    {member.bio && (
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#4b5563', 
                        lineHeight: '1.6',
                        marginBottom: '0.75rem'
                      }}>
                        {member.bio}
                      </p>
                    )}
                    {member.email && (
                      <a 
                        href={`mailto:${member.email}`}
                        style={{ 
                          fontSize: '0.875rem', 
                          color: '#2563eb',
                          textDecoration: 'none',
                          display: 'inline-block',
                          marginTop: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {member.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '1rem' }}>
                Our editorial team information is being updated. Please check back soon.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
