<template>
  <div class="row justify-center">
    <q-list bordered class="rounded-borders col" style="max-width: 450px">
      <template v-for="todo in [...todos]" v-bind:key="todo.id">
        <q-item class="col-12">
        <q-item-section>
          <q-item-label lines="1">
            <span class="text-weight-medium">{{ todo.title }}</span>
            <span class="text-grey-8"> - {{ moment(todo.created_at).fromNow() }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="text-grey-8 q-gutter-xs">
            <q-btn class="gt-xs" size="12px" flat dense round icon="delete" />
            <q-btn class="gt-xs" size="12px" flat dense round icon="done" />
          </div>
        </q-item-section>
      </q-item>
      <q-separator spaced />
      </template>
      <q-separator spaced />
    </q-list>
  </div>
</template>

<script>

import * as Database from '../utils/Database'
import { onMounted, ref } from 'vue'
import moment from 'moment'

export default {
  name: 'TodoList',

  setup () {
    const todos = ref([])
    onMounted(() => {
      Database.getDBInstance()
        .then((db) => {
          db.todos.find()
            .sort('created_at').$.subscribe((records) => {
              console.log('todos', records)
              todos.value = records
            })
        })
    })

    return {
      moment,
      todos
    }
  }
}
</script>
