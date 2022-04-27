const express = require('express')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.set('view engine', 'ejs')

const userRouter = require('./routes/panel')

app.get('/', (req, res) => {
    res.render('main')
})

app.use('/panel', userRouter)

app.listen(process.env.PORT || 80)