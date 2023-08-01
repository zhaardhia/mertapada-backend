"use strict";

const sequelize = require("sequelize");
const Sequelize = require("sequelize")
const { db } = require("../../components/database")
const { Op } = sequelize;
const { 
	user
} = require("../../components/database");

exports.getAllUserImageInfo = async (uid) => {
  return user.findAll({
    raw: true,
    // where: {
    //   uid
    // },
    attributes: ["id", "email", "fullname", "first_name", "last_name", "address", "role"]
  })
}

exports.getUserById = async (id) => {
  return user.findOne({
    raw: true,
    where: {
      id
    },
    attributes: ["id", "email", "fullname", "first_name", "last_name", "address", "city", "postal_code", "phone", "role"]
  })
}

exports.updateUserProfile = async (dbTransaction, payload, id) => {
  return user.update(
    payload, { where: { id }, transaction: dbTransaction }
  )
}

exports.registerPassword = async (payload) => {
  return user.create(
    payload
  )
}

exports.getUserByEmail = async (email) => {
  return user.findOne({
    raw: true,
    where: {
      email
    }
  })
}

exports.getUserByUsername = async (username) => {
  return user.findOne({
    raw:true,
    where: {
      username
    }
  })
}

exports.updateRefreshToken = async (userId, refresh_token) => {
  return user.update(
    {
      refresh_token,
      forgot_pass_token: null
    },
    {
      where: {
        id: userId
      }
    }
  )
}

exports.updateForgotPassToken = async (userId, forgot_pass_token) => {
  return user.update(
    {
      forgot_pass_token
    },
    {
      where: {
        id: userId
      }
    }
  )
}

exports.getTokenForgotPass = async (forgot_pass_token) => {
  return user.findOne({
    raw: true,
    where: {
      forgot_pass_token
    },
    attributes: ["id", "email", "forgot_pass_token"]
  })
}

exports.changePassword = async (id, password) => {
  return user.update(
    {
      password,
      forgot_pass_token: null
    },
    {
      where: {
        id
      }
    }
  )
}

exports.getRefreshToken = async (refresh_token) => {
  return user.findAll({
    raw: true,
    where: {
      refresh_token
    }
  })
}