<template>
  <q-item class="col" style="max-width: 600px">
    <q-item-section>
      <q-input rounded outlined v-model="title" placeholder="Nouvelle tâche...">
        <template v-slot:after>
          <q-btn round dense flat icon="add" color="primary" @click="addTodo"/>
        </template>
      </q-input>
    </q-item-section>
  </q-item>
</template>

<script>
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { LocalStorage } from 'quasar'

import { getDBInstance } from '../utils/Database'

export default {
  name: 'TodoInput',
  setup () {
    const title = ref('')

    const addTodo = () => {
      if (title.value === '') return
      getDBInstance()
        .then((db) => {
          if (!db) return
          const todoToCreate = {
            id: uuidv4(),
            title: title.value,
            is_completed: false,
            created_at: new Date().toISOString(),
            user_id: LocalStorage.getItem('userId')
          }
          try {
            db.todos.insert(todoToCreate)
          } catch (err) {
            console.log('Error insert', err)
          }
          title.value = ''
        })
    }

    return {
      title,
      addTodo
    }
  }
}
</script>
