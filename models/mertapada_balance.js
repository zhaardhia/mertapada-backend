const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mertapada_balance', {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    prevbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    currentbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    cum_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    cum_sales: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'mertapada_balance',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
