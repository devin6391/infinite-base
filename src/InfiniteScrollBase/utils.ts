interface NewConsole extends Console {
  re: any;
}

declare var console: NewConsole;

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
  ABOVE = 1,
  BELOW
}

let touchScrollDirection = ScrollDirection.UP;
let allObservationPoints: ObservationPoint[];
let scrollContainer: HTMLDivElement;
let listContainer: HTMLDivElement;


// This can change after initialisation
let allIntersectionObservers: IntersectionObserver[] = [];

// This is an application state value. This value would be true if DPR has to be compensated for rootMargin.
// DPR: Device Pixel Ratio
let shouldCompensateForDpr: boolean = false;
// Below is process state flag.
// If calculation of DPR and the consequence due to that is done for once, then do not do it again by making it true.
let compensateForDprProcessed = false;

////////////////////////////////////////////////////////////////////

function createViewportTopObserverCallback(observationPoint: ObservationPoint) {
  return function viewportTopObserverCallback(
    entries: IntersectionObserverEntry[]
  ) {
    entries.forEach(entry => {
      const {
        target,
        rootBounds,
        intersectionRatio,
        isIntersecting,
        boundingClientRect,
        time
      } = entry;
      // console.log("\n\n");
      // console.log(
      //   "%c=========TOP INTERSECTION CONTAINER=============",
      //   "font-size: 18px; color: red"
      // );
      // console.log("Target: ");
      // console.log(target);
      // console.log("is intersecting?");
      // console.log(isIntersecting);
      // console.log("Root bounds");
      // console.log(rootBounds);
      // console.log("Target Rect");
      // console.log(boundingClientRect);
      // console.log("Intersection ratio");
      // console.log(Math.round(intersectionRatio * 100));
      // console.log("Intersection time");
      // console.log(time);

      // console.re.log("Bounding rect", rootBounds);

      if (observationPoint.intersectionCallback) {
        let positionRelativeToPoint: PositionRelativeToPoint | null = null;

        if (
          touchScrollDirection === ScrollDirection.UP &&
          boundingClientRect.top < rootBounds.bottom &&
          Math.round(boundingClientRect.bottom) <=
            Math.round(rootBounds.bottom) &&
          boundingClientRect.top > rootBounds.top
        ) {
          positionRelativeToPoint = PositionRelativeToPoint.ABOVE;
        } else if (
          touchScrollDirection === ScrollDirection.DOWN &&
          boundingClientRect.bottom > rootBounds.bottom &&
          Math.round(boundingClientRect.top) >= Math.round(rootBounds.bottom)
        ) {
          positionRelativeToPoint = PositionRelativeToPoint.BELOW;
        }

        if (positionRelativeToPoint) {
          observationPoint.intersectionCallback(
            target as HTMLElement,
            observationPoint,
            positionRelativeToPoint
          );
        }
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
        intersectionRatio,
        isIntersecting,
        boundingClientRect,
        time
      } = entry;
      // console.log("\n\n");
      // console.log(
      //   "%c=========BOTTOM INTERSECTION CONTAINER=============",
      //   "font-size: 18px; color: red"
      // );
      // console.log("Target: ");
      // console.log(target);
      // console.log("is intersecting?");
      // console.log(isIntersecting);
      // console.log("Root bounds");
      // console.log(rootBounds);
      // console.log("Target Rect");
      // console.log(boundingClientRect);
      // console.log("Intersection ratio");
      // console.log(Math.round(intersectionRatio * 100));
      // console.log("Intersection time");
      // console.log(time);

      // console.re.log("Bounding rect", rootBounds);

      if(!compensateForDprProcessed) {
        compensateForDpr(observationPoint, rootBounds);
        compensateForDprProcessed = true;
      }

      if (observationPoint.intersectionCallback) {
        let positionRelativeToPoint: PositionRelativeToPoint | null = null;

        if (
          touchScrollDirection === ScrollDirection.UP &&
          boundingClientRect.top < rootBounds.top &&
          Math.round(boundingClientRect.bottom) <= Math.round(rootBounds.top)
        ) {
          positionRelativeToPoint = PositionRelativeToPoint.ABOVE;
        } else if (
          touchScrollDirection === ScrollDirection.DOWN &&
          boundingClientRect.bottom > rootBounds.top &&
          Math.round(boundingClientRect.top) >= Math.round(rootBounds.top) &&
          boundingClientRect.bottom < rootBounds.bottom - 1
        ) {
          positionRelativeToPoint = PositionRelativeToPoint.BELOW;
        }

        if (positionRelativeToPoint) {
          observationPoint.intersectionCallback(
            target as HTMLElement,
            observationPoint,
            positionRelativeToPoint
          );
        }
      }
    });
  };
}

export const viewportTopObserver = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint
): IntersectionObserver => {
  const { displacement } = observationPoint;
  const compensatedDisplacement = shouldCompensateForDpr
    ? displacement * window.devicePixelRatio
    : displacement;
  const rootMargin = `0px 0px -${compensatedDisplacement}px 0px`;
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
  const compensatedDisplacement = shouldCompensateForDpr
    ? displacement * window.devicePixelRatio
    : displacement;
  const rootMargin = `${compensatedDisplacement}px 0px 0px 0px`;
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

export function setTouchScrollDirection(direction: ScrollDirection) {
  console.re.log(
    "[white]Scroll direction: " +
      (direction === ScrollDirection.UP ? "UP" : "DOWN") +
      "[/white]"
  );
  touchScrollDirection = direction;
}

////////////////////////////////////////////////////////////////////////////////

export function initializeObservers(
  root: HTMLDivElement,
  listRoot: HTMLDivElement,
  observationPoints: ObservationPoint[]
) {
  if (!scrollContainer) scrollContainer = root;
  if (!allObservationPoints) allObservationPoints = observationPoints;
  if (!listContainer) listContainer = listRoot;
  if (scrollContainer) {
    allObservationPoints.forEach(observationPoint => {
      const { reference } = observationPoint;
      if (reference === ScrollContainerCoordinateRef.TOP) {
        const intersectionObservers = viewportBottomObserver(
          scrollContainer,
          observationPoint
        );
        allIntersectionObservers.push(intersectionObservers);
      } else if (reference === ScrollContainerCoordinateRef.BOTTOM) {
        const intersectionObservers = viewportTopObserver(
          scrollContainer,
          observationPoint
        );
        allIntersectionObservers.push(intersectionObservers);
      }
    });
  }
}

export function observeChildrenOnIntersection() {
  allIntersectionObservers.forEach(intersectionObserver => {
    const children = listContainer.children;
    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        intersectionObserver.observe(children[i]);
      }
    }
  });
}

export function unobserveChildrenOnIntersection() {
  allIntersectionObservers.forEach(intersectionObserver => {
    intersectionObserver.disconnect();
  });
}

export function destroyIntersectionObservers() {
  unobserveChildrenOnIntersection();
  allIntersectionObservers = [];
}

export function reloadIntersectionObservers() {
  console.re.log("[white]==========Reload of intersection observers called============[/white]");
  destroyIntersectionObservers();

  initializeObservers(scrollContainer, listContainer, allObservationPoints);
  observeChildrenOnIntersection();
}

/////////////////////////////DPR Compensation////////////////////////////////////

function compensateForDpr(
  observationPoint: ObservationPoint,
  rootBounds: DOMRect | ClientRect
) {
  console.re.log("[white]==========Compensate for DPR called============[/white]");
  if(!shouldCompensateForDpr) {
    shouldCompensateForDpr = calculateShouldCompensateForDpr(observationPoint, rootBounds);
  }
  if(shouldCompensateForDpr) {
    requestAnimationFrame(reloadIntersectionObservers);
  }
}

function calculateShouldCompensateForDpr(
  observationPoint: ObservationPoint,
  rootBounds: DOMRect | ClientRect
): boolean {
  console.re.log("[white]==========Calculate ShouldCompensate for DPR called============[/white]");
  let localShouldCompensateForDpr = false;

  if (observationPoint.reference === ScrollContainerCoordinateRef.TOP) {
    const expectedTop = Math.round(observationPoint.displacement * -1);
    const actualTop = Math.round(rootBounds.top);
    if (expectedTop !== actualTop) localShouldCompensateForDpr = true;
  } else if (
    observationPoint.reference === ScrollContainerCoordinateRef.BOTTOM
  ) {
    const expectedBottom = Math.round(
      getScrollContainerHeight().height - observationPoint.displacement
    );
    const actualBottom = Math.round(rootBounds.bottom);
    if (expectedBottom !== actualBottom) localShouldCompensateForDpr = true;
  }

  return localShouldCompensateForDpr;
}


/////////////DPR Compensation////////////////////////

// memoize
let scrollContainerRect: DOMRect | ClientRect;
function getScrollContainerHeight(): DOMRect | ClientRect {
  if (!scrollContainerRect)
    scrollContainerRect = scrollContainer.getBoundingClientRect();
  return scrollContainerRect;
}

let reloadRaf: number | null = null;