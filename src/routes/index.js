const router = require('express').Router()
const categoryRouter = require('./category.route')
const productRouter = require('./product.route')
const supplierRouter = require('./supplier.route')
const customerRouter = require('./customer.route')
const purchaseOrderRouter = require('./purchase-order.route')
const exportOrderRouter = require('./export-order.route')


router.use('/category',categoryRouter)
router.use('/product',productRouter)
router.use('/supplier',supplierRouter)
router.use('/customer',customerRouter)
router.use('/purchase-order',purchaseOrderRouter)
router.use('/export-order',exportOrderRouter)
module.exports = router