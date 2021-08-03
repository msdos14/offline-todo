const lodash = require('lodash')
import * as Database from '../../utils/Database'

export function pushToTodos ({ state, commit }, payload) {
  let storedTodos = Array.from(state.todos)

  lodash.each(payload.todos, (todo) => {
    storedTodos = lodash.filter(storedTodos, (t) => t.id !== todo.id)
    storedTodos = [...storedTodos, todo]
  })

  commit('setTodos', storedTodos)
}

export async function finishTodo (context, payload) {
  const db = await Database.getDBInstance()
  const todo = await db.todos.findOne({
    selector: {
      id: payload.id
    }
  }).exec()
  if (todo) {
    todo.update({
      $set: {
        is_completed: payload.is_completed
      }
    })
  } else {
    console.error(`TODO ${payload.id} not found in DB`)
  }
}

export async function deleteTodo (context, payload) {
  const db = await Database.getDBInstance()
  const todo = await db.todos.findOne({
    selector: {
      id: payload.id
    }
  }).exec()
  if (todo) {
    todo.remove()
  } else {
    console.error(`TODO ${payload.id} not found in DB`)
  }
}
