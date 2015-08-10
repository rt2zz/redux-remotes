# Redux Remotes
Trigger remote interactions (e.g. async actions) via dispatch.  

Remotes provides a standard, predicatable, semi-declarative API for handling remote interactions. It is similar to using redux-thunk, except instead of dispatching a function, you dispatch a "command" action which is then handled by a remote. There are potentially a few benefits to this approach:
* "Command actions" are serializable (as opposed to action creator invocation which is not)
* Robust and standardized logging
* See all dispatches that originated from within a remote-action
* Potential to archive and replay all remote interactions
* See all oustanding "contracts" at any point in time, which can be really useful for long running remote interactions like geolocation.
* Apply a remote interaction to multiple or all action types (e.g. remote logging)
* Apply multiple remote interactions to one source action

Additionally because the structure of remotes mirrors that of reducers, the mental model is light and easy to integrate within an existing redux application.

**Warning** this is an early experiment.

Not necessarily redux specific, but that is the target architecture.

## What does it look like?
Remotes works as follows:  
1. Compose multiple `remotes` into a single `remote` function (just like you do with reducers  
2. Install the middleware. The middleware sends every action to the registered remote before passing it along.   
3. A contract is created for every action that one more remotes handles.  
4. Each remote calls finish() when it is done operating on an action.  

To get a better idea of what this looks like, see the console logging upon contract completion:
<hr />
<img style="border:2px solid #aaaaaa;" src="https://raw.githubusercontent.com/rt2zz/redux-remotes/master/examples/log.png" />

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
    //call finish when done operating so the contract can be closed.
    setTimeout(finish, 1000)
    //return true indicates this remote is going to operate, and the contract should wait for response
    return true

  default:
    //return false if no operation
    return false
  }
}
```

## Use Cases
Restful Resource
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
```

## Uncertainties
This may need some tweaking to play well with store enhancers like redux-devtools. Further testing and experimentation is needed.
