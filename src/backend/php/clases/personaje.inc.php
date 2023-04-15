<?php
class Personaje {
    private $nombre;
    private $raza;
    private $clases;
    private $personalidad;
    private $contexto;
    private $campaña;
    private $trama;
    private $subtrama;
    private $archivado = false;

    public function __construct($nombre, $raza, $clases, $contexto, $personalidad, $campaña, $trama, $subtrama, $archivado) {
        $this -> nombre = $nombre;
        $this -> raza = $raza;
        $this -> clases = $clases;
        $this -> contexto = $contexto;
        $this -> personalidad = $personalidad;
        $this -> campaña = $campaña;
        $this -> trama = $trama;
        $this -> subtrama = $subtrama;
        $this -> archivado = $archivado;
    }

    public function getArray()
    {
        return [
            'nombre' => $this-> nombre,
            'raza' => $this-> raza,
            'clases' => $this-> clases,
            'personalidad' => $this-> personalidad,
            'contexto' => $this-> contexto,
            'campaña' => $this-> campaña,
            'trama' => $this-> trama,
            'subtrama' => $this-> subtrama,
            'archivado' => $this-> archivado,
        ];
    }

    public function getNombre() { return $this -> nombre; }
    // public function setNombre($nombre) { $this-> nombre = $nombre; }

    public function getRaza() { return $this -> raza; }

    public function getClases() { return $this -> clases; }

    public function getPersonalidad() { return $this -> personalidad; }

    public function getContexto() { return $this -> contexto; }

    public function getCampaña() { return $this -> campaña; }

    public function getTrama() { return $this -> trama; }

    public function getSubtrama() { return $this -> subtrama; }

    public function getarchivado() { return $this-> archivado; }
    public function setarchivado($archivado) { $this-> archivado = $archivado; }
}