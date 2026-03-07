"use client";
import { useRef, useState } from 'react';

export function EvidenceUpload({ matchId }: { matchId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError('No file selected');
      setUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)');
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('matchId', matchId);
    const res = await fetch('/api/matches/evidence', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const { error } = await res.json();
      setError(error || 'Upload failed');
    } else {
      window.location.reload();
    }
    setUploading(false);
  }

  return (
    <form onSubmit={handleUpload} className="mt-4 flex items-center gap-2">
      <input type="file" accept="image/*" ref={fileInput} className="input" required />
      <button type="submit" className="btn btn-accent" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Evidence'}
      </button>
      {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
    </form>
  );
}
