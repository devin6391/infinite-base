import * as React from 'react';

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
    loadingComponent: JSX.Element;

    // Below props are supposed to change and update this component
    anchorElement: AnchorElement;
    children: JSX.Element[];
}

export default class InfiniteScrollBase extends React.Component<InfiniteScrollBaseProps>{
    private observationDirection: ObservationDirection;
    private observationPoints: ObservationPoint[];
    private loadingComponent: JSX.Element;
    private curentChildrenSet: Set<JSX.Element>;

    private updateTransition = {

    }

    constructor(props: InfiniteScrollBaseProps) {
        super(props);
        const {observationDirection, observationPoints, loadingComponent, children} = props;
        this.observationDirection = observationDirection;
        this.observationPoints = observationPoints;
        this.loadingComponent = loadingComponent;
        this.curentChildrenSet = new Set([...children]);
    }

    componentDidMount() {
        const {anchorElement} = this.props;
        const pivotKeySelector = anchorElement.elemSelector;
        if (pivotKeySelector) {
      const pivotElem = document.querySelector(pivotKeySelector) as HTMLElement;
    //   setTimeout(() => {
    //     if (this.scrollRef.current && this.listRef.current && pivotElem) {
    //       const listRefOffsetTop = this.listRef.current.offsetTop;
    //       const pivotElemOffsetTop = pivotElem.offsetTop;
    //       this.scrollRef.current.scrollTop =
    //         listRefOffsetTop + pivotElemOffsetTop;
    //     }
    //   }, 0);
        }
    }

    shouldComponentUpdate(newProps: InfiniteScrollBaseProps) {
        const {children: newChildren, anchorElement: newAnchorElem} = newProps;

        // Detect if new children data is different from previous
        let childrenChanged = newChildren.length !== this.curentChildrenSet.size;
        let newChildIndex = 0;
        while(!childrenChanged) {
            childrenChanged = !this.curentChildrenSet.has(newChildren[newChildIndex]);
            if(newChildIndex >= this.curentChildrenSet.size - 1) {
                break;
            }
        }

        // Detect if new anchor element is different from previous ancor element
        let anchorElemChanged = newAnchorElem !== this.props.anchorElement;

        return childrenChanged || anchorElemChanged;
    }
}