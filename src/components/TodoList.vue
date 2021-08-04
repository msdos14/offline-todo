<template>
  <div class="row justify-center">
    <q-list v-if="todos && todos.length > 0" bordered class="rounded-borders col" style="max-width: 450px">
      <template v-for="todo in todos" v-bind:key="todo.id">
        <TodoItem :todo="todo"/>
      <q-separator spaced />
      </template>
      <q-separator spaced />
    </q-list>
  </div>
</template>

<script>

import * as Database from '../utils/Database'
import { onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import lodash from 'lodash'

import TodoItem from './TodoItem.vue'

export default {
  name: 'TodoList',

  components: {
    TodoItem
  },

  setup () {
    const $store = useStore()

    const todos = computed(() => $store.getters['todos/getTodos'])

    onMounted(() => {
      setTimeout(() => {
        Database.getDBInstance()
          .then((db) => {
            db.todos.find()
              .sort('created_at').$.subscribe((records) => {
                console.log('records', records)
                records = lodash.map(records, (r) => {
                  return lodash.merge(
                    lodash.pick(r, ['id', 'title', 'is_completed', 'created_at', '_deleted']),
                    { _deleted: r.deleted }
                  )
                })
                console.log('result records', records)
                console.log('TODOLIST DISPATCH')
                $store.dispatch('todos/pushToTodos', { todos: records })
              })
          })
      }, 1000)
    })

    return {
      todos
    }
  }
}
</script>
