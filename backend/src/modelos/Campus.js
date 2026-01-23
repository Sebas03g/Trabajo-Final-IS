export default class Campus {
    constructor(id, name, points, edificios, zonasRestringidas, puntosInteres) {
        this.id = id;
        this.name = name;
        this.points = points; // JSON con polígono del campus
        this.edificios = edificios || [];
        this.zonasRestringidas = zonasRestringidas || [];
        this.puntosInteres = puntosInteres || [];
    }

    // Métodos de negocio
    getPoligono() {
        return Array.isArray(this.points) ? this.points : JSON.parse(this.points);
    }

    contieneUbicacion(lat, lng) {
        // Lógica para verificar si un punto está dentro del polígono del campus
        const poligono = this.getPoligono();
        // Implementar algoritmo point-in-polygon
        return true; // Simplificado
    }

    esZonaPermitida(lat, lng) {
        const punto = { lat, lng };
        // Verificar que no esté en zona restringida
        return !this.zonasRestringidas.some(zona => 
            this.puntoEnZona(punto, zona)
        );
    }

    puntoEnZona(punto, zona) {
        // Lógica para verificar si punto está en zona
        return false; // Simplificado
    }

    static fromPrisma(prismaData) {
        return new Campus(
            prismaData.id,
            prismaData.name,
            prismaData.points,
            prismaData.edificios,
            prismaData.zonasRestringidas,
            prismaData.puntosInteres
        );
    }
}