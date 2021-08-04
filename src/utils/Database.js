import lodash from 'lodash'

import store from '../store'

import {
  TodoSchema
} from './Schema/Todo'

import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'

import { RxDBValidatePlugin } from 'rxdb/plugins/validate'
addRxPlugin(RxDBValidatePlugin)

import {
  RxDBReplicationGraphQLPlugin
} from 'rxdb/plugins/replication-graphql'
addRxPlugin(RxDBReplicationGraphQLPlugin)

import {
  SubscriptionClient
} from 'subscriptions-transport-ws'

// ONLY USE IN DEV MODE
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
addRxPlugin(RxDBDevModePlugin)

import { RxDBEncryptionPlugin } from 'rxdb/plugins/encryption'
addRxPlugin(RxDBEncryptionPlugin)

import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
addRxPlugin(RxDBQueryBuilderPlugin)

import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
addRxPlugin(RxDBUpdatePlugin)

import {
  addPouchPlugin,
  getRxStoragePouch
} from 'rxdb/plugins/pouchdb'

addPouchPlugin(require('pouchdb-adapter-idb'))

let db = null

export const createDb = async () => {
  // console.log('DatabaseService: creating database..')

  const db = await createRxDatabase({
    name: 'tododb',
    storage: getRxStoragePouch('idb'),
    password: '|8S_~|nC1>Vf&-9',
    queryChangeDetection: true
  })

  // console.log('DatabaseService: created database')
  window.db = db // write to window for debugging

  // console.log('DatabaseService: create collections')
  await db.addCollections({
    todos: {
      schema: TodoSchema
    }
  })

  return db
}

export const cleanUp = async () => {
  if (db) {
    // console.log('Destroying DBInstance')
    await db.destroy()
    // console.log('Destroying DBInstance DONE')
  }
}

export const getDBInstance = async () => {
  // console.log('Getting getDBInstance')
  if (!db) {
    // console.log('DB not instanciated, instantiating')
    db = await createDb()
    // console.log('DB Instanciated')
  }
  return db
}

const SYNC_URL = 'offline-todo.hasura.app/v1/graphql'

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
        _deleted
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
  // console.log('pushQueryBuilder START')
  const query = `
  mutation SetTodos($todo: [Todos_insert_input!]!) {
    insert_Todos(objects: $todo, on_conflict: {constraint: Todos_pkey, update_columns: [title, is_completed, _deleted, updated_at]}) {
      returning {
        id
      }
    }
  }
  `
  const variables = {
    todo: lodash.omit(doc, ['user_id', '_attachments', '_rev'])
  }

  // console.log('pushQueryBuilder', {
  //   query, variables
  // })

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

  async stop () {
    if (this.replicationState) {
      this.replicationState.cancel()
    }

    if (this.subscriptionClient) {
      this.subscriptionClient.close()
    }
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
      url: `https://${SYNC_URL}`,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      },
      push: {
        batchSize,
        queryBuilder: pushQueryBuilder,
        modifier: (doc) => {
          // console.log('DOC TO PUSH', doc)
          return doc
        }
      },
      pull: {
        queryBuilder: pullQueryBuilder(auth.userId),
        modifier: (doc) => {
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
      deletedFlag: '_deleted'
    })

    // console.log('Exposing to window.replicationState for DEBUG')
    window.replicationState = replicationState

    replicationState.send$.subscribe(data => {
      // console.log('REPLICATION SENDING', data)
    })

    replicationState.recieved$.subscribe(data => {
      // console.log('REPLICATION RECEIVING', data)
    })

    replicationState.error$.subscribe(err => {
      console.error('replication error:')
      console.dir(err)
    })

    replicationState.active$.subscribe(active => {
      // console.log('replication isActive', active)
    })

    replicationState.canceled$.subscribe(active => {
      // console.log('replication isCanceled', active)
    })

    return replicationState
  }

  setupGraphQLSubscription (auth, replicationState) {
    const endpointUrl = `wss://${SYNC_URL}`
    const wsClient = new SubscriptionClient(endpointUrl, {
      reconnect: true,
      connectionParams: {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`
        }
      },
      timeout: 1000 * 60,
      onConnect: () => {
        // console.log('SubscriptionClient.onConnect()')
      },
      connectionCallback: () => {
        // console.log('SubscriptionClient.connectionCallback:')
      },
      reconnectionAttempts: 10000,
      inactivityTimeout: 10 * 1000,
      lazy: true
    })

    const query = `subscription onTodosChanged {
      Todos {
        id
        title
        _deleted
        created_at
        is_completed
      }
    }`

    const ret = wsClient.request({
      query
    })

    ret.subscribe({
      next (data) {
        // console.log('subscription emitted => trigger run', data)
        const records = lodash.map(data.data.Todos, (r) => {
          return lodash.merge(
            lodash.pick(r, ['id', 'title', 'is_completed', 'created_at', '_deleted']),
            { _deleted: r.deleted }
          )
        })
        console.log('DATABASE DISPATCH')
        store.dispatch('todos/pushToTodos', { todos: records })
        replicationState.run()
      },
      error (error) {
        // console.log('got error:')
        console.dir(error)
      }
    })

    return wsClient
  }
}
