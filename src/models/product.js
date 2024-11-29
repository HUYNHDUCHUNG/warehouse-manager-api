'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' })
    }
  }
  Product.init({
    code: DataTypes.STRING,
    product_name: DataTypes.STRING,
    category_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    price: DataTypes.BIGINT,
    unit_calc: DataTypes.STRING,
    inventory_quantity: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};