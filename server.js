const config = require("./config.js");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3300;

app.use(bodyParser.json());
const corsOptions = {
  origin: "*", // "https://crm-i.online", // Permitir cualquier origen *
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use("/api", cors(corsOptions));
app.use("/uploads", cors(corsOptions));

const secretKey = "*_c00rd3n4d45_*";
const connection = mysql.createConnection(config.dbConfig);
// Configurar una ruta para servir archivos estáticos (imágenes)
app.use("/uploads", express.static("uploads"));

// Define la función credencialesSonValidas antes de usarla en la ruta de inicio de sesión
function credencialesSonValidas(correo, contrasena, callback) {
  const query =
    "SELECT * FROM Usuarios WHERE CorreoElectronico = ? AND Contrasena = ?";
  connection.query(query, [correo, contrasena], (error, results) => {
    if (error) {
      // Llama al callback con el error
      return callback(error, null);
    }

    // Si se encontró un usuario con las credenciales proporcionadas, la longitud de los resultados será mayor que 0
    const usuarioValido = results.length > 0;

    // Llama al callback con el resultado (true si las credenciales son válidas, false si no)
    callback(null, usuarioValido);
  });
}

// Resto del código de tu servidor...

connection.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conexión exitosa a la base de datos MyXXXSQL");
});
// Middleware para verificar el token
// Middleware para verificar el token
function verificarToken(req, res, next) {
  const token = req.headers.authorization; // Aquí asumimos que el token se envía en el encabezado Authorization

  if (!token) {
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.decoded = decoded; // Almacena la información del token decodificado en req.decoded
    next();
  });
}

//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES
//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuración de Multer para manejar la subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear una carpeta con el ID del producto
    const productId = req.body.id_producto; // Asegúrate de enviar el ID del producto en la solicitud
    const productFolderPath = `uploads/${productId}`;

    if (!fs.existsSync(productFolderPath)) {
      fs.mkdirSync(productFolderPath);
    }

    cb(null, productFolderPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Nombre del archivo
  },
});

const upload = multer({ storage: storage });

// Ruta para servir imágenes estáticas desde la carpeta 'uploads'
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Configuración para servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ruta para subir imágenes
app.post("/api/subir-imagenes", upload.array("imagenes", 5), (req, res) => {
  const imagenes = req.files;
  const idProducto = req.body.id_producto; // Asegúrate de enviar el ID del producto en la solicitud

  // Insertar la ruta de las imágenes en la base de datos
  const imagenesInsertQuery =
    "INSERT INTO imagenes (ruta_imagen, id_producto) VALUES ?";
  const imagenesData = imagenes.map((image) => [
    path.join(idProducto.toString(), image.filename),
    idProducto,
  ]);

  connection.query(imagenesInsertQuery, [imagenesData], (error) => {
    if (error) {
      console.error(
        "Error al insertar las rutas de las imágenes en la base de datos:",
        error
      );
      res.status(500).json({
        message: "Imagen subida",
      });
      return;
    }

    res.json({ message: "Imágenes subidas con éxito" });
  });
});
// Ruta para obtener el listado de imágenes de un producto
// Ruta para obtener un producto por su ID
app.get("/api/imagenes/:id", (req, res) => {
  const imagenId = req.params.id;

  connection.query(
    "SELECT * FROM imagenes WHERE id_producto = ? AND estado_imagen = 1",
    [imagenId],
    (error, results) => {
      if (error) {
        console.error("Error al realizar la consulta del producto:", error);
        res.status(500).json({ message: "Error al obtener la imagen" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "Imagen no encontrado" });
        return;
      }

      res.json(results);
    }
  );
});

// Endpoint para eliminar una imagen
app.delete(
  "/api/productos/:idProducto/imagenes/:idImagen",
  async (req, res) => {
    try {
      const { idProducto, idImagen } = req.params;

      // 1. Eliminar la referencia en la base de datos
      // Asegúrate de tener un modelo o conexión a la base de datos adecuada
      // Aquí estoy asumiendo que tu modelo es Imagen, ajusta según tu lógica
      await Imagen.findByIdAndRemove(idImagen);

      // 2. Eliminar el archivo del sistema de archivos
      // Asegúrate de ajustar la ruta del archivo según tu estructura de carpetas
      const rutaArchivo = `uploads/${idProducto}/${idImagen}`;
      await fs.unlink(rutaArchivo);

      // Envía una respuesta de éxito
      res.status(200).json({ mensaje: "Imagen eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar la imagen", error);
      res.status(500).json({ mensaje: "Error al eliminar la imagen" });
    }
  }
);
// Ruta para cambiar el estado de una imagen
app.put("/api/imagenes/cst/:id", (req, res) => {
  const imagenid = req.params.id;



  connection.query(
    "UPDATE imagenes SET estado_imagen = 3 WHERE id_imagen = ?",
    [ imagenid],
    (error) => {
      if (error) {
        console.error("Error al cambiar el estado de la imagen:", error);
        res.status(500).json({ message: "Error al cambiar el estado de la imagen" });
        return;
      }

      res.json({ message: "Estado de la imagen cambiado con éxito" });
    }
  );
});

//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES
//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES//IMAGENES

// Ruta protegida que requiere autenticación
app.get("/api/ruta-protegida", verificarToken, (req, res) => {
  // La solicitud solo llegará aquí si el token es válido
  // Puedes acceder a la información del usuario a través de req.decoded
  res.json({ message: "Ruta protegida" });
});

//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS
//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS
// Ruta para el inicio de sesión
app.post("/api/login", (req, res) => {
  const { CorreoElectronico, Contrasena } = req.body;

  // Llamando a la función de verificación
  credencialesSonValidas(
    CorreoElectronico,
    Contrasena,
    (err, usuarioValido) => {
      if (err) {
        res.status(500).json({ error: "Error de la base de datos" });
      } else if (usuarioValido) {
        // Credenciales válidas, genera un token JWT y responde con él
        const token = jwt.sign({ correo: CorreoElectronico }, secretKey);
        res.json({ token });
      } else {
        // Credenciales inválidas
        // Credenciales inválidas
        res.status(401).json({
          error: "Credenciales inválidas",
          reason:
            "Mensaje específico sobre por qué las credenciales son inválidas",
        });
      }
    }
  );
});

// Ruta para obtener datos
app.get("/api/usuarios", (req, res) => {
  connection.query(
    "SELECT * FROM Usuarios where Rol ='Cliente' ",
    (error, results) => {
      if (error) {
        console.error("Error al realizar la consulta:", error);
        res.status(500).json({ message: "Error al obtener los datos" });
        return;
      }

      // Solo envía la respuesta si no hay error
      res.json(results);
    }
  );
});

// Ruta para agregar un nuevo usuario
app.post("/api/usuarios", (req, res) => {
  const nuevoUsuario = req.body; // El usuario se envía en el cuerpo de la solicitud

  // Verificar si el correo electrónico ya está en uso
  connection.query(
    "SELECT * FROM Usuarios WHERE CorreoElectronico = ?",
    [nuevoUsuario.CorreoElectronico],
    (error, results) => {
      if (error) {
        console.error("Error al agregar el producto:", error);
        res.status(500).json({
          message: "Error al agregar el producto",
          errorDetails: error,
        });
        return;
      }
      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso" });
      }

      // Si el correo electrónico no está en uso, realiza la inserción en la base de datos
      connection.query(
        "INSERT INTO Usuarios SET ?",
        nuevoUsuario,
        (error, results) => {
          if (error) {
            console.error("Error al agregar un usuario:", error);
            res.status(500).json({ message: "Error al agregar un usuario" });
          } else {
            console.log("Usuario agregado con éxito");
            res.status(201).json({ message: "Usuario agregado con éxito" });
          }
        }
      );
    }
  );
});
// Ruta para actualizar el rol del usuario
app.put("/api/usuarios/:id", (req, res) => {
  const ID_Usuario = req.params.id;
  const nuevoRol =
    null; /* El nuevo rol que deseas asignar (en este caso, null).

  if (nuevoRol === null) {
    return res.status(400).json({ error: "El nuevo rol no puede ser nulo." });
  }*/

  // Realiza la actualización del rol en la base de datos
  const query = "UPDATE Usuarios SET Rol = NULL WHERE ID_Usuario = ?";
  connection.query(query, [ID_Usuario], (error, results) => {
    if (error) {
      console.error("Error al actualizar el rol del usuarioX:", error);
      return res
        .status(500)
        .json({ error: "Error al actualizar el rol del usuario API." });
    }

    res.json({ message: "Rol del usuario actualizado correctamente." });
  });
});
// Ruta para actualizar un usuario
app.put("/api/edit/usuarios/:id", (req, res) => {
  const ID_Usuario = req.params.id;
  const usuarioActualizado = req.body;

  // Realiza la actualización del usuario en la base de datos
  const query = "UPDATE Usuarios SET ? WHERE ID_Usuario = ?";
  connection.query(
    query,
    [usuarioActualizado, ID_Usuario],
    (error, results) => {
      if (error) {
        console.error("Error al actualizar el usuario2:", error);
        return res
          .status(500)
          .json({ error: "Error al actualizar el usuario API." });
      }

      res.json({ message: "Usuario actualizado correctamente>." });
    }
  );
});
//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS
//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS//USUARIOS

//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS
//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS

// Ruta para obtener todos los productos
app.get("/api/productos", (req, res) => {
  connection.query("SELECT * FROM Productos  JOIN TiposRopa ON Productos.Tipo = TiposRopa.ID_TipoRopa  JOIN PartesCuerpo ON TiposRopa.ID_ParteCuerpo = PartesCuerpo.ID_ParteCuerpo  JOIN imagenes ON imagenes.id_producto = Productos.ID_Producto WHERE estado_imagen = 1", (error, results) => {
    if (error) {
      console.error("Error al realizar la consulta de productos:", error);
      res.status(500).json({ message: "Error al obtener los productos" });
      return;
    }
    res.json(results);
  });
});

// Ruta para obtener un producto por su ID
app.get("/api/productos/:id", (req, res) => {
  const productId = req.params.id;

  connection.query(
    "SELECT * FROM Productos WHERE ID_Producto = ?",
    [productId],
    (error, results) => {
      if (error) {
        console.error("Error al realizar la consulta del producto:", error);
        res.status(500).json({ message: "Error al obtener el producto" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      res.json(results[0]);
    }
  );
});
// Ruta para obtener un producto por su nombre

// Ruta para contar productos por nombre
app.get("/api/productos/c/:name", (req, res) => {
  const nombreProducto = req.params.name;

  connection.query(
    "SELECT COUNT(*) AS count FROM Productos WHERE NombreProducto = ?",
    [nombreProducto],
    (error, results) => {
      if (error) {
        console.error("Error al realizar la consulta:", error);
        res.status(500).json({ message: "Error al contar productos" });
        return;
      }

      // Devolver el resultado del conteo
      const count = results[0].count;
      res.json({ count });
    }
  );
});

// Ruta para agregar un nuevo producto
app.post("/api/productos", (req, res) => {
  const nuevoProducto = req.body;

  connection.query(
    "INSERT INTO Productos SET ?",
    [nuevoProducto],
    (error, results) => {
      if (error) {
        console.error("Error al agregar el producto:", error);
        res.status(500).json({ message: "Error al agregar el producto" });
        return;
      }

      res.json({
        message: "Producto agregado con éxito",
        productId: results.insertId,
      });
    }
  );
});

//Update Productos
app.put("/api/productos/:id", (req, res) => {
  const productId = req.params.id;
  const productoActualizado = req.body.productoData;
  const nuevasImagenes = req.body.nuevasImagenes;

  // Actualiza los campos del producto en la base de datos
  connection.query(
    "UPDATE Productos SET ? WHERE ID_Producto = ?",
    [productoActualizado, productId],
    async (error, results) => {
      if (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto" });
        return;
      }

      if (nuevasImagenes && nuevasImagenes.length > 0) {
        // Si hay nuevas imágenes, inserta las rutas en la base de datos
        const imagenesInsertQuery =
          "INSERT INTO imagenes (ruta_imagen, id_producto) VALUES ?";
        const imagenesData = nuevasImagenes.map((imagen) => [
          imagen.ruta_imagen,
          productId,
        ]);

        try {
          await new Promise((resolve, reject) => {
            connection.query(imagenesInsertQuery, [imagenesData], (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          console.error("Error al insertar nuevas imágenes:", error);
          res
            .status(500)
            .json({ message: "Error al insertar nuevas imágenes" });
          return;
        }
      }

      res.json({ message: "Producto actualizado con éxito" });
    }
  );
});


// Ruta para eliminar un producto
app.delete("/api/productos/:id", (req, res) => {
  const productId = req.params.id;

  connection.query(
    "DELETE FROM Productos WHERE ID_Producto = ?",
    [productId],
    (error) => {
      if (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).json({ message: "Error al eliminar el producto" });
        return;
      }

      res.json({ message: "Producto eliminado con éxito" });
    }
  );
});

// Ruta para verificar la existencia de un producto por nombre
app.get("/api/productos/existe", (req, res) => {
  const nombreProducto = req.query.nombreProducto;

  connection.query(
    "SELECT COUNT(*) AS count FROM Productos WHERE NombreProducto = ?",
    [nombreProducto],
    (error, results) => {
      if (error) {
        console.error("Error al verificar la existencia del producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
        return;
      }

      const existe = results[0].count > 0;

      // Devuelve "Existe" o "No existe" por consola
      console.log(existe ? "Existe" : "No existe");

      // Devuelve la respuesta al cliente
      res.json(existe ? "Existe" : "No existe");
    }
  );
});

app.get("/api/productosPorParteCuerpo", async (req, res) => {
  try {
    const parteCuerpo = req.query.parteCuerpo;
    connection.query(
      `
      SELECT *
      FROM Productos
      JOIN TiposRopa ON Productos.Tipo = TiposRopa.ID_TipoRopa
      JOIN PartesCuerpo ON TiposRopa.ID_ParteCuerpo = PartesCuerpo.ID_ParteCuerpo
      JOIN imagenes ON imagenes.id_producto = Productos.ID_Producto
      where PartesCuerpo.ID_ParteCuerpo = ?;
    `,
      [parteCuerpo],
      (error, results) => {
        if (error) {
          console.error(
            "Error al verificar la existencia del producto 12:",
            error
          );
          res.status(500).json({ error: "Error interno del servidor" });
          return;
        }

        // Muestra el resultado en la consola
        console.log(results);

        res.json(results);
      }
    );
  } catch (error) {
    console.error("Error en la ruta /api/productosPorParteCuerpo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS
//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS//PRODUCTOS

app.listen(3300, "0.0.0.0", () => {
  console.log("Servidor Express en ejecución en http://localhost:3300");
});

//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES
//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES
// Ruta para obtener todos los proveedores
app.get("/api/proveedores", (req, res) => {
  connection.query("SELECT * FROM proveedores", (error, results) => {
    if (error) {
      console.error("Error al realizar la consulta de proveedores:", error);
      res.status(500).json({ message: "Error al obtener los proveedores" });
      return;
    }
    res.json(results);
  });
});

// Ruta para obtener un proveedor por su ID
app.get("/api/proveedores/:id", (req, res) => {
  const proveedorId = req.params.id;

  connection.query(
    "SELECT * FROM proveedores WHERE ID_proveedor = ?",
    [proveedorId],
    (error, results) => {
      if (error) {
        console.error("Error al realizar la consulta del proveedor:", error);
        res.status(500).json({ message: "Error al obtener el proveedor" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "Proveedor no encontrado" });
        return;
      }

      res.json(results[0]);
    }
  );
});

// Ruta para agregar un nuevo proveedor
app.post("/api/proveedores", (req, res) => {
  const nuevoProveedor = req.body;

  connection.query(
    "INSERT INTO proveedores SET ?",
    [nuevoProveedor],
    (error, results) => {
      if (error) {
        console.error("Error al agregar el proveedor:", error);
        res.status(500).json({ message: "Error al agregar el proveedor" });
        return;
      }

      res.json({
        message: "Proveedor agregado con éxito",
        proveedorId: results.insertId,
      });
    }
  );
});

// Ruta para actualizar un proveedor
app.put("/api/proveedores/:id", (req, res) => {
  const proveedorId = req.params.id;
  const datosProveedor = req.body;

  connection.query(
    "UPDATE proveedores SET ? WHERE ID_proveedor = ?",
    [datosProveedor, proveedorId],
    (error) => {
      if (error) {
        console.error("Error al actualizar el proveedor:", error);
        res.status(500).json({ message: "Error al actualizar el proveedor" });
        return;
      }

      res.json({ message: "Proveedor actualizado con éxito" });
    }
  );
});

// Ruta para eliminar un proveedor
app.delete("/api/proveedores/:id", (req, res) => {
  const proveedorId = req.params.id;

  connection.query(
    "DELETE FROM proveedores WHERE ID_proveedor = ?",
    [proveedorId],
    (error) => {
      if (error) {
        console.error("Error al eliminar el proveedor:", error);
        res.status(500).json({ message: "Error al eliminar el proveedor" });
        return;
      }

      res.json({ message: "Proveedor eliminado con éxito" });
    }
  );
});
//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES
//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES//PROVEEDORES

//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES
//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES
// Ruta para obtener todos los clientes
app.get("/api/clientes", (req, res) => {
  connection.query("SELECT * FROM Clientes", (error, results) => {
    if (error) {
      console.error("Error al obtener los clientes:", error);
      res.status(500).json({ message: "Error al obtener los clientes" });
      return;
    }
    res.json(results);
  });
});
// Ruta para agregar un nuevo cliente
app.post("/api/clientes", (req, res) => {
  const nuevoCliente = req.body;

  connection.query(
    "INSERT INTO Clientes SET ?",
    nuevoCliente,
    (error, results) => {
      if (error) {
        console.error("Error al agregar un cliente:", error);
        res.status(500).json({ message: "Error al agregar un cliente" });
        return;
      }
      res.status(201).json({
        message: "Cliente agregado con éxito",
        clienteId: results.insertId,
      });
    }
  );
});

// Ruta para actualizar un cliente
app.put("/api/clientes/:id", (req, res) => {
  const clienteId = req.params.id;
  const clienteActualizado = req.body;

  connection.query(
    "UPDATE Clientes SET ? WHERE ID_Cliente = ?",
    [clienteActualizado, clienteId],
    (error) => {
      if (error) {
        console.error("Error al actualizar el cliente:", error);
        res.status(500).json({ message: "Error al actualizar el cliente" });
        return;
      }
      res.json({ message: "Cliente actualizado correctamente" });
    }
  );
});

// Ruta para eliminar un cliente
app.delete("/api/clientes/:id", (req, res) => {
  const clienteId = req.params.id;

  connection.query(
    "DELETE FROM Clientes WHERE ID_Cliente = ?",
    [clienteId],
    (error) => {
      if (error) {
        console.error("Error al eliminar el cliente:", error);
        res.status(500).json({ message: "Error al eliminar el cliente" });
        return;
      }
      res.json({ message: "Cliente eliminado con éxito" });
    }
  );
});
//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES
//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES//CLIENTES

//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA
//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA//TIPOS ROPA
// Ruta para obtener todos los tipos de ropa
app.get("/api/tiposropa", (req, res) => {
  connection.query("SELECT * FROM TiposRopa", (error, results) => {
    if (error) {
      console.error("Error al obtener los tipos de ropa:", error);
      res.status(500).json({ message: "Error al obtener los Tipos Ropa" });
      return;
    }
    res.json(results);
  });
});
// Ruta para agregar un nuevo TipoRopa
app.post("/api/tiposropa", (req, res) => {
  const nuevoTipo = req.body;

  connection.query(
    "INSERT INTO TiposRopa SET ?",
    nuevoTipo,
    (error, results) => {
      if (error) {
        console.error("Error al agregar un TiposRopa:", error);
        res.status(500).json({ message: "Error al agregar un TiposRopa" });
        return;
      }
      res.status(201).json({
        message: "Tipos Ropa agregado con éxito",
        clienteId: results.insertId,
      });
    }
  );
});

// Ruta para actualizar un tipoRopa
app.put("/api/tiposropa/:id", (req, res) => {
  const clienteId = req.params.id;
  const clienteActualizado = req.body;

  connection.query(
    "UPDATE TiposRopa SET ? WHERE ID_TipoRopa = ?",
    [clienteActualizado, clienteId],
    (error) => {
      if (error) {
        console.error("Error al actualizar el tipo ropa:", error);
        res.status(500).json({ message: "Error al actualizar el tipo ropa" });
        return;
      }
      res.json({ message: "Tipo actualizado correctamente" });
    }
  );
});

// Ruta para eliminar un tipoRopa
app.delete("/api/tiporopa/:id", (req, res) => {
  const tipoID = req.params.id;

  connection.query(
    "DELETE FROM TiposRopa WHERE ID_TipoRopa = ?",
    [tipoID],
    (error) => {
      if (error) {
        console.error("Error al eliminar el tipo:", error);
        res.status(500).json({ message: "Error al eliminar el tipo" });
        return;
      }
      res.json({ message: "Tipo eliminado con éxito" });
    }
  );
});



