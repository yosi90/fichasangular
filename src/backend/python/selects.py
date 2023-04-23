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

@app.route('/personajes', methods=['POST'])
def get_personajes():
    """Recupera la lista de personajes desde SQL server"""
    try:
        connection = pyodbc.connect(
            'DRIVER={SQL Server};' + f'SERVER={SERVER};DATABASE={DATABASE};CHARSET=UTF8')

        cursor = connection.cursor()
        cursorPlantillas = connection.cursor()

        cursor.execute("""
            select p.id_personaje i, p.nombre n, descripcion_personalidad dcp, descripcion_historia dh, p.ataque_base a, p.armadura_natural an, p.ca_desvio cd, r.nombre ra, ti.nombre tc, pc.fuerza f, pc.destreza d, pc.constitucion co, 
            pc.inteligencia int, pc.sabiduria s, pc.carisma ca, p.ajuste aju, dei.nombre de, ab.nombre ali, g.nombre g, ca.nombre ncam, t.nombre ntr, s.nombre nst, p.puntos_golpe v, p.correr cor, p.nadar na, p.volar vo, p.trepar t, 
            p.escalar e, p.oficial o, ta.id_tamaño i_t, ta.nombre n_t, ta.modificador tm, ta.mod_presa tmp, j.nombre ju, p.pgs_lic pgl,
            (select sum(valor) from personajes_dgsExtra where id_personaje = p.id_personaje) dg, 
            stuff((select '| ' + CAST(pmc.valor as varchar) from personaje_modificadores_ca pmc where pmc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') cav, 
            stuff((select '| ' + cl.nombre + ';' + cast(pc.nivel as nvarchar) from clases cl inner join personaje_clases pc on cl.id_clase = pc.id_clase where pc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') cla, 
            stuff((select '| ' + d.nombre from dominios d inner join personaje_dominios pd on d.id_dominio = pd.id_dominio where pd.id_personaje = p.id_personaje for xml path('')), 1, 2, '') dom, 
            stuff((select '| ' + s.nombre from subtipos s inner join personajes_subtipos ps on s.id_subtipo = ps.id_subtipo where ps.id_personaje = p.id_personaje for xml path('')), 1, 2, '') stc, 
            stuff((select '| ' + CAST(ppl.id_plantilla as varchar) from personajes_plantillas ppl where ppl.id_personaje = p.id_personaje for xml path('')), 1, 2, '') pla, 
            stuff((select '| ' + conj.nombre from conjuros conj inner join personaje_conjuros_conocidos pcc on conj.id_conjuro = pcc.id_conjuro where pcc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') con, 
            stuff((select '| ' + es.nombre + ';' + exc.nombre from especiales es inner join personaje_especiales pe on es.id_especial = pe.id_especial inner join extras exc on pe.id_extra = exc.id_extra where pe.id_personaje = p.id_personaje for xml path('')), 1, 2, '') esp,
            stuff((select '| ' + ra.nombre from raciales ra inner join personaje_raciales pr on ra.id_racial = pr.id_racial where pr.id_personaje = p.id_personaje for xml path('')), 1, 2, '') rac, 
            stuff((select '| ' + ha.nombre + ';' + CAST(ph.clasea as varchar) + ';' + cast(ph.rangos as nvarchar) + ';' + cast(ph.rangos_varios as nvarchar) + ';' + exh.nombre + ';' + ph.mod_varios + ';' + CAST(ha.id_caracteristica as varchar) from habilidades ha inner join personajes_habilidades ph on ha.id_habilidad = ph.id_habilidad inner join extras_habilidades exh on ph.id_extra = exh.id_extra where ph.id_personaje = p.id_personaje for xml path('')), 1, 2, '') hab, 
            stuff((select '| ' + hac.nombre + ';' + CAST(phc.clasea as varchar) + ';' + cast(phc.rangos as nvarchar) + ';' + cast(phc.rangos_varios as nvarchar) + ';' + phc.mod_varios + ';' + CAST(hac.id_caracteristica as varchar) from habilidades_custom hac inner join personajes_habilidades_custom phc on hac.id_habilidad = phc.id_habilidad where phc.id_personaje = p.id_personaje for xml path('')), 1, 2, '') habc, 
            stuff((select '| ' + do.nombre + ';' + CAST(pdo.id_extra as varchar) + ';' + CAST(do.extra_arma as varchar) + ';' + CAST(do.extra_armadura as varchar) + ';' + CAST(do.extra_escuela as varchar) + ';' + CAST(do.extra_habilidad as varchar) + ';' + pdo.origen from dotes do inner join personaje_dotes pdo on do.id_dote = pdo.id_dotes where pdo.id_personaje = p.id_personaje for xml path('')), 1, 2, '') dot, 
            stuff((select '| ' + v.nombre from ventajas v inner join personaje_ventajas pv on v.id_ventaja = pv.id_ventaja where pv.id_personaje = p.id_personaje for xml path('')), 1, 2, '') ve, 
            stuff((select '| ' + id.nombre from idiomas id inner join personaje_idiomas pid on id.id_idioma = pid.id_idioma where pid.id_personaje = p.id_personaje for xml path('')), 1, 2, '') idi, 
            stuff((select '| ' + conj2.nombre from conjuros conj2 inner join personaje_sortilegas pso on conj2.id_conjuro = pso.id_conjuro where pso.id_personaje = p.id_personaje for xml path('')), 1, 2, '') sor 
            from personajes p 
            inner join genero g on p.id_genero = g.id_genero 
            inner join capacidades_cargas c on p.id_carga = c.id_carga 
            inner join campañas ca on p.id_campaña = ca.id_campaña 
            inner join tramas t on p.id_trama = t.id_trama 
            inner join subtramas s on p.id_subtrama = s.id_subtrama 
            inner join personajes_caracteristicas pc on p.id_personaje = pc.id_personaje 
            inner join razas r on p.id_raza = r.id_raza 
            inner join tipos ti on p.id_tipoCriatura = ti.id_tipo 
            inner join deidades dei on p.deidad = dei.id_deidad 
            inner join alineamientos al on p.id_alineamiento = al.id_alineamiento 
            inner join alineamientos_basicos ab on al.id_basico = ab.id_alineamiento 
            inner join tamaños ta on r.id_tamaño = ta.id_tamaño 
            inner join jugador_personaje jp on p.id_personaje = jp.id_personaje
            inner join jugadores j on jp.id_jugador = j.id_jugador
            """)

        def calc_mod(caracteristica):
            return (caracteristica - 10) // 2

        results = []
        for row in cursor.fetchall():
            # Dotes                                 Dotes                                 Dotes                                 Dotes                                 Dotes                                 Dotes                                 
            dotes = []
            dotes_extra = []
            dotes_origen = []
            if row.dot:
                for dote in row.dot.split('| '):
                    subcadenas = dote.split(";")
                    dotes.append(Capitalizador(subcadenas[0]))
                    if subcadenas[1] == '-1':
                        dotes_extra.append('No aplica')
                    else:
                        cursorAux = connection.cursor()
                        if subcadenas[2] != '0':
                            cursorAux.execute(
                                f'select nombre from armas where id_arma = {subcadenas[2]}')
                            dotes_extra.append(
                                Capitalizador(cursorAux.fetchval()))
                        elif subcadenas[3] != '0':
                            cursorAux.execute(
                                f'select nombre from armaduras where id_armadura = {subcadenas[3]}')
                            dotes_extra.append(
                                Capitalizador(cursorAux.fetchval()))
                        elif subcadenas[4] != '0':
                            cursorAux.execute(
                                f'select nombre from escuelas_conjuros where id_escuela = {subcadenas[4]}')
                            dotes_extra.append(
                                Capitalizador(cursorAux.fetchval()))
                        elif subcadenas[5] != '0':
                            cursorAux.execute(
                                f'select nombre from habilidades where id_habilidad = {subcadenas[5]}')
                            dotes_extra.append(
                                Capitalizador(cursorAux.fetchval()))
                        else:
                            dotes_extra.append('Error')
                        cursorAux.close()
                    if subcadenas[6] and len(subcadenas[6]) > 1:
                        dotes_origen.append(Capitalizador(subcadenas[6]))
                    else:
                        dotes_origen.append('Desconocido')
            # Claseas                                 Claseas                                 Claseas                                 Claseas                                 Claseas                                 Claseas                                 
            claseas = []
            claseas_extra = []
            if row.esp:
                for clasea in row.esp.split('| '):
                    claseas.append(Capitalizador(clasea.split(';')[0]))
                    claseas_extra.append(Capitalizador(clasea.split(';')[1]))
            habilidades = []
            habilidades_claseas = []
            habilidades_mod_car = []
            habilidades_rango = []
            habilidades_rango_varios = []
            habilidades_extra = []
            habilidades_varios = []
            mod_fuerza = calc_mod(row.f)
            mod_destreza = calc_mod(row.d)
            mod_constitucion = calc_mod(row.co)
            mod_inteligencia = calc_mod(row.int)
            mod_sabiduria = calc_mod(row.s)
            mod_carisma = calc_mod(row.ca)
            # Habilidades                                 Habilidades                                 Habilidades                                 Habilidades                                 Habilidades                                 Habilidades                                 
            if row.hab:
                for habilidad in row.hab.split('| '):
                    linea = habilidad.split(';')
                    mod_car: int = 0
                    if linea[6] == "1":
                        mod_car = mod_fuerza
                    elif linea[6] == "2":
                        mod_car = mod_destreza
                    elif linea[6] == "3":
                        mod_car = mod_constitucion
                    elif linea[6] == "4":
                        mod_car = mod_inteligencia
                    elif linea[6] == "5":
                        mod_car = mod_sabiduria
                    elif linea[6] == "6":
                        mod_car = mod_carisma
                    habilidades.append(Capitalizador(linea[0][:-2] if str.isdigit(linea[0][-1:]) else linea[0]))
                    habilidades_claseas.append(linea[1] == "1")
                    habilidades_mod_car.append(int(mod_car))
                    habilidades_rango.append(int(linea[2]))
                    habilidades_rango_varios.append(int(linea[3]))
                    habilidades_extra.append(Capitalizador(linea[4]) if linea[4] != '-' else '')
                    habilidades_varios.append(Capitalizador(linea[5]) if linea[5] != 'No especifica' else '')
            # Habilidades custom                                 Habilidades custom                                 Habilidades custom                                 Habilidades custom                                 Habilidades custom                                 Habilidades custom                                 
            if row.habc:
                for habilidad in row.habc.split('| '):
                    linea = habilidad.split(';')
                    mod_car: int = 0
                    if linea[5] == "1":
                        mod_car = mod_fuerza
                    elif linea[5] == "2":
                        mod_car = mod_destreza
                    elif linea[5] == "3":
                        mod_car = mod_constitucion
                    elif linea[5] == "4":
                        mod_car = mod_inteligencia
                    elif linea[5] == "5":
                        mod_car = mod_sabiduria
                    elif linea[5] == "6":
                        mod_car = mod_carisma
                    habilidades.append(Capitalizador(linea[0][:-2] if str.isdigit(linea[0][-1:]) else linea[0]))
                    habilidades_claseas.append(linea[1] == "1")
                    habilidades_mod_car.append(int(mod_car))
                    habilidades_rango.append(int(linea[2]))
                    habilidades_rango_varios.append(int(linea[3]))
                    habilidades_extra.append('')
                    habilidades_varios.append(Capitalizador(linea[4]) if linea[4] != 'No especifica' else '')
            # Plantillas                                 Plantillas                                 Plantillas                                 Plantillas                                 Plantillas                                 Plantillas                                 
            plantillas = []
            if row.pla:
                for plantilla in row.pla.split('| '):
                    cursorPlantillas.execute(f"""
                        select p.id_plantilla ip, p.nombre n, p.ataques a, p.ataque_completo ac, t.id_tamaño it, t.nombre nt, pm.id_paso i_tpm, pm.nombre n_tpm, td.id_tipo idg, td.nombre ndg, pm2.id_paso i_dgpm, pm2.nombre n_dgpm, p.act_dg adg, p.correr co, p.nadar na, p.volar vo, 
                        ma.nombre n_ma, p.trepar tr, p.escalar es, p.ataque_base at, p.ca, p.resistencia_conjuros rc, p.reduccion_daño rd, p.resistencia_elemental re, p.velocidades vel, p.iniciativa ini, p.presa pr 
                        from plantillas p 
                        inner join tamaños t on p.id_tamaño = t.id_tamaño 
                        inner join pasos_modificacion pm on p.id_mod_tam = pm.id_paso 
                        inner join tipos_dados td on p.id_tipo_dado = td.id_tipo 
                        inner join pasos_modificacion pm2 on p.id_mod_dg = pm2.id_paso 
                        inner join maniobrabilidades ma on p.id_maniobrabilidad = ma.id_maniobrabilidad
                        where id_plantilla = {plantilla}
                    """)
                    for pl in cursorPlantillas.fetchall():
                        plantillas.append({
                            'Id': pl.ip, 'Nombre': Capitalizador(pl.n), 'Ataques': Capitalizador(pl.a), 'Ataque_completo': Capitalizador(pl.ac), 'Id_tamano': pl.it, 'Tamano': Capitalizador(pl.nt), 'Id_tamano_pasos': pl.i_tpm, 'Tamano_pasos': pl.n_tpm, 'Id_dados_golpe': pl.idg, 'Dados_golpe': pl.ndg,
                            'Id_dados_golpe_pasos': pl.i_dgpm, 'Dados_golpe_pasos': pl.n_dgpm, 'Actualiza_dgs': pl.adg, 'Correr': pl.co, 'Nadar': pl.na, 'Volar': pl.vo, 'Maniobrabilidad': Capitalizador(pl.n_ma), 'Trepar': pl.tr, 'Escalar': pl.es, 'Ataque_base': pl.at, 'Ca': Capitalizador(pl.ca), 
                            'Resistencia_conjuros': Capitalizador(pl.rc), 'Reduccion_dano': Capitalizador(pl.rd), 'Resistencia_elemental': Capitalizador(pl.re), 'Velocidades': Capitalizador(pl.vel), 'Iniciativa': pl.ini, 'Presa': pl.pr
                        })
            tamano = { 'Id': row.i_t, 'Nombre': Capitalizador(row.n_t), 'Modificador': row.tm, 'Modificador_presa': row.tmp }
            # Ca varios                                 Ca varios                                 Ca varios                                 Ca varios                                 Ca varios                                 Ca varios                                 
            ca_varios = 0
            if row.cav:
                for mod in row.cav.split('| '):
                    if mod:
                        ca_varios += int(mod)
            # Ca                                 Ca                                 Ca                                 Ca                                 Ca                                 Ca                                 
            ca = 10 + mod_destreza + row.an + int(tamano['Modificador']) + row.cd + ca_varios
            
            results.append({
                'i': row.i, 'n': Capitalizador(row.n), 'dcp': Capitalizador(row.dcp), 'dh': Capitalizador(row.dh), 'a': row.a, 'ca': ca, 'an': row.an, 'cd': row.cd, 'cv': ca_varios, 'ra': Capitalizador(row.ra), 'tc': Capitalizador(row.tc), 'f': row.f, 'mf': mod_fuerza, 'd': row.d, 'md': mod_destreza, 
                'co': row.co, 'mco': mod_constitucion, 'int': row.int, 'mint': mod_inteligencia, 's': row.s, 'ms': mod_sabiduria, 'car': row.ca, 'mcar': mod_carisma, 'aju': row.aju, 'de': Capitalizador(row.de), 'ali': Capitalizador(row.ali), 'g': Capitalizador(row.g), 'tm': tamano,
                'ncam': Capitalizador(row.ncam), 'ntr': Capitalizador(row.ntr), 'nst': Capitalizador(row.nst), 'v': row.v, 'cor': row.cor, 'na': row.na, 'vo': row.vo, 't': row.t, 'e': row.e, 'o': row.o, 'dg': row.dg, 'cla': CapitalizadorCaracterControl(row.cla), 'dom': CapitalizadorCaracterControl(row.dom), 
                'stc': CapitalizadorCaracterControl(row.stc), 'pla': plantillas, 'con': CapitalizadorCaracterControl(row.con), 'esp': claseas, 'espX': claseas_extra, 'rac': CapitalizadorCaracterControl(row.rac), 'hab': habilidades, 'habC': habilidades_claseas, 'habMc': habilidades_mod_car, 
                'habR': habilidades_rango, 'habRv': habilidades_rango_varios, 'habX': habilidades_extra, 'habV': habilidades_varios, 'dot': dotes, 'dotX': dotes_extra, 'dotO': dotes_origen, 've': CapitalizadorCaracterControl(row.ve), 'idi': CapitalizadorCaracterControl(row.idi), 
                'sor': CapitalizadorCaracterControl(row.sor), 'ju': Capitalizador(row.ju), 'pgl': row.pgl
            })

        cursor.close()
        connection.close()

        response = jsonify(results)
        response.headers.add('Access-Control-Allow-Origin', '*')

        return response

    except ConnectionError as error:
        return error


@app.route('/personajes-simplificados', methods=['POST'])
def get_personajes_simplificados():
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
