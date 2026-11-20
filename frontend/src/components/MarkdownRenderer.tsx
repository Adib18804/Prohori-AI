import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  markdown: string;
}

// Simple wrapper that renders markdown using react-markdown.
// Styling can be extended later.
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown }) => {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
