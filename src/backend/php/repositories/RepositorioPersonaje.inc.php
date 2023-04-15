<?php
require_once '../app/Conexion.inc.php';
require_once '../clases/personaje.inc.php';

class RepositorioPersonaje
{
    public static function listaPersonajes($conexion)
    {
        $personajes = [];
        if (isset($conexion)) {
            try {
                $sql = "select p.nombre n, r.nombre r, stuff((select ',\n ' + c.nombre + ' (' + cast(pc.nivel as nvarchar) + ')' from clases c inner join personaje_clases pc on c.id_clase = pc.id_clase where pc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') c, p.descripcion_historia co, 
                p.descripcion_personalidad p, c.nombre ca, t.nombre t, s.nombre s, archivado a from personajes p inner join razas r on p.id_raza = r.id_raza inner join jugador_personaje jp on p.id_personaje = jp.id_personaje inner join jugadores j on jp.id_jugador = j.id_jugador inner join 
                campañas c on p.id_campaña = c.id_campaña inner join tramas t on p.id_trama = t.id_trama inner join subtramas s on p.id_subtrama = s.id_subtrama";
                
                $res = sqlsrv_query( $conexion, $sql);
                     die( print_r( sqlsrv_errors(), true));

                if (count($res)) {
                    $cont = 0;
                    foreach ($res as $row) {
                        $instance = new Personaje($row['n'], $row['r'], $row['c'], $row['co'], $row['p'], $row['ca'], $row['t'], $row['s'], $row['a']);
                        // $personajes[] = $instance->getArray();
                        $personajes[] = $instance;
                        $cont++;
                    }
                }
            } catch (PDOException $ex) {
                print 'ERROR: ' . $ex->getMessage();
            }
        }
        return $personajes;
    }
}