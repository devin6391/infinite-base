// Assume reference coordinate is center and has value of (0,0)
// Anything right or top is Positive and anything left or bottom is negative
export enum ScrollContainerCoordinateRef {
  TOP = 1,
  BOTTOM
}

export type PointIntersectionCallback = (
  elem: HTMLElement,
  observationPoint: ObservationPoint,
  positionRelativeToPoint: PositionRelativeToPoint
) => void;

export interface ObservationPoint {
  reference: ScrollContainerCoordinateRef;
  displacement: number;
  intersectionCallback?: PointIntersectionCallback;
}

export interface AnchorElement {
  // This is supposed to be a proper DOM selector
  elemSelector: string;
  // This observation point is supposed to be one of 'observationPoints' prop of InfiniteScrollBase
  // If this is null/not present then it means that we have to keep that element's position
  observationPoint?: ObservationPoint;
}

export enum ScrollDirection {
  UP = 1,
  DOWN
}

export enum PositionRelativeToPoint {
  JUST_ABOVE,
  JUST_BELOW
}

////////////////////////////////////////////////////////////////////

function createViewportTopObserverCallback(observationPoint: ObservationPoint) {
  return function viewportTopObserverCallback(
    entries: IntersectionObserverEntry[]
  ) {
    entries.forEach(entry => {
      const { target, rootBounds, intersectionRect, intersectionRatio } = entry;
      if (
        observationPoint.intersectionCallback &&
        intersectionRect.bottom === rootBounds.bottom
      ) {
        const positionRelativeToPoint =
          Math.round(intersectionRatio * 100) === 1
            ? PositionRelativeToPoint.JUST_BELOW
            : PositionRelativeToPoint.JUST_ABOVE;
        observationPoint.intersectionCallback(
          target as HTMLElement,
          observationPoint,
          positionRelativeToPoint
        );
      }
    });
  };
}

function createViewportBottomObserverCallback(
  observationPoint: ObservationPoint
) {
  return function viewportBottomObserverCallback(
    entries: IntersectionObserverEntry[]
  ) {
    entries.forEach(entry => {
      const {
        target,
        rootBounds,
        intersectionRect,
        intersectionRatio,
        isIntersecting
      } = entry;
      console.log("\n\n");
      console.log("=========BOTTOM INTERSECTION=============");
      console.log("Target: ");
      console.log(target);
      console.log("is intersecting?");
      console.log(isIntersecting);
      console.log("Root bounds top");
      console.log(rootBounds.top);
      console.log("Intersection Rect top");
      console.log(intersectionRect.top);
      console.log("Intersection ratio");
      console.log(Math.round(intersectionRatio * 100));

      if (
        observationPoint.intersectionCallback &&
        intersectionRect.top === rootBounds.top
      ) {
        const positionRelativeToPoint =
          Math.round(intersectionRatio * 100) === 99
            ? PositionRelativeToPoint.JUST_BELOW
            : PositionRelativeToPoint.JUST_ABOVE;
        observationPoint.intersectionCallback(
          target as HTMLElement,
          observationPoint,
          positionRelativeToPoint
        );
      }
    });
  };
}

export const viewportTopObserver = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint
): IntersectionObserver => {
  const { displacement } = observationPoint;
  const rootMargin = `0px 0px -${displacement}px 0px`;
  const intersectionObserverOptions = {
    root,
    rootMargin,
    threshold: [0, 1]
  };
  const intersectionObserver = new IntersectionObserver(
    createViewportTopObserverCallback(observationPoint),
    intersectionObserverOptions
  );
  return intersectionObserver;
};

export const viewportBottomObserver = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint
): IntersectionObserver => {
  const { displacement } = observationPoint;
  const rootMargin = `${displacement}px 0px 0px 0px`;
  const intersectionObserverOptions = {
    root,
    rootMargin,
    threshold: [0, 1]
  };
  const intersectionObserver = new IntersectionObserver(
    createViewportBottomObserverCallback(observationPoint),
    intersectionObserverOptions
  );
  return intersectionObserver;
};

/////////////////////////////////////////////////////////////

let touchScrollDirection = ScrollDirection.UP;

export function setTouchScrollDirection(direction: ScrollDirection) {
  console.log(
    "Scroll direction: " + (direction === ScrollDirection.UP ? "UP" : "DOWN")
  );
  touchScrollDirection = direction;
}
