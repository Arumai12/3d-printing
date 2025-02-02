import { cube, cylinder } from './jscadApiWrapper';
import {
  CsgWrapper,
  RectangularPrism,
  Cylinder,
} from './csgWrappers';
import { buildExportsForMap } from './typedUtils';

const map = {
  csg: () => (
    new CsgWrapper({
      position: { x: 5, y: 5, z: 1 },
      csg: cube([10, 10, 2]),
    })
      .centerXY()
      .union(
        new CsgWrapper({
          position: { x: 0, y: 0, z: 5 },
          csg: cylinder({ h: 10, d: 2 }),
        })
          .translateZ(2)
          .centerXY()
      )
  ),
  rectPrism: () => new RectangularPrism({
    width: 20,
    depth: 10,
    height: 4,
  }),
  rotateX: () => new RectangularPrism({
    width: 20,
    depth: 10,
    height: 4,
  })
    .rotateX(90),
  rotateY: () => new RectangularPrism({
    width: 20,
    depth: 10,
    height: 4,
  })
    .rotateY(90),
  rotateZ: () => new RectangularPrism({
    width: 20,
    depth: 10,
    height: 4,
  })
    .rotateZ(90),
  cylinderByRadius: () => new Cylinder({
    radius: 20,
    height: 30,
  }),
  cylinderByDiameter: () => new Cylinder({
    diameter: 20,
    height: 10,
  }),
  intersect: () => CsgWrapper.intersect(
    new RectangularPrism({
      width: 20,
      depth: 20,
      height: 20,
    }),
    new RectangularPrism({
      width: 20,
      depth: 20,
      height: 20,
    })
      .rotateZ(45),
  )
};

export const {
  main,
  getParameterDefinitions,
  objectNames,
} = buildExportsForMap(map)
