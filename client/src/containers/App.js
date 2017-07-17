import React, { Component } from 'react';
import './App.css';
import { Row, Col } from 'reactstrap'
import ConnectionButtons from '../components/ConnectionButtons'
import RealTime from '../components/RealTime'
import TrainingSessions from '../components/TrainingSessions'
import Interface from '../components/Interface'

import styled from 'styled-components'

const Wrapper = styled.div`
  width: 90%;
  margin: 0 auto;
`

class Series extends Component {
  render() {
    return (
      <Wrapper>
        <Row>
          <Col xs='12' sm='2' className='series-configuration'>
            <h3 className='text-center series-connection-title'>Myo</h3>
            <ConnectionButtons />
            real time pause button
          </Col>
          <Col xs='12' sm='10'>
            <div className='charts'>
              <RealTime update />
            </div>
          </Col>
          <Col xs='12' sm='2' className='series-gesture-labels'>
            <TrainingSessions />

          </Col>
          <Col xs='12' sm='10' >
            <div className='series-sessions'>
              <Interface />
            </div>
          </Col>
        </Row>
      </Wrapper>
    );
  }
}

export default Series;
