<script setup lang="ts">
import { ref, computed } from "vue"
import autoAnimate from "@formkit/auto-animate"
import { throttle } from "radash"

interface Player {
  name: string
  team: string
  clan?: string
  observer_slot: number
  match_stats: MatchStats
}

interface PlayerWithSteamId extends Player {
  steamid: string
}

interface PlayerExt extends Player {
  steamid: string
  avatar?: string
}

interface Provider {
  appid: number
  name: string
  steamid: string
  version: string
  timestamp: number
}

interface MatchStats {
  kills: number
  assists: number
  deaths: number
  mvps: number
  score: number
}

interface Map {
  current_spectators: number
  mode: string
  name: string
  num_matches_to_win_series: number
  phase: string
  round: number
  souvenirs_total: number
}

interface GSIData {
  allplayers?: Record<string, Player>
  map: Map
  player: PlayerWithSteamId
  provider: Provider
}

interface GlobalMap {
  id: number
  name: string
  difficulty: number
}

interface SteamPlayer {
  steamid: string
  personaname: string
  avatarfull: string
}

const tierColorMap: Record<number, string> = {
  1: "#049c49",
  2: "#007053",
  3: "#f39c12",
  4: "#fd7e14",
  5: "#e74c3c",
  6: "#c52412",
  7: "#d22ce5"
}

const mapTierCache = new Map<string, number>()

const avatarCache = new Map<string, string>()

const config = useRuntimeConfig()

const currentPlayer = ref<PlayerWithSteamId | null>(null)
const providerId = ref<string>()

const players = ref<PlayerExt[]>([])
const mapName = ref<string>()
const mapTier = ref<number>()

const ranking = ref<HTMLElement>()

const sortedPlayers = computed(() => {
  return [...players.value].sort((a, b) => b.match_stats.score - a.match_stats.score)
})

onMounted(() => {
  if (ranking.value) {
    autoAnimate(ranking.value, { duration: 500 })
  }
})

connect()

const fetchAddedSteamPlayers = throttle({ interval: 5000 }, async () => {
  const playersWithoutAvatar = players.value.filter((player) => !avatarCache.has(player.steamid))

  if (playersWithoutAvatar.length > 0) {
    const steamIds = playersWithoutAvatar.map((player) => player.steamid).join(",")

    try {
      const steamPlayers = await $fetch<SteamPlayer[] | null>("/steam", {
        method: "GET",
        params: { steamIds }
      })

      if (steamPlayers && steamPlayers.length > 0) {
        steamPlayers.forEach((steamPlayer) => {
          avatarCache.set(steamPlayer.steamid, steamPlayer.avatarfull)

          const player = players.value.find((p) => p.steamid === steamPlayer.steamid)
          if (player) {
            player.avatar = steamPlayer.avatarfull
          }
        })
      }
    } catch (error) {
      console.error("Error fetching Steam avatars:", error)
    }
  }
})

async function fetchMapTier(mapName: string) {
  if (mapTierCache.has(mapName)) {
    mapTier.value = mapTierCache.get(mapName)
    return
  }

  try {
    const data = await $fetch<GlobalMap>(`https://kztimerglobal.com/api/v2/maps/name/${mapName}`)

    if (data) {
      mapTier.value = data.difficulty

      mapTierCache.set(mapName, data.difficulty)
    } else {
      mapTier.value = undefined
    }
  } catch (error) {
    console.error("Error fetching map tier:", error)
    mapTier.value = undefined
  }
}

async function connect() {
  const socket = new WebSocket(config.public.gsiServer)

  socket.onopen = () => {
    console.log('opened')
    socket.send("")
  }

  socket.onmessage = async (event) => {
    const data: GSIData = JSON.parse(event.data)

    mapName.value = data.map.name

    fetchMapTier(data.map.name)

    providerId.value = data.provider.steamid

    currentPlayer.value = data.player

    if (data.allplayers) {
      players.value = Object.entries(data.allplayers).map(([steamid, player]) => ({
        ...player,
        steamid,
        avatar: avatarCache.get(steamid),
        match_stats: {
          ...player.match_stats,
          score: player.match_stats.score / 10
        }
      }))

      fetchAddedSteamPlayers()
    }
  }
}
</script>

<template>
  <div class="container">
    <div class="map-info">
      <span class="map-name">{{ mapName || "Unknown Map" }}</span>
      <span v-if="mapTier" class="map-tier" :style="{ color: tierColorMap[mapTier] }">{{ `T${mapTier}` }}</span>
    </div>

    <div class="ranking-container" ref="ranking">
      <div
        v-for="(player, index) in sortedPlayers"
        :key="player.steamid"
        class="player-row"
        :style="{
          backgroundColor: player.steamid === currentPlayer?.steamid ? 'rgba(0, 100, 220, 0.7)' : 'rgba(0, 0, 0, 0.8)'
        }"
      >
        <div class="rank-icon">
          <IconFirstPlace v-if="index === 0" />
          <IconSecondPlace v-else-if="index === 1" />
          <IconThirdPlace v-else-if="index === 2" />
          <span v-else class="rank-number">{{ index + 1 }}</span>
        </div>

        <img v-if="player.avatar" class="avatar" :src="player.avatar" />
        <img v-else class="avatar" src="~/assets/img/avatar_fallback.jpg" />

        <div class="player-info">
          <div class="player-title">
            <span v-if="player.clan" class="clan">{{ `${player.clan}` }}</span>
            <span class="player-name">{{ player.name }}</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${player.match_stats.score}%` }"></div>
            </div>
            <span class="score">{{ player.match_stats.score.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 10px;
  font-family: "Comic Relief", "ZCOOL KuaiLe", sans-serif;
}

.map-info {
  display: flex;
  align-items: center;
  color: #fff;
}

.map-name {
  font-weight: bold;
  font-size: 2em;
  margin-right: 5px;
}

.mode {
  font-size: 1.2em;
  color: #ddd;
}

.slash {
  font-size: 1.2em;
  color: #ccc;
}

.map-tier {
  font-size: 1.2em;
  font-weight: 600;
  color: #f39c12;
}

.unknown-map {
  color: #ddd;
  font-size: 2em;
  font-weight: bold;
}

.ranking-container {
  margin-top: 10px;
}

.player-row {
  width: 600px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 5px;
  /* background: rgba(0, 0, 0, 0.7); */
  border-radius: 10px;
  border-left: 6px solid #007c1b;
  margin-bottom: 5px;
}

.rank-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
}

.rank-number {
  color: #fff;
  font-weight: bold;
  font-size: 1.2em;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-title {
  font-size: 1.2em;
}

.clan {
  color: #cacaca;
  margin-right: 5px;
}

.player-name {
  font-weight: bold;
  color: #fff;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007acc, #00a8ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.score {
  color: #fff;
  font-weight: bold;
  min-width: 50px;
  text-align: right;
}

.player-row:nth-child(1) {
  border-left-color: #ffd700;
}

.player-row:nth-child(1) .progress-fill {
  background: linear-gradient(90deg, #ffd700, #ffed4e);
}

.player-row:nth-child(2) {
  border-left-color: #c0c0c0;
}

.player-row:nth-child(2) .progress-fill {
  background: linear-gradient(90deg, #c0c0c0, #e5e5e5);
}

.player-row:nth-child(3) {
  border-left-color: #cd7f32;
}

.player-row:nth-child(3) .progress-fill {
  background: linear-gradient(90deg, #cd7f32, #daa520);
}
</style>
