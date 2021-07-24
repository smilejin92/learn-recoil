import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import produce from 'immer';
import _ from 'lodash';
import { getImageDimensions } from '../util';
import { callApi } from '../api';
import { Element, ElementPropsSelectorParams, ElementSizePropSelectorProps } from './types';

// 요소: Canvas에 노출되어 있는 Object

// 선택된 요소의 id
export const selectedElementIdAtom = atom<number | null>({
  key: 'selectedElementId',
  default: null,
});

// 모든 요소의 id
export const elementIdsAtom = atom<number[]>({
  key: 'elementIds',
  default: [],
});

/**
 * 여러 아이템에 대한 상태를 하나의 Context로 관리하면, 각 아이템에 대한 상태를 isolate 시킬 수 없다.
 * 즉, 하나의 아이템에 대한 상태를 업데이트하면, 모든 아이템의 상태도 업데이트된다 (불필요한 리렌더링).
 * atomFamily를 사용하면 각 아이템에 대한 atom이 생성되며, 해당 아이템이 업데이트 될 경우 그 아이템만 업데이트, 리렌더링된다.
 * elementAtom(1) -> atom for element 1
 * elementAtom(2) -> atom for element 2
 * elementAtom(3) -> atom for element 3
 * elementAtom(4) -> atom for element 4
 */
export const defaultElement = {
  style: {
    position: {
      top: 0,
      left: 0,
    },
    size: {
      width: 200,
      height: 200,
    },
  },
};

// 각 요소의 상태 (elementAtom(id: number))
export const elementAtom = atomFamily<Element, number>({
  key: 'element',
  default: defaultElement,
});

/**
 * Selector의 장점
 * 1. get, set 로직이 한 곳에 작성되어있음
 * 2. Atom과 같은 API를 사용
 * 3. 공유 가능하며, self-contained state를 가짐
 */

/**
 * selectedElementId에 해당하는 요소를 get, set
 * 만약 선택된 요소의 부분적 정보를 get, set 하려면 어떡해야하나? -> 아래 elementPropsSelector 참고
 */
export const selectedElementSelctor = selector<Element | undefined>({
  key: 'selectedElement',
  get: ({ get }) => {
    // 1. selectedElement의 id를 selectedElementIdAtom 으로부터 get
    const selectedElementId = get(selectedElementIdAtom);
    if (selectedElementId == null) return; // undefined

    // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom을 return
    return get(elementAtom(selectedElementId)); // Element
  },
  set: ({ get, set }, newElement) => {
    // 1. selectedElement의 id를 selectedElementIdAtom 으로부터 get
    const selectedElementId = get(selectedElementIdAtom);
    if (selectedElementId == null) return;
    if (!newElement) return;

    // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom의 상태를 update
    set(elementAtom(selectedElementId), newElement);
  },
});

/**
 * 언제 selectorFamily를 사용하는가?
 * 비슷한 데이터를 get, set하지만 parametar에 따라 동작 여부가 조금씩 달라질 때
 */

/**
 * 특정 요소의 property를 get, set하는 selector
 * params: must be serializable value
 * params.id: 요소의 id
 * params.propPath: 요소의 프로퍼티를 나타내는 경로 (ex. 'foo.bar.baz')
 */
export const elementPropsSelector = selectorFamily<any, ElementPropsSelectorParams>({
  key: 'elementProps',
  get:
    (params) =>
    ({ get }) => {
      const { propPath, id } = params;
      const element = get(elementAtom(id));
      return _.get(element, propPath);
    },
  set:
    (params) =>
    ({ get, set }, newValue) => {
      const { propPath, id } = params;
      const element = get(elementAtom(id));

      /**
       * NOTE: lodash.set mutates the object, and recoil relies on immutability
       * 때문에 아래 코드로 요소의 상태를 업데이트해도, re-render되지 않는다.
       */
      // set(elementAtom(selectedElementIdAtom), _.set(element, path, newValue));

      // immer produce: element를 deep copy 후 draft로 전달 받아 mutate
      const newElement = produce(element, (draft) => {
        _.set(draft, propPath, newValue);
      });

      set(elementAtom(id), newElement);
    },
});

// selector composition: 기존의 selector를 사용하여 새로운 selector를 작성
/**
 * 특정 요소의 style.size[dimension] 프로퍼티를 get, set하는 selector
 * params: must be serializable value
 * params.id: 요소의 id
 * params.dimension: width or height (ex. style.size.width)
 * <returnType, paramsType>
 */
export const elementSizePropSelector = selectorFamily<any, ElementSizePropSelectorProps>({
  key: 'elementSizeProp',
  get:
    (params) =>
    ({ get }) => {
      const { dimension, id } = params;
      const propPath = `style.size.${dimension}`;
      return get(elementPropsSelector({ propPath, id }));
    },
  set:
    (params) =>
    ({ get, set }, newValue) => {
      const { dimension, id } = params;
      const hasImage = get(elementPropsSelector({ propPath: 'image', id })) !== undefined;

      if (!hasImage) {
        set(
          elementPropsSelector({
            propPath: `style.size.${dimension}`,
            id,
          }),
          newValue,
        );

        return;
      }

      const elementSizeProp = elementPropsSelector({ propPath: 'style.size', id });
      const { width, height } = get(elementSizeProp);
      const aspectRatio = width / height;

      if (dimension === 'width') {
        set(elementSizeProp, {
          width: newValue,
          height: Math.round(newValue / aspectRatio),
        });
      } else {
        set(elementSizeProp, {
          width: Math.round(newValue * aspectRatio),
          height: newValue,
        });
      }
    },
});

// async selctor를 사용하는 컴포넌트는 Suspense 컴포넌트로 감싸주어야한다.
// async selector - 이미지 크기 selector
export const imageSizeSelector = selectorFamily({
  key: 'imageSize',
  // async selector이지만, Promise가 resolve 될 때까지 기다린 후 값을 반환
  get: (src: string | undefined) => () => {
    if (!src) return;
    return getImageDimensions(src);
  },
});

// async selector - 이미지 정보 selector
// async selctor를 사용하는 컴포넌트는 Suspense 컴포넌트로 감싸주어야한다.
export const imageInfoSelector = selector({
  key: 'imageInfo',
  get: ({ get }) => {
    /**
     * element가 업데이트될때마다 selector가 계속 호출됨 (infinite fetch).
     * imageId가 바뀔 때만 re-run될 수 있도록 수정 필요
     */
    // const selectedElementId = get(selectedElementIdAtom);
    // if (selectedElementId === null) return;

    // const element = get(elementAtom(selectedElementId));
    // const imageId = element.image?.id;

    /**
     * 위 문제를 intermediate selector를 사용하여 해결.
     * imageIdSelector는 element가 업데이트 될 때마다 호출되지만,
     * 이 곳에선 imageIdSelector가 반환한 값을 비교하여 re-run 할 지를 결정.
     * 즉, imageIdSelector가 이전과 같은 값을 반환했다면 이 곳은 re-run되지 않음
     */
    const imageId = get(imageIdSelector);
    if (imageId === undefined) return;

    return callApi('image-detail', {
      queryParams: {
        seed: imageId,
      },
    });
  },
});

/**
 * intermediate selector - 이미지 ID selector
 * element가 업데이트 될 때마다 selector가 계속 호출됨.
 * 하지만 같은 element에 대해 같은 image ID를 반환
 */
export const imageIdSelector = selector({
  key: 'imageId',
  get: ({ get }) => {
    const selectedElementId = get(selectedElementIdAtom);
    if (selectedElementId === null) return;

    const element = get(elementAtom(selectedElementId));
    return element.image?.id;
  },
});

// 선택된 요소에 image 프로퍼티가 있는지 반환하는 selector
export const hasImageSelector = selector({
  key: 'hasImage',
  get: ({ get }) => {
    const id = get(selectedElementIdAtom);
    if (id === null) return;

    const element = get(elementAtom(id));
    return element.image !== undefined;
  },
});
