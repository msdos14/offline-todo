
# Offline Todo (offline-todo) [WIP]

  

Offline todo with Hasura and RxDB

  

## Install the dependencies

```bash

yarn

```

  

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash

quasar dev

```

  

### Lint the files

```bash

yarn run lint

```

  

### Build the app for Offline capability with Quasar PWA mode

NB: As of right now, this app is intended for local use only, it won't work if served via any other URL than http://localhost:8080

```bash

quasar build -m pwa

quasar serve -p 8080 .\\dist\\pwa --history

```

  

### Customize the configuration

See [Configuring quasar.conf.js](https://v2.quasar.dev/quasar-cli/quasar-conf-js).

You **COULD** change the config in src/utils/auth0-variables.js to use your own [Auth0](https://auth0.com/fr) account

You also can change the variable **SYNC_URL** in src/utils/Database.js to use another GraphQL endpoint. Default value is: "*offline-todo.hasura.app/v1/graphql*"

NB: Please note that additional configuration will be needed if you change your endpoint because it will have to match the default one.