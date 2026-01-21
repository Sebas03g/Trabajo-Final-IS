class Anomalia {
    constructor(id, tipo, idDispositivo, descripcion, fechaDeteccion, estado, nivelUrgencia) {
        this.id = id;
        this.tipo = tipo; // 'hardware', 'software', 'conectividad'
        this.idDispositivo = idDispositivo;
        this.descripcion = descripcion;
        this.fechaDeteccion = fechaDeteccion;
        this.estado = estado; // 'pendiente', 'investigando', 'resuelta'
        this.nivelUrgencia = nivelUrgencia; // 'baja', 'media', 'alta', 'critica'
    }

    // Métodos de negocio
    esUrgente() {
        return ['alta', 'critica'].includes(this.nivelUrgencia);
    }

    tiempoDesdeDeteccion() {
        return Math.floor((new Date() - this.fechaDeteccion) / (1000 * 60 * 60)); // horas
    }

    requiereIntervencionInmediata() {
        return this.esUrgente() && this.tiempoDesdeDeteccion() < 1;
    }

    static fromPrisma(prismaData) {
        return new Anomalia(
            prismaData.id,
            prismaData.tipo,
            prismaData.idDispositivo,
            prismaData.descripcion,
            prismaData.fechaDeteccion,
            prismaData.estado,
            prismaData.nivelUrgencia
        );
    }
}

module.exports = Anomalia;