import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  helpUrl?: string;
  className?: string;
}

/**
 * Help button that opens the help center
 */
export function HelpButton({
  helpUrl = 'https://parslee.ai/support',
  className = '',
}: HelpButtonProps) {
  return (
    <a
      href={helpUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`topbar-icon-button ${className}`}
      aria-label="Help and resources"
      title="Help & Resources"
    >
      <HelpCircle className="topbar-icon" aria-hidden="true" />
    </a>
  );
}
