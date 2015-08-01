# Redux Remotes
Care for your remote interactions (read: intents or async actions). Observable, serializable, and slightly more declarative.  

**Warning** this is an early experiment.  

Not necessarily redux specific, but that is the target architecture.

## Usage
```js
import { createRemote, remotesMiddleware } from 'redux-remotes'
import * as remotes from '../remotes'

const remote = createRemote(remotes, {log: true})
const remoteMW = remotesMiddleware(remote)
const createStoreWithMiddleware = applyMiddleware(remoteMW)(createStore)
```
in reducers/someReducer.js
```js
import { INCREMENT } from '../constants/ActionTypes'

export default function account(action, finish, dispatch) {
  switch (action.type) {

  case INCREMENT:
    setTimeout(finish, 1000)
    return true

  default:
    return false
  }
}
```

##Action Naming
Because we are now creating raw actions that represent "intents" some adjustments may need to be made to naming conventions. As intents are now 1-1 to raw actions, we call these "remote actions", and and dispatches that occur within the remote are called "remote actions". Any given remote action may have multiple remote handlers and may still be handled as normal by reducers.

**note** "remote actions" are indistinguishable from normal actions, the only difference is whether you decide to take action in a remote.

Possible naming for restful resources, such as a blog post:
```js
//explicit naming/seperation
REMOTE_PROFILE_CREATE
PROFILE_CREATE_PENDING
PROFILE_CREATE_SUCCESS
PROFILE_CREATE_FAIL

//terse naming
PROFILE_CREATE
PROFILE_CREATE_SUCCESS
PROFILE_CREATE_FAIL
```

## Use Cases
RESTFUL Resource
```js
export default function profile(action, finish, dispatch) {
  switch (action.type) {

  case PROFILE_CREATE:
    let profile = {...action.data, timestamp: Date.now()}
    profilePending(profile)
    apiClient.createProfile(profile, (err) => {
      if(err){ profileFail(profile) }
      else{ profileSuccess(profile) }
      finish()
    })
    return true

  default:
    return false
  }

  function profilePending(profile){
    dispatch({ type: PROFILE_CREATE_PENDING, profile: profile})
  }
  function profileFail(profile){
    dispatch({ type: PROFILE_CREATE_FAIL, profile: profile})
  }
  function profileSuccess(profile){
    dispatch({ type: PROFILE_CREATE_SUCCESS, profile: profile })
  }
}
```

Other times remotes may not need to report their status as actions. For example a remote action logger:
```js
export default function remoteLogger(action, finish, dispatch) {
  remoteLog(action, () => {
    finish()
  })
  return true
}
```

Or a remote stream
```js
export default function alertPipe(action, finish, dispatch) {
  switch (action.type) {

  let unsubscribe = null

  case SUBSCRIBE_TO_ALERTS:
    listener = rethinkDBListener((alert) => {
      dispatch({
        type: 'ALERT',
        alert: alert,
      })
    })
    unsubscribe = () => {
      listener.destroy()
      finish()
    }
    //finish is never called, meaning this will always show
    return true

  case UNSUBSCRIBE_TO_ALERTS:
    unsubscribe && unsubscribe()
    finish()
    return true

  default:
    return false
}

## Uncertainties
This may need some tweaking to play well with store enhancers like redux-devtools. Further testing and experimentation is needed. Also flowing intents and actions through the same dispatcher may be an anti-pattern, it is possible remotes should hang off of a separate dispatcher.
