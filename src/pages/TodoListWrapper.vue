<template>
  <q-page>
    <template v-if="isLoaded">
      <div class="row justify-center q-mt-lg">
        <TodoInput />
      </div>
      <TodoList/>
    </template>
    <template v-else>
      <div class="row justify-center q-mt-lg">
        <q-item class="col" style="max-width: 600px">
          <q-item-section>
            <q-skeleton type="QInput"></q-skeleton>
          </q-item-section>
          <q-item-section side>
            <div class="text-grey-8 q-gutter-xs">
              <q-skeleton type="QBtn" size="24px"/>
            </div>
          </q-item-section>
        </q-item>
      </div>
      <div v-for ="n in [1, 2, 3]" v-bind:key="n" class="row justify-center">
        <q-item class="col" style="max-width: 300px">
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="q-gutter-xs">
              <q-skeleton type="QBtn" size="24px"/>
            </div>
          </q-item-section>
        </q-item>
      </div>
    </template>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'

import TodoInput from '../components/TodoInput.vue'
import TodoList from '../components/TodoList.vue'

import * as Database from '../utils/Database'

export default defineComponent({
  name: 'PageTodoWrapper',
  components: {
    TodoInput,
    TodoList
  },
  setup () {
    const isLoaded = ref(false)
    onMounted(() => {
      setTimeout(() => {
        Database.getDBInstance()
          .then(() => {
            isLoaded.value = true
          })
      }, 3000)
    })
    return {
      isLoaded
    }
  }
})
</script>
