import * as React from "react";
import {
  getInitialData,
  addDataAtBottom,
  addMultipleDataInMiddle,
  addSingleDataInMiddle,
  adddDataAtTop,
  removeDataFromBottom,
  removeDataFromTop,
  removeMultipleDataInMiddle,
  removeSingleDataInMiddle
} from "./dataService";

import InfiniteScrollBase, {
  ObservationPoint,
  AnchorElement,
  ScrollContainerCoordinateRef,
  ScrollIntersectionCallback,
  ScrollDirection
} from "../InfiniteScrollBase/InfiniteScrollBase";

import './InfiniteScrollView.css';

export interface InfiniteScrollViewState {
  data: number[];
  anchorElement: AnchorElement;
}

export default class InfiniteScrollView extends React.Component<
  {},
  InfiniteScrollViewState
> {
  private topMostElem: HTMLElement | null = null;
  private bottomMostElem: HTMLElement | null = null;

  state = {
    data: [],
    anchorElement: {
      elemSelector: ""
    }
  };

  componentDidMount() {
    getInitialData().then(data => {
        const elemSelector = `div[data-val="${data[3]}"]`;
        const anchorElement = {elemSelector};
        this.setState({data, anchorElement});
    });
  }

  render() {
    return (
      <div className="viewContainer">
      {
          this.state.data.length > 0 ? (
            <InfiniteScrollBase
            observationPoints={this.observationPoints}
            loadingComponentTop={<Loader />}
            loadingComponentBottom={<Loader />}
            anchorElement={this.state.anchorElement}
          >
            {this.state.data.map(val => (
              <div className="singleElement" key={val} data-val={val}>
                <span>{val}</span>
              </div>
            ))}
          </InfiniteScrollBase>
          ) : null
      }
      </div>
    );
  }

  private intersectionCallback: ScrollIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint,
    scrollDirection: ScrollDirection
  ) => {
    if (scrollDirection === ScrollDirection.UP) {
      this.scrollUpIntersectionCallback(elem, observationPoint);
    } else if (scrollDirection === ScrollDirection.DOWN) {
      this.scrollDownIntersectionCallback(elem, observationPoint);
    }
    this.allTriggers();
  };

  private scrollUpIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPointNearTop) {
      this.elementsAboveTop.add(elem);
      this.topMostElem = elem;
    } else if (observationPoint === this.observationPointFarTop) {
      this.elementsAboveTop.delete(elem);
    } else if (observationPoint === this.observationPointNearBottom) {
      this.elementsBelowBottom.delete(elem);
      this.bottomMostElem = elem;
    } else if (observationPoint === this.observationPointFarBottom) {
      this.elementsBelowBottom.add(elem);
    }
  };

  private scrollDownIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPointNearTop) {
      this.elementsAboveTop.delete(elem);
      this.topMostElem = elem;
    } else if (observationPoint === this.observationPointFarTop) {
      this.elementsAboveTop.add(elem);
    } else if (observationPoint === this.observationPointNearBottom) {
      this.elementsBelowBottom.add(elem);
      this.bottomMostElem = elem;
    } else if (observationPoint === this.observationPointFarBottom) {
      this.elementsBelowBottom.delete(elem);
    }
  };

  private observationPointNearTop: ObservationPoint = {
    reference: ScrollContainerCoordinateRef.TOP,
    displacement: -10,
    intersectionCallback: this.intersectionCallback
  };

  private observationPointFarTop: ObservationPoint = {
    reference: ScrollContainerCoordinateRef.TOP,
    displacement: 3000,
    intersectionCallback: this.intersectionCallback
  };

  private observationPointNearBottom: ObservationPoint = {
    reference: ScrollContainerCoordinateRef.BOTTOM,
    displacement: 10,
    intersectionCallback: this.intersectionCallback
  };

  private observationPointFarBottom: ObservationPoint = {
    reference: ScrollContainerCoordinateRef.BOTTOM,
    displacement: -3000,
    intersectionCallback: this.intersectionCallback
  };

  private elementsAboveTop = new Set<HTMLElement>();
  private elementsBelowBottom = new Set<HTMLElement>();

  private get observationPoints(): ObservationPoint[] {
    return [
      this.observationPointNearTop,
      this.observationPointFarTop,
      this.observationPointNearBottom,
      this.observationPointFarBottom
    ];
  }

  private allTriggers() {
      console.log("Top-most element: ", this.topMostElem);
      console.log("Bottom-most element: ", this.bottomMostElem);
      console.log("Elements above top of container: ", this.elementsAboveTop);
      console.log("Elements below bottom of container: ", this.elementsBelowBottom);
  }
}

function Loader() {
  return <div className="loader">Loading...</div>;
}
