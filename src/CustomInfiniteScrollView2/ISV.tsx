import * as React from "react";
import {
  AnchorElement,
  ObservationPoint,
  PointIntersectionCallback,
  PositionRelativeToPoint
} from "../InfiniteScrollBase/utils";
import {
  InfiniteScrollBase,
  ScrollContainerCoordinateRef
} from "../InfiniteScrollBase";
import "../CustomInfiniteScrollView1/InfiniteScrollView.css";
import { Loader } from "../CustomInfiniteScrollView1/InfiniteScrollView";

interface NewConsole extends Console {
  re: any;
}
declare var console: NewConsole;
export interface ISVState {
  data: number[];
  anchorElement: AnchorElement;
}

export default class ISV extends React.Component<{}, ISVState> {
  private observationPoint: ObservationPoint;
  constructor(props: {}) {
    super(props);
    this.observationPoint = {
      reference: ScrollContainerCoordinateRef.BOTTOM,
      displacement: 100,
      intersectionCallback: this.intersectionCallback
    };
    try {
      const locationQueryString = window.location.search.substr(1);
      const singleQueryStringArr = locationQueryString.split("&");
      const reference =
        singleQueryStringArr[0].split("=")[1] === "top"
          ? ScrollContainerCoordinateRef.TOP
          : ScrollContainerCoordinateRef.BOTTOM;
      const displacement = +singleQueryStringArr[1].split("=")[1];
      this.observationPoint.reference = reference;
      this.observationPoint.displacement = displacement;
    } catch (e) {
      console.re.error(
        "You can pass reference and displacement in url query param as '?reference=top&displacement=-40'"
      );
    }
    this.state = {
      data: initialData,
      anchorElement: {
        elemSelector: `div[data-val="${initialData[3]}"]`
      }
    };
  }

  private intersectionCallback: PointIntersectionCallback = (
    elem: HTMLElement,
    observationPoint: ObservationPoint,
    positionRelativeToPoint: PositionRelativeToPoint
  ) => {
    console.re.log("");
    console.re.log("");
    console.re.log("[red]==========LOG Boundary Start==========[/red]");
    if (positionRelativeToPoint === PositionRelativeToPoint.ABOVE) {
      this.elementAbovePoint(elem, observationPoint);
    } else if (positionRelativeToPoint === PositionRelativeToPoint.BELOW) {
      this.elementBelowPoint(elem, observationPoint);
    }
    console.re.log("[red]==========LOG Boundary End==========[/red]");
    console.re.log("");
    console.re.log("");
  };

  render() {
    let intersectionPointStyle = {};
    if (this.observationPoint.reference === ScrollContainerCoordinateRef.TOP) {
      intersectionPointStyle = { top: this.observationPoint.displacement * -1 };
    } else {
      intersectionPointStyle = { bottom: this.observationPoint.displacement };
    }
    return (
      <div className="viewContainer">
        <div className="intersectionPoint" style={intersectionPointStyle} />
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

  private elementAbovePoint = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPoint) {
      console.re.info(
        "[yellow]=====Reporting: Element just above=====[/yellow]"
      );
      console.re.log(elem);
    }
  };

  private elementBelowPoint = (
    elem: HTMLElement,
    observationPoint: ObservationPoint
  ) => {
    if (observationPoint === this.observationPoint) {
      console.re.info(
        "[blue]=====Reporting: Element just above=====[/blue]"
      );
      console.re.log(elem);
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
