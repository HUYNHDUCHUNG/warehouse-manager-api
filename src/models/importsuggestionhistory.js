'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ImportSuggestionHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ImportSuggestionHistory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      ImportSuggestionHistory.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })

    }
  }
  ImportSuggestionHistory.init({
    productId: DataTypes.STRING,
    userId: DataTypes.STRING,
    currentInventory: DataTypes.STRING,
    suggestedQuantity: DataTypes.STRING,
    totalUnprocessedOrders: DataTypes.STRING,
    status: DataTypes.STRING,
    note: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ImportSuggestionHistory',
  });
  return ImportSuggestionHistory;
};