from database import SessionLocal, User, Routine, Day, Exercise, WeekSet, create_tables
from auth import get_password_hash


def seed():
    create_tables()
    db = SessionLocal()

    if db.query(User).count() > 0:
        db.close()
        return

    profesor = User(
        name="Profesor TDC", dni="00000000",
        email="profe@tdc.com", tdc_email="profe@tdc.com",
        hashed_password=get_password_hash("profe123"),
        role="profesor", is_active=True, is_verified=True
    )
    ivan = User(
        name="Ivan Gamarra", dni="12345678",
        email="ivan@gmail.com", tdc_email="12345678@tdc.com",
        hashed_password=get_password_hash("ivan123"),
        role="alumno", is_active=True, is_verified=True
    )
    db.add_all([profesor, ivan])
    db.commit()
    db.refresh(profesor)
    db.refresh(ivan)

    routine = Routine(
        nombre="Hipertrofia - Ivan Gamarra", objetivo="Hipertrofia",
        inicio="26-Feb", alumno_id=ivan.id, profesor_id=profesor.id
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)

    dia1 = Day(
        numero=1, nombre="Pecho / Hombros / Tríceps",
        routine_id=routine.id,
        musculatura="ISQUIOTIBIALES - GLÚTEOS - PECTORALES - TRÍCEPS",
        entrada_calor="Bici fija + Movilidad | Abdominales Largos c/ Disco | Abdominales Inferiores + Abd PP | Plancha Frontal Sep. Pierna (3x40'')",
        finalizar_con="Abdominales Largos c/D 3x10 | Abdominales Inferiores 3x10 | Plancha Frontal c/ Anteb. 3x40\""
    )
    db.add(dia1)
    db.commit()
    db.refresh(dia1)

    ejercicios_dia1 = [
        ("Press Plano c/ Barra", [(1,"2X10 2X8"),(2,"1X10 2X8 1X6"),(3,"12-10-8-6"),(4,"1X10 2X8 1X6")]),
        ("Aperturas c/m en Banco Plano", [(1,"2X10 2X8"),(2,"2X10 2X8"),(3,"10-10-8-8"),(4,"4X8")]),
        ("Press Inclinado c/B", [(1,"2X10 2X10"),(2,"2X10 2X8"),(3,"10-10-8-8"),(4,"4X8")]),
        ("Cross Ascendente Polea Baja", [(1,"4X10"),(2,"4X8"),(3,"10-10-8-8"),(4,"4X8")]),
        ("Press Plano c/ Mancuernas", [(1,"2X12 2X10"),(2,"2X10 2X8"),(3,"1X12 1X10 2X8"),(4,"4X10")]),
        ("Curl Martillo c/ B", [(1,"2X12 2X10"),(2,"2X12 2X8"),(3,"1X12 1X10 2X8"),(4,"4X10")]),
        ("Press Arnold", [(1,"4X10"),(2,"4X8"),(3,"10-8-8"),(4,"4X8")]),
        ("Curl Predicador c/ M", [(1,"4X12"),(2,"2X12 2X10"),(3,"4X10"),(4,"4X10")]),
    ]
    for i, (nombre, sems) in enumerate(ejercicios_dia1, 1):
        ej = Exercise(numero=i, nombre=nombre, day_id=dia1.id)
        db.add(ej); db.commit(); db.refresh(ej)
        for sem_num, sr in sems:
            db.add(WeekSet(semana=sem_num, series_reps=sr, peso=None, exercise_id=ej.id))
    db.commit()

    dia2 = Day(
        numero=2, nombre="Espalda / Bíceps / Piernas",
        routine_id=routine.id,
        musculatura="DORSALES - CUÁDRICEPS - BÍCEPS",
        entrada_calor="Bici fija + Movilidad | Oblicuos Cruzados | Espinales Superman | Plancha Frontal Mano-Codo"
    )
    db.add(dia2); db.commit(); db.refresh(dia2)

    ejercicios_dia2 = [
        ("Elevación de Cadera c/B", [(1,"2X10 2X8"),(2,"1X10 2X8 1X6"),(3,"12-10-8-6"),(4,"1X10 2X8 1X6")]),
        ("Peso Muerto Rumano c/B", [(1,"4X10"),(2,"4X8"),(3,"10-10-8-8"),(4,"4X8")]),
        ("Búlgaras c/M", [(1,"2X12 2X10"),(2,"2X10 2X8"),(3,"10-10-8-8"),(4,"4X8")]),
        ("Flexión Isquiotibial c/M", [(1,"2X12 2X10"),(2,"2X10 2X8"),(3,"1X12 1X10 2X8"),(4,"4X8")]),
        ("Gemelos en Smith", [(1,"4X10"),(2,"4X8"),(3,"4X8"),(4,"4X10")]),
        ("Gemelos 1 PP c/ Rusa", [(1,"4X12"),(2,"2X12 2X10"),(3,"4X10"),(4,"4X10")]),
        ("Sentadilla Libre", [(1,"4X10"),(2,"4X8"),(3,"10-8-8"),(4,"4X8")]),
        ("Prensa 45°", [(1,"4X12"),(2,"2X12 2X10"),(3,"4X10"),(4,"4X10")]),
    ]
    for i, (nombre, sems) in enumerate(ejercicios_dia2, 1):
        ej = Exercise(numero=i, nombre=nombre, day_id=dia2.id)
        db.add(ej); db.commit(); db.refresh(ej)
        for sem_num, sr in sems:
            db.add(WeekSet(semana=sem_num, series_reps=sr, peso=None, exercise_id=ej.id))
    db.commit()

    print("✅ Base de datos sembrada")
    print("   profe@tdc.com / profe123  (profesor)")
    print("   12345678@tdc.com / ivan123  (alumno Ivan)")
    db.close()


if __name__ == "__main__":
    seed()
