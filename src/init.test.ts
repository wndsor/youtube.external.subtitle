import DIC, { Youtube } from './dic';
import init, {
  iframeApiScriptAdded,
  addIframeApiScript,
  grantIframeApiScript,
  iframeApiLoaded,
  waitFor,
  onIframeApiReady
} from './init';

const arrayToHTMLCollection = (array: any): HTMLCollectionOf<Element> => {
  return array as HTMLCollectionOf<Element>;
};

test('iframeApiScriptAdded returns the correct result', () => {
  const getDocument = (addIframeApi: boolean): Partial<Document> => {
    return {
      getElementsByTagName: (): HTMLCollectionOf<any> => {
        const scripts = [
          { src: 'https://www.youtube.com/fake_script_file.js' }
        ];

        if (addIframeApi) {
          scripts.push({ src: 'https://www.youtube.com/iframe_api' });
        }

        return arrayToHTMLCollection(scripts);
      }
    };
  };

  expect(iframeApiScriptAdded(getDocument(false) as Document)).toBe(false);

  expect(iframeApiScriptAdded(getDocument(true) as Document)).toBe(true);
});

test('addIframeApiScript adds the iframe api script', () => {
  const insertHandler = jest.fn();
  const element = {} as HTMLElement;
  const firstScript = {
    parentNode: {
      insertBefore: insertHandler
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document = {
    getElementsByTagName: (): HTMLCollectionOf<any> => {
      return arrayToHTMLCollection([ firstScript ]);
    },
    createElement: (): HTMLElement => {
      return element;
    }
  } as Partial<Document>;

  addIframeApiScript(document as Document);

  expect(insertHandler).toHaveBeenCalledWith(element, firstScript);
});

test('grantIframeApiScript adds the iframe api script if needed', () => {
  const getDocument = (firstScript: HTMLScriptElement, element: HTMLElement, addIframeApi: boolean): Partial<Document> => {
    return {
      getElementsByTagName: (): HTMLCollectionOf<any> => {
        const result = [ firstScript ];

        if (addIframeApi) {
          const iframeApiScript = {
            src: 'https://www.youtube.com/iframe_api'
          } as Partial<HTMLScriptElement>;

          result.push(iframeApiScript as HTMLScriptElement);
        }

        return arrayToHTMLCollection(result);
      },
      createElement: (): HTMLElement => {
        return element;
      }
    };
  };

  const element = {};
  const firstScript = {
    parentNode: {
      insertBefore: jest.fn()
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document = getDocument(firstScript as HTMLScriptElement, element as HTMLElement, false);

  grantIframeApiScript(document as Document);

  expect(firstScript.parentNode.insertBefore).toHaveBeenCalledWith(element, firstScript);

  const element2 = {};
  const firstScript2 = {
    parentNode: {
      insertBefore: jest.fn()
    } as Partial<ParentNode & Node>
  } as Partial<HTMLScriptElement>;

  const document2 = getDocument(firstScript2 as HTMLScriptElement, element2 as HTMLElement, true);

  grantIframeApiScript(document2 as Document);

  expect(firstScript2.parentNode.insertBefore).not.toHaveBeenCalled();
});

test('iframeApiLoaded returns the correct result', () => {
  expect(iframeApiLoaded({} as Window)).toBe(false);

  expect(iframeApiLoaded({
    YT: {}
  } as Window)).toBe(false);

  expect(iframeApiLoaded({
    YT: { Player: {} }
  } as Window)).toBe(true);
});

jest.useFakeTimers();

test('waitFor calls the onComplete when isReady is true', () => {
  const onComplete = jest.fn();

  waitFor(() => { return true; }, onComplete);

  expect(onComplete).toHaveBeenCalled();

  const onComplete2 = jest.fn();
  let counter = 0;

  waitFor(() => {
    return counter++ > 9;
  }, onComplete2);

  expect(onComplete2).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1000);

  expect(onComplete2).toHaveBeenCalled();
});

test('onIframeApiReady calls the callback when the Youtube Api is available', () => {
  const callback1 = jest.fn();
  const YT1 = {};

  DIC.setYT(YT1 as Youtube);

  onIframeApiReady(callback1);

  expect(callback1).toHaveBeenCalled();
  expect(DIC.getYT()).toBe(YT1);

  DIC.setYT(null);

  const YT2 = { Player: {} };
  const document = {
    getElementsByTagName: (): HTMLCollectionOf<any> => {
      return arrayToHTMLCollection([
        { src: 'https://www.youtube.com/iframe_api' }
      ]);
    }
  } as Partial<Document>;
  const window = {
    YT: YT2
  } as Partial<Window>;

  DIC.setWindow(window as Window);
  DIC.setDocument(document as Document);

  const callback2 = jest.fn();

  onIframeApiReady(callback2);

  expect(callback2).toHaveBeenCalled();
  expect(DIC.getYT()).toBe(YT2);
});

test('init sets the correct DIC properties', () => {
  const document = {} as Document;
  const window = {
    document: document
  } as Window;

  init(window);

  expect(DIC.getWindow()).toBe(window);
  expect(DIC.getDocument()).toBe(document);
  expect(DIC.getOnIframeApiReady()).toBe(onIframeApiReady);
});
