class Robot {
    constructor(id, estado, clienteID, batteryLevel, id_rutaActual, id_dispositivo) {
        this.id = id;
        this.estado = estado; // 'OCUPADO', 'MANTENIMIENTO', 'LIBRE'
        this.clienteID = clienteID;
        this.batteryLevel = batteryLevel;
        this.id_rutaActual = id_rutaActual;
        this.id_dispositivo = id_dispositivo;
    }

    // Métodos de negocio específicos para Robot
    puedeAsignarRuta() {
        return this.estado === 'LIBRE' && this.batteryLevel > 20;
    }

    necesitaCarga() {
        return this.batteryLevel < 30;
    }

    cambiarEstado(nuevoEstado) {
        const estadosValidos = ['OCUPADO', 'MANTENIMIENTO', 'LIBRE'];
        if (estadosValidos.includes(nuevoEstado)) {
            this.estado = nuevoEstado;
            return true;
        }
        return false;
    }

    // Métodos estáticos para mapeo desde Prisma
    static fromPrisma(prismaData) {
        return new Robot(
            prismaData.id,
            prismaData.estado,
            prismaData.clienteID,
            prismaData.batteryLevel,
            prismaData.id_rutaActual,
            prismaData.id_dispositivo
        );
    }
}

module.exports = Robot;