const lodash = require('lodash')
export function getTodos (state) {
  const res = lodash.orderBy(state.todos, ['created_at'], ['desc'])
  return lodash.filter(res, (t) => !t._deleted)
}
