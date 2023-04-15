<?php
require_once '../app/Conexion.inc.php';

conexion::abrir_conexion();
$records = repositorioPersonaje::listaPersonajes(conexion::obtener_conexion());
conexion::cerrar_conexion();
echo json_encode($records) ?? die();
