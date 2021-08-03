const lodash = require('lodash')

export function pushToTodos ({ state, commit }, payload) {
  let storedTodos = Array.from(state.todos)
  lodash.each(payload.todos, (todo) => {
    storedTodos = lodash.filter(storedTodos, (t) => t.id !== todo.id)
    storedTodos = [...storedTodos, todo]
    commit('setTodos', storedTodos)
  })
}
