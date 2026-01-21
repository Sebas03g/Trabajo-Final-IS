class Mantenimiento {
    constructor(id, idRobot, tipo, fechaProgramada, fechaRealizado, estado, descripcion) {
        this.id = id;
        this.idRobot = idRobot;
        this.tipo = tipo; // 'preventivo', 'correctivo', 'calibracion'
        this.fechaProgramada = fechaProgramada;
        this.fechaRealizado = fechaRealizado;
        this.estado = estado; // 'pendiente', 'en_proceso', 'completado'
        this.descripcion = descripcion;
    }

    // Métodos de negocio
    estaAtrasado() {
        return this.estado === 'pendiente' && 
               new Date() > this.fechaProgramada;
    }

    puedeProgramarse() {
        return this.estado === 'pendiente' && 
               new Date(this.fechaProgramada) > new Date();
    }

    duracionEstimada() {
        const duraciones = {
            'preventivo': 2, // horas
            'correctivo': 4,
            'calibracion': 1
        };
        return duraciones[this.tipo] || 2;
    }

    static fromPrisma(prismaData) {
        return new Mantenimiento(
            prismaData.id,
            prismaData.idRobot,
            prismaData.tipo,
            prismaData.fechaProgramada,
            prismaData.fechaRealizado,
            prismaData.estado,
            prismaData.descripcion
        );
    }
}

module.exports = Mantenimiento;