import { LocalStorage } from 'quasar'
import loadAuth0 from '../utils/auth0'

const setSession = (user, accessToken, claims) => {
  // Set isLoggedIn flag in localStorage
  LocalStorage.set('isLoggedIn', true)

  // Set the time that the access token will expire at
  const userId = user.sub
  const expiresAt = (claims.exp * 1000) + new Date().getTime()
  const idToken = claims.__raw

  LocalStorage.set('user', user)
  LocalStorage.set('userId', userId)
  LocalStorage.set('expiresAt', expiresAt)
  LocalStorage.set('accessToken', accessToken)
  LocalStorage.set('idToken', idToken)

  // graphqlReplicator.restart({ userId, accessToken })
}

const logout = () => {
  LocalStorage.set('isLoggedIn', false)
  LocalStorage.remove('user')
  LocalStorage.remove('userId')
  LocalStorage.remove('expiresAt')
  LocalStorage.remove('accessToken')
  LocalStorage.remove('idToken')
}

const handleAuthentication = async (next) => {
  const auth0 = await loadAuth0
  try {
    // console.log('Handling authentication from routes.js')

    await auth0.handleRedirectCallback()
    const user = await auth0.getUser()
    const accessToken = await auth0.getTokenSilently()
    const claims = await auth0.getIdTokenClaims()

    if (user && accessToken && claims) {
      setSession(user, accessToken, claims)
      // console.log('Success')
      next('/')
    }
  } catch (err) {
    logout()
    console.error(err)
    alert(`Error: ${err.error} - ${err.errorDescription}`)
    next('/login')
  }
}

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('src/pages/TodoListWrapper.vue')
      }
    ],
    beforeEnter: (to, from, next) => {
      if (!LocalStorage.has('isLoggedIn') || LocalStorage.getItem('isLoggedIn') !== true) {
        // console.log('Erreur non authentifié')
        next('/login')
      } else {
        // console.log('Ok authentifié')
        next()
      }
    }
  },
  { path: '/login', component: () => import('src/pages/Login.vue') },
  {
    path: '/callback',
    beforeEnter: (to, from, next) => {
      handleAuthentication(next)
    }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
