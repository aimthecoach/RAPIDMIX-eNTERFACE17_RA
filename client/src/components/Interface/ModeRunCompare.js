import React from 'react'
import { Button, Row, Col } from 'reactstrap'
import Record from './Record'
import { connect } from 'react-redux'

const ModeRunCompare = ({ recorded, run_record, winner }) => (
  <div>
    <Row>
      <Col sm="3">
        <Record />
      </Col>
    </Row>
    <Row>
      <p></p>
    </Row>
    <Row>
      <Col>
        <h1>No data at the moment. Please record a gesture!</h1>
      </Col>
    </Row>
  </div>
)

const mapStateToProps = ({ record: { recorded, run_record, winner }}) => ({ recorded, run_record, winner })

export default connect()(ModeRunCompare)
