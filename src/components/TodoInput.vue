<template>
  <q-item class="col" style="max-width: 600px">
    <q-item-section>
      <q-input rounded outlined v-model="title" placeholder="Nouvelle tâche...">
        <template v-slot:after>
          <q-btn round dense flat icon="add" color="primary" />
        </template>
      </q-input>
    </q-item-section>
  </q-item>
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'TodoInput',
  setup () {
    const title = ref('')
    return {
      title
    }
  }
}
</script>
