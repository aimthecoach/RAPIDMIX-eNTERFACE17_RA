import React from 'react'
import { connect } from 'react-redux'
import Snapshots from './Snapshots'
import SnapshotsNoData from './SnapshotsNoData'
import { formatRecordedData } from '../../utils'
import { saveVectorToBuffer } from '../../actions/record'

const Recorded = ({ recorded, recordedLength }) => {
  return (
    <div>{
      recordedLength > 0 ? <Snapshots recorded={recorded} /> : <SnapshotsNoData />
    }</div>
  )
}
const mapStateToProps = ({ record: { recorded } }) => {
  return {
    recordedLength: recorded.length,
    recorded
  }
}

export default connect(mapStateToProps)(Recorded)
