import React from 'react'
import { Button, ButtonGroup } from 'reactstrap'
import {
  myoConnect,
  myoDisconnect
} from '../actions/myo'
import { connect } from 'react-redux'

const ConnectionButtons = ({ connected, myoConnect, myoDisconnect }) => {

  return (
    <div className='text-center'>{
      connected
      ? <Button color='danger' onClick={myoDisconnect} >Disconnect</Button>
      : <Button color='success' onClick={myoConnect} >Connect</Button>
    }
    </div>
  )
}

const mapStateToProps = ({ myo : { connected } }) => {
  return { connected }
}

const mapDispatchToProps = dispatch => {
  return {
    myoConnect: () => dispatch(myoConnect()),
    myoDisconnect: () => dispatch(myoDisconnect())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectionButtons)
