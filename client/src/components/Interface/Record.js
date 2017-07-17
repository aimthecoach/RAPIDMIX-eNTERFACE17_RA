import React from 'react'
import { ButtonGroup, Button, Label } from 'reactstrap'
import { connect } from 'react-redux'
import { startRecording, stopRecording } from '../../actions/record'

const Record = ({ recording, startRecording, stopRecording, connected, accelerometer, gyroscope, orientation }) => {
  const handleStart = () => startRecording()
  const handleStop = () => stopRecording()
  return (
    <div>
      <Label for="gestureName">Recording</Label><div></div>
      <ButtonGroup>
        {
          recording
          ? <Button color="danger" onClick={handleStop} disabled={!connected}>STOP</Button>
          : <Button color="primary" onClick={handleStart} disabled={!connected || (!accelerometer && !gyroscope && !orientation)}>START</Button>
        }
      </ButtonGroup>
    </div>
  )
}

const mapStateToProps = ({ record: { recording, sensors: { accelerometer, gyroscope, orientation} }, myo: { connected } }) => ({ recording, connected, accelerometer, gyroscope, orientation })

const mapDispatchToProps = dispatch => {
  return {
    startRecording: () => dispatch(startRecording()),
    stopRecording: () => dispatch(stopRecording())
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Record)
