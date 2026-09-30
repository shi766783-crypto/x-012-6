<script setup>
import { reactive, watch } from 'vue'
import { isPestRecovered } from '../services/gardenRules'
import { formatDate } from '../utils/date'

const props = defineProps({
  archives: {
    type: Array,
    required: true,
  },
  activeRecords: {
    type: Array,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update-status'])

const drafts = reactive({})

watch(
  () => props.archives,
  (groups) => {
    groups.forEach((group) => {
      group.records.forEach((record) => {
        if (!(record.id in drafts)) drafts[record.id] = record.recovery || ''
      })
    })
  },
  { immediate: true, deep: true },
)

function syncStatus(record, event) {
  emit('update-status', record.id, {
    recovered: event.target.value === 'true',
  })
}

function saveRecovery(record) {
  emit('update-status', record.id, { recovery: drafts[record.id] || '' })
}
</script>

<template>
  <section class="panel pest-archive">
    <div class="panel-heading">
      <h2>病虫害防治档案</h2>
      <span>共 {{ stats.total }} 条 · 已康复 {{ stats.recovered }} · 处理中 {{ stats.treating }}</span>
    </div>

    <div class="pest-summary">
      <article class="pest-stat">
        <span>恢复率</span>
        <strong>{{ stats.recoveryRate }}%</strong>
        <progress :max="100" :value="stats.recoveryRate"></progress>
      </article>
      <article class="pest-stat treating" v-if="activeRecords.length">
        <span>仍在处理中</span>
        <strong>{{ activeRecords.length }}</strong>
        <p>需要持续跟进的病虫害单</p>
      </article>
      <article class="pest-stat" v-else>
        <span>仍在处理中</span>
        <strong>0</strong>
        <p>暂无待跟进病例</p>
      </article>
    </div>

    <div v-if="activeRecords.length" class="active-pest-list">
      <h3>处理中跟进</h3>
      <ul class="simple-list active-list">
        <li v-for="record in activeRecords" :key="record.id">
          <span class="status-pill warning">处理中</span>
          <strong>{{ record.plant?.name || '已移除的植物' }}</strong>
          <time>{{ formatDate(record.date) }}</time>
          <p>{{ record.symptom }}</p>
        </li>
      </ul>
    </div>

    <div v-if="!archives.length" class="empty-state">
      还没有病虫害记录，发现异常时可在下方「病虫害记录」表单登记。
    </div>

    <div v-else class="archive-groups">
      <article v-for="group in archives" :key="group.plant.id" class="archive-group">
        <div class="archive-heading">
          <h3>{{ group.plant.name }}</h3>
          <span>
            {{ group.records.length }} 条病史 ·
            恢复率 {{ group.stats.recoveryRate }}%
          </span>
        </div>

        <div v-for="record in group.records" :key="record.id" class="pest-card">
          <div class="pest-card-heading">
            <time>{{ formatDate(record.date) }}</time>
            <span :class="['status-pill', isPestRecovered(record) ? 'ok' : 'warning']">
              {{ isPestRecovered(record) ? '已康复' : '处理中' }}
            </span>
          </div>
          <dl>
            <div>
              <dt>症状</dt>
              <dd>{{ record.symptom }}</dd>
            </div>
            <div>
              <dt>处理</dt>
              <dd>{{ record.treatment || '待补充处理方法' }}</dd>
            </div>
            <div>
              <dt>恢复</dt>
              <dd>{{ record.recovery || '恢复情况待观察' }}</dd>
            </div>
          </dl>
          <div class="pest-followup">
            <textarea
              v-model="drafts[record.id]"
              rows="2"
              placeholder="更新恢复情况，如：新叶恢复正常"
            ></textarea>
            <div class="pest-actions">
              <select
                :value="String(isPestRecovered(record))"
                @change="syncStatus(record, $event)"
              >
                <option value="false">处理中</option>
                <option value="true">已康复</option>
              </select>
              <button class="secondary-action" type="button" @click="saveRecovery(record)">
                保存恢复情况
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
