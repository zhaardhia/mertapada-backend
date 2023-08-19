const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('monthly_recap', {
    id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    gross_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false,
      comment: "Pendapatan (Omset)"
    },
    shop_expense: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_lauk_pauk: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_bumbu_sayuran: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_sembako_minuman: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_others: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_gaji: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    total_sewa: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    nett_profit: {
      type: DataTypes.FLOAT(255,0),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "unverified"
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
    tableName: 'monthly_recap',
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
