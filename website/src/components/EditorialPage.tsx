import React from 'react';

interface EditorialPageProps {
  onBack: () => void;
}

const EditorialPage: React.FC<EditorialPageProps> = ({ onBack }) => {
  return (
    <div className="institutional-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">← Back to News</button>
        <h1 className="page-title">Editorial Guidelines</h1>
      </div>
      
      <div className="page-content">
        <div className="content-section">
          <h2>Our Editorial Model</h2>
          <p className="lead-text">
            Morning Pulse operates on an AI-Human Hybrid model, using Gemini for speed 
            and aggregation, with strict journalistic oversight for accuracy.
          </p>

          <h3>AI-Assisted Aggregation</h3>
          <p>
            We utilize Google's Gemini AI to rapidly aggregate news from multiple sources 
            across the web. This technology allows us to:
          </p>
          <ul>
            <li>Process large volumes of information quickly</li>
            <li>Identify trending stories across multiple categories</li>
            <li>Extract key information and summarize content</li>
            <li>Cross-reference sources for comprehensive coverage</li>
          </ul>

          <h3>Human Oversight & Quality Control</h3>
          <p>
            Every piece of content undergoes human review to ensure:
          </p>
          <ul>
            <li><strong>Accuracy:</strong> All facts are verified against primary sources</li>
            <li><strong>Balance:</strong> Multiple perspectives are presented where applicable</li>
            <li><strong>Relevance:</strong> Content aligns with our editorial standards</li>
            <li><strong>Ethics:</strong> Journalistic integrity is maintained</li>
            <li><strong>Context:</strong> Stories are properly contextualized for our audience</li>
          </ul>

          <h3>Source Attribution</h3>
          <p>
            We always attribute news to its original source. Our aggregation process 
            maintains clear source links, allowing readers to verify information and 
            access original content.
          </p>

          <h3>Corrections Policy</h3>
          <p>
            We are committed to accuracy. If errors are identified, corrections are 
            made promptly and transparently. Readers can report inaccuracies by 
            contacting info@morningpulse.net.
          </p>

          <h3>Independence</h3>
          <p>
            Morning Pulse maintains editorial independence. Our content decisions are 
            not influenced by advertisers, sponsors, or external parties. Our mission 
            is to serve our readers with accurate, relevant, and timely news.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorialPage;
