const express = require('express')
const socket = require('socket.io')
const http = require('http')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socket(server)
const port = 3001

app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
/****************************************************************
*                          API
****************************************************************/
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
app.post('/api/v1/series', (req, res) => {
  console.log(req.body)
  res.json({
    success: true,
    message: 'Came through'
  })
})

/****************************************************************
*                          Socket.io
****************************************************************/

const getRandom = (min, max) => (Math.random() * (max - min) + min)

const getRandomInt = (min, max) => (Math.floor(Math.random() * (max - min + 1) + min))

let timer = null
const startMockIMU = (socket) => {
  timer = setInterval(() => {
    socket.emit('mock_imu', {
      accelerometer: {
        x: getRandom(-3, 3),
        y: getRandom(-3, 3),
        z: getRandom(-3, 3)
      },
      gyroscope: {
        x: getRandomInt(-600, 600),
        y: getRandomInt(-600, 600),
        z: getRandomInt(-600, 600)
      },
      orientation: {
        w: getRandom(-1, 1),
        x: getRandom(-1, 1),
        y: getRandom(-1, 1),
        z: getRandom(-1, 1)
      }
    })
  }, 100)
}

// let timer = null
// let timera = null
// let timerg = null
// let timero = null
// const getAdata = () => ({x: getRandom(-3, 3), y: getRandom(-3, 3), z: getRandom(-3, 3)})
// const startMockIMU = (socket, channel, func, timer) => {
//   timer = setInterval(() => {
//     let res = func()
//     socket.emit(`${channel}`, res)
//   }, 100)
// }
const rapidlib = require('./lib/Rapidlib')
const formatTrainingData = frameArray => {
  let res = frameArray.map(frame => {
    let trainingInput = []
    let keys = Object.keys(frame)
    keys.map(key => {
      let axis = Object.keys(frame[key])
      axis.map(ax => {
        trainingInput.push(frame[key][ax])
      })
    })
    return trainingInput
  })
  res = res.map(r => ({ input: r }))
  return res
}
let users = {}

// const formatRecordedData = dataArray => {
//   let resArray = []
//   dataArray.map(gestureArray => {
//     let gestureFormated = {}
//     gestureArray.map(frameObj => {
//       let keys = Object.keys(frameObj)
//       keys.map(key => {
//         if (gestureFormated[key] !== undefined) {
//           gestureFormated[key] = [...gestureFormated[key], frameObj[key]]
//         } else {
//           gestureFormated[key] = []
//           gestureFormated[key] = [...gestureFormated[key], frameObj[key]]
//         }
//       })
//     })
//     resArray = [ ...resArray, gestureFormated]
//   })
//   return resArray
// }

const formatToChartData = data => {
  let res = {}
  data.map(frame => {
    let keys = Object.keys(frame)
    keys.map(key => {
      if (res[key] === undefined) {
        res[key] = []
        res[key].push(frame[key])
      } else {
        res[key].push(frame[key])
      }
    })
  })
  return res
}
io.on('connection', (socket) => {
  console.log('new socket on server', socket.id)
  let myDTW = new rapidlib.SeriesClassification()
  users[socket.id] = {
    myDTW,
    record: [],
    recorded: [],
    run_record: []

  }
  socket.on('startMock', () => {
    clearInterval(timer)
    startMockIMU(socket)
  })
  socket.on('stopMock', () => {
    clearInterval(timer)
  })
  // was record frame vector
  socket.on('start_recording', ({ frame }) => {
    users[socket.id] = Object.assign({}, users[socket.id], { record: [...users[socket.id].record, frame] })
  })

  socket.on('stop_recording', () => {
    let data = users[socket.id].record
    let recordObj = {
      trained: false,
      data_frames: data,
      training_data_formated: formatTrainingData(data)
    }
    users[socket.id] = Object.assign({}, users[socket.id], {
      recorded: [...users[socket.id].recorded, recordObj],
      record: []
    })
    console.log(recordObj.data_frames)
    socket.emit('SERVER_ACTIONS', { type: 'SET_RECORDED_FROM_SOCKET', payload: formatToChartData(recordObj.data_frames) })
  })

  socket.on('start_recording_comp_sample', ({ frame }) => {
    users[socket.id] = Object.assign({}, users[socket.id], { run_record: [...users[socket.id].run_record, frame] })
  })
  socket.on('stop_recording_comp_sample', ({ frame }) => {
    let { run_record, recorded } = users[socket.id]
    // preciso de transformar a informacao
    let result = users[socket.id].myDTW.run(data)

    // talvez tenha de encontrar o maior valor, tirar o idx e utilizar como ref
    //  ---> return idx
    // formatToChartData() a informacao para ser logo loadada
    // enviar o array selecionado do recorded e o run_record para serem ambos mostrados lado a lado
    // let final = {
    //   winner: {
    //     idx: idx,
    //     run_record,
    //
    //   }
    // }
    // socket.emit('SERVER_ACTIONS', { type: 'SET_DTW_RESULT', payload: final })
  })

  socket.on('stop_recording', () => {
    let data = users[socket.id].record
    let recordObj = {
      trained: false,
      data_frames: data,
      training_data_formated: formatTrainingData(data)
    }
    users[socket.id] = Object.assign({}, users[socket.id], {
      recorded: [...users[socket.id].recorded, recordObj],
      record: []
    })
    console.log(recordObj.data_frames)
    socket.emit('SERVER_ACTIONS', { type: 'SET_RECORDED_FROM_SOCKET', payload: formatToChartData(recordObj.data_frames) })
  })

  socket.on('model_train', gestureIdx => {
    // TODO: seria melhor se recebesse um array de indexes e fizesse treino so desses.
    let { recorded: {training_data_formated} } = users[socket.id]
    users[socket.id].myDTW.train(training_data_formated)
  })

  socket.on('model_reset', () => {
    users[socket.id].myDTW.reset()
  })

  socket.on('model_run', data => {
    let result = users[socket.id].myDTW.run(data)
    socket.emit('SERVER_ACTIONS', { type: 'SET_DTW_RESULT', payload: result })
  })

  socket.on('disconnect', () => {
    console.log(`user ${socket.id} has just disconnected`)
    delete users[socket.id]
  })
  socket.on('getUsers', () => {
    socket.emit('users', users)
  })
})

// start server
server.listen(port, err => {
  if (err) {
    console.log('error', err)
  } else {
    console.log(`Server running at http://localhost:${port}`)
  }
})
