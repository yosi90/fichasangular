# -*- coding: utf-8 -*-
"""Esta clase se dedica a recuperar datos desde SQL server

Returns:
    _type_: Data Array
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pyodbc
import nltk
nltk.download('punkt')

SERVER = 'YOSI-PC\\SQLEXPRESS'
DATABASE = 'rol'

app = Flask(__name__)
app.config['DEBUG'] = True  # RECUERDA QUITAR EL MODO DEBUG
CORS(app)


def Capitalizador(value: str):
    """Capitaliza los textos que se le pasen"""
    oraciones = nltk.sent_tokenize(value)

    strFinal = ""
    for oracion in oraciones:
        strFinal += oracion.capitalize() + " "

    return strFinal.strip()


@app.route('/personajes', methods=['POST'])
def get_personajes():
    """Recupera la lista de personajes desde SQL server"""
    try:
        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute("""
                        select p.id_personaje i, p.nombre n, r.nombre r, stuff((select ', ' + c.nombre + ' ' + cast(pc.nivel as nvarchar) 
                        from clases c inner join personaje_clases pc on c.id_clase = pc.id_clase where pc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') c, 
                        p.descripcion_historia co, p.descripcion_personalidad p, c.nombre ca, t.nombre t, s.nombre s, archivado a from personajes p inner 
                        join razas r on p.id_raza = r.id_raza inner join jugador_personaje jp on p.id_personaje = jp.id_personaje inner join 
                        jugadores j on jp.id_jugador = j.id_jugador inner join campañas c on p.id_campaña = c.id_campaña inner join tramas t on p.id_trama = t.id_trama 
                        inner join subtramas s on p.id_subtrama = s.id_subtrama
                        """)

        results = []
        for row in cursor.fetchall():

            results.append({'i': row.i, 'n': Capitalizador(row.n), 'r': Capitalizador(row.r), 'c': Capitalizador(row.c), 'p': Capitalizador(row.p),
                           'co': Capitalizador(row.co), 'ca': Capitalizador(row.ca), 't': Capitalizador(row.t), 's': Capitalizador(row.s), 'a': row.a})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


@app.route('/campañas', methods=['POST'])
def get_campanas():
    """Recupera la lista de campañas desde SQL server"""
    try:
        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute(
            """select id_campaña i, nombre n from campañas order by id_campaña""")

        results = []
        for row in cursor.fetchall():
            results.append({'i': row.i, 'n': Capitalizador(row.n)})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


@app.route('/tramas', methods=['POST'])
def get_tramas():
    """Recupera la lista de tramas desde SQL server"""
    try:
        data = request.data.decode('utf-8')
        idCampaña = int(data)

        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute(
            f"""select t.id_trama i, t.nombre n from tramas t inner join campañas_tramas ct on t.id_trama = ct.id_trama where ct.id_campaña = {idCampaña} order by t.id_trama""")

        results = []
        for row in cursor.fetchall():
            results.append({'i': row.i, 'n': Capitalizador(row.n)})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


@app.route('/subtramas', methods=['POST'])
def get_subtramas():
    """Recupera la lista de subtramas desde SQL server"""
    try:
        data: int = request.data.decode('utf-8')
        idTrama = int(data)

        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute(
            f"""select s.id_subtrama i, s.nombre n from subtramas s inner join tramas_subtramas ts on s.id_subtrama = ts.id_subtrama where ts.id_trama = {idTrama} order by s.id_subtrama""")

        results = []
        for row in cursor.fetchall():
            results.append({'i': row.i, 'n': Capitalizador(row.n)})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


if __name__ == '__main__':
    app.run()
