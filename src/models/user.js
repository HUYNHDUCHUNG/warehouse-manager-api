'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.ExportOrder, {
        foreignKey: 'userId',
        as: 'exportOrder',
      });
      User.hasMany(models.PurchaseOrder, {
        foreignKey: 'userId',
        as: 'purchaseOrder',
      });
    }
  }
  User.init({
    fullName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    phone: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    contract: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};