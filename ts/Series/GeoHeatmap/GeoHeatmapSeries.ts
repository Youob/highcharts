/* *
 *
 *  (c) 2010-2023 Highsoft AS
 *
 *  Authors: Magdalena Gut, Piotr Madej
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type GeoHeatmapSeriesOptions from './GeoHeatmapSeriesOptions.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import GeoHeatmapPoint from './GeoHeatmapPoint.js';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import H from '../../Core/Globals.js';
const {
    doc
} = H;
import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject, stop } = A;
import type {
    AnimationStepCallbackFunction
} from '../../Core/Animation/AnimationOptions';

const {
    seriesTypes: {
        map: MapSeries
    }
} = SeriesRegistry;

import U from '../../Core/Utilities.js';

const {
    defined,
    extend,
    isNumber,
    merge,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The Geo Heatmap series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.geoheatmap
 *
 * @augments Highcharts.Series
 */

class GeoHeatmapSeries extends MapSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A `geoheatmap` series is a variety of heatmap series, composed into
     * the map projection, where the units are expressed in the latitude
     * and longitude, and individual values contained in a matrix are
     * represented as colors.
     *
     * @sample maps/demo/geoheatmap-europe/
     *         GeoHeatmap Chart on the Orthographic Projection
     * @sample maps/demo/geoheatmap-equalearth/
     *         GeoHeatmap Chart on the Equal Earth Projection
     *
     * @extends      plotOptions.map
     * @since 11.0.0
     * @product      highmaps
     * @excluding    allAreas, dragDrop, findNearestPointBy, geometry, joinBy, negativeColor, onPoint,
     * @requires     modules/geoheatmap
     * @optionparent plotOptions.geoheatmap
     */

    public static defaultOptions: GeoHeatmapSeriesOptions =
        merge(MapSeries.defaultOptions, {

            nullColor: 'transparent',

            tooltip: {
                pointFormat: 'Lat: {point.lat}, Lon: {point.lon}, Value: {point.value}<br/>'
            },

            /**
             * The border width of each geoheatmap tile.
             *
             * In styled mode, the border stroke width is given in the
             * `.highcharts-point` class.
             *
             * @sample maps/demo/geoheatmap-orthographic/
             *         borderWidth set to 1 to create a grid
             *
             * @type      {number|null}
             * @default   0
             * @product   highmaps
             * @apioption plotOptions.geoheatmap.borderWidth
             */
            borderWidth: 0,

            /**
             * The column size - how many longitude units each column in the
             * geoheatmap should span.
             *
             * @sample maps/demo/geoheatmap-europe/
             *         1 by default, set to 5
             *
             * @type      {number}
             * @default   1
             * @since 11.0.0
             * @product   highmaps
             * @apioption plotOptions.geoheatmap.colsize
             */
            colsize: 1,

            /**
             * The main color of the series. In heat maps this color is rarely
             * used, as we mostly use the color to denote the value of each
             * point. Unless options are set in the [colorAxis](#colorAxis), the
             * default value is pulled from the [options.colors](#colors) array.
             *
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @since 11.0.0
             * @product   highmaps
             * @apioption plotOptions.geoheatmap.color
             */

            /**
             * The rowsize size - how many latitude units each row in the
             * geoheatmap should span.
             *
             * @sample maps/demo/geoheatmap-europe/
             *         1 by default, set to 5
             *
             * @type      {number}
             * @default   1
             * @since 11.0.0
             * @product   highmaps
             * @apioption plotOptions.geoheatmap.rowsize
             */
            rowsize: 1

        } as GeoHeatmapSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public options: GeoHeatmapSeriesOptions = void 0 as any;

    public data: Array<GeoHeatmapPoint> = void 0 as any;

    public points: Array<GeoHeatmapPoint> = void 0 as any;

    public canvas?: HTMLCanvasElement = void 0 as any;

    public context?: CanvasRenderingContext2D = void 0 as any;

    public isDirtyCanvas: boolean = true;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * For updated colsize and rowsize options
     * @private
     */
    public update(): void {
        const series = this;

        series.options = merge(series.options, arguments[0]);
        if (series.options.interpolation) {
            series.isDirtyCanvas = true;
        }
        super.update.apply(series, arguments);
    }

    /**
     * Overriding drawPoints original method to apply new features.
     * @private
     */
    public drawPoints(): void {
        const
            series = this,
            chart = series.chart,
            mapView = chart.mapView,
            seriesOptions = series.options,
            interpolation = seriesOptions.interpolation;

        if (interpolation && mapView && series.bounds) {
            const {
                    image,
                    chart,
                    points
                } = series,
                [colsize, rowsize] = [
                    pick(seriesOptions.colsize, 1),
                    pick(seriesOptions.rowsize, 1)
                ],
                // Calculate dimensions based on series bounds
                topLeft = mapView.projectedUnitsToPixels({
                    x: series.bounds.x1,
                    y: series.bounds.y2
                }),
                bottomRight = mapView.projectedUnitsToPixels({
                    x: series.bounds.x2,
                    y: series.bounds.y1
                });

            if (topLeft && bottomRight) {
                const dimensions = {
                        x: topLeft.x,
                        y: topLeft.y,
                        width: bottomRight.x - topLeft.x,
                        height: bottomRight.y - topLeft.y
                    },
                    colorAxis = (
                        chart.colorAxis &&
                        chart.colorAxis[0]
                    ),
                    ctx = series.context || series.getContext(),
                    canvas = series.canvas;

                if (canvas && ctx && colorAxis) {
                    if (
                        // Do not calculate new canvas if not necessary
                        series.isDirtyCanvas ||
                        // Always calculate new canvas for Orthographic proj
                        mapView.projection.options.name === 'Orthographic'
                    ) {
                        const canvasWidth = canvas.width = ~~(
                                360 / colsize
                            ) + 1,
                            canvasHeight = canvas.height = ~~(
                                180 / rowsize
                            ) + 1,
                            canvasArea = canvasWidth * canvasHeight,
                            pixelData = new Uint8ClampedArray(
                                canvasArea * 4
                            ),
                            colorFromPoint = (p: any): number[] => {
                                const rgba = ((
                                    colorAxis.toColor(
                                        p.value ||
                                        0,
                                        pick(p)
                                    ) as string)
                                    .split(')')[0]
                                    .split('(')[1]
                                    .split(',')
                                    .map((s): number => pick(
                                        parseFloat(s),
                                        parseInt(s, 10)
                                    ))
                                );
                                rgba[3] = pick(rgba[3], 1.0) * 255;
                                if (!defined(p.value)) {
                                    rgba[3] = 0;
                                }
                                return rgba;
                            },
                            scaledPointPos = (
                                lon: number,
                                lat: number
                            ): number => (
                                Math.ceil(
                                    (
                                        canvasWidth *
                                        (
                                            canvasHeight - 1 -
                                                (lat + 90) / rowsize
                                        )
                                    ) +
                                    (
                                        (lon + 180) / colsize
                                    )
                                )
                            );

                        for (let i = 0; i < points.length; i++) {
                            const p = points[i],
                                sourceArr = new Uint8ClampedArray(
                                    colorFromPoint(p)
                                ),
                                { lon, lat } = p.options;

                            if (isNumber(lon) && isNumber(lat)) {
                                pixelData.set(
                                    sourceArr,
                                    scaledPointPos(lon, lat) * 4
                                );
                            }
                        }

                        const blur = pick(series.options.interpolationBlur, 1),
                            upscaledWidth = ~~(dimensions.width * blur),
                            upscaledHeight =
                                ~~(
                                    (blur * dimensions.width) / canvasWidth
                                ) * canvasHeight,
                            projectedWidth = ~~dimensions.width,
                            projectedHeight = ~~dimensions.height;

                        canvas.width = upscaledWidth;
                        canvas.height = upscaledHeight;

                        const img =
                            new ImageData(pixelData, canvasWidth, canvasHeight);

                        ctx.putImageData(img, 0, 0);
                        // Now we have an unscaled version of our ImageData
                        // let's make the compositing mode to 'copy' so that
                        // our next drawing op erases whatever was there
                        // previously just like putImageData would have done
                        ctx.globalCompositeOperation = 'copy';
                        // Now we can draw ourself over ourself.
                        ctx.drawImage(
                            canvas,
                            0, 0, img.width, img.height, // Grab the ImageData
                            0, 0, canvas.width, canvas.height // Scale it
                        );

                        const projectedPixelData = new Uint8ClampedArray(
                                projectedWidth * projectedHeight * 4
                            ),
                            cartesianImageData = ctx.getImageData(
                                0, 0, canvas.width, canvas.height
                            );

                        let y = -1;
                        // For each pixel on the map plane, find the map
                        // coordinate and get the color value
                        for (let i = 0; i < projectedPixelData.length; i += 4) {
                            const x = (i / 4) % projectedWidth;

                            if (x === 0) {
                                y++;
                            }
                            const projectedCoords = mapView.pixelsToLonLat({
                                    x: dimensions.x + x,
                                    y: dimensions.y + y
                                }),
                                lambda = pick(
                                    mapView.projection.options.rotation?.[0],
                                    0
                                );

                            if (projectedCoords) {
                                // Normalize lon values
                                if (
                                    projectedCoords.lon > -180 - lambda &&
                                    projectedCoords.lon < 180 - lambda
                                ) {
                                    projectedCoords.lon = projectedCoords.lon -
                                    Math.floor(
                                        (projectedCoords.lon + 180) / 360
                                    ) * 360;
                                }

                                const projected = [
                                        projectedCoords.lon,
                                        projectedCoords.lat
                                    ],
                                    scale = 1,
                                    cvs2PixelX =
                                        projected[0] * canvas.width /
                                        (360 * scale) +
                                        canvas.width / 2,
                                    cvs2PixelY = -1 *
                                        projected[1] * canvas.height /
                                        (180 * scale) +
                                        canvas.height / 2,
                                    redPos = (
                                        // Rows
                                        Math.floor(cvs2PixelY) *
                                        canvas.width * 4 +
                                        // Columns
                                        Math.round(cvs2PixelX) * 4
                                    );

                                if (
                                    cvs2PixelX >= 0 &&
                                    cvs2PixelX <= canvas.width &&
                                    cvs2PixelY >= 0 &&
                                    cvs2PixelY <= canvas.height
                                ) {
                                    projectedPixelData[i] =
                                        cartesianImageData.data[redPos];
                                    projectedPixelData[i + 1] =
                                        cartesianImageData.data[redPos + 1];
                                    projectedPixelData[i + 2] =
                                        cartesianImageData.data[redPos + 2];
                                    projectedPixelData[i + 3] =
                                        cartesianImageData.data[redPos + 3];
                                }
                            }
                        }

                        const projectedImg = new ImageData(
                            projectedPixelData,
                            projectedWidth,
                            projectedHeight
                        );
                        ctx.globalCompositeOperation = 'copy';
                        canvas.width = projectedWidth;
                        canvas.height = projectedHeight;
                        ctx.putImageData(projectedImg, 0, 0);
                    }

                    if (image) {
                        if (
                            chart.renderer.globalAnimation &&
                            chart.hasRendered
                        ) {
                            const startX = Number(
                                    image.attr('x')
                                ),
                                startY = Number(
                                    image.attr('y')
                                ),
                                startWidth = Number(
                                    image.attr('width')
                                ),
                                startHeight = Number(
                                    image.attr('height')
                                );

                            const step: AnimationStepCallbackFunction = (
                                now,
                                fx
                            ): void => {
                                image.attr({
                                    x: (
                                        startX + (
                                            dimensions.x - startX
                                        ) * fx.pos
                                    ),
                                    y: (
                                        startY + (
                                            dimensions.y - startY
                                        ) * fx.pos
                                    ),
                                    width: (
                                        startWidth + (
                                            dimensions.width - startWidth
                                        ) * fx.pos
                                    ),
                                    height: (
                                        startHeight + (
                                            dimensions.height - startHeight
                                        ) * fx.pos
                                    )
                                });
                            };

                            const animOptions = merge(
                                    animObject(chart.renderer.globalAnimation)),
                                userStep = animOptions.step;

                            animOptions.step =
                                function (): void {
                                    if (userStep) {
                                        userStep.apply(this, arguments);
                                    }
                                    step.apply(this, arguments);
                                };

                            image
                                .attr({ animator: 0 })
                                .animate({ animator: 1 }, animOptions);

                        // When dragging or first rendering, animation is off
                        } else {
                            stop(image);
                            image.attr({
                                ...dimensions,
                                href: canvas.toDataURL()
                            });
                        }
                    } else {
                        series.image = chart.renderer.image(
                            canvas.toDataURL()
                        )
                            .attr(dimensions)
                            .add(series.group);
                        series.isDirtyCanvas = false;
                    }
                }
            }
        } else {
            super.drawPoints.apply(series, arguments);
        }
    }

    /**
     * Method responsible for creating a canvas for interpolation image.
     * @private
     */
    public getContext(): CanvasRenderingContext2D | undefined {
        const series = this,
            {
                canvas,
                context
            } = series;
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            series.canvas = doc.createElement('canvas');

            series.context = series.canvas.getContext('2d', {
                willReadFrequently: true
            }) || void 0;
            return series.context;
        }

        return context;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface GeoHeatmapSeries {
    pointClass: typeof GeoHeatmapPoint;
    pointArrayMap: Array<string>;
    image?: SVGElement
}
extend(GeoHeatmapSeries.prototype, {
    type: 'geoheatmap',
    pointClass: GeoHeatmapPoint,
    pointArrayMap: ['lon', 'lat', 'value']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        geoheatmap: typeof GeoHeatmapSeries;
    }
}
SeriesRegistry.registerSeriesType('geoheatmap', GeoHeatmapSeries);

/* *
 *
 *  Default Export
 *
 * */

export default GeoHeatmapSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `geoheatmap` series. If the [type](#series.map.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.geoheatmap
 * @excluding allAreas, dataParser, dataURL, dragDrop, findNearestPointBy,
 *            joinBy, marker, mapData, negativeColor, onPoint, shadow
 * @product   highmaps
 * @apioption series.geoheatmap
 */

/**
 * An array of data points for the series. For the `geoheatmap` series
 * type, points can be given in the following ways:
 *
 * 1.  An array of arrays with 3 or 2 values. In this case, the values
 * correspond to `lon,lat,value`. The `value` refers to the color on the `colorAxis`.
 *
 *  ```js
 *     data: [
 *         [51.50, -0.12, 7],
 *         [54.59, -5.93, 4],
 *         [55.8, -4.25, 3]
 *     ]
 *  ```
 *
 * 2.  An array of objects with named values. The following snippet shows only a
 * few settings, see the complete options set below. If the total number of data
 * points exceeds the series' [turboThreshold](#series.heatmap.turboThreshold),
 * this option is not available.
 *
 *  ```js
 *     data: [{
 *         lat: 51.50,
 *         lon: -0.12,
 *         value: 7,
 *         name: "London"
 *     }, {
 *         lat: 54.59,
 *         lon: -5.93,
 *         value: 4,
 *         name: "Belfast"
 *     }]
 *  ```
 *
 * @sample maps/demo/geoheatmap-europe/
 *         GeoHeatmap Chart on the Orthographic Projection
 * @sample maps/demo/geoheatmap-equalearth/
 *         GeoHeatmap Chart on the Equal Earth Projection
 *
 * @type      {Array<Array<number>|*>}
 * @extends   series.map.data
 * @product   highmaps
 * @apioption series.geoheatmap.data
 */

/**
 * Individual color for the point. By default the color is either used
 * to denote the value, or pulled from the global `colors` array.
 *
 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @product   highmaps
 * @apioption series.geoheatmap.data.color
 */

/**
 * The value of the point, resulting in a color controled by options
 * as set in the [colorAxis](#colorAxis) configuration.
 *
 * @type      {number|null}
 * @product   highmaps
 * @apioption series.geoheatmap.data.value
 */

''; // adds doclets above to the transpiled file
