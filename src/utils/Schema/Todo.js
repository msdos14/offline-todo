export const TodoSchema = {
  title: 'Todo schema',
  description: 'Todo schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true
    },
    title: {
      type: 'string'
    },
    is_completed: {
      type: 'boolean'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    },
    user_id: {
      type: 'string'
    }
  },
  required: ['id', 'title', 'is_completed', 'user_id', 'created_at'],
  indexes: ['created_at'],
  additionalProperties: true
}
