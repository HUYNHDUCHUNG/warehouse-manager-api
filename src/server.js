const app = require('~/app')
const { sequelize } = require('~/models')
import 'dotenv/config'




(async () => {
  try {
   

      await sequelize.authenticate()
      console.log('Connection has been established successfully.')
      app.listen(process.env.APP_PORT, () => {
          console.log(`App listening on port ${process.env.APP_PORT}`)
      })
  } catch (error) {
      console.log(error)
      process.exit(0)
  }
})()

