let dprObservable: IntersectionObserver | null = null;
let expectedRootTop = 10;
const compensateDprEventName = "compensateDpr";

function createDprObservable() {
  dprObservable = new IntersectionObserver(dprObserver, {
    rootMargin: `-${expectedRootTop}px 0px 0px 0px`
  });
}

function observeDprObservable(elem: HTMLDivElement) {
  dprObservable && dprObservable.observe(elem);
}

function destroyDprObservable() {
  dprObservable && dprObservable.disconnect();
  dprObservable = null;
}

function dprObserver(entries: IntersectionObserverEntry[]) {
  entries.forEach(entry => {
    const { rootBounds } = entry;
    const actualRootTop = rootBounds.top;
    const dprBugExist = expectedRootTop / actualRootTop;
    const compensateDprPromiseEvent = new CustomEvent("compensateDpr", {
      detail: dprBugExist
    });
    document.dispatchEvent(compensateDprPromiseEvent);
  });
}

function compensateDprEventListener(): Promise<number> {
  return new Promise(resolve => {
    document.addEventListener(
      compensateDprEventName,
      (event: CustomEventInit<number>) => {
        destroyDprObservable();
        resolve(event.detail);
      }
    );
  });
}

export async function compensateDprPromise(
  elem: HTMLDivElement
): Promise<number> {
  const promise = compensateDprEventListener();
  createDprObservable();
  observeDprObservable(elem);
  return await promise;
}
