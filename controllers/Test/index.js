"use strict";

const response = require("../../components/response")
const { db } = require("../../components/database")
const bcrypt = require("bcrypt")
// const { nanoid } = require('nanoid');
const jwt = require("jsonwebtoken")

exports.getAllCourier = async (req, res, next) => {
  return response.res200(res, "000", "Berhasil konfigurasi API!");
}