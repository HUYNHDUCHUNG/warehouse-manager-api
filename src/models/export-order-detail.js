'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ExportOrderDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ExportOrderDetail.belongsTo(models.ExportOrder, { foreignKey: 'exportOrderId', as: 'exportOrder' })
      ExportOrderDetail.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
    }
  }
  ExportOrderDetail.init({
    exportOrderId: DataTypes.STRING,
    productId: DataTypes.STRING,
    quantity: DataTypes.STRING,
    unitPrice: DataTypes.STRING,
    totalPrice: DataTypes.STRING,
    
  }, {
    sequelize,
    modelName: 'ExportOrderDetail',
  });
  return ExportOrderDetail;
};