import * as React from "react";
import throttle from "lodash.throttle";
import debounce from "lodash.debounce";

// Assume reference coordinate is center and has value of (0,0)
// Anything right or top is Positive and anything left or bottom is negative
export enum ScrollContainerCoordinateRef {
  TOP = 1,
  BOTTOM,
  LEFT,
  RIGHT
}

export enum ObservationDirection {
  HORIZONTAL = 1,
  VERTICAL
}

export enum ScrollDirection {
  UP = 1,
  DOWN
}

export interface ObservationPoint {
  reference: ScrollContainerCoordinateRef;
  displacement: number;
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
  observationDirection: ObservationDirection;
  observationPoints: ObservationPoint[];
  loadingComponentTop: JSX.Element;
  loadingComponentBottom: JSX.Element;

  // Below props are supposed to change and update this component
  anchorElement: AnchorElement;
  children: JSX.Element[];

  // Scroll related events
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

  private updateTransition = {};

  private touchPositionY = 0;
  private disableScrollHandler = false;
  private touchScrollDirection = ScrollDirection.UP;

  private scrollContainerRect: ClientRect | DOMRect | null = null;

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
      const anchorElem = document.querySelector(
        anchorKeySelector
      ) as HTMLElement;
      setTimeout(() => {
        if (this.scrollRef.current && this.listRef.current && anchorElem) {
          const listRefOffsetTop = this.listRef.current.offsetTop;
          const anchorElemOffsetTop = anchorElem.offsetTop;
          this.scrollRef.current.scrollTop =
            listRefOffsetTop + anchorElemOffsetTop;
        }
      }, 0);
    }
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

    return childrenChanged || anchorElemChanged;
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
}
