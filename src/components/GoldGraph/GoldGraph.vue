<script setup lang="ts">
import { computed } from "vue";
import { useIngameSelector } from "../../composables/useIngame";

const goldGraph = useIngameSelector((s) => s.gameData.goldGraph);

/**
 * Parse the gold data into a per-team gold-difference series suitable for SVG rendering.
 * `goldAtTime` is keyed by game-time (seconds), each value is a map of teamId → gold.
 */
const series = computed(() => {
    const current = goldGraph.value?.current;
    if (!current?.goldAtTime) return null;

    const entries = Object.entries(current.goldAtTime)
        .map(([time, teams]) => ({ time: Number(time), teams }))
        .sort((a, b) => a.time - b.time);

    if (entries.length < 2) return null;

    // Team IDs from the data (usually 0 and 1)
    const teamIds = Object.keys(entries[0]?.teams ?? {}).map(Number);
    if (teamIds.length < 2) return null;

    const [t0, t1] = teamIds;
    const teamNames = current.teams ?? {};

    //prevent undefined t0 or t1 by defaulting to 0
    if (t0 === undefined || isNaN(t0) || t1 === undefined || isNaN(t1)) {
        console.warn("Invalid team IDs in gold graph data, defaulting to 0 and 1");
        return null;
    }

    // Compute gold difference: positive = team 0 ahead
    const points = entries.map((e) => ({
        time: e.time,
        diff: (e.teams[t0] ?? 0) - (e.teams[t1] ?? 0),
    }));

    const maxTime = points[points.length - 1]?.time ?? 0;
    const maxAbsDiff = Math.max(...points.map((p) => Math.abs(p.diff)), 1);

    return { points, maxTime, maxAbsDiff, teamNames, teamIds: [t0, t1] as const };
});

// SVG viewBox dimensions — wide and short for a broadcast bar
const WIDTH = 700;
const HEIGHT = 180;
const PADDING_X = 50;
const PADDING_Y = 25;

/** Map a data point to SVG coordinates. */
function toSvg(
    time: number,
    diff: number,
    maxTime: number,
    maxAbsDiff: number
): { x: number; y: number } {
    const x = PADDING_X + ((time / maxTime) * (WIDTH - 2 * PADDING_X));
    const y = HEIGHT / 2 - (diff / maxAbsDiff) * ((HEIGHT - 2 * PADDING_Y) / 2);
    return { x, y };
}

/** Build an SVG path string from the gold-difference points. */
const pathD = computed(() => {
    if (!series.value) return "";
    const { points, maxTime, maxAbsDiff } = series.value;
    return points
        .map((p, i) => {
            const { x, y } = toSvg(p.time, p.diff, maxTime, maxAbsDiff);
            return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");
});

/** Filled area path — positive region (blue team ahead). */
const fillPathBlue = computed(() => {
    if (!series.value) return "";
    const { points, maxTime, maxAbsDiff } = series.value;
    const midY = HEIGHT / 2;
    const segments: string[] = [];

    for (const p of points) {
        const { x, y } = toSvg(p.time, p.diff, maxTime, maxAbsDiff);
        // Clamp to midline for the blue fill (above midline only)
        segments.push(`${segments.length === 0 ? "M" : "L"}${x},${Math.min(y, midY)}`);
    }

    // Close back along the midline
    const lastX = toSvg(points[points.length - 1]?.time ?? 0, 0, maxTime, maxAbsDiff).x;
    const firstX = toSvg(points[0]?.time ?? 0, 0, maxTime, maxAbsDiff).x;
    segments.push(`L${lastX},${midY} L${firstX},${midY} Z`);
    return segments.join(" ");
});

/** Filled area path — negative region (red team ahead). */
const fillPathRed = computed(() => {
    if (!series.value) return "";
    const { points, maxTime, maxAbsDiff } = series.value;
    const midY = HEIGHT / 2;
    const segments: string[] = [];

    for (const p of points) {
        const { x, y } = toSvg(p.time, p.diff, maxTime, maxAbsDiff);
        segments.push(`${segments.length === 0 ? "M" : "L"}${x},${Math.max(y, midY)}`);
    }

    const lastX = toSvg(points[points.length - 1]?.time ?? 0, 0, maxTime, maxAbsDiff).x;
    const firstX = toSvg(points[0]?.time ?? 0, 0, maxTime, maxAbsDiff).x;
    segments.push(`L${lastX},${midY} L${firstX},${midY} Z`);
    return segments.join(" ");
});

/** Y-axis tick values. */
const yTicks = computed(() => {
    if (!series.value) return [];
    const max = series.value.maxAbsDiff;
    const step = niceStep(max);
    const ticks: number[] = [];
    for (let v = -max; v <= max; v += step) {
        ticks.push(v);
    }
    return ticks;
});

function niceStep(max: number): number {
    if (max > 10000) return 5000;
    if (max > 5000) return 2000;
    if (max > 2000) return 1000;
    return 500;
}

function formatGoldDiff(val: number): string {
    if (val === 0) return "0";
    const sign = val > 0 ? "+" : "";
    return val >= 1000 || val <= -1000
        ? `${sign}${(val / 1000).toFixed(1)}k`
        : `${sign}${val}`;
}
</script>

<template>
    <div class="gold-graph">
        <svg v-if="series" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMid meet" class="chart">
            <!-- Filled regions -->
            <path :d="fillPathBlue" fill="rgba(37,99,235,0.3)" />
            <path :d="fillPathRed" fill="rgba(220,38,38,0.3)" />

            <!-- Zero line -->
            <line :x1="PADDING_X" :y1="HEIGHT / 2" :x2="WIDTH - PADDING_X" :y2="HEIGHT / 2" stroke="#3a3f4a"
                stroke-width="1" stroke-dasharray="4 2" />

            <!-- Y-axis ticks -->
            <template v-for="tick in yTicks" :key="tick">
                <text :x="PADDING_X - 6" :y="toSvg(0, tick, series.maxTime, series.maxAbsDiff).y" text-anchor="end"
                    dominant-baseline="middle" class="tick-label">
                    {{ formatGoldDiff(tick) }}
                </text>
            </template>

            <!-- Data line -->
            <path :d="pathD" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" />

            <!-- Team labels -->
            <text :x="WIDTH - PADDING_X + 6" :y="PADDING_Y" class="team-label blue-label">
                {{ series.teamNames[series.teamIds[0]] || "Blue" }} ↑
            </text>
            <text :x="WIDTH - PADDING_X + 6" :y="HEIGHT - PADDING_Y + 4" class="team-label red-label">
                {{ series.teamNames[series.teamIds[1]] || "Red" }} ↓
            </text>
        </svg>

        <p v-else class="placeholder">Gold Difference</p>
    </div>
</template>

<style scoped>
.gold-graph {
    width: 680px;
    background: linear-gradient(180deg, #1a1d24 0%, #12151a 100%);
    border: 1px solid #2a2e38;
    padding: 10px 14px 8px;
    color: #fff;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    user-select: none;
}

.chart {
    width: 100%;
    height: auto;
    display: block;
}

.tick-label {
    fill: #6b7280;
    font-size: 9px;
    font-family: "Inter", system-ui, sans-serif;
}

.team-label {
    font-size: 9px;
    font-weight: 600;
    font-family: "Inter", system-ui, sans-serif;
}

.blue-label {
    fill: #3b8cf5;
}

.red-label {
    fill: #ef4444;
}

.placeholder {
    text-align: center;
    color: #5a6070;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
    padding: 12px 0;
}
</style>
