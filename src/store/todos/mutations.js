const lodash = require('lodash')
export function setTodos (state, todos) {
  todos = lodash.sortBy(todos, 'created_at')
  state.todos = todos
}
