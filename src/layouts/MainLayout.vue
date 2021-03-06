<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
          <q-toolbar-title>
            Offline Todo
          </q-toolbar-title>
          <q-space ></q-space>
          <q-icon style="font-size: 2em; margin-right: 0.2em" :name="isOnlineRef ? 'wifi' : 'wifi_off'"></q-icon>
          <q-btn style="margin-right: 0.2em" flat round icon="clear" @click="wipeDB"></q-btn>
          <q-item clickable v-ripple @click="logout">
            <q-item-section side>
              <q-avatar size="48px">
                <img :src="userRef.picture" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ userRef.name }}</q-item-label>
              <q-item-label caption class="text-white">Se déconnecter</q-item-label>
            </q-item-section>
    </q-item>
        </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>

import { defineComponent, onBeforeMount, onBeforeUnmount, getCurrentInstance, ref } from 'vue'
import { LocalStorage } from 'quasar'
import { useRouter } from 'vue-router'

import * as Database from '../utils/Database'
import loadAuth0 from '../utils/auth0'

export default defineComponent({
  name: 'MainLayout',
  setup () {
    const $v = getCurrentInstance()
    const $router = useRouter()

    let graphqlReplicator = null

    const logout = () => {
      LocalStorage.set('isLoggedIn', false)
      LocalStorage.remove('user')
      LocalStorage.remove('userId')
      LocalStorage.remove('expiresAt')
      LocalStorage.remove('accessToken')
      LocalStorage.remove('idToken')
      $router.push('/login')
    }

    const wipeDB = async () => {
      const ok = window.confirm('Voulez vous vraiment réinitialiser la BDD locale?')
      if (ok) {
        const db = await Database.getDBInstance()
        await db.remove()
        location.reload()
      }
    }

    const isExpired = () => {
      // Check whether the current time is past the
      // access token's expiry time
      return new Date().getTime() > expiresAt
    }

    const isLoggedIn = () => {
      return LocalStorage.getItem('isLoggedIn') === true
    }

    let idToken = LocalStorage.getItem('idToken')
    let expiresAt = LocalStorage.getItem('expiresAt')
    let userId = LocalStorage.getItem('userId')

    const setSession = async (user, accessToken, claims) => {
      // Set isLoggedIn flag in localStorage
      LocalStorage.set('isLoggedIn', true)

      // Set the time that the access token will expire at
      userId = user.sub
      expiresAt = (claims.exp * 1000) + new Date().getTime()
      idToken = claims.__raw

      LocalStorage.set('user', user)
      LocalStorage.set('userId', userId)
      LocalStorage.set('expiresAt', expiresAt)
      LocalStorage.set('accessToken', accessToken)
      LocalStorage.set('idToken', idToken)

      await graphqlReplicator.restart({ userId, accessToken })
    }

    const isOnlineRef = ref($v.appContext.config.globalProperties.$navigator.onLine)
    const renewSession = () => {
      // console.log('Starting set interval')
      return setInterval(async () => {
        const shouldRenewSession = isLoggedIn() && (!idToken || isExpired())
        if (isOnlineRef.value && shouldRenewSession) {
          // console.log('Checking session')
          const auth0 = await loadAuth0
          try {
            const user = await auth0.getUser()
            // console.log('user', user)
            const accessToken = await auth0.getTokenSilently()
            const claims = await auth0.getIdTokenClaims()

            if (user && accessToken && claims) {
              await setSession(user, accessToken, claims)
            }
          } catch (err) {
            logout()
            // console.log(err)
            alert(`Could not get a new token (${err.error}: ${err.error_description}).`)
          }
        } else {
          // console.log('no action')
        }
      }, 5000)
    }

    const handleOfflineEvent = () => {
      isOnlineRef.value = false
      if (graphqlReplicator) {
        graphqlReplicator.stop()
      }
    }

    const handleOnlineEvent = async () => {
      isOnlineRef.value = true
      if (graphqlReplicator) {
        const auth0 = await loadAuth0
        const user = await auth0.getUser()
        const userId = user.sub
        const accessToken = await auth0.getTokenSilently()

        await graphqlReplicator.restart({ userId, accessToken })
      }
    }

    const initGraphQLReplicator = async () => {
      const db = await Database.getDBInstance()
      graphqlReplicator = new Database.GraphQLReplicator(db)

      if (isOnlineRef.value) {
        const auth0 = await loadAuth0
        const user = await auth0.getUser()
        const userId = user.sub
        const accessToken = await auth0.getTokenSilently()

        await graphqlReplicator.restart({ userId, accessToken })
      } else {
        graphqlReplicator.stop()
      }
    }

    const userRef = ref(LocalStorage.getItem('user'))
    let intervalID
    onBeforeMount(async () => {
      userRef.value = LocalStorage.getItem('user')

      if (isLoggedIn()) {
        // console.log('Logged in')
        intervalID = renewSession()
      } else {
        // console.log('Not logged in')
      }

      window.addEventListener('offline', handleOfflineEvent)

      window.addEventListener('online', handleOnlineEvent)

      await initGraphQLReplicator()
    })

    onBeforeUnmount(async () => {
      clearInterval(intervalID)
      await Database.cleanUp()
      window.removeEventListener('offline', handleOfflineEvent)
      window.removeEventListener('online', handleOnlineEvent)
    })

    return {
      userRef,
      isOnlineRef,
      logout,
      wipeDB
    }
  }
})
</script>
