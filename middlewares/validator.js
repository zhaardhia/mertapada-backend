const { body, param, query, validationResult } = require("express-validator");
const { createHmac } = require("crypto")


exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

exports.credentialApiHit = (req, res, next) => {
  if (typeof req.headers.token !== 'undefined' && typeof req.headers.timestamp !== 'undefined' && typeof req.headers.identifier !== 'undefined') {

    const appKey = req.headers.identifier;
    const timestamp = req.headers.timestamp;
    const headerToken = req.headers.token;
    const secretKey = process.env.SECRET_KEY_API;

    const token = createHmac('sha256', secretKey).update(timestamp + appKey).digest('hex');

    if(token !== headerToken){
      response.res401(res, "Invalid token");
    } else {
      next();
    }

  } else {
    response.res400(res, "token, timestamp and identifier is required");
  }

}

exports.validationEmail = (email) => {
  let regex = new RegExp("([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\"\(\[\]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])");
	return regex.test(email)
};