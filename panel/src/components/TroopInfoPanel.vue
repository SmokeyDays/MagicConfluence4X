<script setup lang="ts">
import { computed } from 'vue';
import { NCollapse, NCollapseItem, NTag } from 'naive-ui';
import type { Troop } from '../interfaces/GameState';
import TroopCard from './TroopCard.vue';

const props = defineProps<{
  hoveredTroop: Troop | null;
  selectedTroops: Troop[];
}>();

const selectedTitle = computed(() => `Selected Troops (${props.selectedTroops.length})`);
</script>

<template>
  <div class="troop-info-panel">
    <!-- Hovered Section (Top, separate) -->
    <div v-if="hoveredTroop" class="hover-section fade-in">
        <n-tag class="section-label" type="warning" size="small" :bordered="false">
           PREVIEW
        </n-tag>
        <TroopCard :troop="hoveredTroop" class="highlight-card" />
    </div>

    <!-- Selected List -->
    <div class="selected-container" v-if="selectedTroops.length > 0">
        <n-collapse :default-expanded-names="['1']" arrow-placement="right">
            <n-collapse-item :title="selectedTitle" name="1">
                <div class="list-scroll">
                    <TroopCard 
                       v-for="troop in selectedTroops" 
                       :key="troop.id" 
                       :troop="troop" 
                       class="list-item"
                    />
                </div>
            </n-collapse-item>
        </n-collapse>
    </div>
  </div>
</template>

<style scoped>
.troop-info-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Let clicks pass through empty areas */
  z-index: 1000;
}

.troop-info-panel > * {
  pointer-events: auto; /* Re-enable clicks on cards */
}

.section-label {
    margin-bottom: 4px;
    font-weight: 800;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    background: rgba(0,0,0,0.6) !important;
}

.hover-section {
    animation: fadeIn 0.15s ease-out;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.highlight-card {
    border: 1px solid #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
}

.selected-container {
    background: rgba(16, 20, 29, 0.95);
    border: 1px solid #445;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* Styled to match the Arcane theme */
:deep(.n-collapse-item__header) {
    padding: 10px 12px !important;
    background: rgba(30, 40, 50, 0.6);
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

:deep(.n-collapse-item__header-main) {
    color: #eec !important;
    font-weight: bold;
    font-family: 'Segoe UI', sans-serif;
    letter-spacing: 0.5px;
}

:deep(.n-collapse-item__content-inner) {
    padding: 0 !important;
}

.list-scroll {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    transition: max-height 0.3s ease-in-out;
    max-height: 60vh; 
}

/* Custom Scrollbar */
.list-scroll::-webkit-scrollbar {
  width: 6px;
}
.list-scroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}
.list-scroll::-webkit-scrollbar-thumb {
  background: #556;
  border-radius: 3px;
}
.list-scroll::-webkit-scrollbar-thumb:hover {
  background: #778;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
