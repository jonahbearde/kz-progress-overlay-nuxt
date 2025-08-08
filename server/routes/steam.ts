interface SteamPlayerResponse {
  response: {
    players: Record<string, any>[]
  }
}

export default defineEventHandler(async (event) => {
  const { steamApiKey } = useRuntimeConfig(event)

  const { steamIds } = getQuery(event)
  console.log("steamids", steamIds)

  try {
    const result = await $fetch<SteamPlayerResponse | never[]>(
      "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2",
      {
        params: {
          key: steamApiKey,
          steamids: steamIds
        }
      }
    )

    console.log("result", result)
    if (Array.isArray(result)) {
      return null
    } else {
      return result.response.players
    }
  } catch (error) {
    console.log("Error fetching Steam player data:", error)
    return null
  }
})
