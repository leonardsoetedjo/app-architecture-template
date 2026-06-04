<template>
  <q-input
    v-model="model"
    :color="color"
    :dark="dark"
    :dense="dense"
    :outlined="outlined"
    :borderless="borderless"
    :square="square"
    :bg-color="bgColor"
    :type="type"
    :label="label"
    :placeholder="placeholder"
    :error="error"
    :error-message="errorMessage"
    :disable="disabled"
    :readonly="readonly"
    :loading="loading"
    :prefix="prefix"
    :suffix="suffix"
    :counter="counter"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    class="q-base-input"
    v-bind="$attrs"
  >
    <template v-if="prependIcon" v-slot:prepend>
      <q-icon :name="prependIcon" />
    </template>
    <template v-if="appendIcon" v-slot:append>
      <q-icon :name="appendIcon" />
    </template>
    <slot></slot>
  </q-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { QInput, QIcon } from 'quasar';

export interface QBaseInputProps {
  /** Input value (v-model) */
  modelValue?: string | number;
  /** Input color */
  color?: 'primary' | 'secondary' | 'accent' | 'positive' | 'negative' | 'info' | 'warning';
  /** Dark mode */
  dark?: boolean;
  /** Dense mode */
  dense?: boolean;
  /** Outlined style */
  outlined?: boolean;
  /** Borderless style */
  borderless?: boolean;
  /** Square corners */
  square?: boolean;
  /** Background color */
  bgColor?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readonly?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Prefix text */
  prefix?: string;
  /** Suffix text */
  suffix?: string;
  /** Character counter */
  counter?: boolean;
  /** Maximum length */
  maxlength?: number;
  /** Autocomplete attribute */
  autocomplete?: string;
  /** Prepend icon */
  prependIcon?: string;
  /** Append icon */
  appendIcon?: string;
}

const props = withDefaults(defineProps<QBaseInputProps>(), {
  modelValue: '',
  color: 'primary',
  dark: false,
  dense: false,
  outlined: false,
  borderless: false,
  square: false,
  bgColor: undefined,
  type: 'text',
  label: undefined,
  placeholder: undefined,
  error: false,
  errorMessage: undefined,
  disabled: false,
  readonly: false,
  loading: false,
  prefix: undefined,
  suffix: undefined,
  counter: false,
  maxlength: undefined,
  autocomplete: undefined,
  prependIcon: undefined,
  appendIcon: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'blur': [event: FocusEvent];
  'focus': [event: FocusEvent];
}>();

const model = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  model.value = newValue;
});

watch(model, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<style scoped>
.q-base-input {
  width: 100%;
}
</style>
