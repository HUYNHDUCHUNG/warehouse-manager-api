'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseOrderDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PurchaseOrderDetail.belongsTo(models.PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' })
      PurchaseOrderDetail.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
    }
  }
  PurchaseOrderDetail.init({
    purchaseOrderId: DataTypes.STRING,
    productId: DataTypes.STRING,
    quantity: DataTypes.STRING,
    unitPrice: DataTypes.STRING,
    totalPrice: DataTypes.STRING,
    
  }, {
    sequelize,
    modelName: 'PurchaseOrderDetail',
  });
  return PurchaseOrderDetail;
};