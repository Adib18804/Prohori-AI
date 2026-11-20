import React from 'react';
import DocsPage from '@/pages/docs/DocsPage';

// Simple admin wrapper for the Docs page.
// Future enhancements can add editing controls, visibility toggles, etc.
const DocsAdmin: React.FC = () => {
  return (
    <div className="p-4">
      {/* Admin controls could be placed here */}
      <DocsPage />
    </div>
  );
};

export default DocsAdmin;
