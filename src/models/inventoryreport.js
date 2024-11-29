'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventoryReport extends Model {
    static associate(models) {
      InventoryReport.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  InventoryReport.init({
    productId: DataTypes.INTEGER,
    month: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    beginningInventory: {
      type: DataTypes.STRING,
      defaultValue: 0
    },
    quantityImported: {
      type: DataTypes.STRING,
    },
    quantityExported: {
      type: DataTypes.STRING,
    },
    endingInventory: {
      type: DataTypes.STRING,
    },
    inventoryValue: {
      type: DataTypes.STRING,
    },
    unitPrice: {
      type: DataTypes.STRING,
    }
  }, {
    sequelize,
    modelName: 'InventoryReport',
    indexes: [
      {
        unique: true,
        fields: ['productId', 'month', 'year']
      }
    ]
  });

  return InventoryReport;
};