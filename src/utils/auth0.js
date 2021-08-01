import { AUTH_CONFIG } from './auth0-variables'
import createAuth0Client from '@auth0/auth0-spa-js'

export default createAuth0Client({
  domain: AUTH_CONFIG.domain,
  client_id: AUTH_CONFIG.clientId,
  redirect_uri: AUTH_CONFIG.callbackUrl,
  audience: AUTH_CONFIG.audience,
  responseType: 'token id_token',
  scope: 'openid profile',
  cacheLocation: 'localstorage'
})
