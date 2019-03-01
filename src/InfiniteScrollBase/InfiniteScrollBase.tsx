import * as React from "react";
import throttle from "lodash.throttle";
import debounce from "lodash.debounce";
import "./InfiniteScrollBase.css";
import {
  ObservationPoint,
  AnchorElement,
  ScrollDirection,
  ScrollContainerCoordinateRef,
  inViewPortObservationFromTop,
  inViewPortObservationFromBottom,
  outViewportTopObservationFromBottom,
  outViewportBottomObservationFromTop,
  inViewPortObservers,
  outViewportTopObserver,
  outViewportBottomObserver,
  setTouchScrollDirection
} from "./utils";

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

    // Positioning anchor element
    setTimeout(() => {
        // set the scroll container dimensions
            this.scrollContainerRect =
            this.scrollRef.current && this.scrollRef.current.getBoundingClientRect();
        const {
            elemSelector: anchorKeySelector,
            observationPoint: anchorRefPoint
          } = anchorElement;
          if (anchorKeySelector) {
            this.initialScrollTopSet(anchorKeySelector, anchorRefPoint);
          }
      
          this.initializeObservers();
          this.observeChildrenOnIntersection();
    }, 0);
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
    setTouchScrollDirection(touchDirection);
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
    const scrollContainerHeight = this.scrollContainerRect
      ? this.scrollContainerRect.height
      : 0;
    if (root) {
      this.props.observationPoints.forEach(observationPoint => {
        const { reference, displacement } = observationPoint;
        const distance = Math.abs(displacement);
        if (
          (reference === ScrollContainerCoordinateRef.TOP &&
            displacement < 0) ||
          (reference === ScrollContainerCoordinateRef.BOTTOM &&
            displacement > 0)
        ) {
          const intersectionObservers = inViewPortObservers(
            root,
            observationPoint,
            scrollContainerHeight
          );
          intersectionObservers.forEach(obs =>
            this.allIntersectionObservers.push(obs)
          );
        } else if (
          reference === ScrollContainerCoordinateRef.TOP &&
          displacement >= 0
        ) {
          const intersectionObserver = outViewportTopObserver(
            root,
            observationPoint
          );
          this.allIntersectionObservers.push(intersectionObserver);
        } else if (
          reference === ScrollContainerCoordinateRef.BOTTOM &&
          displacement <= 0
        ) {
          const intersectionObserver = outViewportBottomObserver(
            root,
            observationPoint
          );
          this.allIntersectionObservers.push(intersectionObserver);
        }
      });
    }
  };

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
