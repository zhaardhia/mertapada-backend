"use strict";

exports.res200 = (res, statusCode = "000", message = "Operation success", data = null) => {
  const response = { statusCode, message, data };
  res.status(200);
  res.json(response);
  res.end();
};

exports.res404 = (res, message = "Resources not found") => {
  const response = { message };
  res.status(404);
  res.json(response);
  res.end();
};

exports.res400 = (res, message = "Request error. Please read the API documentation.") => {
  const response = { message };
  res.status(400);
  res.json(response);
  res.end();
};

exports.res401 = (res, message = "Forbidden. You're not allowed to access this resources.") => {
  const response = { message };
  res.status(401);
  res.json(response);
  res.end();
};

exports.res429 = (res, message = "Too many requests", retrySecs = 0) => {
  const response = { message };
  if(retrySecs) res.set('Retry-After', String(retrySecs));
  res.status(429);
  res.json(response);
  res.end();
};

exports.res500 = (res, message = "Internal system failure. Please contact system administrator") => {
  const response = { message };
  res.status(500);
  res.json(response);
  res.end();
};
