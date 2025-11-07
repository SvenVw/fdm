import { fromUrl, type GeoTIFF } from 'geotiff';
import proj4 from 'proj4';
import { scaleSequential } from 'd3-scale';
import { interpolateTurbo } from 'd3-scale-chromatic';

const tiffCache = new Map<string, GeoTIFF>()
const tiffPromiseCache = new Map<string, Promise<GeoTIFF>>()

async function getTiff(url: string): Promise<GeoTIFF> {
    const cached = tiffCache.get(url)
    if (cached) return cached

    const inFlight = tiffPromiseCache.get(url)
    if (inFlight) return inFlight

    const promise = (async () => {
        try {
            const tiff = await fromUrl(url)
            tiffCache.set(url, tiff)
            tiffPromiseCache.delete(url)
            return tiff
        } catch (error) {
            tiffPromiseCache.delete(url)
            throw new Error(
                `Failed to fetch or parse GeoTIFF from ${url}: ${String(error)}`,
            )
        }
    })()
    tiffPromiseCache.set(url, promise)
    return promise
}

addEventListener('message', async (event) => {
    const { bounds, cogIndex } = event.data;

    proj4.defs("EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +no_defs");
    const rdProjection = proj4("EPSG:4326", "EPSG:28992");

    const [minLon, minLat, maxLon, maxLat] = bounds;
    const minRD = rdProjection.forward([minLon, minLat]);
    const maxRD = rdProjection.forward([maxLon, maxLat]);
    const rdBounds = { minX: minRD[0], minY: minRD[1], maxX: maxRD[0], maxY: maxRD[1] };

    const visibleCogs = cogIndex.filter((cog: any) => {
        const [cogMinX, cogMinY, cogMaxX, cogMaxY] = cog.properties.bbox;
        return rdBounds.minX < cogMaxX && rdBounds.maxX > cogMinX && rdBounds.minY < cogMaxY && rdBounds.maxY > cogMinY;
    });

    if (visibleCogs.length === 0) {
        postMessage({ error: 'No COGs found' });
        return;
    }

    let min = Infinity;
    let max = -Infinity;
    const allPixelData = [];

    for (const cog of visibleCogs) {
        const tiff = await getTiff(cog.properties.url);
        const image = await tiff.getImage();
        const data = await image.readRasters({
            bbox: [rdBounds.minX, rdBounds.minY, rdBounds.maxX, rdBounds.maxY],
            resX: 0.5,
            resY: 0.5,
        });
        const pixelData = data[0] as Float32Array;
        for (let i = 0; i < pixelData.length; i++) {
            const value = pixelData[i];
            if (value !== image.getGDALNoData()) {
                if (value < min) min = value;
                if (value > max) max = value;
            }
        }
        allPixelData.push({ data: pixelData, width: data.width, height: data.height });
    }

    const compositeWidth = Math.round((rdBounds.maxX - rdBounds.minX) / 0.5);
    const compositeHeight = Math.round((rdBounds.maxY - rdBounds.minY) / 0.5);
    const compositePixelData = new Float32Array(compositeWidth * compositeHeight).fill(NaN);

    for (const cogData of allPixelData) {
        const { data, width, height } = cogData;
        const tiff = await getTiff(visibleCogs[allPixelData.indexOf(cogData)].properties.url);
        const image = await tiff.getImage();
        const [cogMinX, cogMinY] = image.getOrigin();

        const xOffset = Math.round((cogMinX - rdBounds.minX) / 0.5);
        const yOffset = Math.round((rdBounds.maxY - (cogMinY + height * 0.5)) / 0.5);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const compositeIndex = (yOffset + y) * compositeWidth + (xOffset + x);
                compositePixelData[compositeIndex] = data[y * width + x];
            }
        }
    }

    const colorScale = scaleSequential(interpolateTurbo).domain([min, max]);
    const imageData = new ImageData(compositeWidth, compositeHeight);
    for (let i = 0; i < compositePixelData.length; i++) {
        const value = compositePixelData[i];
        const color = colorScale(value);
        const [r, g, b] = color.substring(4, color.length - 1).split(",").map(Number);
        imageData.data[i * 4] = r;
        imageData.data[i * 4 + 1] = g;
        imageData.data[i * 4 + 2] = b;
        imageData.data[i * 4 + 3] = 255;
    }

    postMessage({
        imageData,
        min,
        max,
        paletteDomain: colorScale.domain(),
        paletteInterpolator: 'interpolateTurbo',
        pixelData: { data: compositePixelData, width: compositeWidth, height: compositeHeight },
    });
});
