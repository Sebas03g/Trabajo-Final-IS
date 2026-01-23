export default class Mapa {
    constructor(id, name, url, points) {
        this.id = id;
        this.name = name;
        this.points = this.parsePoints(points);
    }

    parsePoints(points) {
        if (typeof points === 'string') {
            return JSON.parse(points);
        }
        return points || [];
    }

    // Métodos de negocio
    getPoligono() {
        return this.points;
    }

    esPuntoValido(x, y) {
        // Implementar algoritmo point-in-polygon
        // Simplificado: verificar si el punto está dentro del área del mapa
        if (this.points.length < 3) return false;
        
        const minX = Math.min(...this.points.map(p => p.x));
        const maxX = Math.max(...this.points.map(p => p.x));
        const minY = Math.min(...this.points.map(p => p.y));
        const maxY = Math.max(...this.points.map(p => p.y));
        
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    esUrlValida() {
        try {
            new URL(this.url);
            return true;
        } catch (error) {
            return false;
        }
    }

    getCentro() {
        if (this.points.length === 0) return { x: 0, y: 0 };
        
        const sumX = this.points.reduce((sum, p) => sum + p.x, 0);
        const sumY = this.points.reduce((sum, p) => sum + p.y, 0);
        
        return {
            x: sumX / this.points.length,
            y: sumY / this.points.length
        };
    }

    getArea() {
        if (this.points.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        
        return Math.abs(area) / 2;
    }

    static fromPrisma(prismaData) {
        return new Mapa(
            prismaData.id,
            prismaData.name,
            prismaData.url, // ← Agregar aquí
            prismaData.points
        );
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            points: this.points
        };
    }
}