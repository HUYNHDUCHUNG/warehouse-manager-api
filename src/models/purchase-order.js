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
      PurchaseOrder.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' })
      PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' })

    }
  }
  PurchaseOrder.init({
    product_id: DataTypes.STRING,
    quantity: DataTypes.BIGINT,
    unit_price: DataTypes.BIGINT,
    total_price: DataTypes.BIGINT,
    supplier_id: DataTypes.STRING,
    note: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
  });
  return PurchaseOrder;
};