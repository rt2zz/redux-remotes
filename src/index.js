import _ from 'lodash'
import invariant from 'invariant'

//@TODO need to figure out how this plays with action replay and other redux enhancers

export function remotesMiddleware(remote) {
  return ({ dispatch, getState }) => {
    return next => action => {
      remote(action, dispatch, getState)
      return next(action)
    }
  }
}

export function createRemote(remotes, config){
  let finalRemotes = _.pick(remotes, (val) => typeof val === 'function')
  config = config || {}

  let contracts = []
  let archive = []

  window.logRemotes = function(){
    console.log('Contracts:',contracts,'Archive:', archive)
  }

  return function combinationRemote(action, dispatch, getState) {

    var keys = _.keys(finalRemotes)
    var contract = {
      unresolved: keys,
      resolved: [],
      dispatches: [],
      action: action,
    }

    contracts.push(contract)

    _.forEach(finalRemotes, (remote, key) => {
      let handled = remote({action, getState, dispatch: subdispatch, finish})
      //if remote explicitly returns false, assume noop
      if(handled === false){
        noopResolve(key)
      }

      function finish(finalAction) {
        if(typeof finalAction === 'object'){
          subdispatch(finalAction)
        }
        resolve(key)
      }
    })

    function subdispatch(subaction) {
      contract.dispatches.push(subaction)
      dispatch(subaction)
    }

    function resolve(key){
      contract.resolved.push(key)
      noopResolve(key)
    }

    //same as above but do not add to resolved list
    function noopResolve(key){
      invariant(contract.unresolved.indexOf(key) !== -1, 'Cannot resolve twice for remote: '+key+' for Action: '+action.type+'. You either called finish() twice or returned false and called finish()')
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
        if(config.log === true){
          let groupable = typeof console.groupCollapsed === 'function'

          var time = new Date()
          var isCollapsed = typeof collapsed === "function" ? collapsed(getState, action) : collapsed;
          var formattedTime = timestamp ? " @ " + time.getHours() + ":" + pad(time.getMinutes()) + ":" + pad(time.getSeconds()) : "";
          var formattedDuration = duration ? " in " + took.toFixed(2) + " ms" : "";
          var formattedAction = actionTransformer(action);
          var message = "remote " + formattedAction.type + formattedTime + formattedDuration;

          if(groupable){ console.groupCollapsed(message) }
          console.log('resolved %i remotes', contract.resolved.length, contract.resolved)
          console.log('dispatched %i child actions', contract.dispatches.length, _.pluck(contract.dispatches, 'type'))
          console.log('%i contracts outstanding', contracts.length, _.map(contracts, (contract) => contract.action.type))

          if(groupable){
            console.groupCollapsed('more details')
            console.log("completed contract:", contract)
            console.log("outstanding contracts:", contracts)
            console.groupEnd()
          }

          if(groupable){ console.groupEnd() }
        }
      }
    }
  }
}

var pad = function pad(num) {
  return ("0" + num).slice(-2)
}

export function remoteActionMap(map){
  return (api) => {
    if(!map[api.action.type]){
      return false
    }
    map[api.action.type](api)
    return true
  }
}
