<template>
  <Transition name="fade">
    <div v-if="isVisible" class="popup-overlay">
      <div class="popup-content">
        <h3>Line&nbsp;Complete!</h3>
        <div class="check-icon">✅</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)

function show() {
  isVisible.value = true
  setTimeout(() => {
    isVisible.value = false
  }, 2000)
}

defineExpose({ show })
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  pointer-events: none;
}

.popup-content {
  background-color: #4caf50;
  color: white;
  padding: 30px 50px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  pointer-events: auto;
}

h3 {
  margin: 0;
  font-size: 24px;
}

.check-icon {
  font-size: 48px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
