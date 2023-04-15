<?php
class conexion
{
    private static $conexion;

    public static function abrir_conexion_sqlsrv()
    {
        $conn = sqlsrv_connect(NOMBRE_DB, CONNECTION_STRING);
        if ($conn === false) {
            die(print_r(sqlsrv_errors(), true));
        }
    }

    public static function cerrar_conexion_sqlsrv()
    {
        if (isset(self::$conexion)) {
            self::sqlsrv_close();
        }
    }

    public static function obtener_conexion()
    {
        return self::$conexion;
    }
}
