<template>
  <q-item class="col-12">
    <q-item-section>
      <q-item-label lines="1">
        <span class="text-weight-medium">{{ todo.title }}</span>
        <span class="text-grey-8"> - {{ formatDate(todo.created_at) }}</span>
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="text-grey-8 q-gutter-xs">
        <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="deleteTodo"/>
        <q-btn class="gt-xs" size="12px" flat dense round icon="done" @click="finishTodo"/>
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
import moment from 'moment'

export default {
  name: 'TodoItem',
  props: {
    todo: Object
  },
  setup (props) {
    const formatDate = (date) => {
      moment(date).fromNow()
    }

    const finishTodo = () => {
      alert('Not implemented')
    }

    const deleteTodo = () => {
      alert('Not implement')
    }

    return {
      formatDate,
      finishTodo,
      deleteTodo
    }
  }
}
</script>
