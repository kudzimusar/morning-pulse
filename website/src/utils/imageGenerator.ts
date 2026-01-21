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
  
  // Use a reliable placeholder service instead of deprecated source.unsplash.com
  // Using picsum.photos with a seed based on ID for consistent images
  const width = 1200;
  const height = 800;
  
  // Create a seed from the ID or use a hash of the search term
  let seed = 0;
  if (id) {
    // Convert ID to a number seed
    for (let i = 0; i < id.length; i++) {
      seed = ((seed << 5) - seed) + id.charCodeAt(i);
      seed = seed & seed; // Convert to 32-bit integer
    }
    seed = Math.abs(seed) % 1000;
  } else {
    // Use search term as seed
    for (let i = 0; i < searchTerm.length; i++) {
      seed = ((seed << 5) - seed) + searchTerm.charCodeAt(i);
      seed = seed & seed;
    }
    seed = Math.abs(seed) % 1000;
  }
  
  // Use picsum.photos with seed for consistent, reliable placeholder images
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
