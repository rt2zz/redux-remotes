# Redux Remotes
Treat your remote interactions (read: intents or async actions) right. Observable, serializable, and debuggable.

**Warning** this is an early experiment. Because most remote interactions are not "replayable", allowing actions to trigger them may be an anti-pattern. It will likely break things like devtools.

Not necessarily redux specific, but that is the target architecture.

##Usage
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
    break

  default:
    return false
  }
}
```
