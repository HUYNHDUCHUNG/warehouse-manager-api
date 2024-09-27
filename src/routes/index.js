const router = require('express').Router()
const categoryRouter = require('./category.route')
const productRouter = require('./product.route')
const supplierRouter = require('./supplier.route')
const purchaseOrderRouter = require('./purchase-order.route')


router.use('/category',categoryRouter)
router.use('/product',productRouter)
router.use('/supplier',supplierRouter)
router.use('/purchase-order',purchaseOrderRouter)
module.exports = router