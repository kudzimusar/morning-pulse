import React from 'react';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
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
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
