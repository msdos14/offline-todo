<template>
  <div class="column items-center">
    <div class="row justify-center" style="margin-top: 17vh">
      <h5 class=col>Bienvenu(e) sur Offline Todo</h5>
    </div>
    <div class="row justify-center">
      <p class="col">Veuillez vous connecter pour continuer</p>
    </div>
    <div class="row justify-center">
      <q-btn color="primary" text-color="white" label="Connexion" @click="login" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import loadAuth0 from '../utils/auth0'

export default defineComponent({
  name: 'PageLogin',
  setup () {
    const login = async () => {
      const auth0 = await loadAuth0
      await auth0.loginWithRedirect()
    }

    return {
      login
    }
  }
})
</script>
