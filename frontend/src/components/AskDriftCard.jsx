import React from 'react';
import RealtimeChatbot from './RealtimeChatbot';

export default function AskDriftCard({ studentId }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <RealtimeChatbot studentId={studentId} isFloating={false} />
    </div>
  );
}
