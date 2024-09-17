const router = require('express').Router()
const categoryRouter = require('./category.route')
const productRouter = require('./product.route')



router.use('/category',categoryRouter)
router.use('/product',productRouter)
module.exports = router