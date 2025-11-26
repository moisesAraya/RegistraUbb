"use strict";

export const handleSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    data
  };
  
  return res.status(statusCode).json(response);
};

export const handleErrorClient = (res, statusCode, message) => {
  const response = {
    success: false,
    message,
    data: null
  };
  
  return res.status(statusCode).json(response);
};

export const handleErrorServer = (res, statusCode, message) => {
  const response = {
    success: false,
    message,
    data: null
  };
  
  return res.status(statusCode).json(response);
};