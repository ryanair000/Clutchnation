import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PsnBadge } from '@/components/shared/psn-badge';

describe('PsnBadge', () => {
  it('renders nothing when psnOnlineId is null', () => {
    const { container } = render(
      <PsnBadge psnOnlineId={null} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the online ID', () => {
    render(<PsnBadge psnOnlineId="ClutchKing254" />);
    expect(screen.getByText('ClutchKing254')).toBeInTheDocument();
  });

  it('renders the gamepad emoji', () => {
    render(<PsnBadge psnOnlineId="TestUser" />);
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('shows checkmark when verified', () => {
    render(
      <PsnBadge
        psnOnlineId="ClutchKing254"
        verifiedStatus="confirmed_by_user"
      />,
    );
    const svg = document.querySelector('svg[aria-label="Verified"]');
    expect(svg).toBeInTheDocument();
  });

  it('does not show checkmark when not verified', () => {
    render(
      <PsnBadge
        psnOnlineId="ClutchKing254"
        verifiedStatus="none"
      />,
    );
    const svg = document.querySelector('svg[aria-label="Verified"]');
    expect(svg).not.toBeInTheDocument();
  });

  it('wraps in a link when profileUrl is provided', () => {
    render(
      <PsnBadge
        psnOnlineId="ClutchKing254"
        profileUrl="https://psnprofiles.com/ClutchKing254"
      />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://psnprofiles.com/ClutchKing254',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders as span (no link) when no profileUrl', () => {
    render(<PsnBadge psnOnlineId="ClutchKing254" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('applies sm size classes by default', () => {
    const { container } = render(<PsnBadge psnOnlineId="Test" />);
    const outerSpan = container.querySelector('span.inline-flex');
    expect(outerSpan?.className).toContain('text-xs');
  });

  it('applies md size classes when specified', () => {
    const { container } = render(<PsnBadge psnOnlineId="Test" size="md" />);
    const outerSpan = container.querySelector('span.inline-flex');
    expect(outerSpan?.className).toContain('text-sm');
  });
});
