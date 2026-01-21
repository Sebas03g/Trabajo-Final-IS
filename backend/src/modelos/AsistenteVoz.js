const { EstadoRobot } = require('../enums/EstadoRobot');
const { Ubicaciones } = require('../enums/Ubicaciones');

class AsistenteVoz {
    constructor(id, ubicacion, estado, id_rutaActual, rutaActual = null, robots = []) {
        this.id = id;
        this.ubicacion = ubicacion;
        this.estado = estado || EstadoRobot.LIBRE;
        this.id_rutaActual = id_rutaActual;
        this.rutaActual = rutaActual;
        this.robots = robots;
        this.ultimaInteraccion = new Date();
    }

    // Métodos de negocio
    puedeAtender() {
        return this.estado === EstadoRobot.LIBRE;
    }

    atenderRobot(robot) {
        if (!this.puedeAtender()) {
            throw new Error('Asistente no disponible');
        }
        
        this.estado = EstadoRobot.OCUPADO;
        this.ultimaInteraccion = new Date();
        
        if (robot) {
            this.robots.push(robot);
        }
        
        return true;
    }

    liberar() {
        this.estado = EstadoRobot.LIBRE;
        this.robots = [];
        return true;
    }

    tieneRobotsAsignados() {
        return this.robots.length > 0;
    }

    getRobotsAsignadosIds() {
        return this.robots.map(robot => robot.id);
    }

    cambiarUbicacion(nuevaUbicacion) {
        if (Object.values(Ubicaciones).includes(nuevaUbicacion)) {
            this.ubicacion = nuevaUbicacion;
            return true;
        }
        return false;
    }

    necesitaMantenimiento() {
        const diasSinMantenimiento = (new Date() - this.ultimaInteraccion) / (1000 * 60 * 60 * 24);
        return diasSinMantenimiento > 30;
    }

    static fromPrisma(prismaData) {
        const robots = prismaData.robots ? 
            prismaData.robots.map(r => RobotAutomatico.fromPrisma(r)) : [];
        
        const rutaActual = prismaData.rutaActual ? 
            Ruta.fromPrisma(prismaData.rutaActual) : null;
        
        return new AsistenteVoz(
            prismaData.id,
            prismaData.ubicacion,
            prismaData.estado,
            prismaData.id_rutaActual,
            rutaActual,
            robots
        );
    }

    toJSON() {
        return {
            id: this.id,
            ubicacion: this.ubicacion,
            estado: this.estado,
            id_rutaActual: this.id_rutaActual,
            puedeAtender: this.puedeAtender(),
            robotsAsignados: this.getRobotsAsignadosIds(),
            necesitaMantenimiento: this.necesitaMantenimiento(),
            ultimaInteraccion: this.ultimaInteraccion
        };
    }
}

module.exports = AsistenteVoz;