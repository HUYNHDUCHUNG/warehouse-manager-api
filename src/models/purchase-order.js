'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' })
      PurchaseOrder.hasMany(models.PurchaseOrderDetail, {
        foreignKey: 'purchaseOrderId',
        as: 'purchaseOrderDetails', 
      });
    }
  }
  PurchaseOrder.init({
    codePurchaseOrder: DataTypes.BIGINT,
    dateImport: DataTypes.DATE,
    total_price: DataTypes.BIGINT,
    supplier_id: DataTypes.STRING,
    note: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
  });
  return PurchaseOrder;
};