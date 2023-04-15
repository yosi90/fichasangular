# -*- coding: utf-8 -*-

from flask import Flask, jsonify
from flask_cors import CORS
import pyodbc

server = 'YOSI-PC\SQLEXPRESS'
database = 'rol'

app = Flask(__name__)
app.config['DEBUG'] = True     #RECUERDA QUITAR EL MODO DEBUG
CORS(app)


@app.route('/personajes', methods=['POST'])
def handle_post_request():
    try:
        connection = pyodbc.connect('DRIVER={SQL Server};SERVER=' + server + ';DATABASE=' + database + ';CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute("""select p.nombre n, r.nombre r, stuff((select ',\n ' + c.nombre + ' (' + cast(pc.nivel as nvarchar) + ')' from clases c inner join personaje_clases pc on c.id_clase = pc.id_clase where pc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') c, 
                    p.descripcion_historia co, p.descripcion_personalidad p, c.nombre ca, t.nombre t, s.nombre s, archivado a from personajes p inner join razas r on p.id_raza = r.id_raza inner join jugador_personaje jp on p.id_personaje = jp.id_personaje inner join 
                    jugadores j on jp.id_jugador = j.id_jugador inner join campañas c on p.id_campaña = c.id_campaña inner join tramas t on p.id_trama = t.id_trama inner join subtramas s on p.id_subtrama = s.id_subtrama""")

        results = []
        for row in cursor.fetchall():
            results.append({'n': row.n, 'r': row.r, 'c': row.c, 'p': row.p, 'co': row.co, 'ca': row.ca, 't': row.t, 's': row.s, 'a': row.a})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers',
                            'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST')
        
        return response

    except:
        print('error')


if __name__ == '__main__':
    app.run()
