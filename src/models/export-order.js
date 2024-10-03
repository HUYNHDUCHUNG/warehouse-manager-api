'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ExportOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ExportOrder.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' })
      ExportOrder.hasMany(models.ExportOrderDetail, {
        foreignKey: 'exportOrderId',
        as: 'exportOrderDetails', 
      });
    }
  }
  ExportOrder.init({
    codeExportOrder: DataTypes.STRING,
    dateExport: DataTypes.STRING,
    total_price: DataTypes.STRING,
    customerId: DataTypes.STRING,
    note: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ExportOrder',
  });
  return ExportOrder;
};