import React from 'react';
import OpinionSubmissionForm from './OpinionSubmissionForm';

// Alias component for requested path.
// Morning Pulse uses OpinionSubmissionForm for guest essays; this keeps imports stable.
export default function GuestSubmission(props: any) {
  return <OpinionSubmissionForm {...props} />;
}

