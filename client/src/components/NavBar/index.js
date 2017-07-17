import React from 'react'
import { Link } from 'react-router-dom'
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavLink } from 'reactstrap'

export default class Navigaton extends React.Component {
  constructor (props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.state = {
      isOpen: false
    }
  }
  toggle () {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }
  render () {
    return (
      <div>
        <Navbar color='faded' light toggleable>
          <NavbarToggler right onClick={this.toggle} />
          <NavbarBrand href='/'>RapidMix</NavbarBrand>
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className='ml-auto' navbar>
              <li>
                <Link to='/'>Home</Link>
              </li>
              <li>
                <Link to='/classification'>Classification</Link>
              </li>
              <li>
                <Link to='/regression'>Regression</Link>
              </li>
              <li>
                <Link to='/series'>Series</Link>
              </li>
              <li>
                <Link to='/count'>Counter</Link>
              </li>
            </Nav>
          </Collapse>
        </Navbar>
      </div>
    )
  }
}
