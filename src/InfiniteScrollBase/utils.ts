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

export const inViewPortObservationFromTop = (
  observationPoint: ObservationPoint
): IntersectionObserverCallback => {
  const inViewPortObservationFromTopCallback = (
    entries: IntersectionObserverEntry[]
  ) => {
    entries.forEach(entry => {
      if (
        observationPoint.intersectionCallback &&
        entry.isIntersecting &&
        touchScrollDirection === ScrollDirection.UP
      ) {
        observationPoint.intersectionCallback(
          entry.target as HTMLElement,
          observationPoint,
          touchScrollDirection
        );
      }
    });
  };
  return inViewPortObservationFromTopCallback;
};

export const inViewPortObservationFromBottom = (
  observationPoint: ObservationPoint
): IntersectionObserverCallback => {
  const inViewPortObservationFromTopCallback = (
    entries: IntersectionObserverEntry[]
  ) => {
    entries.forEach(entry => {
      if (
        observationPoint.intersectionCallback &&
        entry.isIntersecting &&
        touchScrollDirection === ScrollDirection.DOWN
      ) {
        observationPoint.intersectionCallback(
          entry.target as HTMLElement,
          observationPoint,
          touchScrollDirection
        );
      }
    });
  };
  return inViewPortObservationFromTopCallback;
};

export const outViewportTopObservationFromBottom = (
  observationPoint: ObservationPoint
): IntersectionObserverCallback => {
  const inViewPortObservationFromTopCallback = (
    entries: IntersectionObserverEntry[]
  ) => {
    entries.forEach(entry => {
      const {
        rootBounds,
        intersectionRect,
        isIntersecting,
        target,
        intersectionRatio
      } = entry;
      const isIntersectingMoreThan50Percent =
        Math.round(intersectionRatio * 100) > 50;
      if (
        observationPoint.intersectionCallback &&
        (rootBounds.top >= intersectionRect.top || intersectionRect.top === 0) &&
        isIntersecting
      ) {
        if (
          (touchScrollDirection === ScrollDirection.DOWN &&
            !isIntersectingMoreThan50Percent) ||
          (touchScrollDirection === ScrollDirection.UP &&
            isIntersectingMoreThan50Percent)
        ) {
          observationPoint.intersectionCallback(
            target as HTMLElement,
            observationPoint,
            touchScrollDirection
          );
        }
      }
    });
  };
  return inViewPortObservationFromTopCallback;
};

export const outViewportBottomObservationFromTop = (
  observationPoint: ObservationPoint
): IntersectionObserverCallback => {
  const inViewPortObservationFromTopCallback = (
    entries: IntersectionObserverEntry[]
  ) => {
    entries.forEach(entry => {
      const {
        rootBounds,
        intersectionRect,
        isIntersecting,
        target,
        intersectionRatio
      } = entry;
      const isIntersectingMoreThan50Percent =
        Math.round(intersectionRatio * 100) > 50;
      if (
        observationPoint.intersectionCallback &&
        intersectionRect.bottom >= rootBounds.bottom &&
        isIntersecting
      ) {
        if (
          (touchScrollDirection === ScrollDirection.DOWN &&
            isIntersectingMoreThan50Percent) ||
          (touchScrollDirection === ScrollDirection.UP &&
            !isIntersectingMoreThan50Percent)
        ) {
          observationPoint.intersectionCallback(
            target as HTMLElement,
            observationPoint,
            touchScrollDirection
          );
        }
      }
    });
  };
  return inViewPortObservationFromTopCallback;
};

export const inViewPortObservers = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint,
  scrollContainerHeight: number
): IntersectionObserver[] => {
  const allIntersectionObservers: IntersectionObserver[] = [];
  const { reference, displacement } = observationPoint;
  const distance = Math.abs(displacement);
  const distanceFromTop =
    reference === ScrollContainerCoordinateRef.BOTTOM
      ? scrollContainerHeight - distance
      : distance;

  // TOP intersection observer
  const rootMarginBottom1 = (scrollContainerHeight - distanceFromTop) * -1;
  const rootMargin1 = `0px 0px ${rootMarginBottom1}px 0px`;
  const intersectionObserverOptions1 = {
    root,
    rootMargin: rootMargin1,
    threshold: 0
  };
  const intersectionObserver1 = new IntersectionObserver(
    inViewPortObservationFromTop(observationPoint),
    intersectionObserverOptions1
  );
  allIntersectionObservers.push(intersectionObserver1);

  // Bottom intersection observer
  const rootMarginTop2 = distanceFromTop * -1;
  const rootMargin2 = `${rootMarginTop2}px 0px 0px 0px`;
  const intersectionObserverOptions2 = {
    root,
    rootMargin: rootMargin2,
    threshold: 0
  };
  const intersectionObserver2 = new IntersectionObserver(
    inViewPortObservationFromBottom(observationPoint),
    intersectionObserverOptions2
  );
  allIntersectionObservers.push(intersectionObserver2);

  return allIntersectionObservers;
};

export const outViewportTopObserver = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint
): IntersectionObserver => {
  const { displacement } = observationPoint;
  const distance = Math.abs(displacement);
  const rootMargin = `${distance}px 0px 0px 0px`;
  const intersectionObserverOptions = {
    root,
    rootMargin,
    threshold: [0, 1]
  };
  const intersectionObserver = new IntersectionObserver(
    outViewportTopObservationFromBottom(observationPoint),
    intersectionObserverOptions
  );
  return intersectionObserver;
};

export const outViewportBottomObserver = (
  root: HTMLDivElement,
  observationPoint: ObservationPoint
): IntersectionObserver => {
  const { displacement } = observationPoint;
  const distance = Math.abs(displacement);
  const rootMargin = `0px 0px ${distance}px 0px`;
  const intersectionObserverOptions = {
    root,
    rootMargin,
    threshold: [0, 1]
  };
  const intersectionObserver = new IntersectionObserver(
    outViewportBottomObservationFromTop(observationPoint),
    intersectionObserverOptions
  );
  return intersectionObserver;
};

let touchScrollDirection = ScrollDirection.UP;

export function setTouchScrollDirection(direction: ScrollDirection) {
  touchScrollDirection = direction;
}
