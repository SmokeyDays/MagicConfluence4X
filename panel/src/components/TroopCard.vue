<script setup lang="ts">
import { computed } from 'vue';
import { NTooltip, NTag, NCard, NSpace } from 'naive-ui';
import type { Troop } from '../interfaces/GameState';

const props = defineProps<{
  troop: Troop;
}>();

const atkIcon = computed(() => {
  return props.troop.troop_template.attack_type === 'Magical' 
    ? '/images/ui/atk_magical.svg'
    : '/images/ui/atk_physical.svg';
});

const defPhysical = computed(() => props.troop.troop_template.defense['Physical'] ?? 0);
const defMagical = computed(() => props.troop.troop_template.defense['Magical'] ?? 0);

const era = computed(() => props.troop.troop_template.era ?? '-');
const priority = computed(() => props.troop.troop_template.attack_priority);
const locationStr = computed(() => `[${props.troop.location[0]}, ${props.troop.location[1]}]`);
const description = computed(() => props.troop.troop_template.description);

const suitabilityText = computed(() => {
    const s = props.troop.troop_template.element_suitability;
    if (!s) return '';
    return Object.entries(s)
        .filter(([_, val]) => val !== 1) 
        .map(([key, val]) => `${key}:${val}`)
        .join(', ');
});
</script>

<template>
  <n-card class="troop-card" size="small" :bordered="true" content-style="padding: 10px;">
    <template #header>
        <div class="card-header-flex">
            <div class="title-group">
                <span class="era-badge">Era {{ era }}</span>
                <span class="troop-name">{{ troop.troop_template.name }}</span>
            </div>
            <div class="size-group">
                <span class="location-badge">LOC {{ locationStr }}</span>
                <span class="stat-label-mini">SIZ</span>
                <span class="size-val">{{ troop.troop_size }}/{{ troop.troop_template.max_size }}</span>
            </div>
        </div>
    </template>
    
    <div class="card-content">
        <div v-if="description" class="description-row">
            {{ description }}
        </div>

        <div class="stats-row">
           <!-- Offensive Group -->
           <div class="stat-group">
             <div class="stat-item" :title="'Attack (' + troop.troop_template.attack_type + ')'">
                <img :src="atkIcon" class="icon"/>
                <span class="stat-val">{{ troop.troop_template.attack || 0 }}</span>
             </div>
             <div class="stat-item" title="Damage">
                <img src="/images/ui/damage.svg" class="icon"/>
                <span class="stat-val">{{ troop.troop_template.damage || 0 }}</span>
             </div>
             <div class="stat-item" title="Attack Priority">
                <span class="stat-label-mini">PRI</span>
                <span class="stat-val pri-val">{{ priority }}</span>
             </div>
           </div>

           <!-- Defensive Group -->
           <div class="stat-group defensive-group" title="Defenses (Physical / Magical)">
              <span class="stat-label-mini group-label">DEF</span>
              <div class="stat-item">
                  <img src="/images/ui/def_physical.svg" class="icon"/>
                  <span class="stat-val">{{ defPhysical }}</span>
              </div>
              <div class="stat-item">
                  <img src="/images/ui/def_magical.svg" class="icon"/>
                  <span class="stat-val">{{ defMagical }}</span>
              </div>
           </div>
        </div>

        <n-space size="small" class="tags-row" align="center">
          <n-tag size="small" type="primary" :color="{ color: '#1a253a', textColor: '#aae', borderColor: '#345' }">
             {{ troop.owner }}
          </n-tag>
          <n-tag size="small" type="warning" :color="{ color: '#3a2520', textColor: '#ea9', borderColor: '#533' }">
             {{ troop.troop_template.arms }}
          </n-tag>
          <n-tag v-if="troop.disordered" size="small" type="error" :color="{ color: '#4a1a1a', textColor: '#fcc', borderColor: '#622' }">
             Disordered
          </n-tag>
        </n-space>

        <div v-if="suitabilityText" class="suitability-row">
            <span class="suitability-label">Mods:</span> {{ suitabilityText }}
        </div>
        
        <n-space v-if="troop.troop_template.abilities?.length" size="small" class="abilities-row">
            <n-tooltip v-for="ab in troop.troop_template.abilities" :key="ab.name" trigger="hover" placement="top">
                <template #trigger>
                   <n-tag size="tiny" class="ability-tag" :bordered="false">{{ ab.name }}</n-tag>
                </template>
                <div class="ability-tooltip">
                    <div class="ab-title">{{ ab.name }}</div>
                    <div class="ab-desc">{{ ab.description }}</div>
                </div>
            </n-tooltip>
        </n-space>
    </div>
  </n-card>
</template>

<style scoped>
.troop-card {
  width: 100%;
}

/* Header Adjustments to fit Naive UI slot */
:deep(.n-card-header) {
    padding: 8px 10px !important;
    background: rgba(255, 255, 255, 0.02);
}

.card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
}

.size-group {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: #aaa;
}
.size-val {
    font-family: monospace;
    font-weight: bold;
    color: #ccc;
}

.troop-name {
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 1px 1px rgba(0,0,0,0.8);
    font-size: 0.9rem;
}

.era-badge {
    background: linear-gradient(135deg, #e6b800, #c49600);
    color: #111;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 3px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.location-badge {
    color: #88a;
    font-size: 0.7rem;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;
}

.card-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.description-row {
    font-size: 0.75rem;
    color: #99a;
    font-style: italic;
    line-height: 1.2;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  background: rgba(0,0,0,0.2);
  padding: 4px 6px;
  border-radius: 4px;
}

.stat-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.defensive-group {
    background: rgba(100, 100, 150, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    gap: 6px;
}

.group-label {
    margin-right: 2px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.stat-label-mini {
    font-size: 0.6rem;
    color: #889;
    font-weight: bold;
    text-transform: uppercase;
}
.stat-val {
  font-family: monospace;
  font-weight: bold;
  font-size: 0.85rem;
}
.pri-val {
    color: #eec;
}

.icon {
  width: 14px;
  height: 14px;
}

.suitability-row {
    font-size: 0.7rem;
    color: #8b9;
    background: rgba(100, 255, 150, 0.05);
    padding: 2px 4px;
    border-radius: 2px;
}
.suitability-label {
    color: #697;
    margin-right: 4px;
}

.abilities-row {
    margin-top: 2px;
}

.ability-tag {
    background: rgba(100, 200, 255, 0.1);
    color: #adf;
    cursor: help;
}

.ability-tooltip {
    max-width: 250px;
}
.ab-title {
    font-weight: bold;
    color: #adf;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    margin-bottom: 4px;
    padding-bottom: 2px;
}
.ab-desc {
    color: #eef;
    font-size: 0.8rem;
}
</style>
