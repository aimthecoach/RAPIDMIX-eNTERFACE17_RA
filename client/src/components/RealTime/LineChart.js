import React, { Component } from 'react'
import { LineChart, Line, YAxis, Legend } from 'recharts'
import equal from 'deep-equal'
const fillState = () => {
  let newState = []
  for (let i = 0; i < 100; i++) {
    newState.push({
      x: 0,
      y: 0,
      z: 0
    })
  }
  return newState
}
export default class UniqueChart extends Component {
  constructor () {
    super()
    this.options = {
      accelerometer: {
        labels: [ 'x', 'y', 'z' ],
        domain: [-4, 4]
      },
      gyroscope: {
        labels: [ 'x', 'y', 'z' ],
        domain: [-800, 800]
      },
      orientation: {
        labels: [ 'w', 'x', 'y', 'z' ],
        domain: [-2, 2]
      }
    }
    this.state = {
      data: fillState()
    }
    this.tick = this.tick.bind(this)
    this.lineColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
  }

  tick () {
    // this.forceUpdate()
    this.setState({data: this.props.data})
  }
  componentDidMount () {
    this.interval = setInterval(this.tick, 100)
  }
  componentWillUnmount () {
    clearInterval(this.interval)
  }
  render () {
    const {sensor, data} = this.props
    let device = this.options[sensor]
    let width = this.props.width || 365
    // let { data } = this.state
    return (
      <div>
        <LineChart width={width} height={150} data={data}
          margin={{top: 5, right: 30, left: 5, bottom: 5}}>
          <YAxis domain={device.domain} />
          {device.labels.map((l, i) => (
            <Line
              type='basis'
              key={`${i}`}
              dataKey={`${l}`}
              dot={false}
              stroke={this.lineColors[i]}
              isAnimationActive={false} />
        ))}
          <Legend />
        </LineChart>
      </div>
    )
  }
}
