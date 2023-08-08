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
      allowNull: true
    },
    nett_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    main_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    other_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    shop_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    shop_expense_detail_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rent_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    employees_salary_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    absence_detail_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    currentbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    prevbalance: {
      type: DataTypes.FLOAT(255,0),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
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
