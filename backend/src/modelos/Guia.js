export default class Guia {
    constructor(id, id_ruta, puntoActual, id_robot, ruta = null, robot = null) {
        this.id = id;
        this.id_ruta = id_ruta;
        this.puntoActual = puntoActual || 0;
        this.id_robot = id_robot;
        this.ruta = ruta;
        this.robot = robot;
    }

    // Métodos de negocio
    getPuntoActualCoords() {
        if (!this.ruta || !this.ruta.points) return null;
        return this.ruta.points[this.puntoActual] || null;
    }

    avanzar() {
        if (!this.ruta) return false;
        
        if (this.puntoActual < this.ruta.points.length - 1) {
            this.puntoActual++;
            return true;
        }
        return false;
    }

    retroceder() {
        if (this.puntoActual > 0) {
            this.puntoActual--;
            return true;
        }
        return false;
    }

    irAPunto(indice) {
        if (!this.ruta) return false;
        
        if (indice >= 0 && indice < this.ruta.points.length) {
            this.puntoActual = indice;
            return true;
        }
        return false;
    }

    getProgreso() {
        if (!this.ruta || this.ruta.points.length === 0) return 0;
        return (this.puntoActual / (this.ruta.points.length - 1)) * 100;
    }

    estaCompletada() {
        if (!this.ruta) return false;
        return this.puntoActual >= this.ruta.points.length - 1;
    }

    getSiguientePunto() {
        if (!this.ruta || this.estaCompletada()) return null;
        return this.ruta.points[this.puntoActual + 1] || null;
    }

    getDistanciaRestante() {
        if (!this.ruta || this.estaCompletada()) return 0;
        
        let distancia = 0;
        for (let i = this.puntoActual; i < this.ruta.points.length - 1; i++) {
            const p1 = this.ruta.points[i];
            const p2 = this.ruta.points[i + 1];
            distancia += this.calcularDistancia(p1, p2);
        }
        return distancia;
    }

    calcularDistancia(p1, p2) {
        const dx = p2.x - p1.x || 0;
        const dy = p2.y - p1.y || 0;
        return Math.sqrt(dx*dx + dy*dy);
    }

    static fromPrisma(prismaData) {
        return new Guia(
            prismaData.id,
            prismaData.id_ruta,
            prismaData.puntoActual,
            prismaData.id_robot,
            prismaData.ruta ? Ruta.fromPrisma(prismaData.ruta) : null,
            prismaData.robot ? RobotAutomatico.fromPrisma(prismaData.robot) : null
        );
    }

    toJSON() {
        return {
            id: this.id,
            id_ruta: this.id_ruta,
            puntoActual: this.puntoActual,
            id_robot: this.id_robot,
            progreso: this.getProgreso(),
            completada: this.estaCompletada(),
            distanciaRestante: this.getDistanciaRestante()
        };
    }
}
