export const robotControl = async(id_ruta) => {

}

export const asistenteVozControl = async(id_asistente) => {
    
}

function cardinalToAngle(cardinal) {
    const map = {
        'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
        'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
        'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
        'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    
    const key = cardinal.toUpperCase();
    return map[key] !== undefined ? map[key] : 0; // Por defecto Norte si no se reconoce
}

/**
 * Calcula el bearing (rumbo) de un punto a otro en grados (0° = Norte)
 * @param {number} lat1 - Latitud punto actual
 * @param {number} lon1 - Longitud punto actual
 * @param {number} lat2 - Latitud destino
 * @param {number} lon2 - Longitud destino
 * @returns {number} - Ángulo en grados (0-360) desde el Norte
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
    // Convertir a radianes
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    // Fórmula de bearing
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - 
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    let θ = Math.atan2(y, x);
    
    // Convertir a grados (0-360)
    const bearing = (θ * 180 / Math.PI + 360) % 360;
    
    return bearing;
}

/**
 * Determina dirección a girar basado en heading actual y bearing hacia destino
 * @param {number} headingActual - Ángulo actual (0°=Norte)
 * @param {number} bearingDestino - Ángulo hacia destino (0°=Norte)
 * @param {number} umbral - Umbral en grados para considerar "recto" (default 30°)
 * @returns {string} - "recto", "izquierda", "derecha", "atrás"
 */
function determinarGiro(headingActual, bearingDestino, umbral = 30) {
    // Normalizar diferencia a [-180, 180]
    let diff = bearingDestino - headingActual;
    diff = ((diff + 180) % 360) - 180;
    
    // Determinar dirección
    if (Math.abs(diff) <= umbral) {
        return "forward";
    } else if (Math.abs(diff) >= 180 - umbral) {
        return "backward";
    } else if (diff > 0) {
        return "left";
    } else {
        return "right";
    }
}

function navegarHaciaDestino(actual, destino, umbral = 30) {
    const { lat: lat1, lng: lon1, direccionCardinal } = actual;
    const { lat: lat2, lng: lon2 } = destino;
    
    // 1. Convertir dirección cardinal a ángulo
    const headingActual = cardinalToAngle(direccionCardinal);
    
    // 2. Calcular bearing hacia destino
    const bearingDestino = calculateBearing(lat1, lon1, lat2, lon2);
    
    // 3. Determinar dirección a girar
    const direccion = determinarGiro(headingActual, bearingDestino, umbral);
    
    // 4. Calcular diferencia exacta
    let diff = bearingDestino - headingActual;
    diff = ((diff + 180) % 360) - 180;
    
    return {
        direccion,           // "recto", "izquierda", "derecha", "atrás"
    };
}

export function movimiento(actual, destion, id_robot){
    const direccion = navegarHaciaDestino(actual, destino);

    if(direccion != 'forward'){

    }
}