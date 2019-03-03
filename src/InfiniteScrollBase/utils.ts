// Assume reference coordinate is center and has value of (0,0)
// Anything right or top is Positive and anything left or bottom is negative
export enum ScrollContainerCoordinateRef {
  TOP = 1,
  BOTTOM
}

export type ScrollIntersectionCallback = (
  elem: HTMLElement,
  observationPoint: ObservationPoint,
  scrollDirection: ScrollDirection
) => void;

export interface ObservationPoint {
  reference: ScrollContainerCoordinateRef;
  displacement: number;
  intersectionCallback?: ScrollIntersectionCallback;
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

////////////////////////////////////////////////////////////////////

function createViewportTopObserverCallback(observationPoint: ObservationPoint) {
  return function viewportTopObserverCallback(
    entries: IntersectionObserverEntry[]
  ) {
    entries.forEach(entry => {
      const { target, rootBounds, intersectionRect } = entry;
      if (
        observationPoint.intersectionCallback &&
        intersectionRect.bottom === rootBounds.bottom
      ) {
        observationPoint.intersectionCallback(
          target as HTMLElement,
          observationPoint,
          touchScrollDirection
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
      const { target, rootBounds, intersectionRect } = entry;
      if (
        observationPoint.intersectionCallback &&
        intersectionRect.top === rootBounds.top
      ) {
        observationPoint.intersectionCallback(
          target as HTMLElement,
          observationPoint,
          touchScrollDirection
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
    threshold: [0.01, 1]
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
    threshold: [0.01, 1]
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
  touchScrollDirection = direction;
}
