# Base de datos de ejercicios por grupo muscular

EXERCISES_DB = {
    "Pecho": [
        "Press Plano c/ Barra", "Press Plano c/ Mancuernas", "Press Inclinado c/ Barra",
        "Press Inclinado c/ Mancuernas", "Press Declinado c/ Barra", "Press Declinado c/ Mancuernas",
        "Aperturas c/ Mancuernas en Banco Plano", "Aperturas en Banco Inclinado",
        "Aperturas en Banco Declinado", "Cross Ascendente Polea Baja", "Cross Descendente Polea Alta",
        "Cross Polea Media", "Press en Máquina", "Aperturas en Máquina (Pec Deck)",
        "Fondos en Paralelas (pecho)", "Pull Over c/ Mancuerna", "Pull Over en Polea"
    ],
    "Espalda": [
        "Tirón al Frente Toma Neutra", "Tirón al Frente Toma Prona", "Tirón al Frente Toma Supina",
        "Remo en Máquina", "Remo Polea Baja Toma Cerrada", "Remo Polea Baja Toma Abierta",
        "Remo Serrucho c/ Mancuerna", "Remo c/ Barra", "Remo Inclinado c/ Mancuernas",
        "Dominadas Toma Prona", "Dominadas Toma Supina", "Peso Muerto Convencional",
        "Peso Muerto Rumano c/ Barra", "Peso Muerto Rumano c/ Mancuernas",
        "Buenos Días c/ Barra", "Hiperextensiones", "Remo con T-Bar",
        "Face Pull en Polea", "Tirón a Cara c/ Soga", "Pullover en Polea Alta"
    ],
    "Hombros": [
        "Press Militar c/ Barra Sentado", "Press Militar c/ Barra De Pie",
        "Press Arnold", "Press c/ Mancuernas Sentado", "Press c/ Mancuernas De Pie",
        "Vuelos Laterales c/ Mancuernas", "Vuelos Laterales en Polea",
        "Vuelos Posteriores c/ Mancuernas", "Vuelos Posteriores en Máquina",
        "Elevaciones Frontales c/ Mancuernas", "Elevaciones Frontales c/ Barra",
        "Elevaciones Frontales en Polea", "Remo al Mentón c/ Barra",
        "Remo al Mentón c/ Mancuernas", "Press en Máquina Hombros",
        "Rotaciones Externas con Mancuerna", "Shrugs c/ Barra", "Shrugs c/ Mancuernas"
    ],
    "Bíceps": [
        "Curl c/ Barra", "Curl c/ Barra Z (EZ)", "Curl c/ Mancuernas Alternado",
        "Curl c/ Mancuernas Simultáneo", "Curl Martillo c/ Mancuernas",
        "Curl Martillo en Polea", "Curl Concentrado c/ Mancuerna",
        "Curl Predicador c/ Barra", "Curl Predicador c/ Barra Z",
        "Curl Predicador c/ Mancuerna", "Curl en Polea Baja",
        "Curl Inclinado c/ Mancuernas", "Curl Spider c/ Barra",
        "Curl de Muñeca c/ Barra", "Curl Inverso c/ Barra"
    ],
    "Tríceps": [
        "Tríceps Prono en Polea", "Tríceps Reverso en Polea", "Tríceps c/ Soga en Polea",
        "Extensión de Tríceps sobre la Cabeza c/ Polea", "Press Francés c/ Barra",
        "Press Francés c/ Barra Z", "Press Francés c/ Mancuernas",
        "Extensión de Tríceps sobre la Cabeza c/ Mancuerna",
        "Fondos en Banco", "Fondos en Paralelas (tríceps)",
        "Patadas de Tríceps c/ Mancuerna", "Patadas de Tríceps en Polea",
        "Press Cerrado c/ Barra", "Tríceps en Máquina"
    ],
    "Cuádriceps": [
        "Sentadilla Libre c/ Barra", "Sentadilla Goblet", "Sentadilla Goblet Talones Elev.",
        "Sentadilla Sumo", "Prensa 45°", "Prensa Horizontal",
        "Extensión de Cuádriceps en Máquina", "Estocadas c/ Mancuernas",
        "Estocadas con Barra", "Estocadas Búlgaras c/ Mancuernas",
        "Subidas al Banco Frontal c/ Mancuernas", "Subidas al Banco Lateral",
        "Sentadilla Hack", "Sentadilla en Máquina Smith",
        "Leg Press", "Zancadas Caminando"
    ],
    "Isquiotibiales": [
        "Peso Muerto Rumano c/ Barra", "Peso Muerto Rumano c/ Mancuernas",
        "Flexión Isquiotibial en Máquina", "Isquiotibiales en Máquina Sentado",
        "Buenos Días c/ Barra", "Curl de Piernas De Pie en Polea",
        "Elevación de Cadera c/ Barra", "Elevación de Cadera en Máquina",
        "Hip Thrust c/ Barra", "Hip Thrust en Máquina",
        "Stiff c/ Barra", "Stiff c/ Mancuernas",
        "Glute Ham Raise", "Curl Nórdico"
    ],
    "Glúteos": [
        "Elevación de Cadera c/ Barra", "Hip Thrust c/ Barra", "Hip Thrust en Máquina",
        "Patadas de Glúteos en Polea", "Patadas de Glúteos en Máquina",
        "Abductores en Máquina", "Abductores de Pie en Polea",
        "Sentadilla Sumo", "Peso Muerto Sumo",
        "Estocadas Búlgaras c/ Mancuernas", "Puente de Glúteos",
        "Donkey Kicks", "Clamshell c/ Banda", "Patadas Cuádrip. en Máquina"
    ],
    "Gemelos": [
        "Gemelos en Prensa", "Gemelos de Pie en Máquina",
        "Gemelos Sentado en Máquina", "Gemelos c/ Mancuerna Un Pie",
        "Gemelos 1 PP c/ Rusa", "Gemelos en Smith",
        "Gemelos De Pie c/ Barra", "Elevaciones de Talones De Pie",
        "Elevaciones de Talones Sentado", "Tibiales en Polea"
    ],
    "Abdominales": [
        "Abdominales en Máquina", "Abdominales Largos c/ Disco",
        "Abdominales Inferiores", "Plancha Frontal",
        "Plancha Frontal c/ Antebrazo", "Plancha Lateral c/ Antebrazo",
        "Twist c/ Disco", "Oblicuos Cruzados",
        "Espinales en Máquina", "Espinales Superman",
        "Crunch en Polea Alta", "Crunch en Máquina",
        "Elevación de Piernas Colgado", "Rueda Abdominal",
        "Mountain Climbers", "Dead Bug", "Bird Dog"
    ],
    "Movilidad / Calentamiento": [
        "Movilidad General", "Movilidad de Cadera", "Movilidad de Hombros",
        "Movilidad de Columna", "Estiramiento de Cuádriceps",
        "Estiramiento de Isquiotibiales", "Estiramiento de Pectorales",
        "Bici Fija", "Caminadora", "Elíptica",
        "Saltar la Soga", "Remo en Máquina (cardio)"
    ]
}

def get_all_exercises():
    result = []
    for grupo, ejercicios in EXERCISES_DB.items():
        for nombre in ejercicios:
            result.append({"grupo": grupo, "nombre": nombre})
    return result
