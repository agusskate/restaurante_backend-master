"use strict";
//Dependencias
const dotenv = require('dotenv');
const express = require('express');
const {MongoClient} = require('mongodb');
var cors = require('cors');

//Configuracion inicial
dotenv.config();
const middlewares = require('./middlewares');
const app = express();
const mongo_uri = "mongodb+srv://santiago894:P5wIGtXue8HvPvli@cluster0.6xkz1.mongodb.net/";
const bd_nombre = "restaurante";
const mongo_cliente = new MongoClient(mongo_uri);

// Conexión a MongoDB
let conexionMongo;
let bd;
let coleccionSesiones;
let coleccionPedidos;
let coleccionMesas;
obtenerCliente();
if (conexionMongo==null) {
  obtenerCliente();
}

// Conectar a MongoDB al inicio
async function obtenerCliente() {
  try {
    conexionMongo = await mongo_cliente.connect();
    bd = await conexionMongo.db(bd_nombre);
    coleccionSesiones = await bd.collection("sesiones");
    coleccionPedidos = await bd.collection("pedidos");
    coleccionMesas = await bd.collection("mesas");
    //console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
}
//Funcionalidades
//Validar que un usuario y contraseña tienen coincidencia
async function validarSesion(usuario,contraseña) {//Redirigir con js window.location.assign("nueva url")
  //Validar Strings
  if (typeof usuario !== "string" || typeof contraseña !== "string") {
    console.error("Los datos no son validos probablente no son string")
    return false;
  }
  
  let documentoUsuario = await coleccionSesiones.findOne({"usuario":usuario,"clave":contraseña});
  return { "logeado":documentoUsuario !== null, "esAdmin":documentoUsuario === null?  false :documentoUsuario["esAdmin"] };
}
//Validar o rechazar un pedido
async function gestionarPedido(id_pedido,estado_pedido) {
  let respuesta;
  if (typeof estado_pedido !== "boolean") {
    console.error("Datos invalidos");
    return "Operacion cancelada, Datos invalidos";
  }
  if (estado_pedido === true) {
    let modificar = await coleccionPedidos.updateOne({ "_id":id_pedido },{ $set:{ "pedido_aprobado":true} });
    modificar.acknowledged === true? respuesta ="Estado del pedido actualizado": respuesta = "Estado del pedido No actualizado";
  }else if(estado_pedido === false){
    let eliminar = await coleccionPedidos.deleteOne({"_id":id_pedido});
    eliminar.acknowledged === true? respuesta ="pedido eliminado": respuesta = "pedido no eliminado";
  }
  return respuesta;
}
//Registrar una nueva sesion 
async function crearSesion(usuario,contraseña,IS_ADMIN) {
  if (typeof usuario !== "string" || typeof contraseña !== "string" || typeof IS_ADMIN !== "boolean") {
      console.error("Datos invalidos")
      return null;
  };
  try {
    let consultaInsert = await coleccionSesiones.insertOne({
      "usuario":usuario,
      "clave":contraseña,
      "esAdmin":IS_ADMIN
    });
    return consultaInsert.acknowledged
  } catch (error) {
    console.error("Fallo al crear usuario: "+error);
    return false
  }

}
async function crearPedido(nombreUsu,numeroUsu,direccion,fechaActual,articulos) {
  if (typeof nombreUsu !== "string" || typeof numeroUsu !== "string" || typeof direccion !== "string" || typeof fechaActual !== "string" ) {
      console.error("Datos invalidos")
      return null;
  };
  try {
    let consultaInsert = await coleccionPedidos.insertOne({
      "nombre":nombreUsu,
      "numero":numeroUsu,
      "direccion":direccion,
      "fecha":fechaActual,
      "lista_articulos":articulos,
      "pedido_aprobado":"NO DEFINIDO"
    });
    return consultaInsert.acknowledged
  } catch (error) {
    console.error("Fallo al crear usuario: "+error);
    return false
  }

}
async function crearMesa(numeroComensales) {
  let capacidad_personas_mesa = parseInt(numeroComensales)
  if (isNaN(capacidad_personas_mesa)) {
    console.error("Datos invalidos");
    return null;
  };
  try {
    let numero_mesas = await coleccionMesas.countDocuments();
    let consultaInsert = await coleccionMesas.insertOne({
      "_id":numero_mesas+1,
      "capacidad_personas":numeroComensales
    });
    return consultaInsert.acknowledged
  } catch (error) {
    console.error("Fallo al crear usuario: "+error);
    return false
  }
}
//Recuperar
//pedidos 
async function obtenerPedidos() {
  if (!bd) {
    throw new Error('Base de datos no disponible'+bd);
  }
  try {
    return await coleccionPedidos.find().toArray();
  } catch (error) {
    console.error('Error al buscar coleccion:', error);
    throw error;
  }
}
//sesiones
async function obtenerSesiones() {
  if (!bd) {
    throw new Error('Base de datos no disponible'+bd);
  }
  try {
    return await coleccionSesiones.find().toArray();
  } catch (error) {
    console.error('Error al buscar coleccion:', error);
    throw error;
  }
}
//mesas
async function obtenerMesas() {
  if (!bd) {
    throw new Error('Base de datos no disponible'+bd);
  }
  try {
    return await coleccionMesas.find().toArray();
  } catch (error) {
    console.error('Error al buscar coleccion:', error);
    throw error;
  }
}
async function obtenerMesasRR() {
  const nuevaCliente = new MongoClient(mongo_uri);
  let cliente = nuevaCliente.connect();
  let coleccionM = await cliente.collection("mesas");
  try {
    return cliente;
  } catch (error) {
    console.error('Error al buscar coleccion:', error);
    throw error;
  }
}

const corsOptions = {
  origin: '*', // Cambiar por la URL de tu frontend en producción
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  //allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(express.json());
app.use(cors(corsOptions));
//Peticiones del servidor 
//GET
app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});
//Peticiones para recuperar las colecciones
app.get('/api/obtener/pedidos', async(req, res) => {
  res.json({
    message: JSON.parse(JSON.stringify(await obtenerPedidos(), null, 2))
  });
});

app.get('/api/obtener/sesiones', async(req, res) => {
  res.json({
    message: JSON.parse(JSON.stringify(await obtenerSesiones(), null, 2))
  });
});

app.get('/api/obtener/mesas', async(req, res) => {
  res.json({
    message: JSON.parse(JSON.stringify(await obtenerMesas(), null, 2))
  });
});

app.get('/api/obtener/mesas/libres', async(req, res) => {
  res.json({
    message: JSON.parse(JSON.stringify(await obtenerMesas(), null, 2))
  });
});

//Peticiones para crear y agregar a las colecciones
app.post('/api/crear/sesion', async(req, res) => {
  console.log(req.body);
  res.json({
    message: await crearSesion(req.body.usuario,req.body.contraseña,req.body.is_admin)
  });
});
app.post('/api/crear/mesa', async(req, res) => {
  res.json({
    message: await crearMesa(req.body.capacidadComensales)
  });
});
app.post('/api/crear/pedido', async(req, res) => {
  res.json({
    message: await crearPedido(
      req.body.nombre,//Nombres + Apellidos
      req.body.numero,//Telefono
      req.body.direccion,//Nombre cll + Num cll + Portal Num + Piso Num + Codigo Postal
      req.body.fechaActual,//Hora a la que se solicito el pedido
      req.body.articulos//Lista de ID's
    )
  });
});
//Validar sesion y Para luego redirigir a el login 

app.post('/api/validarLogin', async(req, res) => {

  res.json({
    message: await validarSesion(
      req.body.usuario.trim(),
      req.body.contraseña.trim(),
    )
  });
});

//Gestionar pedido

app.post("/api/recibir", (req, res) => {
    const recibido = req.body; // Aquí llega el objeto enviado desde el frontend
    console.log("Datos recibidos:", recibido);

    res.json({ mensaje: "Datos recibidos correctamente", datos: recibido });
});

app.get("/api/time", async(req, res) => {

  res.json(new Date().toLocaleString()+"\n"+ await obtenerMesasRR());
  //res.json({ mensaje:   Date.now().toUTCString() });
});

// Conectar a MongoDB antes de escuchar las rutas

//Algo falla y dios sabe que es
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;