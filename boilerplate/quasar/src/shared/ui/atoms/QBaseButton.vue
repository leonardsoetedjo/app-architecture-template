<template>
  <q-btn
    :color="color"
    :outline="outline"
    :rounded="rounded"
    :flat="flat"
    :unelevated="unelevated"
    :size="size"
    :loading="loading"
    :disable="disabled"
    :icon="icon"
    :icon-right="iconRight"
    class="q-base-button"
    v-bind="$attrs"
  >
    <slot></slot>
  </q-btn>
</template>

<script setup lang="ts">
import { QBtn } from 'quasar';

export interface QBaseButtonProps {
  /** Button color variant */
  color?: 'primary' | 'secondary' | 'accent' | 'positive' | 'negative' | 'info' | 'warning';
  /** Outline style */
  outline?: boolean;
  /** Rounded corners */
  rounded?: boolean;
  /** Flat style */
  flat?: boolean;
  /** Unelevated style */
  unelevated?: boolean;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state with spinner */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Left icon */
  icon?: string;
  /** Right icon */
  iconRight?: string;
}

withDefaults(defineProps<QBaseButtonProps>(), {
  color: 'primary',
  outline: false,
  rounded: false,
  flat: false,
  unelevated: false,
  size: 'md',
  loading: false,
  disabled: false,
  icon: undefined,
  iconRight: undefined,
});
</script>

<style scoped>
.q-base-button {
  min-width: 80px;
}
</style>
