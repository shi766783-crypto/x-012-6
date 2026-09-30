import { computed, reactive, watch } from 'vue'
import { DEFAULT_GOALS } from '../constants/garden'
import { todayISO } from '../utils/date'
import { loadGardenState, saveGardenState } from '../services/storage'
import {
  buildLeaderboards,
  buildPestArchives,
  buildTimeline,
  calculateAchievements,
  createId,
  getActivePestRecords,
  getDashboard,
  getDueWateringPlants,
  getPestStats,
  getWateringStatus,
  updateWateringGoal,
} from '../services/gardenRules'

const demoState = {
  plants: [
    {
      id: 'plant-demo-1',
      name: '琴叶榕',
      variety: 'Ficus lyrata',
      category: '观叶',
      location: '客厅',
      lightNeed: '半阴',
      wateringFrequency: 4,
      fertilizerFrequency: 30,
      purchaseDate: '2026-08-18',
      lastWateredDate: '2026-09-12',
      potSize: '28cm 陶盆',
      soilType: '泥炭土混合珍珠岩',
      photo: '',
      alive: true,
    },
    {
      id: 'plant-demo-2',
      name: '蓝雪花',
      variety: 'Plumbago auriculata',
      category: '观花',
      location: '阳台',
      lightNeed: '全阳',
      wateringFrequency: 2,
      fertilizerFrequency: 14,
      purchaseDate: '2026-07-02',
      lastWateredDate: '2026-09-13',
      potSize: '20cm 加仑盆',
      soilType: '通用营养土',
      photo: '',
      alive: true,
    },
  ],
  careRecords: [
    {
      id: 'care-demo-1',
      plantId: 'plant-demo-2',
      date: '2026-09-14',
      type: '施肥',
      amount: '缓释肥 5g',
      note: '花量增加，叶色正常',
      photo: '',
    },
    {
      id: 'care-demo-2',
      plantId: 'plant-demo-1',
      date: '2026-09-12',
      type: '浇水',
      amount: '约 600ml',
      note: '盆底少量出水',
      photo: '',
    },
  ],
  growthRecords: [
    {
      id: 'growth-demo-1',
      plantId: 'plant-demo-1',
      date: '2026-08-20',
      height: 82,
      leafCount: 14,
      bloomState: '未开花',
    },
    {
      id: 'growth-demo-2',
      plantId: 'plant-demo-1',
      date: '2026-09-10',
      height: 88,
      leafCount: 17,
      bloomState: '未开花',
    },
    {
      id: 'growth-demo-3',
      plantId: 'plant-demo-2',
      date: '2026-09-08',
      height: 45,
      leafCount: 56,
      bloomState: '盛开',
    },
  ],
  pestRecords: [
    {
      id: 'pest-demo-1',
      plantId: 'plant-demo-1',
      date: '2026-09-02',
      symptom: '叶背出现褐色斑点，疑似红蜘蛛',
      treatment: '摘除病叶，连续 5 天喷施稀释阿维菌素',
      recovery: '一周后斑点不再扩散，新叶正常',
      recovered: true,
    },
    {
      id: 'pest-demo-2',
      plantId: 'plant-demo-2',
      date: '2026-09-11',
      symptom: '嫩梢有蚜虫聚集',
      treatment: '清水冲洗后喷施苦参碱，每 3 天一次',
      recovery: '',
      recovered: false,
    },
  ],
  goals: DEFAULT_GOALS,
}

export function useGardenStore() {
  const storedState = loadGardenState()
  const state = reactive(storedState || demoState)

  const plantsWithStatus = computed(() =>
    state.plants.map((plant) => ({ ...plant, wateringStatus: getWateringStatus(plant) })),
  )
  const dueWateringPlants = computed(() => getDueWateringPlants(state.plants))
  const dashboard = computed(() => getDashboard(state.plants, state.careRecords, state.growthRecords))
  const goals = computed(() => updateWateringGoal(state.goals, state.careRecords))
  const achievements = computed(() =>
    calculateAchievements(state.plants, state.careRecords, state.growthRecords, state.pestRecords, goals.value),
  )
  const leaderboards = computed(() => buildLeaderboards(state.plants, state.careRecords, state.growthRecords))
  const pestStats = computed(() => getPestStats(state.pestRecords))
  const activePestRecords = computed(() => getActivePestRecords(state.pestRecords, state.plants))
  const pestArchives = computed(() => buildPestArchives(state.plants, state.pestRecords))

  watch(
    state,
    () => {
      saveGardenState({ ...state, goals: goals.value })
    },
    { deep: true },
  )

  function addPlant(payload) {
    state.plants.unshift({
      ...payload,
      id: createId('plant'),
      lastWateredDate: payload.lastWateredDate || payload.purchaseDate || todayISO(),
      alive: true,
    })
  }

  function addCareRecord(payload) {
    const record = { ...payload, id: createId('care') }
    state.careRecords.unshift(record)

    if (record.type === '浇水') {
      const plant = state.plants.find((item) => item.id === record.plantId)
      if (plant) plant.lastWateredDate = record.date
    }
  }

  function addGrowthRecord(payload) {
    state.growthRecords.unshift({ ...payload, id: createId('growth') })
  }

  function addPestRecord(payload) {
    state.pestRecords.unshift({
      ...payload,
      id: createId('pest'),
      recovered: payload.recovered === true,
    })
  }

  function updatePestRecord(id, patch) {
    const record = state.pestRecords.find((item) => item.id === id)
    if (!record) return
    Object.assign(record, patch)
  }

  function getPlantTimeline(plantId) {
    return buildTimeline(plantId, state.careRecords, state.growthRecords, state.pestRecords)
  }

  function getPlantGrowth(plantId) {
    return state.growthRecords
      .filter((record) => record.plantId === plantId)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  return {
    state,
    plantsWithStatus,
    dueWateringPlants,
    dashboard,
    goals,
    achievements,
    leaderboards,
    pestStats,
    activePestRecords,
    pestArchives,
    addPlant,
    addCareRecord,
    addGrowthRecord,
    addPestRecord,
    updatePestRecord,
    getPlantTimeline,
    getPlantGrowth,
  }
}
