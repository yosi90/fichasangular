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
    if value is None:
        return ""
    else:
        oraciones = nltk.sent_tokenize(value)

        strFinal = ""
        for oracion in oraciones:
            strFinal += oracion.capitalize() + " "

        return strFinal.strip()


def CapitalizadorCaracterControl(value: str):
    """Capitaliza los textos que se le pasen"""
    if value is None:
        return ""
    else:
        subcadenas = value.split("| ")
        strFinal = ""
        for i, subcadena in enumerate(subcadenas):
            if i == 0:
                strFinal += subcadena.capitalize() + "| "
            else:
                strFinal += subcadena.strip().capitalize() + "| "
        return strFinal.strip()


@app.route('/detalles_personajes', methods=['POST'])
def get_detalles_personaje():
    """Recupera la lista de personajes desde SQL server"""
    try:
        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()

        cursor.execute("""
                        select p.id_personaje i, p.nombre n, descripcion_personalidad dcp, descripcion_historia dh, p.ataque_base a, p.armadura_natural an, p.ca_desvio cd, r.nombre ra, ti.nombre tc, pc.fuerza f, pc.destreza d, pc.constitucion co, 
                        pc.inteligencia int, pc.sabiduria s, pc.carisma ca, p.ajuste aju, dei.nombre de, ab.nombre ali, g.nombre g, ca.nombre ncam, t.nombre ntr, s.nombre nst, p.puntos_golpe v, p.correr cor, p.nadar na, p.volar vo, p.trepar t, 
                        p.escalar e, p.oficial o, ta.nombre tn, ta.modificador tm,
                        (select sum(valor) from personajes_dgsExtra where id_personaje = p.id_personaje) dg, 
                        stuff((select '| ' + cl.nombre + ';' + cast(pc.nivel as nvarchar) from clases cl inner join personaje_clases pc on cl.id_clase = pc.id_clase where pc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') cla, 
                        stuff((select '| ' + d.nombre from dominios d inner join personaje_dominios pd on d.id_dominio = pd.id_dominio where pd.id_personaje = p.id_personaje for xml path('')), 1, 2, '') dom, 
                        stuff((select '| ' + s.nombre from subtipos s inner join personajes_subtipos ps on s.id_subtipo = ps.id_subtipo where ps.id_personaje = p.id_personaje for xml path('')), 1, 2, '') stc, 
                        stuff((select '| ' + pl.nombre from plantillas pl inner join personajes_plantillas ppl on pl.id_plantilla = ppl.id_plantilla where ppl.id_personaje = p.id_personaje for xml path('')), 1, 2, '') pla, 
                        stuff((select '| ' + conj.nombre from conjuros conj inner join personaje_conjuros_conocidos pcc on conj.id_conjuro = pcc.id_conjuro where pcc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') con, 
                        stuff((select '| ' + es.nombre from especiales es inner join personaje_especiales pe on es.id_especial = pe.id_especial where pe.id_personaje = p.id_personaje for xml path('')), 1, 2, '') esp, 
                        stuff((select '| ' + ra.nombre from raciales ra inner join personaje_raciales pr on ra.id_racial = pr.id_racial where pr.id_personaje = p.id_personaje for xml path('')), 1, 2, '') rac, 
                        stuff((select '| ' + ha.nombre + ';' + cast((ph.rangos + ph.rangos_varios) as nvarchar) from habilidades ha inner join personajes_habilidades ph on ha.id_habilidad = ph.id_habilidad where (ph.rangos + ph.rangos_varios) > 0 and ph.id_personaje = p.id_personaje for xml path('')), 1, 2, '') hab, 
                        stuff((select '| ' + do.nombre from dotes do inner join personaje_dotes pdo on do.id_dote = pdo.id_dotes where pdo.id_personaje = p.id_personaje for xml path('')), 1, 2, '') dot, 
                        stuff((select '| ' + v.nombre from ventajas v inner join personaje_ventajas pv on v.id_ventaja = pv.id_ventaja where pv.id_personaje = p.id_personaje for xml path('')), 1, 2, '') ve, 
                        stuff((select '| ' + id.nombre from idiomas id inner join personaje_idiomas pid on id.id_idioma = pid.id_idioma where pid.id_personaje = p.id_personaje for xml path('')), 1, 2, '') idi, 
                        stuff((select '| ' + conj2.nombre from conjuros conj2 inner join personaje_sortilegas pso on conj2.id_conjuro = pso.id_conjuro where pso.id_personaje = p.id_personaje for xml path('')), 1, 2, '') sor 
                        from personajes p 
                        inner join genero g on p.id_genero = g.id_genero inner join capacidades_cargas c on p.id_carga = c.id_carga inner join campañas ca on p.id_campaña = ca.id_campaña inner join tramas t on p.id_trama = t.id_trama inner join subtramas s on p.id_subtrama = s.id_subtrama 
                        inner join personajes_caracteristicas pc on p.id_personaje = pc.id_personaje inner join razas r on p.id_raza = r.id_raza inner join tipos ti on p.id_tipoCriatura = ti.id_tipo inner join deidades dei on p.deidad = dei.id_deidad 
                        inner join alineamientos al on p.id_alineamiento = al.id_alineamiento inner join alineamientos_basicos ab on al.id_basico = ab.id_alineamiento inner join tamaños ta on r.id_tamaño = ta.id_tamaño
                        """)

        def calc_mod(caracteristica):
            return (caracteristica - 10) // 2

        results = []
        for row in cursor.fetchall():
            # TODO Incluir mod varios a la CA
            ca = 10 + calc_mod(row.d) + row.an + row.tm + row.cd
            results.append({'i': row.i, 'n': Capitalizador(row.n), 'dcp': Capitalizador(row.dcp), 'dh': Capitalizador(row.dh), 'a': row.a, 'tn': row.tn, 'tm': row.tm, 'ca': ca, 'an': row.an, 'cd': row.cd, 'ra': Capitalizador(row.ra), 'tc': Capitalizador(row.tc),
                            'f': row.f, 'mf': calc_mod(row.f), 'd': row.d, 'md': calc_mod(row.d), 'co': row.co, 'mco': calc_mod(row.co), 'int': row.int, 'mint': calc_mod(row.int), 's': row.s, 'ms': calc_mod(row.s), 'car': row.ca, 'mcar': calc_mod(row.ca),
                            'aju': row.aju, 'de': Capitalizador(row.de), 'ali': Capitalizador(row.ali), 'g': Capitalizador(row.g), 'ncam': Capitalizador(row.ncam), 'ntr': Capitalizador(row.ntr), 'nst': Capitalizador(row.nst), 'v': row.v, 'cor': row.cor, 'na': row.na,
                            'vo': row.vo, 't': row.t, 'e': row.e, 'o': row.o, 'dg': row.dg, 'cla': CapitalizadorCaracterControl(row.cla), 'dom': CapitalizadorCaracterControl(row.dom), 'stc': CapitalizadorCaracterControl(row.stc),
                            'pla': CapitalizadorCaracterControl(row.pla), 'con': CapitalizadorCaracterControl(row.con), 'esp': CapitalizadorCaracterControl(row.esp), 'rac': CapitalizadorCaracterControl(row.rac), 'hab': CapitalizadorCaracterControl(row.hab),
                            'dot': CapitalizadorCaracterControl(row.dot), 've': CapitalizadorCaracterControl(row.ve), 'idi': CapitalizadorCaracterControl(row.idi), 'sor': CapitalizadorCaracterControl(row.sor)})

        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


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
