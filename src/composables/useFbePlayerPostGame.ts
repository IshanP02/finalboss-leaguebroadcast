import { ref, watch, type Ref } from 'vue';
import type { postGamePlayerStats, postGamePlayerRunesAndItems } from '@bluebottle_gg/league-broadcast-client';
import { useClient } from '@/client';
import { usePostGameStatsVersion } from '@/composables/usePostGame';

export type FbePlayerScreen = 'spotlight' | 'performance';

/** Fetch by the backend's global player index (0–9), not the local role index. */
export function useFbePlayerPostGame(
  gameId: Ref<number | undefined>,
  playerIndex: Ref<number>,
  mocking: Ref<boolean | undefined>,
  mode: Ref<FbePlayerScreen>,
  award: Ref<boolean>,
) {
  const client = useClient();
  const statsVersion = usePostGameStatsVersion();
  const stats = ref<postGamePlayerStats | null>(null);
  const build = ref<postGamePlayerRunesAndItems | null>(null);
  const loading = ref(false);
  const error = ref('');
  const warning = ref('');

  watch([gameId, playerIndex, mocking, mode, award, statsVersion], async ([id, index, mock, screen, isAward], _, onCleanup) => {
    let cancelled = false;
    onCleanup(() => { cancelled = true; });
    stats.value = null;
    build.value = null;
    error.value = '';
    warning.value = '';
    loading.value = false;

    if (!Number.isInteger(index) || index < 0 || index > 9) {
      error.value = 'Select a player index from 0 to 9.';
      return;
    }
    if (mock === undefined) { loading.value = true; return; }
    if (!mock && (id === undefined || !Number.isSafeInteger(id) || id <= 0)) {
      error.value = 'No recorded game selected.';
      return;
    }
    loading.value = true;
    try {
      // Mock endpoints are independently generated and must not be combined.
      // Real spotlight requests both records for the same game and player.
      const statsRequest = mock
        ? (screen === 'performance' || isAward ? client.api.postGame.getMockPlayerStats() : Promise.resolve(null))
        : client.api.postGame.getPlayerStats(id!, index);
      const buildRequest = screen === 'spotlight'
        ? (mock ? (isAward ? Promise.resolve(null) : client.api.postGame.getMockItemAndRunes()) : client.api.postGame.getItemsAndRunes(id!, index))
        : Promise.resolve(null);
      const [s, b] = await Promise.allSettled([statsRequest, buildRequest]);
      if (cancelled) return;
      let nextStats = s.status === 'fulfilled' ? s.value ?? null : null;
      let nextBuild = b.status === 'fulfilled' ? b.value ?? null : null;
      if (s.status === 'rejected') console.warn('[FBE Player] Stats request failed', s.reason);
      if (b.status === 'rejected') console.warn('[FBE Player] Build request failed', b.reason);

      if (nextStats && nextBuild) {
        const a = nextStats.champion?.id;
        const z = nextBuild.champion?.id;
        const statName = nextStats.nameWithTag?.trim().toLowerCase();
        const buildName = nextBuild.nameWithTag?.trim().toLowerCase();
        if (a == null || z == null || a !== z || (statName && buildName && statName !== buildName)) {
          // Keep the performance data rather than assign another player's build.
          nextBuild = null;
          warning.value = 'Build identity could not be verified.';
          console.warn('[FBE Player] Discarded mismatched build', { gameId: id, index, statsChampion: a, buildChampion: z });
        }
      }
      stats.value = nextStats;
      build.value = nextBuild;
      if (!nextStats && !nextBuild) error.value = 'No player data was returned.';
      else if (!mock && screen === 'spotlight' && !nextBuild && !warning.value) warning.value = 'Rune and purchase data unavailable.';
      else if (!mock && screen === 'spotlight' && !nextStats) warning.value = 'Performance statistics unavailable.';
    } catch (cause) {
      if (!cancelled) { error.value = 'Unable to load selected player.'; console.error('[FBE Player]', cause); }
    } finally {
      if (!cancelled) loading.value = false;
    }
  }, { immediate: true });

  return { stats, build, loading, error, warning };
}
