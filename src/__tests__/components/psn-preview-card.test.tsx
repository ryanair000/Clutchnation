import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PsnPreviewCard } from '@/components/shared/psn-preview-card';
import type { NormalizedPsnProfile } from '@/types';

const mockProfile: NormalizedPsnProfile = {
  accountId: '123',
  onlineId: 'ClutchKing254',
  avatarUrl: 'https://image.api.playstation.com/avatar.png',
  aboutMe: 'I love FC 26',
  isPlus: true,
  trophyLevel: 300,
  trophyCounts: { bronze: 100, silver: 50, gold: 20, platinum: 5 },
  shareUrl: 'https://psnprofiles.com/ClutchKing254',
  presence: {
    state: 'online',
    platform: 'PS5',
    titleName: 'EA SPORTS FC 26',
    titleId: 'PPSA12345',
  },
  recentActivity: { fc26LastPlayedAt: '2026-03-10T12:00:00Z', fc26PlayDuration: 'PT5H' },
  availability: 'public',
  fetchedAt: new Date().toISOString(),
};

describe('PsnPreviewCard', () => {
  const defaultProps = {
    profile: null as NormalizedPsnProfile | null,
    loading: false,
    error: null as string | null,
    notFound: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders nothing when no profile, no loading, no error', () => {
    const { container } = render(<PsnPreviewCard {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows loading skeleton', () => {
    render(<PsnPreviewCard {...defaultProps} loading={true} />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows error message with dismiss button', () => {
    const onCancel = vi.fn();
    render(
      <PsnPreviewCard
        {...defaultProps}
        error="Lookup failed"
        onCancel={onCancel}
      />,
    );
    expect(
      screen.getByText(/couldn't verify this PSN ID/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows not-found message', () => {
    const onCancel = vi.fn();
    render(
      <PsnPreviewCard
        {...defaultProps}
        notFound={true}
        onCancel={onCancel}
      />,
    );
    expect(
      screen.getByText(/No PlayStation account found/i),
    ).toBeInTheDocument();
  });

  it('renders profile data correctly', () => {
    const { container } = render(
      <PsnPreviewCard {...defaultProps} profile={mockProfile} />,
    );

    expect(screen.getByText('ClutchKing254')).toBeInTheDocument();
    expect(container.textContent).toContain('I love FC 26');
    expect(container.textContent).toContain('Level');
    expect(container.textContent).toContain('300');
    expect(screen.getByText('PS+')).toBeInTheDocument();
  });

  it('shows online presence', () => {
    const { container } = render(
      <PsnPreviewCard {...defaultProps} profile={mockProfile} />,
    );
    expect(screen.getByText(/Online/)).toBeInTheDocument();
    expect(container.textContent).toContain('EA SPORTS FC 26');
  });

  it('calls onConfirm when "This is my account" is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <PsnPreviewCard
        {...defaultProps}
        profile={mockProfile}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText('This is my account'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when "Not me" is clicked', () => {
    const onCancel = vi.fn();
    render(
      <PsnPreviewCard
        {...defaultProps}
        profile={mockProfile}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Not me'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders share link when shareUrl is present', () => {
    render(
      <PsnPreviewCard {...defaultProps} profile={mockProfile} />,
    );
    const link = screen.getByText('View on PlayStation');
    expect(link).toHaveAttribute(
      'href',
      'https://psnprofiles.com/ClutchKing254',
    );
  });

  it('handles profile with no avatar', () => {
    const noAvatar = { ...mockProfile, avatarUrl: null };
    render(
      <PsnPreviewCard {...defaultProps} profile={noAvatar} />,
    );
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });
});
