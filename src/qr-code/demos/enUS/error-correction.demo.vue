<markdown>
  # Error correction

  Use `error-correction-level` to set the error correction level.
</markdown>

<script lang="ts" setup>
import { ref } from 'vue'

const errorCorrectionLevel = ref('M')
const errorCorrectionOptions = [
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'Q', label: 'Q' },
  { value: 'H', label: 'H' }
]
</script>

<template>
  <n-space vertical>
    <n-qr-code
      value="Like a humorous magician, he skillfully turns tedious information into a mysterious QR code"
      :error-correction-level="errorCorrectionLevel"
    />
    <n-radio-group v-model:value="errorCorrectionLevel">
      <n-radio-button
        v-for="errorCorrection in errorCorrectionOptions"
        :key="errorCorrection.value"
        :value="errorCorrection.value"
        :label="errorCorrection.label"
      />
    </n-radio-group>
  </n-space>
</template>
