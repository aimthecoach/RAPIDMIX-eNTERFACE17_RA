import React, { Component } from 'react'
import { ButtonGroup, Button } from 'reactstrap'
import { connect } from 'react-redux'
import {
  setInterfaceAddEdit,
  setInterfaceRunCompare } from '../../actions/interface'

class TraningSessions extends Component {
  render(){
    let { setInterfaceAddEdit, setInterfaceRunCompare} = this.props
    return (
      <div>
        <h5>Gestures</h5>
        <ButtonGroup>
          <Button onClick={setInterfaceAddEdit}>Add</Button>
          <Button onClick={setInterfaceRunCompare}>Run</Button>
        </ButtonGroup>
        <ul>
          <li>LIST OF GESTURES</li>
        </ul>
      </div>
    )
  }
}
const mapDispatchToProps = dispatch => {
  return {
    setInterfaceAddEdit: () => dispatch(setInterfaceAddEdit()),
    setInterfaceRunCompare: () => dispatch(setInterfaceRunCompare())
  }
}
export default connect(null, mapDispatchToProps)(TraningSessions)
