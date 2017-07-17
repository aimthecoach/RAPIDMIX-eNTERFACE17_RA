import React, { Component } from 'react'


import ModeAddEdit from './ModeAddEdit'
import ModeNormalBlank from './ModeNormalBlank'
import ModeRunCompare from './ModeRunCompare'

import { connect } from 'react-redux'

import { setGestureName } from '../../actions/gesture'

class Interface extends Component {
  constructor(){
    super()
    this.handleOnChange = this.handleOnChange.bind(this)
  }

  handleOnChange(e){
    e.preventDefault()
    let name = e.target.value
    this.props.setGestureName(name)
  }
  renderMode(){
    let { mode } = this.props
    switch (mode) {
      case 'ADD_EDIT':
        return (<ModeAddEdit handleOnChange={this.handleOnChange}/>)
      case 'RUN_COMPARE':
        return (<ModeRunCompare  />)
      default:
        return (<ModeNormalBlank  />)
    }
  }
  render(){
    return (
      <div>
        { this.renderMode() }
      </div>
    )
  }
}
const mapStateToProps = ({ interface: { mode }}) => ({ mode })
const mapDispatchToProps = dispatch => {
  return {
    setGestureName: text => dispatch(setGestureName(text))
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Interface)
