import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'

import {
  TodoSchema
} from './Schema/Todo'

import { RxDBValidatePlugin } from 'rxdb/plugins/validate'
import { RxDBReplicationGraphQLPlugin } from 'rxdb/plugins/replication-graphql'

import {
  SubscriptionClient
} from 'subscriptions-transport-ws'

// ONLY USE IN DEV MODE
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
addRxPlugin(RxDBDevModePlugin)

addRxPlugin(RxDBValidatePlugin)
addRxPlugin(RxDBReplicationGraphQLPlugin)

import { RxDBEncryptionPlugin } from 'rxdb/plugins/encryption'
addRxPlugin(RxDBEncryptionPlugin)

import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
addRxPlugin(RxDBQueryBuilderPlugin)

import {
  addPouchPlugin,
  getRxStoragePouch
} from 'rxdb/plugins/pouchdb'

addPouchPlugin(require('pouchdb-adapter-idb'))

let db = null

export const createDb = async () => {
  console.log('DatabaseService: creating database..')

  const db = await createRxDatabase({
    name: 'tododb',
    storage: getRxStoragePouch('idb'),
    password: '|8S_~|nC1>Vf&-9',
    queryChangeDetection: true
  })

  console.log('DatabaseService: created database')
  window.db = db // write to window for debugging

  console.log('DatabaseService: create collections')
  await db.addCollections({
    todos: {
      schema: TodoSchema
    }
  })

  return db
}

export const getDBInstance = async () => {
  console.log('Getting getDBInstance')
  if (!db) {
    console.log('DB not instanciated, instantiating')
    db = await createDb()
    console.log('DB Instanciated')
  }
  return db
}

const syncURL = 'https://offline-todo.hasura.app/v1/graphql'

const batchSize = 5
const pullQueryBuilder = (userId) => {
  return (doc) => {
    if (!doc) {
      doc = {
        id: 0,
        updated_at: new Date(0).toUTCString()
      }
    }

    const query = `{
      Todos(
        where: {
          _or: [
            {updated_at: {_gt: "${doc.updated_at}"}},
            {
              updated_at: {_eq: "${doc.updated_at}"},
              id: {_gt: "${doc.id}"}
            }
          ],
          user_id: {_eq: "${userId}"} 
        },
        limit: ${batchSize},
        order_by: [{updated_at: asc}, {id: asc}]
      ) {
        id
        title
        is_completed
        deleted
        created_at
        updated_at
        user_id
      }
    }`
    return {
      query,
      variables: {}
    }
  }
}

const pushQueryBuilder = doc => {
  const query = `
    mutation InsertTodo($todo: [Todos_insert_input]!) {
      insert_Todos(
        objects: $todo,
        on_conflict: {
          constraint: Todos_pkey,
          update_columns: [is_completed, deleted, updated_at]
        }){
        returning {
          id
        }
      }
    }
  `
  const variables = {
    todo: doc
  }

  return {
    query,
    variables
  }
}

export class GraphQLReplicator {
  constructor (db) {
    this.db = db
    this.replicationState = null
    this.subscriptionClient = null
  }

  async restart (auth) {
    if (this.replicationState) {
      this.replicationState.cancel()
    }

    if (this.subscriptionClient) {
      this.subscriptionClient.close()
    }

    this.replicationState = await this.setupGraphQLReplication(auth)
    this.subscriptionClient = this.setupGraphQLSubscription(auth, this.replicationState)
  }

  async setupGraphQLReplication (auth) {
    const replicationState = this.db.todos.syncGraphQL({
      url: syncURL,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      },
      push: {
        batchSize,
        queryBuilder: pushQueryBuilder,
        modifier: (doc) => {
          doc.id = Number(doc.id)
          return doc
        }
      },
      pull: {
        queryBuilder: pullQueryBuilder(auth.userId),
        modifier: (doc) => {
          doc.id = String(doc.id)
          return doc
        }
      },
      live: true,
      /**
       * Because the websocket is used to inform the client
       * when something has changed,
       * we can set the liveIntervall to a high value
       */
      liveInterval: 1000 * 60 * 10, // 10 minutes
      deletedFlag: 'deleted'
    })

    replicationState.error$.subscribe(err => {
      console.error('replication error:')
      console.dir(err)
    })

    return replicationState
  }

  setupGraphQLSubscription (auth, replicationState) {
    const endpointUrl = 'wss://offline-todo.hasura.app/v1/graphql'
    const wsClient = new SubscriptionClient(endpointUrl, {
      reconnect: true,
      connectionParams: {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`
        }
      },
      timeout: 1000 * 60,
      onConnect: () => {
        console.log('SubscriptionClient.onConnect()')
      },
      connectionCallback: () => {
        console.log('SubscriptionClient.connectionCallback:')
      },
      reconnectionAttempts: 10000,
      inactivityTimeout: 10 * 1000,
      lazy: true
    })

    const query = `subscription onTodosChanged {
      Todos {
        id
        title
        deleted
        is_completed
      }
    }`

    const ret = wsClient.request({
      query
    })

    ret.subscribe({
      next (data) {
        console.log('subscription emitted => trigger run')
        console.dir(data)
        replicationState.run()
      },
      error (error) {
        console.log('got error:')
        console.dir(error)
      }
    })

    return wsClient
  }
}
