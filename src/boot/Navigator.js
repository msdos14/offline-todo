window.process = {
  env: { DEBUG: undefined }
}

export default ({ app, router, store }) => {
  // something to do
  console.log('Setting up navigator object')
  app.config.globalProperties.$navigator = window.navigator
}
