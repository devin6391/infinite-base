import * as React from "react";
import {
  AnchorElement,
  ObservationPoint,
  ScrollIntersectionCallback
} from "../InfiniteScrollBase/utils";
import {
  InfiniteScrollBase,
  ScrollContainerCoordinateRef,
  ScrollDirection
} from "../InfiniteScrollBase";
import "../CustomInfiniteScrollView1/InfiniteScrollView.css";
import { Loader } from "../CustomInfiniteScrollView1/InfiniteScrollView";

export interface ISVState {
  data: number[];
  anchorElement: AnchorElement;
}

export default class ISV extends React.Component<{}, ISVState> {
  state = {
    data: initialData,
    anchorElement: {
      elemSelector: `div[data-val="${initialData[3]}"]`
    }
  };

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
  };

  private observationPoint: ObservationPoint = {
    reference: ScrollContainerCoordinateRef.TOP,
    displacement: -105,
    intersectionCallback: this.intersectionCallback
  };

  render() {
    return (
      <div className="viewContainer">
        {this.state.data.length > 0 ? (
          <InfiniteScrollBase
            observationPoints={[this.observationPoint]}
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
        ) : null}
      </div>
    );
  }

  private scrollUpIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPoint) {
      console.log("=====Intersecting upwards=====");
      console.log(elem);
    }
  };

  private scrollDownIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPoint) {
        console.log("=====Intersecting downwards=====");
        console.log(elem);
    }
  };
}

const initialData = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];
