const express = require('express');
const router = express.Router();
const mapaService = require('../servicios/mapa.service');

const validarCrearMapa = (req, res, next) => {
    const { name, url, points } = req.body;
    
    if (!name || !url || !points) {
        return res.status(400).json({ 
            success: false,
            error: 'Faltan campos requeridos: name, url, points' 
        });
    }
    
    // Validar URL
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({ 
            success: false,
            error: 'URL no válida' 
        });
    }
    
    // Validar puntos
    if (!Array.isArray(points) || points.length < 3) {
        return res.status(400).json({ 
            success: false,
            error: 'points debe ser un array con al menos 3 puntos' 
        });
    }
    
    next();
};

// Crear nuevo mapa
router.post('/', validarCrearMapa, async (req, res) => {
    try {
        const mapa = await mapaService.crearMapa(req.body);
        res.status(201).json({
            success: true,
            data: mapa,
            message: 'Mapa creado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener todos los mapas
router.get('/', async (req, res) => {
    try {
        const mapas = await mapaService.obtenerTodosMapas();
        res.json({
            success: true,
            count: mapas.length,
            data: mapas
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener mapa por ID
router.get('/:id', async (req, res) => {
    try {
        const mapa = await mapaService.obtenerMapaPorId(req.params.id);
        res.json({
            success: true,
            data: mapa
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener mapa principal
router.get('/principal/actual', async (req, res) => {
    try {
        const mapa = await mapaService.obtenerMapaPrincipal();
        res.json({
            success: true,
            data: mapa
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

const validarActualizarMapa = (req, res, next) => {
    const { url } = req.body;
    
    // Si se proporciona URL, validarla
    if (url) {
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({ 
                success: false,
                error: 'URL no válida' 
            });
        }
    }
    
    next();
};

// Actualizar mapa
router.put('/:id', validarActualizarMapa, async (req, res) => {
    try {
        const mapa = await mapaService.actualizarMapa(req.params.id, req.body);
        res.json({
            success: true,
            data: mapa,
            message: 'Mapa actualizado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar mapa
router.delete('/:id', async (req, res) => {
    try {
        const mapa = await mapaService.eliminarMapa(req.params.id);
        res.json({
            success: true,
            data: mapa,
            message: 'Mapa eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Validar ubicación en mapa
router.post('/:id/validar-ubicacion', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan coordenadas: lat, lng' 
            });
        }
        
        const esValida = await mapaService.validarUbicacionEnMapa(
            req.params.id, 
            parseFloat(lat), 
            parseFloat(lng)
        );
        
        res.json({
            success: true,
            data: {
                mapaId: req.params.id,
                coordenadas: { lat, lng },
                esValida
            }
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener centro del mapa
router.get('/:id/centro', async (req, res) => {
    try {
        const centro = await mapaService.obtenerCentroMapa(req.params.id);
        res.json({
            success: true,
            data: {
                mapaId: req.params.id,
                centro
            }
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener área del mapa
router.get('/:id/area', async (req, res) => {
    try {
        const area = await mapaService.obtenerAreaMapa(req.params.id);
        res.json({
            success: true,
            data: {
                mapaId: req.params.id,
                area
            }
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.get('/:id/detalle', async (req, res) => {
    try {
        const mapa = await mapaService.obtenerMapaPorId(req.params.id);
        
        // Información extendida con el nuevo campo
        const detalle = {
            ...mapa.toJSON(),
            metadata: {
                tieneUrl: !!mapa.url,
                urlValida: mapa.esUrlValida(),
                tipoArchivo: mapa.getTipoMapa(),
                numeroPuntos: mapa.points.length
            }
        };
        
        res.json({
            success: true,
            data: detalle
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.get('/buscar/tipo', async (req, res) => {
    try {
        const { tipo } = req.query; // 'imagen', 'geojson', 'kml'
        
        const mapas = await mapaService.obtenerTodosMapas();
        
        // Filtrar por tipo basado en la URL
        const mapasFiltrados = mapas.filter(mapa => {
            const tipoMapa = mapa.getTipoMapa();
            return tipo ? tipoMapa === tipo.toLowerCase() : true;
        });
        
        res.json({
            success: true,
            count: mapasFiltrados.length,
            data: mapasFiltrados
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;