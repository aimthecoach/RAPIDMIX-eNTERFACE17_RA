import React from 'react'
import { ButtonGroup, Button, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap'
import Configuration from './Configuration'
import Record from './Record'
import { connect } from 'react-redux'
import Recorded from './Recorded'
import { setInterfaceNormalBlank } from '../../actions/interface'


const ModeAddEdit = ({ setInterfaceNormalBlank, handleOnChange }) => (
  <div>
    <Row>
      <Col sm="3">
        <Configuration />
      </Col>
      <Col sm="3">
        <Form>
         <FormGroup>
           <Label for="gestureName">Name</Label>
           <Input type="text" name="gestureName"  onChange={handleOnChange} placeholder="enter name here..." />
         </FormGroup>
       </Form>
      </Col>
      <Col sm="2">
        <Record />
      </Col>
      <Col sm="4">
        <Label for="gestureName">Actions</Label>
        <div>
          <ButtonGroup>
            <Button color="success">Save</Button>
            <Button color="danger">Destroy</Button>
            <Button color="warning" onClick={setInterfaceNormalBlank}>Cancel</Button>
          </ButtonGroup>
      </div>
      </Col>
    </Row>
    <Row>
      <p></p>
    </Row>
    <Row>
      <Recorded />
    </Row>
  </div>
)
const mapDispatchToProps = dispatch => {
  return {
    setInterfaceNormalBlank: () => dispatch(setInterfaceNormalBlank())
  }
}

export default connect(null, mapDispatchToProps)(ModeAddEdit)
