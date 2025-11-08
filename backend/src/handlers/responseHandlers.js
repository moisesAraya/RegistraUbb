"use strict";

export const handleSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    data
  };
  
  console.log('📤 Enviando respuesta exitosa:', response);
  return res.status(statusCode).json(response);
};

export const handleErrorClient = (res, statusCode, message) => {
  const response = {
    success: false,
    message,
    data: null
  };
  
  console.log('📤 Enviando error del cliente:', response);
  return res.status(statusCode).json(response);
};

export const handleErrorServer = (res, statusCode, message) => {
  const response = {
    success: false,
    message,
    data: null
  };
  
  console.log('📤 Enviando error del servidor:', response);
  return res.status(statusCode).json(response);
};