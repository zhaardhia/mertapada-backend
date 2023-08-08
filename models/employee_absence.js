const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('employee_absence', {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    employee_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    absence_detail_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_present: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1: true, 0: false"
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    tableName: 'employee_absence',
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
