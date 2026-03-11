import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PsnLinkCard } from '@/components/shared/psn-link-card';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('PsnLinkCard', () => {
  const onLinked = vi.fn();
  const onUnlinked = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Linked state', () => {
    const linkedProps = {
      psnOnlineId: 'Ryanair001',
      psnAccountId: 'acct-123',
      verifiedStatus: 'confirmed_by_user' as const,
      syncStatus: 'ok' as const,
      lastSyncedAt: '2026-03-10T12:00:00Z',
      onLinked,
      onUnlinked,
    };

    it('shows verified badge and PSN ID when linked', () => {
      render(<PsnLinkCard {...linkedProps} />);

      expect(screen.getByText(/Verified/)).toBeInTheDocument();
      expect(screen.getByText(/Ryanair001/)).toBeInTheDocument();
    });

    it('shows last synced date', () => {
      render(<PsnLinkCard {...linkedProps} />);
      expect(screen.getByText(/Last synced/)).toBeInTheDocument();
    });

    it('shows sync error warning', () => {
      render(<PsnLinkCard {...linkedProps} syncStatus="error" />);
      expect(
        screen.getByText(/Sync issue/),
      ).toBeInTheDocument();
    });

    it('calls onUnlinked when unlink button clicked', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<PsnLinkCard {...linkedProps} />);

      fireEvent.click(screen.getByText('Unlink'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/psn/unlink', {
          method: 'POST',
        });
        expect(onUnlinked).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Not linked state', () => {
    const unlinkedProps = {
      psnOnlineId: null,
      psnAccountId: null,
      verifiedStatus: 'none' as const,
      syncStatus: 'never' as const,
      lastSyncedAt: null,
      onLinked,
      onUnlinked,
    };

    it('shows link prompt when not linked', () => {
      render(<PsnLinkCard {...unlinkedProps} />);
      expect(
        screen.getByText('Link PlayStation Account'),
      ).toBeInTheDocument();
    });

    it('shows verify form when link button clicked', () => {
      render(<PsnLinkCard {...unlinkedProps} />);
      fireEvent.click(screen.getByText('Link PlayStation Account'));

      expect(
        screen.getByPlaceholderText(/Enter PSN Online ID/),
      ).toBeInTheDocument();
    });

    it('calls lookup API when verify clicked', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          found: true,
          data: {
            accountId: 'acct-new',
            onlineId: 'NewPlayer',
            avatarUrl: null,
            aboutMe: null,
            isPlus: false,
            trophyLevel: 10,
            trophyCounts: null,
            shareUrl: null,
            presence: null,
            recentActivity: null,
            availability: 'public',
            fetchedAt: new Date().toISOString(),
          },
        }),
      });

      render(<PsnLinkCard {...unlinkedProps} />);
      fireEvent.click(screen.getByText('Link PlayStation Account'));

      const input = screen.getByPlaceholderText(/Enter PSN Online ID/);
      fireEvent.change(input, { target: { value: 'NewPlayer' } });
      fireEvent.click(screen.getByText('Verify'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/psn/lookup/NewPlayer',
        );
      });
    });

    it('shows preview card on successful lookup', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          found: true,
          data: {
            accountId: 'acct-show',
            onlineId: 'ShowUser',
            avatarUrl: null,
            aboutMe: null,
            isPlus: false,
            trophyLevel: 50,
            trophyCounts: { bronze: 10, silver: 5, gold: 2, platinum: 0 },
            shareUrl: null,
            presence: null,
            recentActivity: null,
            availability: 'public',
            fetchedAt: new Date().toISOString(),
          },
        }),
      });

      render(<PsnLinkCard {...unlinkedProps} />);
      fireEvent.click(screen.getByText('Link PlayStation Account'));

      const input = screen.getByPlaceholderText(/Enter PSN Online ID/);
      fireEvent.change(input, { target: { value: 'ShowUser' } });
      fireEvent.click(screen.getByText('Verify'));

      await waitFor(() => {
        expect(screen.getByText('ShowUser')).toBeInTheDocument();
        expect(screen.getByText('This is my account')).toBeInTheDocument();
      });
    });

    it('calls link API when confirm clicked after lookup', async () => {
      // First call: lookup, second call: link
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            found: true,
            data: {
              accountId: 'acct-link',
              onlineId: 'LinkMe',
              avatarUrl: null,
              aboutMe: null,
              isPlus: false,
              trophyLevel: 20,
              trophyCounts: null,
              shareUrl: null,
              presence: null,
              recentActivity: null,
              availability: 'public',
              fetchedAt: new Date().toISOString(),
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<PsnLinkCard {...unlinkedProps} />);
      fireEvent.click(screen.getByText('Link PlayStation Account'));

      const input = screen.getByPlaceholderText(/Enter PSN Online ID/);
      fireEvent.change(input, { target: { value: 'LinkMe' } });
      fireEvent.click(screen.getByText('Verify'));

      await waitFor(() => {
        expect(screen.getByText('This is my account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('This is my account'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/psn/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: 'acct-link',
            onlineId: 'LinkMe',
          }),
        });
        expect(onLinked).toHaveBeenCalledOnce();
      });
    });

    it('handles not-found lookup result', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ found: false, reason: 'not_found' }),
      });

      render(<PsnLinkCard {...unlinkedProps} />);
      fireEvent.click(screen.getByText('Link PlayStation Account'));

      const input = screen.getByPlaceholderText(/Enter PSN Online ID/);
      fireEvent.change(input, { target: { value: 'GhostUser' } });
      fireEvent.click(screen.getByText('Verify'));

      await waitFor(() => {
        expect(
          screen.getByText(/No PlayStation account found/),
        ).toBeInTheDocument();
      });
    });
  });
});
