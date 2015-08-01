import _ from 'lodash'
import invariant from 'invariant'

export function remotesMiddleware(remote) {
  return ({ dispatch, getState }) => {
    return next => action => {
      remote(action, dispatch)
      return next(action)
    }
  }
}

export function createRemote(remotes, config){
  config = config || {}

  let contracts = []
  let archive = []

  window.logRemotes = function(){
    console.log('Contracts:',contracts,'Archive:', archive)
  }

  return function combinationRemote(action, dispatch) {

    var keys = _.keys(remotes)
    var contract = {
      unresolved: keys,
      resolved: [],
      dispatches: [],
      action: action,
    }

    contracts.push(contract)

    _.forEach(remotes, (remote, key) => {
      let handled = remote(action, () => {
        resolve(key)
      }, subdispatch)

      //if remote explicitly returns false, assume noop
      if(handled === false){
        noopResolve(key)
      }
    })

    function subdispatch(subaction) {
      contract.dispatches.push(subaction)
      dipatch(subaction)
    }

    function resolve(key){
      contract.resolved.push(key)
      noopResolve(key)
    }

    //same as above but do not add to resolved list
    function noopResolve(key){
      invariant(contract.unresolved.indexOf(key) !== -1, 'Cannot resolve twice for remote: ', key, ' for Action: ', action.type, '. You either called finish() twice or returned false and called finish()')
      contract.unresolved = _.without(contract.unresolved, key)
      if(contract.unresolved.length === 0){
        completeContract()
      }
    }

    function completeContract() {
      contracts = _.without(contracts, contract)
      //only process if something was handled
      if(contract.resolved.length > 0){
        archive.unshift(contract)
        archive = archive.slice(0, 1000)
        if(config.log){
          console.log('%c REMOTE COMPLETE: '+action.type, 'background: #a9e2fc', action, contract)
        }
      }
    }
  }
}
