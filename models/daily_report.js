const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('daily_report', {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    gross_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    nett_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    shop_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    shop_expense_detail_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rent_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    employees_salary_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    employee_absence_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    currentbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    prevbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(255),
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
    tableName: 'daily_report',
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
