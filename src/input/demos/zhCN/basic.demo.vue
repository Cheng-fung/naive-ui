<markdown>
# 基础用法

文本输入的基础用法。
</markdown>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(null)
</script>

<template>
  <n-space vertical>
    <n-input v-model:value="value" type="text" placeholder="基本的 Input" />
    <n-input
      v-model:value="value"
      type="textarea"
      placeholder="基本的 Textarea"
    />
  </n-space>
</template>
