<script setup>
import { reactive, watch } from 'vue'
import { PEST_STATUSES } from '../constants/garden'
import { daysBetween, formatDate, todayISO } from '../utils/date'

const props = defineProps({
  archive: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['update-status', 'update-recovery'])

const recoveryDrafts = reactive({})

watch(
  () => props.archive.treatingRecords,
  (records) => {
    records.forEach((record) => {
      if (!(record.id in recoveryDrafts)) recoveryDrafts[record.id] = record.recovery || ''
    })
  },
  { immediate: true, deep: true },
)

function saveRecovery(record) {
  emit('update-recovery', record.id, (recoveryDrafts[record.id] || '').trim())
}

function markRecovered(record) {
  emit('update-recovery', record.id, (recoveryDrafts[record.id] || '').trim())
  emit('update-status', record.id, '已康复', todayISO())
}
</script>

<template>
  <section class="panel pest-archive">
    <div class="panel-heading">
      <h2>病虫害防治档案</h2>
      <span>恢复率 {{ archive.recoveryRate }}% · {{ archive.recovered }} / {{ archive.total }} 已康复</span>
    </div>

    <div v-if="!archive.total" class="empty-state">还没有病虫害记录，先在上方表单记下第一笔吧。</div>

    <template v-else>
      <div class="pest-stats">
        <article class="pest-stat">
          <span>档案总数</span>
          <strong>{{ archive.total }}</strong>
        </article>
        <article class="pest-stat treating">
          <span>处理中</span>
          <strong>{{ archive.treating }}</strong>
        </article>
        <article class="pest-stat recovered">
          <span>已康复</span>
          <strong>{{ archive.recovered }}</strong>
        </article>
        <article class="pest-stat rate">
          <span>恢复率</span>
          <strong>{{ archive.recoveryRate }}%</strong>
        </article>
      </div>

      <div class="pest-section">
        <h3>仍在处理中（{{ archive.treating }}）</h3>
        <div v-if="!archive.treatingRecords.length" class="empty-state">所有病虫害都已康复，花园状态良好。</div>
        <div v-else class="pest-case-list">
          <article v-for="record in archive.treatingRecords" :key="record.id" class="pest-case treating-case">
            <div class="pest-case-head">
              <div>
                <strong>{{ record.plantName }}</strong>
                <time>发现于 {{ formatDate(record.date) }} · 已跟进 {{ daysBetween(record.date) }} 天</time>
              </div>
              <span class="status-pill warning">处理中</span>
            </div>
            <p class="pest-line"><em>症状</em>{{ record.symptom }}</p>
            <p class="pest-line"><em>处理方法</em>{{ record.treatment || '暂未记录处理方法' }}</p>
            <label class="pest-recovery-edit">
              <span>更新恢复情况</span>
              <textarea
                v-model="recoveryDrafts[record.id]"
                rows="2"
                placeholder="记录最新观察，如新叶正常、虫口减少…"
              ></textarea>
            </label>
            <div class="pest-actions">
              <button class="secondary-action" type="button" @click="saveRecovery(record)">保存恢复情况</button>
              <button class="primary-action" type="button" @click="markRecovered(record)">标记已康复</button>
            </div>
          </article>
        </div>
      </div>

      <div class="pest-section">
        <h3>按株查看防治历史</h3>
        <div class="plant-archive-list">
          <article v-for="entry in archive.plantArchives" :key="entry.plantId" class="plant-archive">
            <div class="plant-archive-head">
              <strong>{{ entry.plantName }}</strong>
              <span>{{ entry.location }} · 共 {{ entry.total }} 笔 · 处理中 {{ entry.treating }} · 已康复 {{ entry.recovered }}</span>
            </div>
            <ul class="pest-history">
              <li v-for="record in entry.records" :key="record.id" class="pest-case">
                <div class="pest-case-head">
                  <time>{{ formatDate(record.date) }}</time>
                  <span :class="['status-pill', record.status === '已康复' ? 'ok' : 'warning']">{{ record.status }}</span>
                </div>
                <p class="pest-line"><em>症状</em>{{ record.symptom }}</p>
                <p class="pest-line"><em>处理方法</em>{{ record.treatment || '暂未记录处理方法' }}</p>
                <p class="pest-line">
                  <em>恢复情况</em>
                  <template v-if="record.status === '已康复'">
                    {{ record.recovery || '已康复' }}（康复于 {{ formatDate(record.recoveredDate) }}）
                  </template>
                  <template v-else>{{ record.recovery || '恢复情况待观察' }}</template>
                </p>
                <label class="pest-status-edit">
                  <span>更新状态</span>
                  <select
                    :value="record.status"
                    @change="emit('update-status', record.id, $event.target.value, todayISO())"
                  >
                    <option v-for="status in PEST_STATUSES" :key="status" :value="status">{{ status }}</option>
                  </select>
                </label>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>
