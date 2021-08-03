<template>
  <q-item class="col-12">
    <q-item-section>
      <q-item-label lines="1" :class="todo.is_completed ? 'text-strike' : ''">
        <span class="text-weight-medium">{{ todo.title }}</span>
        <span class="text-grey-8"> - {{ formatDate(todo.created_at) }}</span>
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="text-grey-8 q-gutter-xs">
        <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="deleteTodo"/>
        <q-btn class="gt-xs" size="12px" flat dense round :icon="todo.is_completed ? 'check_box' : 'check_box_outline_blank'" @click="finishTodo"/>
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
import moment from 'moment'
import { useStore } from 'vuex'
export default {
  name: 'TodoItem',
  props: {
    todo: Object
  },
  setup (props) {
    const $store = useStore()
    const formatDate = (date) => {
      return moment(date).fromNow()
    }

    const finishTodo = async () => {
      await $store.dispatch('todos/finishTodo', { id: props.todo.id, is_completed: !props.todo.is_completed })
    }

    const deleteTodo = async () => {
      await $store.dispatch('todos/deleteTodo', { id: props.todo.id })
    }

    return {
      formatDate,
      finishTodo,
      deleteTodo
    }
  }
}
</script>
