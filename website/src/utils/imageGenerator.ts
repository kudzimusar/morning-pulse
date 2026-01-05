export function getImageByTopic(headline: string, id?: string): string {
  const lower = (headline || '').toLowerCase();
  let searchTerm = 'news,journalism';
  
  if (lower.includes('tech') || lower.includes('ai') || lower.includes('artificial') || lower.includes('digital')) {
    searchTerm = 'technology,computer,digital';
  } else if (lower.includes('polit') || lower.includes('government') || lower.includes('election')) {
    searchTerm = 'government,politics,democracy';
  } else if (lower.includes('econom') || lower.includes('business') || lower.includes('finance') || lower.includes('market')) {
    searchTerm = 'business,finance,economy';
  } else if (lower.includes('climate') || lower.includes('environment') || lower.includes('energy')) {
    searchTerm = 'nature,environment,climate';
  } else if (lower.includes('health') || lower.includes('medical') || lower.includes('pandemic')) {
    searchTerm = 'health,medical,science';
  } else if (lower.includes('educat') || lower.includes('school') || lower.includes('university')) {
    searchTerm = 'education,learning,student';
  } else if (lower.includes('sport') || lower.includes('game') || lower.includes('athlete')) {
    searchTerm = 'sports,competition,athlete';
  }
  
  // Unsplash Source (no API key). Note: this URL 302-redirects to images.unsplash.com.
  const sig = id ? `&sig=${encodeURIComponent(id)}` : '';
  return `https://source.unsplash.com/1200x800/?${searchTerm}${sig}`;
}
