import * as React from "react";
import throttle from "lodash.throttle";
import debounce from "lodash.debounce";
import "./InfiniteScrollBase.css";

// Assume reference coordinate is center and has value of (0,0)
// Anything right or top is Positive and anything left or bottom is negative
export enum ScrollContainerCoordinateRef {
  TOP = 1,
  BOTTOM
}

export enum ScrollDirection {
  UP = 1,
  DOWN
}

export type ScrollIntersectionCallback = (elem: HTMLElement, observationPoint: ObservationPoint, scrollDirection: ScrollDirection) => void;

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

export interface InfiniteScrollBaseProps {
  // Below props are supposed to be provided initially and then they should not change
  observationPoints: ObservationPoint[];
  loadingComponentTop: JSX.Element;
  loadingComponentBottom: JSX.Element;

  // Below props are supposed to change and update this component
  anchorElement: AnchorElement;
  children: JSX.Element[];

  // DOM event handlers
  onScroll?: (direction: ScrollDirection) => void;
  onscrollEnd?: (direction: ScrollDirection) => void;
  onTouch?: (direction: ScrollDirection) => void;
}

export default class InfiniteScrollBase extends React.Component<
  InfiniteScrollBaseProps
> {
  private curentChildrenSet = new Set<JSX.Element>();
  private scrollRef = React.createRef<HTMLDivElement>();
  private listRef = React.createRef<HTMLDivElement>();

  /**
   * This element is used to set anchor element which whould be resetted to specified position(or same as before position)
   */
  private updateTransitionElem: AnchorElement | null = null;

  private touchPositionY = 0;
  private disableScrollHandler = false;
  private touchScrollDirection = ScrollDirection.UP;

  private scrollContainerRect: ClientRect | DOMRect | null = null;

  private allIntersectionObservers: IntersectionObserver[] = [];

  constructor(props: InfiniteScrollBaseProps) {
    super(props);
  }

  componentDidMount() {
    const { anchorElement, children } = this.props;

    // Set the children set
    this.curentChildrenSet = new Set([...children]);

    // set the scroll container dimensions
    this.scrollContainerRect =
      this.scrollRef.current && this.scrollRef.current.getBoundingClientRect();

    // Positioning anchor element
    const {
      elemSelector: anchorKeySelector,
      observationPoint: anchorRefPoint
    } = anchorElement;
    if (anchorKeySelector) {
      this.initialScrollTopSet(anchorKeySelector, anchorRefPoint);
    }

    this.initializeObservers();
    this.observeChildrenOnIntersection();
  }

  shouldComponentUpdate(newProps: InfiniteScrollBaseProps) {
    const { children: newChildren, anchorElement: newAnchorElem } = newProps;

    // Detect if new children data is different from previous
    let childrenChanged = newChildren.length !== this.curentChildrenSet.size;
    let newChildIndex = 0;
    while (!childrenChanged) {
      childrenChanged = !this.curentChildrenSet.has(newChildren[newChildIndex]);
      if (newChildIndex >= this.curentChildrenSet.size - 1) {
        break;
      }
    }

    // Detect if new anchor element is different from previous ancor element
    let anchorElemChanged = newAnchorElem !== this.props.anchorElement;

    if (!(childrenChanged || anchorElemChanged)) {
      return false;
    }

    // Unobserve intersections
    this.unobserveChildrenOnIntersection();

    // Set anchor element for updation
    if (newAnchorElem.observationPoint) {
      this.updateTransitionElem = newAnchorElem;
    } else {
      const displacement = this.getDisplacementToSetOnSamePosition(
        newAnchorElem.elemSelector
      );
      this.updateTransitionElem = {
        elemSelector: newAnchorElem.elemSelector,
        observationPoint: {
          displacement,
          reference: ScrollContainerCoordinateRef.TOP
        }
      };
    }

    return true;
  }

  componentDidUpdate() {
    if (
      this.updateTransitionElem &&
      this.updateTransitionElem.observationPoint
    ) {
      const { elemSelector, observationPoint } = this.updateTransitionElem;
      this.setScrollTopWithElemAtPoint(elemSelector, observationPoint);
      this.updateTransitionElem = null;
    }
    this.observeChildrenOnIntersection();
  }

  render() {
    const {
      loadingComponentTop,
      loadingComponentBottom,
      children
    } = this.props;
    return (
      <div
        ref={this.scrollRef}
        className="infiniteScrollContainer"
        onScroll={this.throttleScroll}
        onTouchStart={this.touchStartHandler}
        onTouchMove={this.touchMoveHandler}
      >
        {loadingComponentTop && (
          <div className="loadingComponentTop">{loadingComponentTop}</div>
        )}
        <div ref={this.listRef} className="listContainer">
          {children}
        </div>
        {loadingComponentBottom && (
          <div className="loadingComponentBottom">{loadingComponentBottom}</div>
        )}
      </div>
    );
  }

  // =========DOM event handlers===========

  private touchStartHandler = (evt: React.SyntheticEvent<EventTarget>) => {
    const nativeEvent = evt.nativeEvent as TouchEvent;
    const touchPosition = nativeEvent.touches[0];
    this.touchPositionY = touchPosition.pageY;
  };

  private touchMoveHandler = (evt: React.SyntheticEvent<EventTarget>) => {
    const nativeEvent = evt.nativeEvent as TouchEvent;
    const touchPosition = nativeEvent.touches[0];
    const touchDirection =
      touchPosition.pageY - this.touchPositionY > 0
        ? ScrollDirection.DOWN
        : ScrollDirection.UP;
    this.touchScrollDirection = touchDirection;
  };

  private scrollHandler = () => {
    const { onScroll } = this.props;
    if (this.disableScrollHandler) {
      return;
    }
    this.debouncedScroll();
    onScroll && onScroll(this.touchScrollDirection);
  };

  private scrollEnd = () => {
    const { onscrollEnd } = this.props;
    if (this.disableScrollHandler) {
      return;
    }
    onscrollEnd && onscrollEnd(this.touchScrollDirection);
  };

  private throttleScroll = throttle(this.scrollHandler, 50);
  private debouncedScroll = debounce(this.scrollEnd, 100);

  // =========Scroll resetting realated methods===========

  private initialScrollTopSet = (
    anchorKeySelector: string,
    anchorRefPoint?: ObservationPoint
  ) => {
    const anchorElem = document.querySelector(anchorKeySelector) as HTMLElement;
    if (this.scrollRef.current && this.listRef.current && anchorElem) {
      if (!anchorRefPoint) {
        this.setScrollTopWithElemAtTop(anchorKeySelector);
      } else {
        this.setScrollTopWithElemAtPoint(anchorKeySelector, anchorRefPoint);
      }
    }
  };

  private setScrollTopWithElemAtTop = (anchorKeySelector: string) => {
    if (this.scrollRef.current) {
      const anchorElem = document.querySelector(
        anchorKeySelector
      ) as HTMLElement;
      const listRefOffsetTop = this.listRef.current
        ? this.listRef.current.offsetTop
        : 0; // Distance of list from scroll container
      const anchorElemOffsetTop = anchorElem.offsetTop; // Distance of elem from list

      const anchorElemScrollTopFromTop = listRefOffsetTop + anchorElemOffsetTop;
      this.scrollRef.current.scrollTop = anchorElemScrollTopFromTop;
    }
  };

  private setScrollTopWithElemAtPoint = (
    anchorKeySelector: string,
    anchorRefPoint: ObservationPoint
  ) => {
    const anchorElem = document.querySelector(anchorKeySelector) as HTMLElement;
    const listRefOffsetTop = this.listRef.current
      ? this.listRef.current.offsetTop
      : 0; // Distance of list from scroll container
    const anchorElemOffsetTop = anchorElem.offsetTop; // Distance of elem from list

    const anchorElemScrollTopFromTop = listRefOffsetTop + anchorElemOffsetTop;
    if (this.scrollRef.current) {
      switch (anchorRefPoint.reference) {
        case ScrollContainerCoordinateRef.TOP:
          this.scrollRef.current.scrollTop =
            anchorElemScrollTopFromTop + anchorRefPoint.displacement;
          break;
        case ScrollContainerCoordinateRef.BOTTOM:
          const anchorElemScrollTopFromBottom =
            anchorElemScrollTopFromTop -
            (this.scrollContainerRect ? this.scrollContainerRect.height : 0);
          this.scrollRef.current.scrollTop =
            anchorElemScrollTopFromBottom + anchorRefPoint.displacement;
          break;
        default:
          this.scrollRef.current.scrollTop = anchorElemScrollTopFromTop;
      }
    }
  };

  private getDisplacementToSetOnSamePosition = (
    anchorElemSelector: string
  ): number => {
    const anchorElem = document.querySelector(
      anchorElemSelector
    ) as HTMLElement;
    const anchorElemOffsetTop = anchorElem.offsetTop;
    const listOffsetTop = this.listRef.current
      ? this.listRef.current.offsetTop
      : 0;
    const scrollTop = this.scrollRef.current
      ? this.scrollRef.current.scrollTop
      : 0;
    return scrollTop - (anchorElemOffsetTop + listOffsetTop);
  };

  // =========Intersection observer realated methods===========

  private initializeObservers = () => {
    const root = this.scrollRef.current;
    if (root) {
      this.props.observationPoints.forEach(observationPoint => {
        const scrollContainerHeight = this.scrollContainerRect
          ? this.scrollContainerRect.height
          : 0;
        let rootMarginTop = 0;
        let rootMarginBottom = 0;
        if (observationPoint.reference === ScrollContainerCoordinateRef.TOP) {
          rootMarginTop = observationPoint.displacement;
          rootMarginBottom = (scrollContainerHeight + rootMarginTop - 1) * -1;
        } else if (
          observationPoint.reference === ScrollContainerCoordinateRef.BOTTOM
        ) {
          rootMarginBottom = observationPoint.displacement * -1;
          rootMarginTop = (scrollContainerHeight + rootMarginBottom - 1) * -1;
        }
        const rootMargin = `${rootMarginTop}px 0px ${rootMarginBottom}px 0px`;
        const intersectionObserverOptions = {
          root,
          rootMargin,
          threshold: 0
        };

        const intersectionObserver = new IntersectionObserver(
            this.createIntersectionCallback(observationPoint),
          intersectionObserverOptions
        );

        this.allIntersectionObservers.push(intersectionObserver);
      });
    }
  };

  private createIntersectionCallback = (observationPoint: ObservationPoint): IntersectionObserverCallback => {
      const intersectionObserverCallback = (
        entries: IntersectionObserverEntry[]
      ) => {
        entries.forEach(entry => {
          if (
            observationPoint.intersectionCallback && entry.isIntersecting
          ) {
            observationPoint.intersectionCallback(
              entry.target as HTMLElement,
              observationPoint,
              this.touchScrollDirection
            );
          }
        });
      };
      return intersectionObserverCallback;
  }

  private observeChildrenOnIntersection = () => {
    this.allIntersectionObservers.forEach(intersectionObserver => {
      const children = this.listRef.current && this.listRef.current.children;
      if (children && children.length > 0) {
        for (let i = 0; i < children.length; i++) {
          intersectionObserver.observe(children[i]);
        }
      }
    });
  };

  private unobserveChildrenOnIntersection = () => {
    this.allIntersectionObservers.forEach(intersectionObserver => {
      intersectionObserver.disconnect();
    });
  };
}
