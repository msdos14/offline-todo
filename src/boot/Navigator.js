window.process = {
  env: { DEBUG: undefined }
}

export default ({ app, router, store }) => {
  // something to do
  // console.log('Setting up navigator object')
  // Expose window.navigator to Vue so that we can check online status
  app.config.globalProperties.$navigator = window.navigator
}
