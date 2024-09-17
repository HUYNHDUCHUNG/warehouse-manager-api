const express = require('express')
const app = express()
const appRouter = require('~/routes')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/api',appRouter)

app.use((err, req, res, next) => {
    const status = err.status || 500
    const message = status !== 500 && err.message

    return res.status(status).json({
        status,
        message
    })
})

module.exports = app