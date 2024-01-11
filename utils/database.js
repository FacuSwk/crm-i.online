// utils/database.js

const mysql = require("mysql");
const config = require("../config.js"); // Ajusta la ruta según la estructura de tu proyecto

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection(config.dbConfig);

// Conectar a la base de datos
function conectarBD() {
  connection.connect((err) => {
    if (err) {
      console.error("Error al conectar a la base de datos:", err);
      throw err;
    }
    console.log("Conexión exitosa a la base de datos MyXXXSQL");
  });
}

// Desconectar de la base de datos
function desconectarBD() {
  connection.end((err) => {
    if (err) {
      console.error("Error al desconectar de la base de datos:", err);
      throw err;
    }
    console.log("Desconexión exitosa de la base de datos");
  });
}

module.exports = {
  conectarBD,
  desconectarBD,
  connection,
};
