class Usuario {
    constructor(id, nombre, email, rol, fechaRegistro) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol; // 'admin', 'operador', 'tecnico'
        this.fechaRegistro = fechaRegistro;
    }

    // Métodos de negocio
    esAdministrador() {
        return this.rol === 'admin';
    }

    puedeGestionarRobot() {
        return ['admin', 'operador'].includes(this.rol);
    }

    static fromPrisma(prismaData) {
        return new Usuario(
            prismaData.id,
            prismaData.nombre,
            prismaData.email,
            prismaData.rol,
            prismaData.fechaRegistro
        );
    }
}

module.exports = Usuario;