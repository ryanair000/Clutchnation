import type { PlatformType } from '@/types';
import type { PlatformService } from './types';
import { psnAdapter } from './psn-adapter';
import { steamAdapter } from './steam-adapter';
import { xboxAdapter } from './xbox-adapter';
import { epicAdapter } from './epic-adapter';

const adapters: Record<PlatformType, PlatformService> = {
  psn: psnAdapter,
  steam: steamAdapter,
  xbox: xboxAdapter,
  epic: epicAdapter,
};

/**
 * Get the platform service adapter for a given platform type.
 * Throws on unknown platform.
 */
export function getPlatformService(platform: PlatformType): PlatformService {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}
