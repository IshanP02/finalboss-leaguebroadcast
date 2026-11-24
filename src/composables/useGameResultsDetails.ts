import { ref, watch, type Ref } from "vue";

import type {
  postGamePlayerStats,
  postGamePlayerRunesAndItems,
  matchWithGamesAndTeams,
} from "@bluebottle_gg/league-broadcast-client";

import { useClient } from "@/client";

import {
  usePostGameStatsVersion,
} from "@/composables/usePostGame";

export interface GameResultsPlayer {
  index: number;
  stats: postGamePlayerStats | null;
  build: postGamePlayerRunesAndItems | null;
}

export function useGameResultsDetails(
  gameId: Ref<number | undefined>,
  isMocking: Ref<boolean>,
  hasOverview: Ref<boolean>,
) {
  const client = useClient();

  const players = ref<GameResultsPlayer[]>([]);

  const match = ref<matchWithGamesAndTeams | null>(null);

  const loading = ref(false);
  const statsVersion = usePostGameStatsVersion();

  watch(
    [gameId, isMocking, hasOverview, statsVersion],

    async ([id, mocking, ready], _, onCleanup) => {
      let cancelled = false;

      onCleanup(() => {
        cancelled = true;
      });

      // Clear details belonging to the previous game.
      players.value = [];
      match.value = null;
      loading.value = false;

      // The overview already provides champion damage
      // data in mock mode.
      //
      // Mock player endpoints aren't tied to the ten
      // actual champions in the overview.
      if (mocking || !ready || id === undefined) {
        return;
      }

      loading.value = true;

      async function fetchPlayer(
        index: number,
        selectedGameId: number,
      ): Promise<GameResultsPlayer> {
        const [statsResult, buildResult] =
          await Promise.allSettled([
            client.api.postGame.getPlayerStats(
              selectedGameId,
              index,
            ),

            client.api.postGame.getItemsAndRunes(
              selectedGameId,
              index,
            ),
          ]);

        return {
          index,

          stats:
            statsResult.status === "fulfilled"
              ? statsResult.value ?? null
              : null,

          build:
            buildResult.status === "fulfilled"
              ? buildResult.value ?? null
              : null,
        };
      }

      try {
        const matchRequest = (async () => {
            try {
                const game = await client.api.game.getGame(id);

                if (game?.matchId == null) {
                return null;
                }

                return await client.api.match.getMatch(
                game.matchId
                );
            } catch (error) {
                console.warn(
                "[FBE Game Results] Match retrieval failed:",
                error
                );

                return null;
            }
        })();

        const collected: GameResultsPlayer[] = [];

        // Fetch five players at a time rather than
        // launching every player request simultaneously.
        for (let start = 0; start < 10; start += 5) {
          if (cancelled) return;

          const batch = await Promise.all(
            Array.from(
              { length: 5 },
              (_, offset) =>
                fetchPlayer(start + offset, id),
            ),
          );

          if (cancelled) return;

          collected.push(...batch);

          players.value = [...collected];
        }

        const matchData = await matchRequest;

        if (cancelled) return;

        match.value = matchData ?? null;
      } catch (error) {
        if (!cancelled) {
          console.warn(
            "[FBE Game Results] Optional details failed:",
            error,
          );
        }
      } finally {
        if (!cancelled) {
          loading.value = false;
        }
      }
    },

    { immediate: true },
  );

  return {
    players,
    match,
    loading,
  };
}