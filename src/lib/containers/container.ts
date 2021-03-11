import _ from 'lodash';
import { CsgWrapper, RectPrism } from '../csgWrappers';
import { getNextMultiple } from '../typedUtils';

export enum ExpandStrategy {
  none = 'none',
  inside = 'inside',
  wall = 'wall',
}

interface ContainerOptions {
  innerLength?: number,
  innerWidth?: number,
  innerDepth?: number,
  outerLength?: number,
  outerWidth?: number,
  outerDepth?: number,
  sideMultiple?: number,
  widthMultiple?: number,
  depthMultiple?: number,
  wallThickness?: number,
  wallThicknessX?: number,
  wallThicknessY?: number,
  expand?: ExpandStrategy,
  expandX?: ExpandStrategy,
  expandY?: ExpandStrategy,
  baseHoleLength?: number,
  baseHoleWidth?: number,
  baseHoleDepth?: number,
  baseSupportLength?: number,
  baseSupportLengthX?: number,
  baseSupportLengthY?: number,
  braceLength?: number,
  braceLengthX?: number,
  braceLengthY?: number,
  braceHeight?: number,
  baseThickness?: number,
  innerHeight?: number,
  outerHeight?: number,
}

export class Container extends CsgWrapper {
  constructor({
    innerLength = null,
    innerWidth = innerLength,
    innerDepth = innerLength,
    outerLength = null,
    outerWidth = outerLength,
    outerDepth = outerLength,
    sideMultiple = null,
    widthMultiple = sideMultiple,
    depthMultiple = sideMultiple,
    wallThickness = 0.8,
    wallThicknessX = wallThickness,
    wallThicknessY = wallThickness,
    expand = ExpandStrategy.none,
    expandX = expand,
    expandY = expand,
    baseHoleLength = 0,
    baseHoleWidth = baseHoleLength,
    baseHoleDepth = baseHoleLength,
    baseSupportLength = Infinity,
    baseSupportLengthX = baseSupportLength,
    baseSupportLengthY = baseSupportLength,
    braceLength = Infinity,
    braceLengthX = braceLength,
    braceLengthY = braceLength,
    braceHeight = Infinity,
    baseThickness = null,
    innerHeight = null,
    outerHeight = null,
  }: ContainerOptions) {
    const heightParameterCount = _.sumBy(
      [outerHeight, innerHeight, baseThickness],
      (value: number) => value === null ? 0 : 1,
    );

    if (heightParameterCount !== 2) {
      throw Error('Must provide exactly two of "outerHeight", "innerHeight", "baseThickness"');
    } else if (outerHeight === null) {
      outerHeight = innerHeight + baseThickness;
    } else if (innerHeight === null) {
      innerHeight = outerHeight - baseThickness;
    } else {
      baseThickness = outerHeight - innerHeight;
    }

    const hasInnerWidth = innerWidth !== null;
    const hasOuterWidth = outerWidth !== null;
    const hasWidthMultiple = widthMultiple !== null;

    { // width validation
      if (wallThicknessX <= 0) {
        throw Error('"wallThicknessX" must be greater than or equal to 0')
      }

      if (!hasInnerWidth && !hasOuterWidth  && !hasWidthMultiple) {
        throw Error('at least one of "innerWidth", "outerWidth", "widthMultiple" must be provided');
      }

      if (hasInnerWidth && !hasOuterWidth && !hasWidthMultiple && expandX !== ExpandStrategy.none) {
        throw Error('"expandX" must be "none" when only "innerWidth" is provided');
      }

      if (hasOuterWidth && hasWidthMultiple && !_.isInteger(outerWidth / widthMultiple)) {
        throw Error('"outerWidth" is not a multiple of "widthMultiple');
      }

      if (!hasInnerWidth && (hasOuterWidth || hasWidthMultiple) && expandX !== ExpandStrategy.inside) {
        throw Error('"expandX" must be "inside" when "innerWidth" is not provided');
      }

      if (hasInnerWidth && hasOuterWidth && expandX === ExpandStrategy.none && (innerWidth + 2 * wallThicknessX) !== outerWidth) {
        throw Error('invalid "innerWidth", "wallThicknessX", "outerWidth" combination for "expandX" set to "none". Either change "expandX" to "wall" or "inside", provide less dimensions, or provide exact dimensions');
      }

      if (hasInnerWidth && !hasOuterWidth && hasWidthMultiple && expandX === ExpandStrategy.none) {
        const providedWidth = innerWidth + 2 * wallThicknessX;
        if(providedWidth !== getNextMultiple(providedWidth, widthMultiple)) {
          throw Error('invalid "innerWidth", "wallThicknessX", "widthMultiple" combination for "expandX" set to "none". Either change "expandX" to "wall" or "inside", provide less dimensions, or provide exact dimensions');
        }
      }
    }

    const hasInnerDepth = innerWidth !== null;
    const hasOuterDepth = outerWidth !== null;
    const hasDepthMultiple = widthMultiple !== null;

    { // depth validation
      if (wallThicknessY <= 0) {
        throw Error('"wallThicknessY" must be greater than or equal to 0')
      }

      if (!hasInnerDepth && !hasOuterDepth  && !hasDepthMultiple) {
        throw Error('at least one of "innerDepth", "outerDepth", "depthMultiple" must be provided');
      }

      if (hasInnerDepth && !hasOuterDepth && !hasDepthMultiple && expandX !== ExpandStrategy.none) {
        throw Error('"expandY" must be "none" when only "innerDepth" is provided');
      }

      if (hasOuterDepth && hasDepthMultiple && !_.isInteger(outerDepth / depthMultiple)) {
        throw Error('"outerDepth" is not a multiple of "depthMultiple');
      }

      if (!hasInnerDepth && (hasOuterDepth || hasDepthMultiple) && expandY !== ExpandStrategy.inside) {
        throw Error('"expandY" must be "inside" when "innerDepth" is not provided');
      }

      if (hasInnerDepth && hasOuterDepth && expandY === ExpandStrategy.none && (innerDepth + 2 * wallThicknessY) !== outerDepth) {
        throw Error('invalid "innerDepth", "wallThicknessY", "outerDepth" combination for "expandY" set to "none". Either change "expandY" to "wall" or "inside", provide less dimensions, or provide exact dimensions');
      }

      if (hasInnerDepth && !hasOuterDepth && hasDepthMultiple && expandY === ExpandStrategy.none) {
        const providedWidth = innerDepth + 2 * wallThicknessY;
        if(providedWidth !== getNextMultiple(providedWidth, depthMultiple)) {
          throw Error('invalid "innerDepth", "wallThicknessY", "depthMultiple" combination for "expandY" set to "none". Either change "expandY" to "wall" or "inside", provide less dimensions, or provide exact dimensions');
        }
      }
    }

    if (!hasInnerWidth) {
      innerWidth = 0; // default width for expansion
    }

    if (!hasOuterWidth) {
      const computedWidth = innerWidth + 2 * wallThicknessX;

      outerWidth = hasWidthMultiple
        ? getNextMultiple(computedWidth, widthMultiple)
        : computedWidth;
    }

    if (expandX === ExpandStrategy.inside) {
      innerWidth = outerWidth - 2 * wallThicknessX;
    } else if (expandX === ExpandStrategy.wall) {
      wallThicknessX = (outerWidth - innerWidth) / 2;
    }

    if (!hasInnerDepth) {
      innerDepth = 0; // default depth for expansion
    }

    if (!hasOuterDepth) {
      const computedDepth = innerDepth + 2 * wallThicknessY;

      outerDepth = hasDepthMultiple
        ? getNextMultiple(computedDepth, depthMultiple)
        : computedDepth;
    }

    if (expandY === ExpandStrategy.inside) {
      innerDepth = outerDepth - 2 * wallThicknessY;
    } else if (expandY === ExpandStrategy.wall) {
      wallThicknessY = (outerDepth - innerDepth) / 2;
    }

    if (baseSupportLengthX !== Infinity) {
      baseHoleWidth = innerWidth - 2 * baseSupportLengthX;

      if (baseHoleWidth < 0) {
        throw Error('"baseSupportLengthX" is too big')
      }
    }

    if (baseSupportLengthY !== Infinity) {
      baseHoleDepth = innerDepth - 2 * baseSupportLengthY;

      if (baseHoleDepth < 0) {
        throw Error('"baseSupportLengthY" is too big')
      }
    }

    super({
      csg: new RectPrism({
        name: 'Outer Box',
        width: outerWidth,
        depth: outerDepth,
        height: outerHeight,
      })
        .difference(
          new RectPrism({
            name: 'Inner Hole',
            width: innerWidth,
            depth: innerDepth,
            height: innerHeight,
          })
            .translate(wallThicknessX, wallThicknessY, baseThickness),
          new RectPrism({
            name: 'Base Hole',
            isOptional: true,
            width: baseHoleWidth,
            depth: baseHoleDepth,
            height: baseThickness,
          })
            .translateXY((outerWidth / 2) - (baseHoleWidth / 2), (outerDepth / 2) - (baseHoleDepth / 2)),
          new RectPrism({
            name: 'Left/Right Wall Holes',
            isOptional: true,
            width: outerWidth,
            depth: innerDepth - 2 * braceLengthY,
            height: outerHeight - braceHeight - baseThickness,
          })
            .translateYZ(wallThicknessY + braceLengthY, baseThickness + braceHeight),
          new RectPrism({
            name: 'Front/Back Wall Holes',
            isOptional: true,
            width: innerDepth - 2 * braceLengthX,
            depth: outerDepth,
            height: outerHeight - braceHeight - baseThickness,
          })
            .translateXZ(wallThicknessX + braceLengthX, baseThickness + braceHeight)
        )
    });
  }
}
