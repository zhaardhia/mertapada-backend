"use strict";
const { Sequelize, DataTypes } = require("sequelize");
const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;

const db = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  timezone: "+07:00",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
});

db.authenticate()
  .then(() => console.log(`Connected to database : ${DB_HOST}:${DB_PORT}`))
  .catch(() => console.error(`Unable to connect to the database!`));

const category = require("../models/category");
const daily_report = require("../models/daily_report");
const employee_absence = require("../models/employee_absence");
const employee = require("../models/employee");
const mertapada_balance = require("../models/mertapada_balance");
const rent = require("../models/rent");
const shop_expense_detail = require("../models/shop_expense_detail");
const user = require("../models/user");
const daily_shop_item = require("../models/daily_shop_item");
const monthly_recap = require("../models/monthly_recap");
const monthly_exact_expense = require("../models/monthly_exact_expense");
module.exports = {
  category: category(db, DataTypes),
  daily_report: daily_report(db, DataTypes),
  employee_absence: employee_absence(db, DataTypes),
  employee: employee(db, DataTypes),
  mertapada_balance: mertapada_balance(db, DataTypes),
  rent: rent(db, DataTypes),
  shop_expense_detail: shop_expense_detail(db, DataTypes),
  user: user(db, DataTypes),
  daily_shop_item: daily_shop_item(db, DataTypes),
  monthly_recap: monthly_recap(db, DataTypes),
  monthly_exact_expense: monthly_exact_expense(db, DataTypes),
  db,
};