const app = require('~/app')
const { sequelize } = require('~/models')
const cron = require('node-cron')
import 'dotenv/config'
const stockRecommendationController = require("~/controllers/stock-recommendation.controller");
const SalesKPIController = require("~/controllers/kpi-user.controller");



(async () => {
  try {
   

      await sequelize.authenticate()
      console.log('Connection has been established successfully.')
      app.listen(process.env.APP_PORT, () => {
          console.log(`App listening on port ${process.env.APP_PORT}`)
        //   cron.schedule('10 * * * * *', stockRecommendationController.getInventoryRecommendations)
          //  cron.schedule('10 * * * * *', SalesKPIController.calculateMonthlyKPI)
      })
  } catch (error) {
      console.log(error)
      process.exit(0)
  }
})()

