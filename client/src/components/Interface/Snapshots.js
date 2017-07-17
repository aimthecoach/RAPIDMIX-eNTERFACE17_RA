import React from 'react'
import LineChart from '../RealTime/LineChart'
import { Row, Col, Button } from 'reactstrap'
const Snapshots = ({ recorded }) => {
  return (
    <div>{
      recorded.map(gesture => {
        let keys = Object.keys(gesture)
        return (
          <Row className='sessions-chart-flex' >{
            keys.map(key => {
              const data = gesture[key]
              return (
                <Col md='3' className='sessions-chart-flex-item'>
                  <h5>{`${key}`}</h5>
                  <LineChart className='sessions-chart' width={300} data={data} sensor={key} />
                </Col>
              )
            })

          }
          </Row>
        )
      })
    }</div>
  )
}

export default Snapshots
