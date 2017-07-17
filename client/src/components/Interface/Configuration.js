import React, { Component } from 'react'
import { ButtonGroup, Button, Label } from 'reactstrap'
import { connect } from 'react-redux'
import './configuration.css'
import {
  toggleSensorsSelectAll,
  toggleSensorsSelectAccelerometer,
  toggleSensorsSelectGyroscope,
  toggleSensorsSelectOrientation,
  sensorsSelectAll,
  sensorsDeselectAll
} from '../../actions/record'

const Configuration = ({
  sensors: { accelerometer, gyroscope, orientation },
  connected,
  sensorsSelectAll,
  sensorsDeselectAll,
  toggleSensorsSelectAccelerometer,
  toggleSensorsSelectGyroscope,
  toggleSensorsSelectOrientation }) => (
    <div className='sensors-configuration'>
      <div className='sensors-all'>
        <Label for="gestureName">Choose Sensors</Label>
        <ButtonGroup >
          <Button onClick={toggleSensorsSelectAccelerometer} active={accelerometer} disabled={!connected}>A</Button>
          <Button onClick={toggleSensorsSelectGyroscope} active={gyroscope} disabled={!connected}>G</Button>
          <Button onClick={toggleSensorsSelectOrientation} active={orientation} disabled={!connected}>O</Button>
          {
            accelerometer && gyroscope && orientation
            ? <Button onClick={sensorsDeselectAll} active={accelerometer && gyroscope && orientation} disabled={!connected}>ALL</Button>
            : <Button onClick={sensorsSelectAll} active={accelerometer && gyroscope && orientation} disabled={!connected}>ALL</Button>
          }

        </ButtonGroup>
      </div>
    </div>
)
// export default Configuration
const mapStateToProps = ({record: { sensors, recording, recordBuffer }, myo: { connected }}) => ({ sensors, connected })
const mapDispatchToProps = dispatch => {
  return {
    sensorsSelectAll: () => dispatch(sensorsSelectAll()),
    sensorsDeselectAll: () => dispatch(sensorsDeselectAll()),
    toggleSensorsSelectAccelerometer: () => dispatch(toggleSensorsSelectAccelerometer()),
    toggleSensorsSelectGyroscope: () => dispatch(toggleSensorsSelectGyroscope()),
    toggleSensorsSelectOrientation: () => dispatch(toggleSensorsSelectOrientation())
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Configuration)
