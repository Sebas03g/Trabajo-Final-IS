class Dispositivo {
    constructor(id, id_robot, lat, lng, cardinalDirection) {
        this.id = id;
        this.id_robot = id_robot;
        this.lat = lat;
        this.lng = lng;
        this.cardinalDirection = cardinalDirection; // 0-360 grados
    }

    // Métodos de negocio
    getUbicacion() {
        return { lat: this.lat, lng: this.lng };
    }

    getDireccionCardinal() {
        const direcciones = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(this.cardinalDirection / 45) % 8;
        return direcciones[index];
    }

    distanciaA(lat, lng) {
        // Fórmula Haversine simplificada
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat - this.lat) * Math.PI / 180;
        const dLng = (lng - this.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    static fromPrisma(prismaData) {
        return new Dispositivo(
            prismaData.id,
            prismaData.id_robot,
            prismaData.lat,
            prismaData.lng,
            prismaData.cardinalDirection
        );
    }
}

module.exports = Dispositivo;