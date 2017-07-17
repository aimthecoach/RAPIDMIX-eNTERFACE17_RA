import React from 'react'
import LineChart from './LineChart'
import './realtime.css'
import { Row } from 'reactstrap'
import { connect } from 'react-redux'

const Realtime = ({ accelerometer, gyroscope, orientation }) => (
  <Row className='charts-section'>
    <div className='charts-item'>
      <h5 className='text-center'>Orientation</h5>
      <LineChart data={orientation} sensor={'orientation'} update />
    </div>
    <div className='charts-item'>
      <h5 className='text-center'>Accelerometer</h5>
      <LineChart data={accelerometer} sensor={'accelerometer'} update />
    </div>
    <div className='charts-item'>
      <h5 className='text-center'>Gyroscope</h5>
      <LineChart data={gyroscope} sensor={'gyroscope'} update />
    </div>
  </Row>
)

const mapStateToProps = ({ charts: { accelerometer, gyroscope, orientation } }) => {
  return {
    accelerometer,
    gyroscope,
    orientation
  }
}
export default connect(mapStateToProps)(Realtime)
