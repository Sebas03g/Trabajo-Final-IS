class Ruta {
    constructor(id, name, points, beginning, ending, createdAt) {
        this.id = id;
        this.name = name;
        this.points = points; // JSON con puntos de la ruta
        this.beginning = beginning; // Ubicaciones enum
        this.ending = ending; // Ubicaciones enum
        this.createdAt = createdAt;
    }

    // Métodos de negocio
    getPuntosDeRuta() {
        return Array.isArray(this.points) ? this.points : JSON.parse(this.points);
    }

    esRutaValida() {
        const puntos = this.getPuntosDeRuta();
        return puntos.length >= 2 && this.beginning && this.ending;
    }

    distanciaEstimada() {
        // Lógica para calcular distancia basada en puntos
        const puntos = this.getPuntosDeRuta();
        return puntos.length * 10; // Ejemplo simplificado
    }

    static fromPrisma(prismaData) {
        return new Ruta(
            prismaData.id,
            prismaData.name,
            prismaData.points,
            prismaData.beginning,
            prismaData.ending,
            prismaData.createdAt
        );
    }
}

module.exports = Ruta;